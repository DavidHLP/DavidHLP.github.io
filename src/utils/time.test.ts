import { describe, expect, it } from "vitest";
import Time from "./time";

/**
 * The Time module uses Temporal. Tests pass an explicit `timezone` via
 * `import.meta.env.PUBLIC_TIMEZONE` to keep the formatting deterministic
 * across hosts (CI, dev machine, GitHub Actions).
 *
 * The locale-formatted variants (`toLocaleString`, `toLocaleDateString`)
 * require an explicit `locale` arg in tests; their `navigator.language`
 * default is a client-only path and out of scope here.
 */
describe("Time.toString", () => {
	it("formats an ISO string as YYYY/MM/DD-HH:MM:SS in the configured timezone", () => {
		import.meta.env.PUBLIC_TIMEZONE = "UTC";
		expect(Time.toString("2025-04-04T00:00:00Z")).toBe("2025/04/04-00:00:00");
	});

	it("respects a non-UTC timezone when configured", () => {
		import.meta.env.PUBLIC_TIMEZONE = "Asia/Shanghai";
		// 2025-04-04T00:00:00Z is 2025-04-04T08:00:00 in Shanghai
		expect(Time.toString("2025-04-04T00:00:00Z")).toBe("2025/04/04-08:00:00");
	});

	it("accepts a Date object", () => {
		import.meta.env.PUBLIC_TIMEZONE = "UTC";
		expect(Time.toString(new Date("2025-04-04T15:30:00Z"))).toBe("2025/04/04-15:30:00");
	});
});

describe("Time.toDateString", () => {
	it("formats an ISO string as YYYY/MM/DD in the configured timezone", () => {
		import.meta.env.PUBLIC_TIMEZONE = "UTC";
		expect(Time.toDateString("2025-04-04T00:00:00Z")).toBe("2025/04/04");
	});

	it("respects a non-UTC timezone when configured", () => {
		import.meta.env.PUBLIC_TIMEZONE = "Asia/Shanghai";
		expect(Time.toDateString("2025-04-04T00:00:00Z")).toBe("2025/04/04");
	});

	it("rolls the date forward when UTC is past midnight in the configured timezone", () => {
		import.meta.env.PUBLIC_TIMEZONE = "Asia/Shanghai";
		// 2025-04-03T18:00:00Z is 2025-04-04T02:00:00 in Shanghai
		expect(Time.toDateString("2025-04-03T18:00:00Z")).toBe("2025/04/04");
	});
});

describe("Time.toLocaleString / toLocaleDateString", () => {
	it("uses the locale the caller passes (not navigator.language)", () => {
		import.meta.env.PUBLIC_TIMEZONE = "UTC";
		// zh-CN: 2025年4月4日
		const formatted = Time.toLocaleDateString("2025-04-04T00:00:00Z", "zh-CN");
		expect(formatted).toContain("2025");
		expect(formatted).toContain("4");
	});

	it("returns a non-empty string for an explicit locale and timezone", () => {
		import.meta.env.PUBLIC_TIMEZONE = "UTC";
		const formatted = Time.toLocaleString("2025-04-04T00:00:00Z", "en-US");
		expect(formatted.length).toBeGreaterThan(0);
	});
});
