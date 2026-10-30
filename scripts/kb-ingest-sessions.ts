#!/usr/bin/env node
// biome-ignore-all lint/style/useNamingConvention: JSONL interoperability contracts use snake_case keys.

import { createHash } from "node:crypto";
import {
	chmodSync,
	createReadStream,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	renameSync,
	statSync,
	unlinkSync,
	writeFileSync
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { DatabaseSync } from "node:sqlite";

export type Tool = "omp" | "opencode" | "codex" | "hindsight";
export type ParseStatus = "processed" | "unchanged" | "skipped" | "failed";
export type Role = "user" | "assistant";

export interface SourceManifest {
	source_key: string;
	tool: Tool;
	record_type: string;
	project_key: string;
	session_hash: string;
	created_at: string;
	updated_at: string;
	format: string;
	content_hash: string;
	parse_status: ParseStatus;
	redaction_status: string;
	candidate_count: number;
	article_slugs: string[];
	skip_reason: string;
	error: string;
	run_at: string;
}

/** The requested 24 knowledge fields plus private-ledger metadata. */
export interface KnowledgeCandidate {
	topic: string;
	user_goal: string;
	technical_environment: string[];
	software_versions: string[];
	symptoms: string[];
	error_messages: string[];
	trigger_conditions: string[];
	investigation_steps: string[];
	attempted_solutions: string[];
	failed_solutions: string[];
	root_cause: string;
	final_solution: string;
	changes: string[];
	validation_commands: string[];
	validation_results: string[];
	applicability: string[];
	non_applicability: string[];
	risks_side_effects: string[];
	rollback: string[];
	reusable_lessons: string[];
	unresolved_questions: string[];
	confidence: number;
	source_refs: string[];
	existing_kb_status: string;
	candidate_id: string;
	source_key: string;
	session_key: string;
	project_key: string;
	tool: Tool;
	record_type: string;
	format: string;
	text: string;
	summary: string;
	language: string;
	created_at: string;
	updated_at: string;
	note_matches: string[];
	redactions: string[];
	conclusion_status: "verified" | "conditional" | "unverified_inference" | "historical" | "outdated";
	scores: { relevance: number; confidence: number; novelty: number };
	decision: "create" | "update" | "merge" | "jotting" | "reject" | "duplicate";
	topic_keys: string[];
	fingerprint: string;
	duplicate_of: string;
	cluster_id: string;
	cluster_size: number;
}

export interface RejectedRecord {
	rejection_id: string;
	source_key: string;
	reason: string;
	run_at: string;
}
export interface SourceArticleMap {
	source_key: string;
	candidate_ids: string[];
	article_slugs: string[];
	run_at: string;
}
export interface IngestSummary {
	run_id: string;
	started_at: string;
	finished_at: string;
	dry_run: boolean;
	discovered: number;
	processed: number;
	unchanged: number;
	skipped: number;
	failed: number;
	candidates: number;
	rejected: number;
	duplicates: number;
	clusters: number;
	duplicate_code_blocks: number;
	duplicate_error_logs: number;
	semantic_duplicates: number;
	errors: number;
}

interface SourceUnit {
	tool: Tool;
	recordType: string;
	format: string;
	sourceIdentity: string;
	sessionIdentity: string;
	projectIdentity: string;
	createdAt: string;
	updatedAt: string;
	contentHash: string;
	candidates: VisibleRecord[];
	skipReason?: string;
	error?: string;
}
interface VisibleRecord {
	role: Role;
	text: string;
	createdAt: string;
	turnIndex: number;
	redactions: string[];
}
export interface CliOptions {
	write?: boolean;
	outputDir?: string;
	repoRoot?: string;
	ompSessions?: string;
	opencodeDb?: string;
	codexDir?: string;
	promptHistory?: string;
	hindsightUrl?: string;
	skipHindsight?: boolean;
	maxTextPerSource?: number;
}

const MAX_TEXT = 120_000;
const MAX_CANDIDATE = 8_000;
const STOPWORDS: Record<string, true> = {
	the: true,
	and: true,
	for: true,
	with: true,
	that: true,
	this: true,
	from: true,
	have: true,
	will: true,
	are: true,
	was: true,
	were: true,
	into: true,
	about: true,
	than: true,
	when: true,
	where: true,
	what: true,
	which: true,
	your: true,
	you: true,
	our: true,
	not: true,
	can: true,
	use: true,
	using: true,
	user: true,
	assistant: true,
	system: true,
	true: true,
	false: true,
	的: true,
	是: true,
	了: true,
	和: true,
	在: true,
	有: true,
	我: true,
	你: true,
	这: true,
	个: true,
	也: true,
	要: true,
	不: true,
	会: true
};
const REDACTION_VERSION = "v19";

export function sha256(value: string | Uint8Array): string {
	return createHash("sha256").update(value).digest("hex");
}
export function hashIdentifier(value: string): string {
	return sha256(value.normalize("NFKC"));
}
export function normalizeText(value: string): string {
	return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/gu, " ").trim();
}
export function normalizedFingerprint(value: string): string {
	return sha256(normalizeText(value));
}
async function sha256File(path: string): Promise<string> {
	const hash = createHash("sha256");
	for await (const chunk of createReadStream(path)) hash.update(chunk);
	return hash.digest("hex");
}

