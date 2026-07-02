/**
 * Heatmap bin strategy — one pipeline, three adapters.
 *
 * `Heatmap.astro` used to inline a three-way switch on `frequency` (day /
 * week / month) and re-derive the same "init empty bins, distribute
 * contents" pattern in each branch. The discriminator leaked into the
 * grid class, the per-cell size class, the date arithmetic, the
 * popup-rendering template, and the label format, so adding a fourth
 * frequency meant editing four places.
 *
 * This module owns the seam. Each adapter is a `HeatmapBinStrategy`
 * with the same shape; `Heatmap.astro` only ever calls
 * `strategy.buildBins(cards, now, config, locale)` and reads
 * `strategy.gridClass` / `strategy.cellSizeClass` /
 * `strategy.showEntryTitles`. The pipeline itself is one place, the
 * differences are three small adapters.
 *
 * The input shape is `ContentCard[]` (the same shape the listing pages,
 * the Atom feed, and the homepage's `<LatestCard />` consume). The
 * pre-deepening module had its own `HeatmapEntry` type and its own
 * `toHeatmapEntries` adapter that ran in parallel to `toCard` —
 * deleting them concentrates the "what does a listable surface see"
 * decision in one place (`ContentCard`), so adding a card field
 * auto-enriches the heatmap.
 *
 * Deletion test: removing this module forces `Heatmap.astro` to
 * re-inline all three branches, the date normalisation, and the
 * popup-rendering if-ladder. The re-spread is the signal this seam
 * is earning its keep.
 */
import { Temporal } from "temporal-polyfill";
import type { ContentCard } from "./content-card";
import Time from "$utils/time";

/** A single heatmap bin — the cell label and the cards that fell inside it. */
export interface HeatmapBin {
	target: string;
	contents: ContentCard[];
}

/** Per-unit config accepted by the strategy. The discriminator is `unit`. */
export type HeatmapConfig = { unit: "day"; weeks?: number } | { unit: "week" } | { unit: "month"; years?: number };

/** Discriminator for selecting a strategy at the call site. */
export type HeatmapUnit = HeatmapConfig["unit"];

/**
 * A heatmap bin strategy — the adapter interface at the seam.
 *
 * Two adapters = a real seam: the `day` / `week` / `month` strategies
 * below are three concrete implementations. The pipeline that consumes
 * them (build bins, distribute entries, render with grid + cell classes)
 * sits in `Heatmap.astro` and never branches on `unit` directly — it
 * reads `showEntryTitles` for the popup template instead.
 */
export interface HeatmapBinStrategy {
	readonly unit: HeatmapUnit;
	/** Tailwind class for the grid layout (column count / flow). */
	readonly gridClass: string;
	/** Tailwind class for the per-cell square size. */
	readonly cellSizeClass: string;
	/**
	 * Whether the cell popup should render each card's title as a link
	 * (`true` for day / week — the user can drill into a single day's
	 * activity) or just an aggregate count (`false` for month — too many
	 * titles to be useful in a 12-month cell). Moving this from
	 * `unit === "month"` in the component to the strategy itself
	 * closes the seam; adding a fourth unit only edits one place.
	 */
	readonly showEntryTitles: boolean;
	/**
	 * Build the bin array spanning from `now` back to the configured
	 * window, then distribute each card into the bin whose range
	 * contains `card.data.timestamp`. Cards outside the window are
	 * dropped. Each strategy normalises the date in the site-configured
	 * timezone (via `Time`) so the bin boundaries are stable across
	 * hosts.
	 */
	buildBins(cards: ContentCard[], now: Temporal.PlainDate, config: HeatmapConfig, locale: string): HeatmapBin[];
}

const dayStrategy: HeatmapBinStrategy = {
	unit: "day",
	gridClass: "grid-flow-col grid-rows-7",
	cellSizeClass: "w-2.5 h-2.5",
	showEntryTitles: true,
	buildBins(cards, now, config, locale) {
		const weekend = now.add({ days: 7 - now.dayOfWeek });
		const weeks = config.unit === "day" ? (config.weeks ?? 20) : 20;
		const start = weekend.subtract({ weeks: weeks - 1, days: 6 });
		const bins: HeatmapBin[] = [];
		let current = start;
		while (Temporal.PlainDate.compare(current, weekend) <= 0) {
			bins.push({ target: current.toLocaleString(locale, { dateStyle: "medium" }), contents: [] });
			current = current.add({ days: 1 });
		}
		for (const card of cards) {
			const date = Time(card.data.timestamp.toISOString()).toPlainDate();
			const gap = start.until(date, { largestUnit: "day" }).days;
			if (gap >= 0 && gap < bins.length) bins[gap].contents.push(card);
		}
		return bins;
	}
};

const weekStrategy: HeatmapBinStrategy = {
	unit: "week",
	gridClass: "grid-cols-13",
	cellSizeClass: "w-4 h-4",
	showEntryTitles: true,
	buildBins(cards, now, _config, locale) {
		const start = now.subtract({ weeks: 51, days: now.dayOfWeek - 1 });
		const bins: HeatmapBin[] = [];
		let current = start;
		while (Temporal.PlainDate.compare(current, now) <= 0) {
			const end = current.add({ days: 6 });
			bins.push({
				target: `${current.toLocaleString(locale, { month: "short", day: "numeric" })} - ${end.toLocaleString(locale, { month: "short", day: "numeric" })}`,
				contents: []
			});
			current = current.add({ weeks: 1 });
		}
		for (const card of cards) {
			const date = Time(card.data.timestamp.toISOString()).toPlainDate();
			const gap = start.until(date, { largestUnit: "week" }).weeks;
			if (gap >= 0 && gap < bins.length) bins[gap].contents.push(card);
		}
		return bins;
	}
};

const monthStrategy: HeatmapBinStrategy = {
	unit: "month",
	gridClass: "grid-cols-12",
	cellSizeClass: "w-4.5 h-4.5",
	showEntryTitles: false,
	buildBins(cards, now, config, locale) {
		const years = config.unit === "month" ? (config.years ?? 4) : 4;
		const start = Temporal.PlainDate.from({ year: now.year - years + 1, month: 1, day: 1 });
		const end = Temporal.PlainDate.from({ year: now.year, month: 12, day: 31 });
		const bins: HeatmapBin[] = [];
		let current = start;
		while (Temporal.PlainDate.compare(current, end) <= 0) {
			bins.push({ target: current.toLocaleString(locale, { month: "short", year: "numeric" }), contents: [] });
			current = current.add({ months: 1 });
		}
		for (const card of cards) {
			const date = Time(card.data.timestamp.toISOString()).toPlainDate();
			const gap = start.until(date, { largestUnit: "month" }).months;
			if (gap >= 0 && gap < bins.length) bins[gap].contents.push(card);
		}
		return bins;
	}
};

const strategies: Record<HeatmapUnit, HeatmapBinStrategy> = {
	day: dayStrategy,
	week: weekStrategy,
	month: monthStrategy
};

/** Resolve the strategy for the given frequency. The single selector at the seam. */
export function getStrategy(unit: HeatmapUnit): HeatmapBinStrategy {
	return strategies[unit];
}
