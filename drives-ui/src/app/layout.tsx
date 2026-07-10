import type { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import { RefineContext } from "./_refine_context";
import "./globals.css";
import Loading from "./loading";

import { ConfigProvider } from "@/components/config-provider";
import { getPublicConfig } from "@utils/config";

export const metadata: Metadata = {
  title: "Emerald System",
  description: "A Jewelry Store Management System.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme");
  const defaultMode = theme?.value === "dark" ? "dark" : "light";

  const config = getPublicConfig();

  return (
    <html lang="en">
      <head title="script">
        <script
          dangerouslySetInnerHTML={{
            __html: `
        (function() {
          try {
            // Function to get a cookie by name
            function getCookie(name) {
              var value = "; " + document.cookie;
              var parts = value.split("; " + name + "=");
              if (parts.length === 2) return parts.pop().split(";").shift();
            }

            // Get 'theme' from cookies
            var theme = getCookie("theme");

            // Fallback to system preference if cookie is missing
            if (!theme) {
              theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }

            // Apply to HTML element instantly
            document.documentElement.setAttribute("data-theme", theme);
          } catch (e) {}
        })()
      `,
          }}
        />
      </head>
      <body>
        <ConfigProvider config={config}>
          <Suspense fallback={<Loading />}>
            <RefineContext defaultMode={defaultMode}>{children}</RefineContext>
          </Suspense>
        </ConfigProvider>
      </body>
    </html>
  );
}
