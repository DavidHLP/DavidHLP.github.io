// biome-ignore-all lint/style/useNamingConvention: fixtures mirror external JSONL and JSONL ledger contracts.
import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
	deduplicateAndCluster,
	extractCandidates,
	normalizedFingerprint,
	parseCodexFile,
	parseOmpFile,
	parseOpenCodeDb,
	parsePromptHistory,
	redactText,
	runIngest,
	sourceKeyFor
} from "./kb-ingest-sessions";

function temp(): string {
	return mkdtempSync(join(tmpdir(), "kb-ingest-"));
}
function writeJsonl(path: string, values: unknown[]): void {
	writeFileSync(path, `${values.map(value => JSON.stringify(value)).join("\n")}\n`);
}

const session = (id: string, cwd: string) => ({ type: "session", id, cwd, timestamp: "2026-08-12T00:00:00.000Z" });
const ompMessage = (role: string, content: unknown[]) => ({ type: "message", message: { role, content } });
const privateHome = join("/", "home", "alice");
const shortPrivateHome = join("/", "home", "a");

describe("privacy-safe session ingestion", () => {
	it("redacts credentials, identity, hosts, paths, and private repositories", () => {
		const apiSecret = `${["s", "k"].join("")}-${"a".repeat(16)}`;
		const tokenSecret = `${["g", "h", "p"].join("")}_${"b".repeat(16)}`;
		const opaqueToken = ["opaque", "value"].join("-");
		const dsnPassword = ["dsn", "password"].join("-");
		const redisPassword = ["redis", "password"].join("-");
		const jsonPassword = ["json", "password"].join("-");
		const jsonToken = ["json", "token"].join("-");
		const jsonApiKey = ["json", "api-key"].join("-");
		const passwordSecret = ["hunter", "2"].join("");
		const escapedApiSuffix = ["escaped", "api", "tail"].join("-");
		const escapedTokenSuffix = ["escaped", "token", "tail"].join("-");
		const escapedPasswordSuffix = ["escaped", "password", "tail"].join("-");
		const privateEmail = ["me", "example.com"].join("@");
		const localLogin = ["user", "buildbox"].join("@");
		const result = redactText(
			`OPENAI_API_KEY=${apiSecret} APP_TOKEN=${tokenSecret} NPM_TOKEN=${opaqueToken} NACOS_PASSWORD=${passwordSecret} postgres://dbuser:${dsnPassword}@db.example/app redis://:${redisPassword}@localhost:6379/0 {"password": "${jsonPassword}", "cookie": "${jsonToken}", "api_key": "${jsonApiKey}"} ${JSON.stringify({ api_key: `prefix"${escapedApiSuffix}`, token: `prefix'${escapedTokenSuffix}`, password: `prefix"${escapedPasswordSuffix}` })} tokens_saved=42 token_count=10 email ${privateEmail} at db.internal 192.168.1.2 ::1 fe80::1 fd00::42 中文${privateHome}/app >${privateHome}/redirect file:${privateHome}/source C:\\Users\\alice\\secret D:\\work\\private-repo \\\\corp-fs\\private\\file ~/.config/app path:~/.omp/store /tmp/architecture-review-output.html ${localLogin} git@github.com:private/repo.git https://user:pass@github.com/private/repo.git`
		);
		for (const placeholder of [
			"<REDACTED_API_KEY>",
			"<REDACTED_TOKEN>",
			"<REDACTED_PASSWORD>",
			"<PRIVATE_EMAIL>",
			"<PRIVATE_HOST>",
			"<PRIVATE_PATH>",
			"<PRIVATE_REPOSITORY>"
		]) {
			expect(result.text).toContain(placeholder);
		}
		for (const secret of [
			apiSecret,
			tokenSecret,
			opaqueToken,
			passwordSecret,
			dsnPassword,
			redisPassword,
			jsonPassword,
			jsonToken,
			jsonApiKey,
			escapedApiSuffix,
			escapedTokenSuffix,
			escapedPasswordSuffix,
			"alice",
			privateEmail,
			localLogin,
			"db.internal",
			"user:pass",
			"::1",
			"fe80::1",
			"fd00::42",
			"architecture-review-output.html",
			"~/.config/app",
			"~/.omp/store",
			"C:\\Users\\alice\\secret",
			"D:\\work\\private-repo",
			"\\\\corp-fs\\private\\file"
		]) {
			expect(result.text).not.toContain(secret);
		}
		expect(result.text).toContain("tokens_saved=42 token_count=10");
	});

	it("keeps only visible OMP user/assistant prose and isolates malformed lines", async () => {
		const root = temp();
		const file = join(root, "session.jsonl");
		writeJsonl(file, [
			session("omp-secret-id", join(privateHome, "project")),
			ompMessage("system", [{ type: "text", text: "do not publish" }]),
			ompMessage("user", [
				{ type: "text", text: "Keep this user question" },
				{ type: "toolCall", text: "hidden" }
			]),
			ompMessage("user", [{ type: "text", text: "### Session update [in progress]\n→ read(private-log)" }]),
			ompMessage("user", [{ type: "text", text: "Complete assignment thoroughly: hidden review task" }]),
			ompMessage("user", [{ type: "text", text: "[user] **agent**: _thinking:_ hidden nested transcript" }]),
			ompMessage("assistant", [{ type: "text", text: "[assistant] hidden nested transcript with _thinking:_ later" }]),
			ompMessage("assistant", [{ type: "text", text: "[in progress — more steps follow]" }]),
			ompMessage("assistant", [{ type: "text", text: "[assistant] call:default_api:eval{code:process.exit(1)}" }]),
			ompMessage("assistant", [{ type: "text", text: "Internal review\n// Inspect private state\n→ bash(git status --short) ⇒ ok · 2 lines" }]),
			ompMessage("assistant", [
				{ type: "text", text: "The transcript's `_thinking:_` is only a summary; the real reasoning block consumes the budget." }
			]),
			ompMessage("assistant", [{ type: "text", text: "→ mcp__context_mode_ctx_execute({code: 'private'}) ⇒ ok · 1 line" }]),
			ompMessage("assistant", [{ type: "text", text: "Parent IRC message: hidden coordination" }]),
			ompMessage("assistant", [{ type: "text", text: "Current interruptible wait stopped early for immediate reading." }]),
			ompMessage("assistant", [{ type: "text", text: "[budget notice] hidden accounting" }]),
			ompMessage("assistant", [{ type: "text", text: "[async-result] hidden job payload" }]),
			ompMessage("assistant", [{ type: "text", text: "(No response)" }]),
			ompMessage("user", [{ type: "text", text: "A legitimate example may contain → read(file)" }]),
			ompMessage("user", [{ type: "text", text: "A legitimate article may quote the _thinking:_ marker" }]),
			ompMessage("assistant", [
				{ type: "thinking", text: "hidden reasoning" },
				{ type: "text", text: "Keep this answer" }
			]),
			ompMessage("assistant", [{ type: "text", text: "_thinking:_ hidden internal reasoning" }]),
			ompMessage("toolResult", [{ type: "text", text: "hidden tool output" }])
		]);
		writeFileSync(file, `${readFileSync(file, "utf8")}not-json\n`);
		const parsed = await parseOmpFile(file);
		expect(parsed.candidates.map(item => item.text)).toEqual([
			"Keep this user question",
			"A legitimate example may contain → read(file)",
			"A legitimate article may quote the _thinking:_ marker",
			"Keep this answer"
		]);
		expect(parsed.error).toBeTruthy();
		expect(parsed.sessionIdentity).toBe("omp-secret-id");
	});

	it("uses Codex response_item messages once and excludes developer/event traces", async () => {
		const root = temp();
		const file = join(root, "codex.jsonl");
		writeJsonl(file, [
			{ type: "session_meta", payload: { session_id: "codex-secret", cwd: join(privateHome, "work"), timestamp: "2026-08-12T00:00:00Z" } },
			{ type: "response_item", payload: { type: "message", role: "developer", content: [{ type: "input_text", text: "hidden developer" }] } },
			{ type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "one canonical prompt" }] } },
			{ type: "event_msg", payload: { type: "user_message", text: "duplicate event prompt" } },
			{
				type: "response_item",
				payload: { type: "message", role: "assistant", content: [{ type: "output_text", text: "one canonical answer" }] }
			},
			{ type: "response_item", payload: { type: "reasoning", text: "hidden" } }
		]);
		const parsed = await parseCodexFile(file);
		expect(parsed.candidates.map(item => item.text)).toEqual(["one canonical prompt", "one canonical answer"]);
	});

	it("reads OpenCode SQLite in read-only mode and only text parts", () => {
		const root = temp();
		const dbPath = join(root, "opencode.db");
		const db = new DatabaseSync(dbPath);
		db.exec("CREATE TABLE session (id TEXT, project_id TEXT, directory TEXT, time_created INTEGER, time_updated INTEGER)");
		db.exec("CREATE TABLE message (id TEXT, session_id TEXT, time_created INTEGER, data TEXT)");
		db.exec("CREATE TABLE part (message_id TEXT, data TEXT, time_created INTEGER)");
		db.prepare("INSERT INTO session VALUES (?, ?, ?, ?, ?)").run(
			"ses-secret",
			"project-secret",
			join(privateHome, "work"),
			1780000000000,
			1780000001000
		);
		db.prepare("INSERT INTO message VALUES (?, ?, ?, ?)").run(
			"msg-user",
			"ses-secret",
			1780000000000,
			JSON.stringify({ role: "user", time: { created: 1780000000000 } })
		);
		db.prepare("INSERT INTO message VALUES (?, ?, ?, ?)").run(
			"msg-assistant",
			"ses-secret",
			1780000000001,
			JSON.stringify({ role: "assistant", time: { created: 1780000000001 } })
		);
		db.prepare("INSERT INTO part VALUES (?, ?, ?)").run("msg-user", JSON.stringify({ type: "text", text: "visible question" }), 1);
		db.prepare("INSERT INTO part VALUES (?, ?, ?)").run("msg-assistant", JSON.stringify({ type: "reasoning", text: "hidden reasoning" }), 2);
		db.prepare("INSERT INTO part VALUES (?, ?, ?)").run("msg-assistant", JSON.stringify({ type: "text", text: "visible answer" }), 3);
		db.close();
		const parsed = parseOpenCodeDb(dbPath);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].candidates.map(item => item.text)).toEqual(["visible question", "visible answer"]);
		expect(readFileSync(dbPath).length).toBeGreaterThan(0);
	});
	it("keeps prompt-history identity stable when content is appended", async () => {
		const root = temp();
		const file = join(root, "prompt-history.jsonl");
		writeJsonl(file, [{ text: "Diagnose a TypeScript build error with tests." }]);
		const first = await parsePromptHistory(file);
		writeJsonl(file, [{ text: "Diagnose a TypeScript build error with tests." }, { text: "The focused test now passes after the minimal fix." }]);
		const changed = await parsePromptHistory(file);
		expect(changed.sessionIdentity).toBe(first.sessionIdentity);
		expect(changed.contentHash).not.toBe(first.contentHash);
	});

	it("deduplicates exact normalized text and bounds clusters", () => {
		const source = {
			candidate_id: "a",
			fingerprint: normalizedFingerprint("Hello  WORLD"),
			topic_keys: ["hello", "world"],
			decision: "jotting",
			cluster_id: "",
			cluster_size: 1
		};
		const duplicate = { ...source, candidate_id: "b", fingerprint: normalizedFingerprint(" hello world ") };
		const output = deduplicateAndCluster([source as never, duplicate as never]);
		expect(output[1].decision).toBe("duplicate");
		expect(output[1].duplicate_of).toBe("a");
	});

	it("keys sources by tool, project, session, and content hash", async () => {
		const root = temp();
		const firstPath = join(root, "first.jsonl");
		const secondPath = join(root, "second.jsonl");
		const values = [
			session("same-session", join(privateHome, "project")),
			ompMessage("user", [{ type: "text", text: "Debug a TypeScript build error with a reproducible validation command." }])
		];
		writeJsonl(firstPath, values);
		writeJsonl(secondPath, values);
		const first = await parseOmpFile(firstPath);
		const moved = await parseOmpFile(secondPath);
		expect(sourceKeyFor(first)).toBe(sourceKeyFor(moved));
		writeJsonl(firstPath, [...values, ompMessage("assistant", [{ type: "text", text: "The corrected build now passes." }])]);
		const changed = await parseOmpFile(firstPath);
		expect(sourceKeyFor(changed)).not.toBe(sourceKeyFor(first));
		expect(sourceKeyFor({ ...first, tool: "codex" })).not.toBe(sourceKeyFor(first));
		expect(extractCandidates({ ...first, error: "source_changed_during_read" } as never)).toEqual([]);
	});

	it("reprocesses a previously failed source even when its content hash is unchanged", async () => {
		const root = temp();
		const omp = join(root, "omp");
		const output = join(root, "out");
		mkdirSync(omp);
		writeJsonl(join(omp, "one.jsonl"), [
			session("retry-session", privateHome),
			ompMessage("user", [{ type: "text", text: "Diagnose a TypeScript build failure and verify the minimal fix." }])
		]);
		const common = {
			repoRoot: root,
			ompSessions: omp,
			opencodeDb: join(root, "missing.db"),
			codexDir: join(root, "missing-codex"),
			outputDir: output,
			skipHindsight: true
		};
		await runIngest({ ...common, write: true });
		const prior = JSON.parse(readFileSync(join(output, "manifest.jsonl"), "utf8").split("\n")[0]);
		writeJsonl(join(output, "manifest.jsonl"), [{ ...prior, parse_status: "failed", candidate_count: 0 }]);
		writeFileSync(join(output, "candidates.jsonl"), "");
		writeJsonl(join(output, "rejected.jsonl"), [
			{ rejection_id: "failed", source_key: prior.source_key, reason: "malformed_or_unavailable_source", run_at: prior.run_at }
		]);
		const retried = await runIngest({ ...common, write: true });
		expect(retried.processed).toBe(1);
		expect(retried.candidates).toBe(1);
	});

	it("records OMP advisor files as skipped internal control-plane sources", async () => {
		const root = temp();
		const omp = join(root, "omp");
		const output = join(root, "out");
		mkdirSync(omp);
		const advisorPath = join(omp, "__advisor.jsonl");
		writeJsonl(advisorPath, [
			session("advisor-session", privateHome),
			ompMessage("assistant", [{ type: "text", text: "The agent is mid-turn and there is nothing to critique yet." }])
		]);
		const summary = await runIngest({
			repoRoot: root,
			ompSessions: omp,
			opencodeDb: join(root, "missing.db"),
			codexDir: join(root, "missing-codex"),
			promptHistory: join(root, "missing-history.jsonl"),
			outputDir: output,
			skipHindsight: true,
			write: true
		});
		const manifests = readFileSync(join(output, "manifest.jsonl"), "utf8")
			.trim()
			.split("\n")
			.map(line => JSON.parse(line));
		const advisor = manifests.find(item => item.record_type === "advisor");
		expect(summary.candidates).toBe(0);
		expect(advisor.parse_status).toBe("skipped");
		expect(advisor.skip_reason).toBe("internal_control_plane");
		rmSync(advisorPath);
		await runIngest({
			repoRoot: root,
			ompSessions: omp,
			opencodeDb: join(root, "missing.db"),
			codexDir: join(root, "missing-codex"),
			promptHistory: join(root, "missing-history.jsonl"),
			outputDir: output,
			skipHindsight: true,
			write: true
		});
		expect(readFileSync(join(output, "manifest.jsonl"), "utf8")).not.toContain('"record_type":"advisor"');
	});

	it("dry-runs without ledger mutation, then preserves unchanged state on write rerun", async () => {
		const root = temp();
		const omp = join(root, "omp");
		const output = join(root, "out");
		mkdirSync(omp);
		const sourceFile = join(omp, "one.jsonl");
		writeJsonl(sourceFile, [
			session("session-private", shortPrivateHome),
			ompMessage("user", [
				{
					type: "text",
					text: "Diagnose a TypeScript build error, identify its root cause, apply the minimal fix, and verify it with the project test command so the solution is reusable."
				}
			])
		]);
		const common = {
			repoRoot: root,
			outputDir: output,
			ompSessions: omp,
			opencodeDb: join(root, "missing.db"),
			codexDir: join(root, "none"),
			promptHistory: join(root, "missing-history.jsonl"),
			skipHindsight: true
		};
		const dry = await runIngest(common);
		expect(dry.dry_run).toBe(true);
		expect(existsSync(output)).toBe(false);
		const first = await runIngest({ ...common, write: true });
		expect(first.processed).toBe(1);
		if (process.platform !== "win32") {
			expect(statSync(output).mode & 0o777).toBe(0o700);
			expect(statSync(join(output, "manifest.jsonl")).mode & 0o777).toBe(0o600);
			expect(statSync(join(root, ".agent", "checkpoints")).mode & 0o777).toBe(0o700);
		}
		writeJsonl(sourceFile, [
			session("session-private", shortPrivateHome),
			ompMessage("user", [
				{
					type: "text",
					text: "Diagnose a TypeScript build error, identify its root cause, apply the minimal fix, and verify the updated implementation with the project test command."
				}
			])
		]);
		const changed = await parseOmpFile(sourceFile);
		const priorManifest = JSON.parse(readFileSync(join(output, "manifest.jsonl"), "utf8").split("\n")[0]);
		writeJsonl(join(output, "manifest.partial.jsonl"), [
			{
				...priorManifest,
				source_key: sourceKeyFor(changed),
				content_hash: changed.contentHash,
				parse_status: "processed",
				redaction_status: "none:v5",
				candidate_count: 1
			}
		]);
		writeFileSync(join(output, "candidates.partial.jsonl"), "");
		const recovered = await runIngest({ ...common, write: true });
		expect(recovered.processed).toBe(1);
		expect(recovered.candidates).toBe(1);
		const second = await runIngest({ ...common, write: true });
		expect(second.unchanged).toBe(1);
		const manifest = readFileSync(join(output, "manifest.jsonl"), "utf8");
		expect(manifest).not.toContain(shortPrivateHome);
		expect(manifest).not.toContain("session-private");
		const staleCandidate = JSON.parse(readFileSync(join(output, "candidates.jsonl"), "utf8").split("\n")[0]);
		writeJsonl(join(output, "candidates.jsonl"), [
			{
				...staleCandidate,
				text: "[user] _thinking_: stale internal transcript",
				summary: "safe text",
				user_goal: "safe text"
			}
		]);
		const filtered = await runIngest({ ...common, write: true });
		expect(filtered.unchanged).toBe(1);
		expect(filtered.candidates).toBe(0);
		expect(filtered.rejected).toBeGreaterThanOrEqual(1);
		const serializedFiltered = readFileSync(join(output, "candidates.jsonl"), "utf8");
		expect(serializedFiltered).not.toContain("_thinking_:");
		rmSync(omp, { recursive: true, force: true });
		const offline = await runIngest({ ...common, write: true });
		expect(offline.candidates).toBe(0);
		expect(offline.skipped).toBeGreaterThanOrEqual(1);
	});
});
