import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  vi: { translation: {} },
  en: { translation: {} },
};

export function initI18n(language: string = "vi") {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: "vi",
      interpolation: { escapeValue: false },
    })
    .catch((err) => console.error("i18n init error", err));
  return i18n;
}

export default i18n;
