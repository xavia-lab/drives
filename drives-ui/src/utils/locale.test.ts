import { describe, it, expect } from "vitest";
import enUS from "antd/locale/en_US";
import deDE from "antd/locale/de_DE";
import zhTW from "antd/locale/zh_TW";
import { resolveLocale, resolveAndApplyLocale } from "./locale";

describe("resolveLocale", () => {
  it("falls back to US English for unknown or empty tags", () => {
    expect(resolveLocale()).toEqual({ antd: enUS, dayjs: "en" });
    expect(resolveLocale("xx-YY")).toEqual({ antd: enUS, dayjs: "en" });
  });

  it("resolves a full system tag to its base language", () => {
    expect(resolveLocale("en-US").dayjs).toBe("en");
    expect(resolveLocale("de-AT")).toEqual({ antd: deDE, dayjs: "de" });
  });

  it("resolves script subtags for Chinese variants", () => {
    expect(resolveLocale("zh-Hant-TW")).toEqual({
      antd: zhTW,
      dayjs: "zh-tw",
    });
    expect(resolveLocale("zh-CN").dayjs).toBe("zh-cn");
  });
});

describe("resolveAndApplyLocale", () => {
  it("returns the Ant Design locale object", () => {
    expect(resolveAndApplyLocale("de-DE")).toBe(deDE);
  });
});
