"use client";

import { useEffect, useState } from "react";
import { Card, Typography, Space, Badge, Spin, Result } from "antd";
import { useDataProvider } from "@refinedev/core";

export default function StatusPage() {
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  const dataProvider = useDataProvider();
  const API_URL = dataProvider().getApiUrl?.() || "";

  useEffect(() => {
    fetch(`${API_URL}/health/version`)
      .then((res) => res.json())
      .then((data) => setServerVersion(data.version))
      .catch(() => setServerVersion("offline"))
      .finally(() => setLoading(false));
  }, [API_URL]);

  if (loading)
    return (
      <Spin
        size="large"
        style={{ display: "grid", placeItems: "center", height: "100vh" }}
      />
    );

  const isHealthy = serverVersion !== "offline";

  return (
    <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
      <Card title="System Status" style={{ width: 400, textAlign: "center" }}>
        <Result
          status={isHealthy ? "success" : "error"}
          title={isHealthy ? "System Operational" : "Backend Unreachable"}
          subTitle={`Health check performed at ${new Date().toLocaleTimeString()}`}
        />
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Typography.Text>Client Version:</Typography.Text>
            <Badge count={`v${clientVersion}`} color="blue" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Typography.Text>Server Version:</Typography.Text>
            <Badge
              count={isHealthy ? `v${serverVersion}` : "Offline"}
              color={isHealthy ? "green" : "red"}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}
