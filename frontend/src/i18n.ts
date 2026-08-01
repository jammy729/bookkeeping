import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enTransactions from "./locales/en/transactions.json";
import enReceipts from "./locales/en/receipts.json";
import enAuth from "./locales/en/auth.json";
import enSettings from "./locales/en/settings.json";
import enReports from "./locales/en/reports.json";
import enCategories from "./locales/en/categories.json";
import enClients from "./locales/en/clients.json";
import enBudgets from "./locales/en/budgets.json";
import enInvoices from "./locales/en/invoices.json";
import enIncome from "./locales/en/income.json";
import enTax from "./locales/en/tax.json";
import enNav from "./locales/en/nav.json";

import frCommon from "./locales/fr/common.json";
import frDashboard from "./locales/fr/dashboard.json";
import frTransactions from "./locales/fr/transactions.json";
import frReceipts from "./locales/fr/receipts.json";
import frAuth from "./locales/fr/auth.json";
import frSettings from "./locales/fr/settings.json";
import frReports from "./locales/fr/reports.json";
import frCategories from "./locales/fr/categories.json";
import frClients from "./locales/fr/clients.json";
import frBudgets from "./locales/fr/budgets.json";
import frInvoices from "./locales/fr/invoices.json";
import frIncome from "./locales/fr/income.json";
import frTax from "./locales/fr/tax.json";
import frNav from "./locales/fr/nav.json";

import koCommon from "./locales/ko/common.json";
import koDashboard from "./locales/ko/dashboard.json";
import koTransactions from "./locales/ko/transactions.json";
import koReceipts from "./locales/ko/receipts.json";
import koAuth from "./locales/ko/auth.json";
import koSettings from "./locales/ko/settings.json";
import koReports from "./locales/ko/reports.json";
import koCategories from "./locales/ko/categories.json";
import koClients from "./locales/ko/clients.json";
import koBudgets from "./locales/ko/budgets.json";
import koInvoices from "./locales/ko/invoices.json";
import koIncome from "./locales/ko/income.json";
import koTax from "./locales/ko/tax.json";
import koNav from "./locales/ko/nav.json";

import esCommon from "./locales/es/common.json";
import esDashboard from "./locales/es/dashboard.json";
import esTransactions from "./locales/es/transactions.json";
import esReceipts from "./locales/es/receipts.json";
import esAuth from "./locales/es/auth.json";
import esSettings from "./locales/es/settings.json";
import esReports from "./locales/es/reports.json";
import esCategories from "./locales/es/categories.json";
import esClients from "./locales/es/clients.json";
import esBudgets from "./locales/es/budgets.json";
import esInvoices from "./locales/es/invoices.json";
import esIncome from "./locales/es/income.json";
import esTax from "./locales/es/tax.json";
import esNav from "./locales/es/nav.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          ...enCommon,
          ...enDashboard,
          ...enTransactions,
          ...enReceipts,
          ...enAuth,
          ...enSettings,
          ...enReports,
          ...enCategories,
          ...enClients,
          ...enBudgets,
          ...enInvoices,
          ...enIncome,
          ...enTax,
          ...enNav,
        },
      },
      fr: {
        translation: {
          ...frCommon,
          ...frDashboard,
          ...frTransactions,
          ...frReceipts,
          ...frAuth,
          ...frSettings,
          ...frReports,
          ...frCategories,
          ...frClients,
          ...frBudgets,
          ...frInvoices,
          ...frIncome,
          ...frTax,
          ...frNav,
        },
      },
      ko: {
        translation: {
          ...koCommon,
          ...koDashboard,
          ...koTransactions,
          ...koReceipts,
          ...koAuth,
          ...koSettings,
          ...koReports,
          ...koCategories,
          ...koClients,
          ...koBudgets,
          ...koInvoices,
          ...koIncome,
          ...koTax,
          ...koNav,
        },
      },
      es: {
        translation: {
          ...esCommon,
          ...esDashboard,
          ...esTransactions,
          ...esReceipts,
          ...esAuth,
          ...esSettings,
          ...esReports,
          ...esCategories,
          ...esClients,
          ...esBudgets,
          ...esInvoices,
          ...esIncome,
          ...esTax,
          ...esNav,
        },
      },
    },
    fallbackLng: "en",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "bookkeeping-lang",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
