import type { Locale } from "antd/es/locale";
import arEG from "antd/locale/ar_EG";
import deDE from "antd/locale/de_DE";
import enGB from "antd/locale/en_GB";
import enUS from "antd/locale/en_US";
import esES from "antd/locale/es_ES";
import frFR from "antd/locale/fr_FR";
import hiIN from "antd/locale/hi_IN";
import itIT from "antd/locale/it_IT";
import jaJP from "antd/locale/ja_JP";
import koKR from "antd/locale/ko_KR";
import nlNL from "antd/locale/nl_NL";
import plPL from "antd/locale/pl_PL";
import ptBR from "antd/locale/pt_BR";
import ruRU from "antd/locale/ru_RU";
import svSE from "antd/locale/sv_SE";
import trTR from "antd/locale/tr_TR";
import zhCN from "antd/locale/zh_CN";
import zhTW from "antd/locale/zh_TW";
import dayjs from "dayjs";

// Side-effect imports register the dayjs locales we can activate at runtime.
// `resolveAndApplyLocale` switches the globally active one.
import "dayjs/locale/ar";
import "dayjs/locale/de";
import "dayjs/locale/en-gb";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/hi";
import "dayjs/locale/it";
import "dayjs/locale/ja";
import "dayjs/locale/ko";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt";
import "dayjs/locale/pt-br";
import "dayjs/locale/ru";
import "dayjs/locale/sv";
import "dayjs/locale/tr";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";

export type ResolvedLocale = {
  /** Locale object handed to Ant Design's `ConfigProvider`. */
  antd: Locale;
  /** dayjs locale code used for date formatting. */
  dayjs: string;
};

const DEFAULT_LOCALE: ResolvedLocale = { antd: enUS, dayjs: "en" };

// Keyed by a lowercased BCP-47 tag or its base language code.
const SUPPORTED_LOCALES: Record<string, ResolvedLocale> = {
  en: DEFAULT_LOCALE,
  "en-gb": { antd: enGB, dayjs: "en-gb" },
  de: { antd: deDE, dayjs: "de" },
  fr: { antd: frFR, dayjs: "fr" },
  es: { antd: esES, dayjs: "es" },
  it: { antd: itIT, dayjs: "it" },
  nl: { antd: nlNL, dayjs: "nl" },
  pl: { antd: plPL, dayjs: "pl" },
  sv: { antd: svSE, dayjs: "sv" },
  tr: { antd: trTR, dayjs: "tr" },
  ja: { antd: jaJP, dayjs: "ja" },
  ko: { antd: koKR, dayjs: "ko" },
  ru: { antd: ruRU, dayjs: "ru" },
  ar: { antd: arEG, dayjs: "ar" },
  hi: { antd: hiIN, dayjs: "hi" },
  pt: { antd: ptBR, dayjs: "pt" },
  "pt-br": { antd: ptBR, dayjs: "pt-br" },
  zh: { antd: zhCN, dayjs: "zh-cn" },
  "zh-cn": { antd: zhCN, dayjs: "zh-cn" },
  "zh-hans": { antd: zhCN, dayjs: "zh-cn" },
  "zh-tw": { antd: zhTW, dayjs: "zh-tw" },
  "zh-hant": { antd: zhTW, dayjs: "zh-tw" },
};

/**
 * Maps an arbitrary BCP-47 tag (e.g. "de-AT", "zh-Hant-TW") to a supported
 * Ant Design + dayjs locale, falling back to US English. Tries the full tag,
 * then the language+script subtag, then the bare language.
 */
export const resolveLocale = (tag?: string | null): ResolvedLocale => {
  if (!tag) {
    return DEFAULT_LOCALE;
  }

  const normalized = tag.toLowerCase();
  const parts = normalized.split("-");
  const candidates = [normalized, parts.slice(0, 2).join("-"), parts[0]];

  for (const candidate of candidates) {
    if (SUPPORTED_LOCALES[candidate]) {
      return SUPPORTED_LOCALES[candidate];
    }
  }

  return DEFAULT_LOCALE;
};

/** Reads the preferred locale from the browser, safe to call during SSR. */
export const detectSystemLocale = (): string | undefined => {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return navigator.languages?.[0] ?? navigator.language;
};

/**
 * Resolves a locale tag to an Ant Design locale and applies the matching dayjs
 * locale globally so every date field stays consistent with the widgets.
 */
export const resolveAndApplyLocale = (tag?: string | null): Locale => {
  const resolved = resolveLocale(tag);
  dayjs.locale(resolved.dayjs);
  return resolved.antd;
};
