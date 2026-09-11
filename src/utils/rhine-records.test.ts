import { expect, it, vi } from "vitest";
import { archiveCategoryFor, archiveColumnsFor, type BlogArchive } from "./rhine-records";

it("navigates unequal blog columns beyond the original 32 physical rows", async () => {
	const records = Array.from({ length: 66 }, (_, index) => ({
		id: `X-${index}`,
		category: index === 65 ? "jotting" : "note"
	})) as BlogArchive[];
	expect(archiveColumnsFor([])).toEqual([]);
	expect(archiveColumnsFor(records)).toEqual(["note", "jotting"]);
	vi.stubGlobal("document", { getElementById: () => ({ textContent: JSON.stringify(records) }) });
	try {
		const { fileLocation, columnFiles } = await import("../rhine/data");
		const { fileAtCell, selectionCell } = await import("../rhine/archive-loop");
		for (let index = 0; index < records.length; index++) {
			expect(fileAtCell(fileLocation(index))).toBe(index);
			expect(fileAtCell(selectionCell(index, { lane: 0, row: 12 }))).toBe(index);
		}
		expect(columnFiles(-1)).toEqual([65]);
		expect(fileAtCell({ lane: 0, row: 11 })).toBe(64);
		expect(fileAtCell({ lane: 1, row: -100 })).toBe(65);
	} finally {
		vi.unstubAllGlobals();
	}
});

it("assigns technical archives to stable topic columns", () => {
	expect(archiveCategoryFor({ title: "ResiCache", findings: [] }, "note")).toBe("resicache");
	expect(archiveCategoryFor({ title: "UltiCode", findings: [] }, "note")).toBe("ulticode");
	expect(archiveCategoryFor({ title: "Memory bridge", findings: ["MCP"] }, "note")).toBe("ai-systems");
	expect(archiveCategoryFor({ title: "Storage", findings: ["MySQL"] }, "note")).toBe("data-cache");
	expect(archiveCategoryFor({ title: "Runtime", findings: ["Java"] }, "note")).toBe("java-backend");
	expect(archiveCategoryFor({ title: "Runtime", findings: ["Docker"] }, "note")).toBe("infra-ops");
	expect(archiveCategoryFor({ title: "Runtime", findings: ["Microservices"] }, "note")).toBe("architecture");
	expect(archiveCategoryFor({ title: "Inbox", findings: ["Knowledge Base"] }, "jotting")).toBe("jotting");

	const records = [
		{ category: "Java / 后端", categoryKey: "java-backend" },
		{ category: "ResiCache", categoryKey: "resicache" },
		{ category: "AI / 记忆", categoryKey: "ai-systems" }
	] as BlogArchive[];
	expect(archiveColumnsFor(records)).toEqual(["ResiCache", "AI / 记忆", "Java / 后端"]);
});
