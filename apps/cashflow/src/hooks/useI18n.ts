import { useTranslation } from "react-i18next";
import { useLocalStorage } from "./useLocalStorage";

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useLocalStorage(
    "i18nextLng",
    "en",
  );

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
  };

  const getCurrentLanguage = () => currentLanguage;

  const isEnglish = () => currentLanguage === "en";
  const isVietnamese = () => currentLanguage === "vi";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isVietnamese() ? "vi-VN" : "en-US", {
      style: "currency",
      currency: isVietnamese() ? "VND" : "USD",
      minimumFractionDigits: isVietnamese() ? 0 : 2,
      maximumFractionDigits: isVietnamese() ? 0 : 2,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isVietnamese()) {
      return dateObj.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isVietnamese()) {
      return dateObj.toLocaleString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    if (isVietnamese()) {
      return new Intl.NumberFormat("vi-VN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const getDirection = () => {
    // Both English and Vietnamese are LTR languages
    return "ltr";
  };

  const getCurrencySymbol = () => {
    return isVietnamese() ? "₫" : "$";
  };

  const getCurrencyCode = () => {
    return isVietnamese() ? "VND" : "USD";
  };

  const getCurrency = () => {
    return isVietnamese() ? "VND" : "USD";
  };

  return {
    t,
    i18n,
    currentLanguage,
    changeLanguage,
    getCurrentLanguage,
    isEnglish,
    isVietnamese,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatNumber,
    getDirection,
    getCurrencySymbol,
    getCurrencyCode,
    getCurrency,
  };
};
