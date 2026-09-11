import { expect, it } from "vitest";
import { searchCards, type SearchableCard } from "./content-search";

it("searches Chinese and normalized literal terms across fields, ranking titles first without changing the input", () => {
	const card = (id: string, title: string, searchText = "", tags: string[] = []): SearchableCard => ({
		id,
		url: `/note/${id}`,
		section: "note",
		searchText,
		data: { title, tags, top: 0, timestamp: new Date(0), series: "并发" }
	});
	const items = [card("body", "缓存实践", "Redis CAS"), card("tag", "缓存", "CAS", ["Redis"]), card("title", "Redis 并发", "CAS")];
	expect(searchCards(items, "  ＲＥＤＩＳ   cas ").map(x => x.id)).toEqual(["title", "tag", "body"]);
	expect(searchCards(items, "缓存 并发").map(x => x.id)).toEqual(["body", "tag"]);
	expect(searchCards(items, "redis missing")).toEqual([]);
	expect(searchCards(items, "[.*")).toEqual([]);
	expect(searchCards(items, " \n ")).toBe(items);
	expect(searchCards(items, "redis redis")).toEqual(searchCards(items, "redis"));
	expect(items.map(x => x.id)).toEqual(["body", "tag", "title"]);
});
