"use client";

import { ColorModeContext, PRIMARY_COLOR_PRESETS } from "@contexts/color-mode";
import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import {
  Button,
  Dropdown,
  Layout as AntdLayout,
  Space,
  Switch,
  theme,
  Tooltip,
} from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import React, { useContext } from "react";
import UserProfileDisplay from "@components/user-profile-display";

const { useToken } = theme;

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { mode, setMode, primaryColor, setPrimaryColor } =
    useContext(ColorModeContext);

  const colorMenuItems = PRIMARY_COLOR_PRESETS.map((preset) => ({
    key: preset.color,
    label: (
      <Space>
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: preset.color,
          }}
        />
        {preset.name}
      </Space>
    ),
  }));

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: colorMenuItems,
            selectable: true,
            selectedKeys: [primaryColor],
            onClick: ({ key }) => setPrimaryColor(key),
          }}
        >
          <Tooltip title="Theme color">
            <Button
              type="text"
              shape="circle"
              aria-label="Change theme color"
              icon={
                <BgColorsOutlined
                  style={{ fontSize: 18, color: primaryColor }}
                />
              }
            />
          </Tooltip>
        </Dropdown>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        <UserProfileDisplay />
      </Space>
    </AntdLayout.Header>
  );
};
