"use client";

import { RefineThemes } from "@refinedev/antd";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import type { Locale } from "antd/es/locale";
import { detectSystemLocale, resolveAndApplyLocale } from "@utils/locale";
import Cookies from "js-cookie";
import React, {
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";

export type PrimaryColorPreset = {
  name: string;
  color: string;
};

export const PRIMARY_COLOR_PRESETS: PrimaryColorPreset[] = [
  { name: "Emerald", color: "#50C878" },
  { name: "Ocean", color: "#1677FF" },
  { name: "Violet", color: "#722ED1" },
  { name: "Magenta", color: "#EB2F96" },
  { name: "Crimson", color: "#F5222D" },
  { name: "Sunset", color: "#FA8C16" },
  { name: "Teal", color: "#13C2C2" },
  { name: "Graphite", color: "#595959" },
];

export const DEFAULT_PRIMARY_COLOR = "#50C878";

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType,
);

type ColorModeContextProviderProps = {
  defaultMode?: string;
  defaultPrimaryColor?: string;
};

export const ColorModeContextProvider: React.FC<
  PropsWithChildren<ColorModeContextProviderProps>
> = ({ children, defaultMode, defaultPrimaryColor }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState(defaultMode || "light");
  const [primaryColor, setPrimaryColorState] = useState(
    defaultPrimaryColor || DEFAULT_PRIMARY_COLOR,
  );
  // Default to English so SSR and the first client render match, then switch to
  // the system locale once mounted.
  const [locale, setLocale] = useState<Locale>(() =>
    resolveAndApplyLocale("en"),
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const theme = Cookies.get("theme") || "light";
      setMode(theme);

      const storedPrimaryColor = Cookies.get("primaryColor");
      if (storedPrimaryColor) {
        setPrimaryColorState(storedPrimaryColor);
        document.documentElement.style.setProperty(
          "--color-primary",
          storedPrimaryColor,
        );
      }
    }
  }, [isMounted]);

  useEffect(() => {
    setLocale(resolveAndApplyLocale(detectSystemLocale()));
  }, []);

  const setColorMode = () => {
    if (mode === "light") {
      setMode("dark");
      Cookies.set("theme", "dark");
    } else {
      setMode("light");
      Cookies.set("theme", "light");
    }
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    Cookies.set("primaryColor", color);
    document.documentElement.style.setProperty("--color-primary", color);
  };

  const { darkAlgorithm, defaultAlgorithm } = theme;

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
        setPrimaryColor,
        primaryColor,
      }}
    >
      <ConfigProvider
        // An explicit locale keeps Ant Design and dayjs consistent. It also
        // stops ProComponents' ProConfigProvider (used by EditableProTable) from
        // falling back to zh_CN and running dayjs.locale('zh-cn') globally.
        locale={locale}
        // `colorPrimary` is user-selectable (see the header color picker); the
        // `primaryColor` state is seeded from the `primaryColor` cookie so SSR
        // and the first client render match.
        theme={{
          ...RefineThemes.Magenta,
          algorithm: mode === "light" ? defaultAlgorithm : darkAlgorithm,
          token: {
            colorPrimary: primaryColor,
            borderRadius: 6,
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
