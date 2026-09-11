import {
  matchingPreset,
  qualityPresets,
  type QualityPreset,
  type RenderQuality,
} from "./render-quality";
import { isWallpaper } from "./wallpaper";
import { escapeHtml } from "./html";
import { rt } from "./i18n";

function choiceControl(attributes: string, label: string, value: string | number, choices: (readonly [string | number, string])[]) {
  if (isWallpaper) {
    const text = choices.find(([key]) => key === value)?.[1] ?? rt("quality.custom");
    return `<button type="button" ${attributes} class="quality-cycle" aria-label="${label}" title="${label}" value="${value}" data-quality-choices="${escapeHtml(JSON.stringify(choices))}"><span data-quality-label>${text}</span><span aria-hidden="true">↻</span></button>`;
  }
  return `<select ${attributes} aria-label="${label}">${choices.map(([key, text]) => `<option value="${key}" ${key === value ? "selected" : ""}>${text}</option>`).join("")}${value === "custom" ? `<option value="custom" disabled selected>${rt("quality.custom")}</option>` : ""}</select>`;
}

if (isWallpaper) document.addEventListener("click", event => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-quality-choices]");
  if (!button || button.disabled) return;
  const choices = JSON.parse(button.dataset.qualityChoices!) as [string | number, string][];
  const index = choices.findIndex(([value]) => String(value) === button.value);
  const [value, label] = choices[(index + 1) % choices.length];
  button.value = String(value);
  button.querySelector("[data-quality-label]")!.textContent = label;
  button.dispatchEvent(new Event("change", { bubbles: true }));
});

function select(
  quality: RenderQuality,
  key: keyof RenderQuality,
  label: string,
  hint: string,
  choices: (readonly [string | number, string])[],
) {
  return `<label class="quality-control"><span>${label}<small>${hint}</small></span>${choiceControl(`data-quality="${key}"`, label, quality[key], choices)}</label>`;
}
function range(
  quality: RenderQuality,
  key: "scale" | "depthOfField",
  label: string,
  hint: string,
  min: number,
  max: number,
) {
  return `<label class="quality-control quality-range"><span>${label}<small>${hint}</small></span><div><input type="range" data-quality="${key}" aria-label="${label}" min="${min}" max="${max}" step="5" value="${quality[key]}"/><output data-quality-output="${key}">${quality[key]}%</output></div></label>`;
}
export function qualityMarkup(quality: RenderQuality) {
  const preset = matchingPreset(quality);
  const presets = (Object.keys(qualityPresets) as QualityPreset[]).map(key => [key, rt(`quality.presets.${key}`)] as const);
  const note = isWallpaper ? rt("quality.noteWallpaper") : rt("quality.noteBrowser");
  return `<section class="quality-settings" aria-label="${rt("quality.aria")}">
    <div class="quality-heading"><h3>${rt("quality.title")} <span>${rt("quality.subtitle")}</span></h3>${choiceControl('id="quality-preset"', rt("quality.preset"), preset, presets)}</div>
    <p class="quality-summary" id="quality-summary" aria-live="polite"></p>
    <details class="quality-advanced"><summary>${rt("quality.advanced")} <span>${rt("quality.advancedSubtitle")}</span></summary><div class="quality-grid">
    ${range(quality, "scale", rt("quality.scale"), rt("quality.scaleHint"), 50, 200)}
    ${select(
      quality,
      "pixelRatio",
      rt("quality.pixelRatio"),
      rt("quality.pixelRatioHint"),
      [1, 1.5, 2, 3].map((v) => [v, `${v}×`]),
    )}
    ${select(quality, "antialias", rt("quality.antialias"), rt("quality.antialiasHint"), [
      ["off", rt("quality.original")],
      ["smaa", "SMAA"],
    ])}
    ${select(
      quality,
      "anisotropy",
      rt("quality.texture"),
      rt("quality.textureHint"),
      [1, 2, 4, 8, 16].map((v) => [v, `${v}×`]),
    )}
    ${select(
      quality,
      "transmission",
      rt("quality.transmission"),
      rt("quality.transmissionHint"),
      [0.25, 0.5, 0.75, 1].map((v) => [v, `${v * 100}%`]),
    )}
    ${select(
      quality,
      "shadows",
      rt("quality.shadows"),
      rt("quality.shadowsHint"),
      [
        [0, rt("quality.off")],
        [1024, "1024"],
        [2048, "2048"],
        [4096, "4096"],
      ],
    )}
    ${select(
      quality,
      "aoSamples",
      rt("quality.aoSamples"),
      rt("quality.aoSamplesHint"),
      [
        [0, rt("quality.off")],
        [16, `16 ${rt("quality.samples")}`],
        [32, `32 ${rt("quality.samples")}`],
        [64, `64 ${rt("quality.samples")}`],
      ],
    )}
    ${select(
      quality,
      "aoResolution",
      rt("quality.aoResolution"),
      rt("quality.aoResolutionHint"),
      [0.5, 0.75, 1].map((v) => [v, `${v * 100}%`]),
    )}
    ${range(quality, "depthOfField", rt("quality.depthOfField"), rt("quality.depthOfFieldHint"), 0, 150)}
    </div></details><p class="quality-note">${note}${rt("quality.noteShared")}</p>
  </section>`;
}

export function syncQualityUI(quality: RenderQuality) {
  const preset = document.querySelector<HTMLSelectElement | HTMLButtonElement>("#quality-preset");
  if (!preset) return;
  preset.value = matchingPreset(quality);
  document
    .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("[data-quality]")
    .forEach((control) => {
      const key = control.dataset.quality as keyof RenderQuality;
      control.value = String(quality[key]);
      control.disabled = key === "aoResolution" && quality.aoSamples === 0;
    });
  document.querySelectorAll<HTMLButtonElement>("[data-quality-choices]").forEach(button => {
    const choices = JSON.parse(button.dataset.qualityChoices!) as [string | number, string][];
    button.querySelector("[data-quality-label]")!.textContent = choices.find(([value]) => String(value) === button.value)?.[1] ?? rt("quality.custom");
  });
  document
    .querySelectorAll<HTMLOutputElement>("[data-quality-output]")
    .forEach((output) => {
      output.value = `${quality[output.dataset.qualityOutput as keyof RenderQuality]}%`;
    });
}
