import { expect, it } from "vitest";
import { tagOptions } from "./tag-options";

it("ranks tags by article count and searches without counting duplicate tags twice", () => {
	const tags = ["API", "Java", "Redis", "Unused"];
	const items = [{ data: { tags: ["Redis", "Redis", "Java"] } }, { data: { tags: ["Redis", "API"] } }, { data: {} }];
	expect(tagOptions(tags, items)).toEqual([
		{ tag: "Redis", count: 2 },
		{ tag: "API", count: 1 },
		{ tag: "Java", count: 1 },
		{ tag: "Unused", count: 0 }
	]);
	expect(tagOptions(tags, items, "  RED  ")).toEqual([{ tag: "Redis", count: 2 }]);
	expect(tagOptions(tags, items, "missing")).toEqual([]);
	expect(tags).toEqual(["API", "Java", "Redis", "Unused"]);
});
