import type { AudioPreferences } from "./audio";
import { rt } from "./i18n";

export function audioSettingsMarkup(prefs: AudioPreferences) {
  return `<div class="audio-settings">${(
    [
      ["sound", "soundVolume", "audio.interfaceTitle", "audio.interfaceDescription", "audio.soundVolume"],
      ["music", "musicVolume", "audio.backgroundTitle", "audio.backgroundDescription", "audio.musicVolume"],
    ] as const
  )
    .map(
      ([toggle, volume, titleKey, descriptionKey, volumeKey]) => `<div class="audio-setting">
    <label class="audio-toggle"><div><strong>${rt(titleKey)}</strong><span>${rt(descriptionKey)}</span></div><input type="checkbox" data-pref="${toggle}" ${prefs[toggle] ? "checked" : ""}/><i class="toggle"></i></label>
    <label class="audio-volume"><span>${rt(volumeKey)}</span><input aria-label="${rt(volumeKey)}" data-volume="${volume}" type="range" min="0" max="100" step="1" value="${Math.round(prefs[volume] * 100)}"/><output>${Math.round(prefs[volume] * 100)}%</output></label>
  </div>`,
    )
    .join("")}</div>`;
}
