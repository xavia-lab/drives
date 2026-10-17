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

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType,
);

type ColorModeContextProviderProps = {
  defaultMode?: string;
};

export const ColorModeContextProvider: React.FC<
  PropsWithChildren<ColorModeContextProviderProps>
> = ({ children, defaultMode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState(defaultMode || "light");
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

  const { darkAlgorithm, defaultAlgorithm } = theme;

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
      }}
    >
      <ConfigProvider
        // An explicit locale keeps Ant Design and dayjs consistent. It also
        // stops ProComponents' ProConfigProvider (used by EditableProTable) from
        // falling back to zh_CN and running dayjs.locale('zh-cn') globally.
        locale={locale}
        // you can change the theme colors here. example: ...RefineThemes.Magenta,
        theme={{
          ...RefineThemes.Magenta,
          algorithm: mode === "light" ? defaultAlgorithm : darkAlgorithm,
          token: {
            colorPrimary: "#50C878", // Emerald Green
            borderRadius: 6,
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
