import { assetUrl } from "./asset-url";
import { isWallpaper } from "./wallpaper";
import { rt } from "./i18n";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let installPrompt: InstallPrompt | undefined;
let registration: ServiceWorkerRegistration | undefined;
let ready = false, failed = false, reloading = false, started = false;
let tell: (message: string) => void = () => {};
const installed = () => matchMedia("(display-mode: standalone)").matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event as InstallPrompt;
  refresh();
});
window.addEventListener("appinstalled", () => { installPrompt = undefined; refresh(); });
matchMedia("(display-mode: standalone)").addEventListener("change", refresh);

export function pwaSettingsMarkup() {
  if (isWallpaper) return "";
  const status = !import.meta.env.PROD ? rt("pwa.devPreview")
    : !window.isSecureContext ? rt("pwa.https")
    : !("serviceWorker" in navigator) ? rt("pwa.browser")
    : failed ? rt("pwa.failed")
    : ready ? rt("pwa.ready")
    : rt("pwa.preparing");
  const guidance = installed() ? rt("pwa.installed")
    : ios() ? rt("pwa.ios")
    : installPrompt ? rt("pwa.installReady")
    : rt("pwa.installHint");
  return `<section id="pwa-settings" class="pwa-settings" aria-label="${rt("pwa.aria")}"><h3>${rt("pwa.title")}</h3><p>${guidance}</p><p class="pwa-status" role="status">${status}</p><div class="pwa-actions">${installPrompt && !installed() ? `<button data-pwa-action="install">${rt("pwa.install")}</button>` : ""}${registration?.waiting ? `<span>${rt("pwa.newVersion")}</span><button data-pwa-action="update">${rt("pwa.update")}</button>` : ""}${failed ? `<button data-pwa-action="retry">${rt("pwa.retry")}</button>` : ""}</div></section>`;
}
function refresh() {
  const current = document.querySelector("#pwa-settings");
  if (current) current.outerHTML = pwaSettingsMarkup();
  document.documentElement.dataset.offlineReady = String(ready);
  const notice = document.querySelector<HTMLElement>("#pwa-update-notice");
  const waiting = Boolean(registration?.waiting);
  if (notice) notice.hidden = !waiting;
  const stage = document.querySelector<HTMLElement>("#stage");
  if (stage) stage.dataset.pwaUpdate = String(waiting);
}

export async function initPwa(notify: (message: string) => void) {
  if (isWallpaper) return;
  tell = notify;
  if (started || !import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) return;
  started = true;
  try {
    registration = await navigator.serviceWorker.register(assetUrl("sw.js"), {
      scope: import.meta.env.BASE_URL, updateViaCache: "none",
    });
    const watch = () => {
      const worker = registration?.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          failed = false;
          refresh();
        } else if (worker.state === "redundant" && !registration?.active) {
          failed = true; refresh();
        }
      });
    };
    registration.addEventListener("updatefound", watch);
    watch();
    refresh();
    void navigator.serviceWorker.ready.then(() => { ready = true; failed = false; refresh(); });
    let lastCheck = Date.now();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - lastCheck > 3_600_000) {
        lastCheck = Date.now(); void registration?.update().catch(() => {});
      }
    });
  } catch { failed = true; }
  refresh();
}

if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (reloading) location.reload();
  else refresh();
});
document.addEventListener("click", async event => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-pwa-action]");
  if (!button) return;
  if (button.dataset.pwaAction === "install" && installPrompt) {
    const prompt = installPrompt; installPrompt = undefined;
    try { await prompt.prompt(); await prompt.userChoice; } catch { tell(rt("pwa.installError")); }
    refresh();
  }
  if (button.dataset.pwaAction === "update" && registration?.waiting) {
    reloading = true;
    button.disabled = true;
    registration.waiting.postMessage({ type: "RHINE_APPLY_UPDATE" });
  }
  if (button.dataset.pwaAction === "retry") {
    failed = false;
    refresh();
    if (registration) {
      try { await registration.update(); } catch { failed = true; refresh(); }
    } else { started = false; void initPwa(tell); }
  }
});
