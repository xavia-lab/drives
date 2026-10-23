"use client";

import { useContext, useEffect } from "react";
import { ColorModeContext } from "@contexts/color-mode";

const faviconSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="22" x2="2" y1="12" y2="12"/>
  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  <line x1="6" x2="6.01" y1="16" y2="16"/>
  <line x1="10" x2="10.01" y1="16" y2="16"/>
</svg>`;

/**
 * Keeps the browser favicon in sync with the user's primary colour. The static
 * SVG remains the no-JS fallback; after hydration we replace the icon link with
 * a data URI generated from the active theme.
 */
export const DynamicFavicon = () => {
  const { primaryColor } = useContext(ColorModeContext);

  useEffect(() => {
    const href = `data:image/svg+xml,${encodeURIComponent(
      faviconSvg(primaryColor),
    )}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.type = "image/svg+xml";
    link.href = href;
  }, [primaryColor]);

  return null;
};