export function redactText(input: string): { text: string; applied: string[] } {
	let text = input;
	const applied = new Set<string>();
	const replace = (pattern: RegExp, value: string, label: string): void => {
		const next = text.replace(pattern, value);
		if (next !== text) {
			text = next;
			applied.add(label);
		}
	};
	replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gu, "<REDACTED_TOKEN>", "<REDACTED_TOKEN>");
	replace(/\b[A-Z][A-Z0-9+.-]*:\/\/[^\s/@:]*:[^\s/@]+@[^\s]+/giu, "<REDACTED_PASSWORD>", "<REDACTED_PASSWORD>");
	replace(/git@[^\s:]+:[^\s]+/gu, "<PRIVATE_REPOSITORY>", "<PRIVATE_REPOSITORY>");
	replace(
		/(?:["'])?\b[A-Z0-9_]*api[_-]?key[A-Z0-9_]*\b(?:["'])?\s*[:=]\s*(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^\s,;]+)/giu,
		"api_key=<REDACTED_API_KEY>",
		"<REDACTED_API_KEY>"
	);
	replace(/\b(?:sk-[A-Za-z0-9_-]{16,}|AKIA[A-Z0-9]{16})\b/gu, "<REDACTED_API_KEY>", "<REDACTED_API_KEY>");
	replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{12,}/gu, "<REDACTED_TOKEN>", "<REDACTED_TOKEN>");
	replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{16,}|xox[baprs]-[A-Za-z0-9-]{16,})\b/gu, "<REDACTED_TOKEN>", "<REDACTED_TOKEN>");
	replace(
		/(?:["'])?\b[A-Z0-9_]*(?:token|authorization|cookie|secret(?:[_-]?key)?)\b(?:["'])?\s*[:=]\s*(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^\s,;]+)/giu,
		"token=<REDACTED_TOKEN>",
		"<REDACTED_TOKEN>"
	);
	replace(
		/(?:["'])?\b[A-Z0-9_]*(?:password|passwd)[A-Z0-9_]*\b(?:["'])?\s*[:=]\s*(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|[^\s,;]+)/giu,
		"password=<REDACTED_PASSWORD>",
		"<REDACTED_PASSWORD>"
	);
	replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "<PRIVATE_EMAIL>", "<PRIVATE_EMAIL>");
	replace(/\b[A-Z0-9._-]+@[A-Z0-9_-]+\b/giu, "<PRIVATE_EMAIL>", "<PRIVATE_EMAIL>");
	replace(
		/\b(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b192\.168\.\d{1,3}\.\d{1,3}\b|\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b|(?<![0-9A-F:])::1(?![0-9A-F:])|\b(?:F[CD][0-9A-F]{2}|FE[89AB][0-9A-F])(?::[0-9A-F]{0,4}){1,7}\b|\b(?:localhost|[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.(?:internal|local|lan|corp))\b/giu,
		"<PRIVATE_HOST>",
		"<PRIVATE_HOST>"
	);
	replace(/\\\\[^\\\s"'`)\]}>,;]+\\[^\\\s"'`)\]}>,;]+(?:\\[^\\\s"'`)\]}>,;]+)*/gu, "<PRIVATE_PATH>", "<PRIVATE_PATH>");
	replace(/\b[A-Z]:\\[^\\\s"'`)\]}>,;]+(?:\\[^\\\s"'`)\]}>,;]+)*/giu, "<PRIVATE_PATH>", "<PRIVATE_PATH>");
	replace(/\/(?:home|Users)\/[A-Za-z0-9._-]+(?:\/[^\s"'`)\]}>,;]*)?/gmu, "<PRIVATE_PATH>", "<PRIVATE_PATH>");
	replace(/~\/[^\s"'`)\]}>,;]+/gmu, "<PRIVATE_PATH>", "<PRIVATE_PATH>");
	replace(/\bfile:(?:\/{1,3}|~\/)[^\s"'`)\]}>,;]+/gmu, "file:<PRIVATE_PATH>", "<PRIVATE_PATH>");
	replace(/(^|[\s"'`(=\x5B{,:])~\/[^\s"'`)\]}>,;]+/gmu, "$1<PRIVATE_PATH>", "<PRIVATE_PATH>");
	replace(/(^|[\s"'`(=\x5B{,:])[/](?![/])[^\s"'`)\]}>,;]+/gmu, "$1<PRIVATE_PATH>", "<PRIVATE_PATH>");
	return { text: text.slice(0, MAX_CANDIDATE), applied: [...applied] };
}

export async function* streamJsonl(path: string): AsyncGenerator<{ value?: unknown; line: number; error?: string }> {
	const input = createInterface({ input: createReadStream(path, { encoding: "utf8" }), crlfDelay: Infinity });
	let line = 0;
	for await (const raw of input) {
		line += 1;
		const value = raw.trim();
		if (!value) continue;
		try {
			yield { value: JSON.parse(value) as unknown, line };
		} catch (error) {
			yield { line, error: error instanceof Error ? error.message : "invalid JSON" };
		}
	}
}

function walkFiles(root: string, suffix: string): string[] {
	if (!existsSync(root)) return [];
	const out: string[] = [];
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) out.push(...walkFiles(path, suffix));
		else if (entry.name.endsWith(suffix)) out.push(path);
	}
	return out;
}
function jsonObject(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}
function stringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}
function isoTime(value: unknown): string {
	const timestamp =
		typeof value === "number" ? (value < 10_000_000_000 ? value * 1000 : value) : typeof value === "string" ? Date.parse(value) : Number.NaN;
	return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}
function extractText(value: unknown): string {
	if (typeof value === "string") return value;
	const object = jsonObject(value);
	return object ? stringValue(object.text) : "";
}
function isInternalConversationText(text: string): boolean {
	const prefix = text.trimStart().slice(0, 768);
	const recordMarker =
		/^(?:\[(?:user|assistant)\]\s*)?(?:\*\*(?:agent|user|assistant)\*\*:\s*)?(?:¶(?:user|think|ai|call):|_thinking(?::_|_:)|Complete (?:the )?assignment(?: below)?,?\s*thoroughly:|Archived transcript scopes:|#{1,6}\s*Session update\b|\[irc\]|Resume prior conversation\.[\s\S]*Archived transcript scopes:)|^\[(?:user|assistant|skill-prompt)\][\s\S]{0,512}_thinking(?::_|_:)/iu;
	const internalNarration = /\[in progress\s*[—-]\s*more steps follow\]/iu;
	const toolEnvelope =
		/^(?:\[(?:user|assistant)\]\s*)?call:[A-Z0-9_.-]+:[A-Z0-9_.-]+(?:\{|$)|(?:^|\n)\/\/[^\n]*(?:\n\s*)?(?:→|->)\s*[A-Z0-9_.-]+\(|(?:^|\n)(?:\[(?:user|assistant)\]\s*)?(?:→|->)\s*[A-Z0-9_.-]+\([^\n]{0,2000}\)\s*(?:⇒|=>)/iu;
	const runtimeEnvelope =
		/(?:Parent IRC message|Current interruptible (?:wait|operation)|\[budget notice\]|\[async-result\]|^(?:\[(?:user|assistant)\]\s*)?\(No response\)\s*$)/imu;
	const watchdogNarration =
		/^(?:\[(?:user|assistant)\]\s*)?(?:Silent\b|Still (?:early )?context gathering\b|The agent is (?:mid-turn|(?:still )?(?:scoping|reading|reviewing|gathering))\b|Review (?:is )?progressing\b|Nothing to critique(?: yet)?\b|No action needed\b|Waiting for (?:more|the agent)\b|I(?:'ll| will) wait\b)/iu;
	const transcriptAnalysis =
		/\btranscript(?:'s)?\s+[`"']?_thinking(?::_|_:)[`"']?[\s\S]{0,200}\b(?:real|hidden)\s+(?:reasoning|thinking)\s+block\b/iu;
	if (
		/^\[skill-prompt\]/iu.test(prefix) ||
		recordMarker.test(prefix) ||
		internalNarration.test(text) ||
		toolEnvelope.test(text) ||
		runtimeEnvelope.test(text) ||
		watchdogNarration.test(text) ||
		transcriptAnalysis.test(text)
	)
		return true;
	const embeddedEnvelope =
		/(?:^|\n)(?:\[(?:user|assistant|skill-prompt)\]\s*)?\*\*(?:agent|user|assistant)\*\*:\s*(?:\n\s*)?(?:¶(?:user|think|ai|call):|_thinking(?::_|_:)|Complete (?:the )?assignment(?: below)?,?\s*thoroughly:|Archived transcript scopes:|#{1,6}\s*Session update\b|\[irc\])/iu;
	const transcriptArtifact =
		/(?:^|\n)\[(?:user|assistant|skill-prompt)\]\s*(?:\/\/[^\n]*(?:read|write|edit|bash|grep|glob|task|todo|hub)\(|\{[\s\S]*"(?:severity|guidance|rule)"[\s\S]*\b(?:_thinking|Archived transcript scopes|Complete assignment)\b)/iu;
	return embeddedEnvelope.test(text) || transcriptArtifact.test(text);
}
function hasInternalCandidateText(value: unknown): boolean {
	if (typeof value === "string") return isInternalConversationText(value);
	if (Array.isArray(value)) return value.some(hasInternalCandidateText);
	return Boolean(value && typeof value === "object" && Object.values(value).some(hasInternalCandidateText));
}
function sanitizeCandidate(candidate: KnowledgeCandidate): KnowledgeCandidate {
	const applied = new Set(candidate.redactions);
	const sanitize = (value: unknown): unknown => {
		if (typeof value === "string") {
			const result = redactText(value);
			for (const label of result.applied) applied.add(label);
			return result.text;
		}
		if (Array.isArray(value)) return value.map(sanitize);
		if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)]));
		return value;
	};
	const sanitized = sanitize(candidate) as KnowledgeCandidate;
	const topicKeys = keywords(sanitized.text).slice(0, 5);
	sanitized.created_at = isoTime(sanitized.created_at);
	sanitized.updated_at = isoTime(sanitized.updated_at);
	sanitized.summary = sanitized.text.replace(/\s+/gu, " ").slice(0, 300);
	sanitized.language = /[\u4e00-\u9fff]/u.test(sanitized.text) ? "zh" : "und";
	sanitized.topic_keys = topicKeys;
	sanitized.topic = topicKeys.slice(0, 3).join(" / ") || "uncategorized";
	sanitized.fingerprint = normalizedFingerprint(sanitized.text);
	sanitized.candidate_id = sha256(`${sanitized.source_key}\0${sanitized.fingerprint}`);
	sanitized.redactions = [...applied];
	return sanitized;
}
function visible(role: unknown, text: string, createdAt: string, turnIndex: number): VisibleRecord | undefined {
	if (role !== "user" && role !== "assistant") return undefined;
	if (isInternalConversationText(text)) return undefined;
	const redacted = redactText(text);
	if (!redacted.text.trim()) return undefined;
	return { role, text: redacted.text, createdAt, turnIndex, redactions: redacted.applied };
}

export async function parseOmpFile(path: string, maxText = MAX_TEXT): Promise<SourceUnit> {
	const before = statSync(path);
	const hash = await sha256File(path);
	const records: VisibleRecord[] = [];
	let used = 0;
	let session: Record<string, unknown> = {};
	let parseError = "";
	let turn = 0;
	for await (const item of streamJsonl(path)) {
		if (item.error) {
			parseError = item.error;
			continue;
		}
		const object = jsonObject(item.value);
		if (!object) continue;
		if (object.type === "session") session = object;
		const message = jsonObject(object.message);
		const role = stringValue(message?.role);
		const content = message?.content;
		if (!Array.isArray(content) || (role !== "user" && role !== "assistant")) continue;
		for (const part of content) {
			const itemObject = jsonObject(part);
			if (stringValue(itemObject?.type) !== "text") continue;
			const candidate = visible(role, stringValue(itemObject?.text), stringValue(object.timestamp), turn++);
			if (!candidate || used + candidate.text.length > maxText) continue;
			used += candidate.text.length;
			records.push(candidate);
		}
	}
	const after = statSync(path);
	if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) parseError = "source_changed_during_read";
	const sessionId = stringValue(session.id) || hash;
	return {
		tool: "omp",
		recordType: "session",
		format: "jsonl",
		sourceIdentity: path,
		sessionIdentity: sessionId,
		projectIdentity: stringValue(session.cwd),
		createdAt: isoTime(session.timestamp),
		updatedAt: new Date(after.mtimeMs).toISOString(),
		contentHash: hash,
		candidates: records,
		error: parseError || undefined
	};
}

export function parseOpenCodeDb(path: string, maxText = MAX_TEXT): SourceUnit[] {
	const db = new DatabaseSync(path, { readOnly: true });
	db.exec("BEGIN");
	const sessions = db.prepare("SELECT id, project_id, directory, time_created, time_updated FROM session ORDER BY id").all() as Array<
		Record<string, unknown>
	>;
	const messages = new Map<string, { sessionId: string; role: string; created: string }>();
	const malformed = new Map<string, number>();
	const rawHashes = new Map<string, string[]>();
	for (const row of db.prepare("SELECT id, session_id, time_created, data FROM message ORDER BY id").all() as Array<Record<string, unknown>>) {
		const sessionId = stringValue(row.session_id);
		const hashes = rawHashes.get(sessionId) ?? [];
		hashes.push(sha256(JSON.stringify(row)));
		rawHashes.set(sessionId, hashes);
		try {
			const data = JSON.parse(stringValue(row.data)) as Record<string, unknown>;
			messages.set(stringValue(row.id), {
				sessionId,
				role: stringValue(data.role),
				created: isoTime((data.time as Record<string, unknown> | undefined)?.created ?? row.time_created)
			});
		} catch {
			malformed.set(sessionId, (malformed.get(sessionId) ?? 0) + 1);
		}
	}
	const grouped = new Map<string, VisibleRecord[]>();
	const used = new Map<string, number>();
	for (const row of db.prepare("SELECT message_id, data FROM part ORDER BY time_created, message_id").all() as Array<Record<string, unknown>>) {
		const message = messages.get(stringValue(row.message_id));
		if (message) {
			const hashes = rawHashes.get(message.sessionId) ?? [];
			hashes.push(sha256(JSON.stringify(row)));
			rawHashes.set(message.sessionId, hashes);
		}
		try {
			const data = JSON.parse(stringValue(row.data)) as Record<string, unknown>;
			if (data.type !== "text" || !message) continue;
			const candidate = visible(message.role, stringValue(data.text), message.created, grouped.get(message.sessionId)?.length ?? 0);
			if (!candidate) continue;
			const amount = used.get(message.sessionId) ?? 0;
			if (amount + candidate.text.length > maxText) continue;
			used.set(message.sessionId, amount + candidate.text.length);
			const list = grouped.get(message.sessionId) ?? [];
			list.push(candidate);
			grouped.set(message.sessionId, list);
		} catch {
			if (message) malformed.set(message.sessionId, (malformed.get(message.sessionId) ?? 0) + 1);
		}
	}
	const rows: SourceUnit[] = [];
	for (const session of sessions) {
		const id = stringValue(session.id);
		const text = grouped.get(id) ?? [];
		const contentHash = sha256(JSON.stringify({ session, rawHashes: rawHashes.get(id) ?? [] }));
		rows.push({
			tool: "opencode",
			recordType: "session",
			format: "sqlite",
			sourceIdentity: `${path}\0${id}`,
			sessionIdentity: id,
			projectIdentity: stringValue(session.directory) || stringValue(session.project_id),
			createdAt: isoTime(session.time_created),
			updatedAt: isoTime(session.time_updated),
			contentHash,
			candidates: text,
			error: malformed.has(id) ? `malformed_records:${malformed.get(id)}` : undefined
		});
	}
	db.exec("COMMIT");
	db.close();
	return rows;
}

export async function parseCodexFile(path: string, maxText = MAX_TEXT): Promise<SourceUnit> {
	const before = statSync(path);
	const hash = await sha256File(path);
	const records: VisibleRecord[] = [];
	let meta: Record<string, unknown> = {};
	let used = 0;
	let turn = 0;
	let parseError = "";
	for await (const item of streamJsonl(path)) {
		if (item.error) {
			parseError = item.error;
			continue;
		}
		const object = jsonObject(item.value);
		const payload = jsonObject(object?.payload);
		if (!object || !payload) continue;
		if (object.type === "session_meta") meta = payload;
		if (object.type !== "response_item" || payload.type !== "message") continue;
		const role = stringValue(payload.role);
		const content = Array.isArray(payload.content) ? payload.content : [];
		for (const part of content) {
			const partObject = jsonObject(part);
			const type = stringValue(partObject?.type);
			if (type !== "input_text" && type !== "output_text") continue;
			const candidate = visible(role, stringValue(partObject?.text), stringValue(object.timestamp), turn++);
			if (!candidate || used + candidate.text.length > maxText) continue;
			used += candidate.text.length;
			records.push(candidate);
		}
	}
	const after = statSync(path);
	if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) parseError = "source_changed_during_read";
	const id = stringValue(meta.session_id) || hash;
	return {
		tool: "codex",
		recordType: "session",
		format: "jsonl",
		sourceIdentity: path,
		sessionIdentity: id,
		projectIdentity: stringValue(meta.cwd),
		createdAt: isoTime(meta.timestamp),
		updatedAt: new Date(after.mtimeMs).toISOString(),
		contentHash: hash,
		candidates: records,
		error: parseError || undefined
	};
}

export async function parsePromptHistory(path: string, maxText = MAX_TEXT, tool: "opencode" | "codex" = "opencode"): Promise<SourceUnit> {
	const before = statSync(path);
	const hash = await sha256File(path);
	const records: VisibleRecord[] = [];
	let used = 0;
	let turn = 0;
	let error = "";
	for await (const item of streamJsonl(path)) {
		if (item.error) {
			error = item.error;
			continue;
		}
		const object = jsonObject(item.value);
		if (!object) continue;
		const text = extractText(object.text ?? object.input);
		const candidate = visible("user", text, isoTime(object.ts ?? object.timestamp), turn++);
		if (candidate && used + candidate.text.length <= maxText) {
			used += candidate.text.length;
			records.push(candidate);
		}
	}
	const after = statSync(path);
	if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) error = "source_changed_during_read";
	return {
		tool,
		recordType: "prompt-history",
		format: "jsonl",
		sourceIdentity: path,
		sessionIdentity: path,
		projectIdentity: tool,
		createdAt: "",
		updatedAt: new Date(after.mtimeMs).toISOString(),
		contentHash: hash,
		candidates: records,
		error: error || undefined
	};
}

export async function fetchHindsight(baseUrl: string, maxText = MAX_TEXT): Promise<SourceUnit[]> {
	const records: SourceUnit[] = [];
	try {
		const apiRoot = new URL("/v1/default/", baseUrl);
		const banksResponse = await fetch(new URL("banks", apiRoot));
		if (!banksResponse.ok) throw new Error(`HTTP ${banksResponse.status}`);
		const banksBody = jsonObject(await banksResponse.json());
		const banks = Array.isArray(banksBody?.banks) ? banksBody.banks : [];
		for (const bankEntry of banks) {
			const bank = jsonObject(bankEntry);
			const bankId = stringValue(bank?.bank_id ?? bank?.id ?? bank?.name);
			if (!bankId) continue;
			for (let offset = 0; ; offset += 500) {
				const url = new URL(`banks/${encodeURIComponent(bankId)}/memories/list`, apiRoot);
				url.searchParams.set("limit", "500");
				url.searchParams.set("offset", String(offset));
				const response = await fetch(url);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const body = jsonObject(await response.json());
				const items = Array.isArray(body?.items) ? body.items : [];
				for (const item of items) {
					const value = jsonObject(item);
					const text = extractText(value?.text ?? value?.content);
					const memoryId = stringValue(value?.id) || sha256(text);
					const createdAt = isoTime(value?.date ?? value?.mentioned_at ?? value?.created_at);
					const candidate = visible("assistant", text, createdAt, 0);
					if (!candidate || candidate.text.length > maxText) continue;
					records.push({
						tool: "hindsight",
						recordType: "memory",
						format: "api",
						sourceIdentity: `${baseUrl}\0${bankId}\0${memoryId}`,
						sessionIdentity: memoryId,
						projectIdentity: bankId,
						createdAt,
						updatedAt: isoTime(value?.edited_at) || createdAt,
						contentHash: sha256(JSON.stringify(value)),
						candidates: [candidate]
					});
				}
				if (items.length < 500) break;
			}
		}
	} catch (error) {
		records.push({
			tool: "hindsight",
			recordType: "memory-store",
			format: "api",
			sourceIdentity: baseUrl,
			sessionIdentity: "unavailable",
			projectIdentity: "",
			createdAt: "",
			updatedAt: "",
			contentHash: sha256("hindsight_unavailable"),
			candidates: [],
			error: error instanceof Error ? `hindsight_unavailable: ${error.message}` : "hindsight_unavailable"
		});
	}
	return records;
}

function keywords(text: string): string[] {
	return [
		...new Set(
			normalizeText(text)
				.split(/[^\p{L}\p{N}_-]+/u)
				.filter(token => token.length > 2 && !STOPWORDS[token])
		)
	].slice(0, 12);
}
const NOTE_CACHE = new Map<string, Array<{ slug: string; words: Set<string> }>>();
function noteSlugs(repoRoot: string): Array<{ slug: string; words: Set<string> }> {
	const cached = NOTE_CACHE.get(repoRoot);
	if (cached) return cached;
	const root = join(repoRoot, "src", "content", "note", "zh-cn");
	const notes = existsSync(root)
		? readdirSync(root)
				.filter(name => name.endsWith(".md"))
				.map(name => {
					const text = readFileSync(join(root, name), "utf8");
					return { slug: name.slice(0, -3), words: new Set(keywords(text)) };
				})
		: [];
	NOTE_CACHE.set(repoRoot, notes);
	return notes;
}
function noteMatches(candidateWords: string[], notes: Array<{ slug: string; words: Set<string> }>): string[] {
	return notes
		.map(note => ({ slug: note.slug, score: candidateWords.filter(word => note.words.has(word)).length }))
		.filter(item => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map(item => item.slug);
}
function snippets(records: VisibleRecord[], pattern: RegExp, limit = 3): string[] {
	return records
		.filter(record => pattern.test(record.text))
		.slice(0, limit)
		.map(record => record.text.slice(0, 500));
}
function uniqueMatches(text: string, pattern: RegExp): string[] {
	return [...new Set([...text.matchAll(pattern)].map(match => match[0]))].slice(0, 12);
}
function compactConversation(records: VisibleRecord[]): string {
	const text = records.map(record => `[${record.role}] ${record.text}`).join("\n");
	if (text.length <= MAX_CANDIDATE) return text;
	const middle = Math.max(0, Math.floor(text.length / 2) - 500);
	return `${text.slice(0, 3_500)}\n[...]\n${text.slice(middle, middle + 1_000)}\n[...]\n${text.slice(-3_500)}`;
}
function hasTechnicalSignal(text: string): boolean {
	return /(error|exception|fail|fix|debug|test|build|config|api|database|sql|git|docker|kubernetes|linux|java|typescript|javascript|python|rust|astro|svelte|css|theme|omp|opencode|codex|agent|llm|错误|失败|根因|修复|配置|验证|测试|构建|数据库|架构|排查|工具|会话|知识库|前端|后端|设计)/iu.test(
		text
	);
}
export function sourceKeyFor(unit: Pick<SourceUnit, "tool" | "projectIdentity" | "sessionIdentity" | "contentHash">): string {
	return sha256(`${unit.tool}\0${hashIdentifier(unit.projectIdentity)}\0${hashIdentifier(unit.sessionIdentity)}\0${unit.contentHash}`);
}
function sourceIdentityKey(unit: Pick<SourceUnit, "tool" | "projectIdentity" | "sessionIdentity">): string {
	return `${unit.tool}\0${hashIdentifier(unit.projectIdentity)}\0${hashIdentifier(unit.sessionIdentity)}`;
}

export function extractCandidates(unit: SourceUnit, repoRoot = process.cwd()): KnowledgeCandidate[] {
	if (unit.error === "source_changed_during_read") return [];
	if (!unit.candidates.length) return [];
	const text = compactConversation(unit.candidates);
	if (isInternalConversationText(text)) return [];
	if (unit.tool !== "hindsight" && (text.length < 120 || !hasTechnicalSignal(text))) return [];
	const words = keywords(text);
	const matches = noteMatches(words, noteSlugs(repoRoot));
	const sourceKey = sourceKeyFor(unit);
	const fingerprint = normalizedFingerprint(text);
	const firstUser = unit.candidates.find(record => record.role === "user")?.text.slice(0, 1_200) ?? "";
	const lastAssistant = unit.candidates.findLast(record => record.role === "assistant")?.text.slice(0, 2_000) ?? "";
	const rootCauses = snippets(unit.candidates, /(root cause|caused by|原因|根因)/iu);
	const solutions = snippets(unit.candidates, /(solution|resolved|fix(?:ed)?|workaround|解决|修复|最终|结论)/iu);
	const validation = snippets(unit.candidates, /(pass(?:ed)?|verified|validation|test(?:ed)?|build|check|通过|验证|测试|构建)/iu);
	const topicKeys = words.slice(0, 5);
	const confidence = unit.tool === "hindsight" ? 0.55 : 0.3;
	return [
		{
			topic: topicKeys.slice(0, 3).join(" / ") || "uncategorized",
			user_goal: firstUser,
			technical_environment: uniqueMatches(
				text,
				/\b(?:Linux|Fedora|Arch Linux|macOS|Windows|JVM|Java|Spring|Node(?:\.js)?|Astro|Svelte|TypeScript|Docker|Kubernetes|MySQL|PostgreSQL|OMP|OpenCode|Codex)\b/giu
			),
			software_versions: uniqueMatches(
				text,
				/\b(?:OMP|OpenCode|Codex|Astro|Node(?:\.js)?|pnpm|Java|Spring|Docker|MySQL|TypeScript|Svelte)\s*(?:v|version)?\s*\d+(?:\.\d+){0,3}\b/giu
			),
			symptoms: snippets(unit.candidates, /(symptom|error|exception|failed|slow|timeout|问题|现象|错误|失败|超时|缓慢)/iu),
			error_messages: snippets(unit.candidates, /(error|exception|traceback|panic|错误|异常|失败)/iu),
			trigger_conditions: snippets(unit.candidates, /(when|after|before|trigger|条件|触发|之后|之前)/iu),
			investigation_steps: snippets(unit.candidates, /(inspect|check|trace|search|diagnos|排查|检查|定位|读取|搜索|诊断)/iu),
			attempted_solutions: snippets(unit.candidates, /(attempt|tried|try |workaround|方案|尝试|改用|使用)/iu),
			failed_solutions: snippets(
				unit.candidates,
				/(did not work|doesn't work|failed approach|dead end|无效|不生效|死胡同|否定方案|失败方案)/iu
			),
			root_cause: rootCauses.at(-1) ?? "",
			final_solution: solutions.at(-1) ?? lastAssistant,
			changes: snippets(unit.candidates, /(change|patch|edit|config|修改|补丁|配置变更|代码变更)/iu),
			validation_commands: uniqueMatches(
				text,
				/(?:^|\n)\s*(?:\$ )?(?:pnpm|npm|npx|node|bun|cargo|mvn|gradle|pytest|vitest|git)\s+[^\n]{1,180}/gimu
			).map(command => command.trim()),
			validation_results: validation,
			applicability: snippets(unit.candidates, /(applies|applicable|适用|前置条件|场景)/iu),
			non_applicability: snippets(unit.candidates, /(does not apply|not applicable|不适用|不要用于)/iu),
			risks_side_effects: snippets(unit.candidates, /(risk|side effect|warning|danger|风险|副作用|警告|危险)/iu),
			rollback: snippets(unit.candidates, /(rollback|revert|restore|回滚|恢复)/iu),
			reusable_lessons: snippets(unit.candidates, /(lesson|principle|generaliz|经验|原则|方法论|可推广)/iu),
			unresolved_questions: snippets(
				unit.candidates.filter(record => record.role === "user"),
				/[?？]|未解决|待验证/u
			),
			confidence,
			source_refs: [sourceKey],
			existing_kb_status: matches.length ? `matched:${matches.join(",")}` : "not_matched",
			candidate_id: sha256(`${sourceKey}\0${fingerprint}`),
			source_key: sourceKey,
			session_key: hashIdentifier(unit.sessionIdentity),
			project_key: hashIdentifier(unit.projectIdentity),
			tool: unit.tool,
			record_type: unit.recordType,
			format: unit.format,
			text,
			summary: text.replace(/\s+/gu, " ").slice(0, 300),
			language: /[\u4e00-\u9fff]/u.test(text) ? "zh" : "und",
			created_at: unit.createdAt,
			updated_at: unit.updatedAt,
			note_matches: matches,
			redactions: [...new Set(unit.candidates.flatMap(record => record.redactions))],
			conclusion_status: "unverified_inference",
			scores: { relevance: hasTechnicalSignal(text) ? 0.7 : 0.2, confidence, novelty: matches.length ? 0.3 : 0.7 },
			decision: "jotting",
			topic_keys: topicKeys,
			fingerprint,
			duplicate_of: "",
			cluster_id: "",
			cluster_size: 1
		}
	];
}

export function deduplicateAndCluster(candidates: KnowledgeCandidate[], maxClusterSize = 8): KnowledgeCandidate[] {
	const first = new Map<string, KnowledgeCandidate>();
	const clusterMembers = new Map<string, KnowledgeCandidate[]>();
	const topicCounts = new Map<string, number>();
	for (const candidate of candidates) {
		candidate.duplicate_of = "";
		if (candidate.decision === "duplicate") candidate.decision = "jotting";
		candidate.cluster_id = "";
		candidate.cluster_size = 1;
		const prior = first.get(candidate.fingerprint);
		if (prior) {
			candidate.duplicate_of = prior.candidate_id;
			candidate.decision = "duplicate";
			continue;
		}
		first.set(candidate.fingerprint, candidate);
		const topic = candidate.topic_keys[0] || `misc-${candidate.fingerprint.slice(0, 12)}`;
		const index = topicCounts.get(topic) ?? 0;
		topicCounts.set(topic, index + 1);
		const clusterId = `cluster-${sha256(`${topic}\0${Math.floor(index / maxClusterSize)}`).slice(0, 12)}`;
		candidate.cluster_id = clusterId;
		const members = clusterMembers.get(clusterId) ?? [];
		members.push(candidate);
		clusterMembers.set(clusterId, members);
	}
	for (const members of clusterMembers.values()) for (const member of members) member.cluster_size = members.length;
	return candidates;
}
function duplicateFragmentCount(values: string[]): number {
	const counts = new Map<string, number>();
	for (const value of values) {
		const normalized = normalizeText(value);
		if (normalized.length < 40) continue;
		const fingerprint = sha256(normalized);
		counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1);
	}
	return [...counts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
}

function duplicateCodeBlockCount(candidates: KnowledgeCandidate[]): number {
	const blocks = candidates.flatMap(candidate => [...candidate.text.matchAll(/```[^\n]*\n([\s\S]*?)```/gu)].map(match => match[1]));
	return duplicateFragmentCount(blocks);
}

function semanticDuplicateCount(candidates: KnowledgeCandidate[]): number {
	const counts = new Map<string, number>();
	for (const candidate of candidates) {
		if (!candidate.cluster_id || candidate.decision === "duplicate") continue;
		counts.set(candidate.cluster_id, (counts.get(candidate.cluster_id) ?? 0) + 1);
	}
	return [...counts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
}

function readJsonlFile<T>(path: string): T[] {
	if (!existsSync(path)) return [];
	return readFileSync(path, "utf8")
		.split("\n")
		.filter(Boolean)
		.flatMap(line => {
			try {
				return [JSON.parse(line) as T];
			} catch {
				return [];
			}
		});
}
function atomic(path: string, content: string): void {
	const directory = dirname(path);
	mkdirSync(directory, { recursive: true, mode: 0o700 });
	chmodSync(directory, 0o700);
	const temp = `${path}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
	writeFileSync(temp, content, { encoding: "utf8", mode: 0o600 });
	renameSync(temp, path);
	chmodSync(path, 0o600);
}
function lineJson(values: unknown[]): string {
	return values.length ? `${values.map(value => JSON.stringify(value)).join("\n")}\n` : "";
}
function optionsFromArgv(argv: string[]): CliOptions & { help?: boolean } {
	const result: CliOptions & { help?: boolean } = {};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		const next = argv[i + 1];
		if (arg === "--write") result.write = true;
		else if (arg === "--skip-hindsight") result.skipHindsight = true;
		else if (arg === "--help" || arg === "-h") result.help = true;
		else if (typeof next === "string" && arg === "--output-dir") (result.outputDir = next), (i += 1);
		else if (typeof next === "string" && arg === "--omp-sessions") (result.ompSessions = next), (i += 1);
		else if (typeof next === "string" && arg === "--opencode-db") (result.opencodeDb = next), (i += 1);
		else if (typeof next === "string" && arg === "--codex-dir") (result.codexDir = next), (i += 1);
		else if (typeof next === "string" && arg === "--prompt-history") (result.promptHistory = next), (i += 1);
		else if (typeof next === "string" && arg === "--hindsight-url") (result.hindsightUrl = next), (i += 1);
	}
	return result;
}
export async function runIngest(options: CliOptions = {}): Promise<IngestSummary> {
	const repoRoot = resolve(options.repoRoot ?? process.cwd());
	const outputDir = resolve(options.outputDir ?? join(repoRoot, ".agent", "kb-ingest"));
	const maxText = options.maxTextPerSource ?? MAX_TEXT;
	const home = homedir();
	const dataHome = process.env.XDG_DATA_HOME ?? join(home, ".local", "share");
	const stateHome = process.env.XDG_STATE_HOME ?? join(home, ".local", "state");
	const started = new Date().toISOString();
	const unavailable = (tool: Tool, recordType: string, identity: string, error: string): SourceUnit => ({
		tool,
		recordType,
		format: "unavailable",
		sourceIdentity: identity,
		sessionIdentity: identity,
		projectIdentity: dirname(identity),
		createdAt: "",
		updatedAt: "",
		contentHash: sha256(error),
		candidates: [],
		error
	});
	const guardedLoad = async (
		tool: Tool,
		recordType: string,
		identity: string,
		load: () => SourceUnit[] | Promise<SourceUnit[]>
	): Promise<SourceUnit[]> => {
		try {
			return await load();
		} catch (error) {
			const message = error instanceof Error ? error.message : "unknown error";
			return [unavailable(tool, recordType, identity, `${tool}_${recordType}_unavailable: ${message}`)];
		}
	};
	const loaders: Array<() => Promise<SourceUnit[]>> = [];

	const omp = options.ompSessions ?? join(home, ".omp", "agent", "sessions");
	if (existsSync(omp)) {
		for (const path of walkFiles(omp, ".jsonl").sort()) {
			const advisor = basename(path) === "__advisor.jsonl";
			loaders.push(() =>
				guardedLoad("omp", advisor ? "advisor" : "session", path, async () => {
					const unit = await parseOmpFile(path, maxText);
					return advisor
						? [{ ...unit, recordType: "advisor", candidates: [], skipReason: "internal_control_plane", error: undefined }]
						: [unit];
				})
			);
		}
	} else loaders.push(async () => [unavailable("omp", "session-store", omp, "omp_session_store_unavailable")]);

	const openCodeDb = options.opencodeDb ?? join(dataHome, "opencode", "opencode.db");
	if (existsSync(openCodeDb)) {
		loaders.push(() => guardedLoad("opencode", "session-store", openCodeDb, () => parseOpenCodeDb(openCodeDb, maxText)));
	} else loaders.push(async () => [unavailable("opencode", "session-store", openCodeDb, "opencode_session_store_unavailable")]);

	const codex = options.codexDir ?? process.env.CODEX_HOME ?? join(home, ".codex");
	if (existsSync(codex)) {
		const codexFiles = [...walkFiles(join(codex, "sessions"), ".jsonl"), ...walkFiles(join(codex, "archived_sessions"), ".jsonl")].sort();
		for (const path of codexFiles) {
			loaders.push(() => guardedLoad("codex", "session", path, async () => [await parseCodexFile(path, maxText)]));
		}
	} else loaders.push(async () => [unavailable("codex", "session-store", codex, "codex_session_store_unavailable")]);

	const openCodeHistory = options.promptHistory ?? join(stateHome, "opencode", "prompt-history.jsonl");
	if (existsSync(openCodeHistory)) {
		loaders.push(() =>
			guardedLoad("opencode", "prompt-history", openCodeHistory, async () => [await parsePromptHistory(openCodeHistory, maxText, "opencode")])
		);
	}
	const codexHistory = join(codex, "history.jsonl");
	if (existsSync(codexHistory)) {
		loaders.push(() =>
			guardedLoad("codex", "prompt-history", codexHistory, async () => {
				const history = await parsePromptHistory(codexHistory, maxText, "codex");
				history.candidates = [];
				history.skipReason = "prompt_index_covered_by_session_store";
				return [history];
			})
		);
	}
	const hindsightUrl = options.hindsightUrl ?? process.env.HINDSIGHT_API_URL;
	if (!options.skipHindsight && hindsightUrl) {
		loaders.push(() => guardedLoad("hindsight", "memory-store", hindsightUrl, () => fetchHindsight(hindsightUrl, maxText)));
	}

	const partialManifestPath = join(outputDir, "manifest.partial.jsonl");
	const partialCandidatesPath = join(outputDir, "candidates.partial.jsonl");
	const partialRejectedPath = join(outputDir, "rejected.partial.jsonl");
	const manifestByIdentity = new Map<string, SourceManifest>();
	for (const item of [...readJsonlFile<SourceManifest>(join(outputDir, "manifest.jsonl")), ...readJsonlFile<SourceManifest>(partialManifestPath)]) {
		manifestByIdentity.set(`${item.tool}\0${item.project_key}\0${item.session_hash}`, item);
	}
	const previous = [...manifestByIdentity.values()];
	const partialCandidates = readJsonlFile<KnowledgeCandidate>(partialCandidatesPath);
	const partialCandidateSources = new Set(partialCandidates.map(item => item.source_key));
	const previousCandidates = [
		...readJsonlFile<KnowledgeCandidate>(join(outputDir, "candidates.jsonl")).filter(item => !partialCandidateSources.has(item.source_key)),
		...partialCandidates
	];
	const partialRejected = readJsonlFile<RejectedRecord>(partialRejectedPath);
	const partialRejectedSources = new Set(partialRejected.map(item => item.source_key));
	const previousRejected = [
		...readJsonlFile<RejectedRecord>(join(outputDir, "rejected.jsonl")).filter(item => !partialRejectedSources.has(item.source_key)),
		...partialRejected
	];
	const priorByIdentity = new Map(previous.map(item => [`${item.tool}\0${item.project_key}\0${item.session_hash}`, item]));
	const priorCandidatesBySource = new Map<string, KnowledgeCandidate[]>();
	for (const candidate of previousCandidates) {
		const list = priorCandidatesBySource.get(candidate.source_key) ?? [];
		list.push(candidate);
		priorCandidatesBySource.set(candidate.source_key, list);
	}
	const priorRejectedBySource = new Map<string, RejectedRecord[]>();
	for (const item of previousRejected) {
		const list = priorRejectedBySource.get(item.source_key) ?? [];
		list.push(item);
		priorRejectedBySource.set(item.source_key, list);
	}

	const scannedPromptHistoryTools = new Set<Tool>();
	const manifests: SourceManifest[] = [];
	const candidates: KnowledgeCandidate[] = [];
	const rejected: RejectedRecord[] = [];
	const checkpointPath = join(repoRoot, ".agent", "checkpoints", "current-task.md");
	const scannedIdentityKeys = new Set<string>();
	let discovered = 0;
	let lastSourceKey = "";
	const persistPartial = (): void => {
		if (!options.write || !discovered) return;
		mkdirSync(outputDir, { recursive: true });
		atomic(partialManifestPath, lineJson(manifests));
		atomic(partialCandidatesPath, lineJson(candidates));
		atomic(partialRejectedPath, lineJson(rejected));
		atomic(
			checkpointPath,
			`# Current task\n\n- Run ID: kb-ingest-${started.slice(0, 10)}\n- Status: parsing\n- Current batch: ${discovered} source records\n- Resume cursor: ${lastSourceKey}\n- Persisted manifests: ${manifests.length}\n- Persisted candidates: ${candidates.length}\n- Persisted rejected: ${rejected.length}\n- Failed: ${manifests.filter(item => item.parse_status === "failed").length}\n- Next action: resume from partial ledgers and unchanged content hashes\n`
		);
	};

	for (const load of loaders) {
		const units = await load();
		for (const unit of units) {
			discovered += 1;
			if (unit.recordType === "prompt-history") scannedPromptHistoryTools.add(unit.tool);
			const identityKey = sourceIdentityKey(unit);
			scannedIdentityKeys.add(identityKey);
			const sourceKey = sourceKeyFor(unit);
			lastSourceKey = sourceKey;
			const prior = priorByIdentity.get(identityKey);
			const priorCandidates = prior ? (priorCandidatesBySource.get(prior.source_key) ?? []) : [];
			const priorRejected = prior ? (priorRejectedBySource.get(prior.source_key) ?? []) : [];
			const priorLedgerComplete =
				prior !== undefined && priorCandidates.length === prior.candidate_count && (prior.candidate_count > 0 || priorRejected.length > 0);
			if (
				!unit.error &&
				prior?.parse_status !== "failed" &&
				prior?.content_hash === unit.contentHash &&
				prior.redaction_status.endsWith(`:${REDACTION_VERSION}`) &&
				priorLedgerComplete
			) {
				const retainedCandidates = priorCandidates.filter(candidate => !hasInternalCandidateText(candidate)).map(sanitizeCandidate);
				const safeError = redactText(prior.error);
				manifests.push({
					...prior,
					created_at: unit.createdAt,
					updated_at: unit.updatedAt,
					source_key: sourceKey,
					parse_status: "unchanged",
					redaction_status: `${retainedCandidates.some(candidate => candidate.redactions.length) || safeError.applied.length ? "redacted" : "none"}:${REDACTION_VERSION}`,
					candidate_count: retainedCandidates.length,
					article_slugs: [...new Set(retainedCandidates.flatMap(candidate => candidate.note_matches))],
					error: safeError.text,
					run_at: started
				});
				candidates.push(...retainedCandidates.map(candidate => ({ ...candidate, source_key: sourceKey, source_refs: [sourceKey] })));
				rejected.push(...priorRejected.map(item => ({ ...item, source_key: sourceKey, run_at: started })));
				if (retainedCandidates.length !== priorCandidates.length) {
					const reason = "internal_transcript_filtered";
					rejected.push({ rejection_id: sha256(`${sourceKey}\0${reason}`), source_key: sourceKey, reason, run_at: started });
				}
			} else {
				const safeError = redactText(unit.error ?? "").text;
				const extracted = extractCandidates(unit, repoRoot);
				candidates.push(...extracted);
				const reason = unit.error
					? "malformed_or_unavailable_source"
					: (unit.skipReason ?? (extracted.length ? "" : "no_reusable_technical_knowledge"));
				if (unit.error || !extracted.length) {
					rejected.push({ rejection_id: sha256(`${sourceKey}\0${reason}`), source_key: sourceKey, reason, run_at: started });
				}
				manifests.push({
					source_key: sourceKey,
					tool: unit.tool,
					record_type: unit.recordType,
					project_key: hashIdentifier(unit.projectIdentity),
					session_hash: hashIdentifier(unit.sessionIdentity),
					created_at: unit.createdAt,
					updated_at: unit.updatedAt,
					format: unit.format,
					content_hash: unit.contentHash,
					parse_status: unit.error && !extracted.length ? "failed" : extracted.length ? "processed" : "skipped",
					redaction_status: `${extracted.some(item => item.redactions.length) ? "redacted" : "none"}:${REDACTION_VERSION}`,
					candidate_count: extracted.length,
					article_slugs: [...new Set(extracted.flatMap(candidate => candidate.note_matches))],
					skip_reason: reason,
					error: safeError,
					run_at: started
				});
			}
			if (discovered % 100 === 0) persistPartial();
		}
	}
	if (discovered % 100 !== 0) persistPartial();

	for (const [identityKey, prior] of priorByIdentity) {
		if (scannedIdentityKeys.has(identityKey)) continue;
		if (prior.tool === "omp" && prior.record_type === "advisor") continue;
		if (
			prior.record_type === "prompt-history" &&
			scannedPromptHistoryTools.has(prior.tool) &&
			prior.session_hash === hashIdentifier(prior.content_hash)
		)
			continue;
		const priorSourceCandidates = priorCandidatesBySource.get(prior.source_key) ?? [];
		const retainedCandidates = priorSourceCandidates.filter(candidate => !hasInternalCandidateText(candidate)).map(sanitizeCandidate);
		const safeError = redactText(prior.error).text;
		manifests.push({
			...prior,
			created_at: isoTime(prior.created_at),
			updated_at: isoTime(prior.updated_at),
			parse_status: "skipped",
			redaction_status: `${retainedCandidates.some(candidate => candidate.redactions.length) || safeError !== prior.error ? "redacted" : "none"}:${REDACTION_VERSION}`,
			candidate_count: retainedCandidates.length,
			article_slugs: [...new Set(retainedCandidates.flatMap(candidate => candidate.note_matches))],
			skip_reason: "source_not_scanned_this_run",
			error: safeError,
			run_at: started
		});
		candidates.push(...retainedCandidates.map(candidate => ({ ...candidate, source_refs: [prior.source_key] })));
		rejected.push(...(priorRejectedBySource.get(prior.source_key) ?? []).map(item => ({ ...item, run_at: started })));
		if (retainedCandidates.length !== priorSourceCandidates.length) {
			const reason = "internal_transcript_filtered";
			rejected.push({ rejection_id: sha256(`${prior.source_key}\0${reason}`), source_key: prior.source_key, reason, run_at: started });
		}
	}

	deduplicateAndCluster(candidates);
	const finished = new Date().toISOString();
	const summary: IngestSummary = {
		run_id: `kb-ingest-${started.slice(0, 10)}`,
		started_at: started,
		finished_at: finished,
		dry_run: !options.write,
		discovered,
		processed: manifests.filter(item => item.parse_status === "processed").length,
		unchanged: manifests.filter(item => item.parse_status === "unchanged").length,
		skipped: manifests.filter(item => item.parse_status === "skipped").length,
		failed: manifests.filter(item => item.parse_status === "failed").length,
		candidates: candidates.length,
		rejected: rejected.length,
		duplicates: candidates.filter(item => item.decision === "duplicate").length,
		duplicate_code_blocks: duplicateCodeBlockCount(candidates),
		duplicate_error_logs: duplicateFragmentCount(candidates.flatMap(candidate => candidate.error_messages)),
		semantic_duplicates: semanticDuplicateCount(candidates),
		clusters: new Set(candidates.map(item => item.cluster_id).filter(Boolean)).size,
		errors: manifests.filter(item => item.error).length
	};
	if (options.write) {
		const candidateIdsBySource = new Map<string, string[]>();
		for (const candidate of candidates) {
			const ids = candidateIdsBySource.get(candidate.source_key) ?? [];
			ids.push(candidate.candidate_id);
			candidateIdsBySource.set(candidate.source_key, ids);
		}
		const maps = manifests.map(
			item =>
				({
					source_key: item.source_key,
					candidate_ids: candidateIdsBySource.get(item.source_key) ?? [],
					article_slugs: item.article_slugs,
					run_at: started
				}) satisfies SourceArticleMap
		);
		atomic(join(outputDir, "manifest.jsonl"), lineJson(manifests));
		atomic(join(outputDir, "candidates.jsonl"), lineJson(candidates));
		atomic(join(outputDir, "rejected.jsonl"), lineJson(rejected));
		atomic(join(outputDir, "source-article-map.jsonl"), lineJson(maps));
		atomic(
			join(outputDir, "run-summary.md"),
			`# KB ingest run summary\n\n- Run ID: ${summary.run_id}\n- Status: parsed; synthesis pending\n- Dry run: no\n- Discovered records: ${summary.discovered}\n- Processed: ${summary.processed}\n- Unchanged: ${summary.unchanged}\n- Skipped: ${summary.skipped}\n- Failed: ${summary.failed}\n- Candidates: ${summary.candidates}\n- Rejected: ${summary.rejected}\n- Exact duplicates: ${summary.duplicates}\n- Duplicate code blocks: ${summary.duplicate_code_blocks}\n- Duplicate error logs: ${summary.duplicate_error_logs}\n- Semantic duplicate candidates: ${summary.semantic_duplicates}\n- Topic clusters: ${summary.clusters}\n- Errors: ${summary.errors}\n`
		);
		atomic(
			checkpointPath,
			`# Current task\n\n- Run ID: ${summary.run_id}\n- Status: parsing complete; synthesis pending\n- Discovered records: ${summary.discovered}\n- Processed: ${summary.processed}\n- Unchanged: ${summary.unchanged}\n- Skipped: ${summary.skipped}\n- Failed: ${summary.failed}\n- Candidates: ${summary.candidates}\n- Rejected: ${summary.rejected}\n- Current batch: ${discovered}/${discovered}\n- Next action: review clusters and match existing knowledge\n- Resume: rerun; partial ledgers and unchanged identity/content hashes are reused\n`
		);
		for (const path of [partialManifestPath, partialCandidatesPath, partialRejectedPath]) {
			if (existsSync(path)) unlinkSync(path);
		}
	}
	return summary;
}

export const cliHelp =
	"Usage: kb-ingest-sessions [--write] [--output-dir DIR] [--omp-sessions DIR] [--opencode-db FILE] [--codex-dir DIR] [--prompt-history FILE] [--skip-hindsight]";
if (import.meta.url === `file://${process.argv[1]}`) {
	const options = optionsFromArgv(process.argv.slice(2));
	if (options.help) {
		console.log(cliHelp);
	} else {
		const summary = await runIngest(options);
		console.log(JSON.stringify(summary));
	}
}
