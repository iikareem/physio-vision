/** PWA / home-screen helpers — especially for older iOS Safari. */

export type IosInstallContext = {
  isIOS: boolean;
  isSafari: boolean;
  isStandalone: boolean;
  /** True when we should show “Add to Home Screen” help. */
  needsInstallHelp: boolean;
  /** User is on iPhone/iPad but not in Safari (Chrome/Firefox/etc.). */
  needsSafari: boolean;
  iosMajor: number | null;
};

function readIOSMajor(ua: string): number | null {
  // iPhone OS 15_4 or CPU OS 12_5 like Mac OS X
  const m =
    ua.match(/OS (\d+)[_\.](\d+)/i) ||
    ua.match(/Version\/(\d+)\.(\d+).*Mobile.*Safari/i);
  if (!m) return null;
  const major = Number(m[1]);
  return Number.isFinite(major) ? major : null;
}

export function getIosInstallContext(
  win: Window = typeof window !== "undefined" ? window : (undefined as never),
): IosInstallContext {
  if (typeof win === "undefined") {
    return {
      isIOS: false,
      isSafari: false,
      isStandalone: false,
      needsInstallHelp: false,
      needsSafari: false,
      iosMajor: null,
    };
  }

  const nav = win.navigator as Navigator & { standalone?: boolean };
  const ua = nav.userAgent || "";

  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    // iPadOS 13+ may report as Mac with touch
    (nav.platform === "MacIntel" && (nav.maxTouchPoints || 0) > 1);

  const isStandalone =
    nav.standalone === true ||
    win.matchMedia("(display-mode: standalone)").matches ||
    win.matchMedia("(display-mode: fullscreen)").matches ||
    // Some older WebViews expose this
    win.matchMedia("(display-mode: minimal-ui)").matches;

  // Chrome/Firefox/Edge on iOS include CriOS/FxiOS/EdgiOS; real Safari does not.
  const isSafari =
    isIOS &&
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|brave/i.test(ua);

  const iosMajor = isIOS ? readIOSMajor(ua) : null;

  const needsSafari = isIOS && !isStandalone && !isSafari;
  const needsInstallHelp = isIOS && !isStandalone && isSafari;

  return {
    isIOS,
    isSafari,
    isStandalone,
    needsInstallHelp,
    needsSafari,
    iosMajor,
  };
}

export const IOS_INSTALL_DISMISS_KEY = "physio-vision-ios-install-dismissed";
