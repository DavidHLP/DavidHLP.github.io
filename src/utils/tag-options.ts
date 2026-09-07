/** Count articles once per tag; keep equal-frequency tags in the supplied order. */
export function tagOptions(tagList: string[], items: { data: { tags?: string[] } }[], query = "") {
	const counts = new Map<string, number>();
	for (const item of items) {
		for (const tag of new Set(item.data.tags ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	}
	const search = query.trim().toLowerCase();
	return tagList
		.filter(tag => tag.toLowerCase().includes(search))
		.map(tag => ({ tag, count: counts.get(tag) ?? 0 }))
		.sort((a, b) => b.count - a.count);
}
