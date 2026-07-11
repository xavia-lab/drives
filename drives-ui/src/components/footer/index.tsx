"use client";

import { useEffect, useState } from "react";
import { Layout, Typography, theme, Flex } from "antd";
import { useDataProvider } from "@refinedev/core";

export const Footer = () => {
  const { token } = theme.useToken();
  const [serverVersion, setServerVersion] = useState("...");
  const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  const dataProvider = useDataProvider();
  const API_URL = dataProvider().getApiUrl?.() || "";

  useEffect(() => {
    fetch(`${API_URL}/health/version`)
      .then((res) => res.json())
      .then((data) => setServerVersion(data.version))
      .catch(() => setServerVersion("?.?.?"));
  }, []);

  return (
    <Layout.Footer
      style={{
        textAlign: "center",
        color: token.colorTextSecondary,
        backgroundColor: token.colorBgContainer,
        padding: "8px 24px", // Reduced vertical padding slightly
        borderTop: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex justify="space-between" align="center">
        {/* Left/Center: Copyright */}
        <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
          © 2026 Eikranex Technologies Inc. All Rights Reserved.
        </Typography.Text>

        {/* Right: Versions */}
        <Flex gap={12}>
          <Typography.Text type="secondary" style={{ fontSize: "10px" }}>
            C: <strong>v{clientVersion}</strong>
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: "10px" }}>
            S: <strong>v{serverVersion}</strong>
          </Typography.Text>
        </Flex>
      </Flex>
    </Layout.Footer>
  );
};
