import { LS_SCHEME } from "../constants";

export const launchLS = () => {
  for (const key of Object.keys(LS_SCHEME)) {
    if (!localStorage.hasOwnProperty(key)) {
      localStorage.clear();
      return
    }
  }
}

export const reboot = () => window.location.href = window.location.href;

export const getFromLS = (key: string, fallbackData: any) => {
  const saved = localStorage.getItem(key);

  if (!saved) return fallbackData;

  try {
    const parsed = JSON.parse(saved);

    if (typeof fallbackData === "object" && fallbackData !== null && !Array.isArray(fallbackData)) {
      return {
        ...fallbackData,
        ...parsed,
        distribution: {
          ...fallbackData.distribution,
          ...(parsed.distribution ?? {}),
        },
      };
    }

    return parsed;
  } catch {
    return fallbackData;
  }
}

export const getIsValidMobileContext = (): boolean => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
  const isTelegram = Boolean(window.Telegram?.WebApp?.initData);

  return isMobile && (isStandalone || isTelegram);
}
