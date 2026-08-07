import { onMounted } from "vue";

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  colorScheme: "light" | "dark";
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  HapticFeedback?: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
  MainButton?: {
    text: string;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    enable: () => void;
    disable: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

const { getUser } = useTelegram();

const user = getUser();

console.log(user);

export function useTelegram() {
  const getWebApp = (): TelegramWebApp | null => {
    if (typeof window === "undefined") return null;
    return window.Telegram?.WebApp ?? null;
  };

  const haptic = (style: "light" | "medium" | "heavy" = "light") => {
    const webApp = getWebApp();
    webApp?.HapticFeedback?.impactOccurred(style);
  };

  const hapticNotify = (type: "success" | "warning" | "error" = "success") => {
    const webApp = getWebApp();
    webApp?.HapticFeedback?.notificationOccurred(type);
  };

  const init = () => {
    onMounted(() => {
      const webApp = getWebApp();
      if (!webApp) return;

      webApp.ready();
      webApp.expand();
      const color = webApp.colorScheme === "dark" ? "#0f0f0f" : "#ffffff";
      webApp.setHeaderColor(color);
      webApp.setBackgroundColor(color);
    });
  };

  const getUser = () => {
    return getWebApp()?.initDataUnsafe.user ?? null;
  };

  const getInitData = () => {
    return getWebApp()?.initData ?? "";
  };

  return {
    getWebApp,
    getUser,
    getInitData,
    haptic,
    hapticNotify,
    init,
  };
}
