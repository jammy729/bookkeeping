import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, type Locale } from "date-fns"
import { enUS, fr, ko, es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const localeMap: Record<string, Locale> = {
  en: enUS,
  fr,
  ko,
  es,
};

const dateFormatMap: Record<string, string> = {
  en: "MMM d, yyyy",
  fr: "d MMM yyyy",
  ko: "yyyy년 MM월 dd일",
  es: "d 'de' MMM 'de' yyyy",
};

const dateFormatShortMap: Record<string, string> = {
  en: "MMM d",
  fr: "d MMM",
  ko: "MM월 dd일",
  es: "d MMM",
};

const dateFormatMonthYearMap: Record<string, string> = {
  en: "MMM yyyy",
  fr: "MMM yyyy",
  ko: "yyyy년 MM월",
  es: "MMM yyyy",
};

function getLocale(lang?: string): Locale {
  const lng = (lang || "en").split("-")[0];
  return localeMap[lng] || enUS;
}

function getDateFormat(lang?: string): string {
  const lng = (lang || "en").split("-")[0];
  return dateFormatMap[lng] || dateFormatMap.en;
}

function getDateFormatShort(lang?: string): string {
  const lng = (lang || "en").split("-")[0];
  return dateFormatShortMap[lng] || dateFormatShortMap.en;
}

function getDateFormatMonthYear(lang?: string): string {
  const lng = (lang || "en").split("-")[0];
  return dateFormatMonthYearMap[lng] || dateFormatMonthYearMap.en;
}

export function formatCurrency(amount: number, lang?: string): string {
  const lng = lang?.split("-")[0] || "en";
  const locale = lng === "fr" ? "fr-CA" : lng === "ko" ? "ko-KR" : lng === "es" ? "es-ES" : "en-CA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, lang?: string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, getDateFormat(lang), { locale: getLocale(lang) })
}

export function formatDateShort(date: string | Date, lang?: string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, getDateFormatShort(lang), { locale: getLocale(lang) })
}

export function formatMonthYear(date: string | Date, lang?: string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, getDateFormatMonthYear(lang), { locale: getLocale(lang) })
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM")
}

export function getStartOfYear(): string {
  return format(new Date(), "yyyy-01-01")
}

export function formatNumber(value: number, lang?: string): string {
  const lng = lang?.split("-")[0] || "en";
  const locale = lng === "fr" ? "fr-CA" : lng === "ko" ? "ko-KR" : lng === "es" ? "es-ES" : "en-CA";
  return new Intl.NumberFormat(locale).format(value);
}

export function hslVar(name: string): string {
  if (typeof document === "undefined") return "#000";
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val ? `hsl(${val})` : "#000";
}
