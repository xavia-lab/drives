"use client";

import { useContext, useMemo } from "react";
import type { ComponentType, CSSProperties } from "react";
import {
  useIsExistAuthentication,
  useLink,
  useLogout,
  useMenu,
  useTranslate,
  useWarnAboutChange,
} from "@refinedev/core";
import type { TreeMenuItem } from "@refinedev/core";
import { ThemedTitle, useThemedLayoutContext } from "@refinedev/antd";
import { useQueries } from "@tanstack/react-query";
import {
  Button,
  ConfigProvider,
  Drawer,
  Grid,
  Layout,
  Menu,
  theme,
} from "antd";
import type { MenuProps } from "antd";
import {
  BarsOutlined,
  LeftOutlined,
  LogoutOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { AccessControlContext } from "@refinedev/core";

const drawerButtonStyles = {
  borderStartStartRadius: 0,
  borderEndStartRadius: 0,
  position: "fixed" as const,
  top: 64,
  zIndex: 999,
};

const flattenItems = (items: TreeMenuItem[]): TreeMenuItem[] =>
  items.flatMap((item) => [item, ...flattenItems(item.children)]);

/**
 * Ant Design v5 custom sider. Refine's default `ThemedSider` still renders
 * `Menu.Item`/`Menu.SubMenu` children, which Ant Design deprecates; building
 * the menu through the `items` API keeps the console clean while preserving
 * permission filtering and the collapse/drawer behavior.
 */
export const AppSider = ({
  Title,
}: {
  Title?: ComponentType<{ collapsed: boolean }>;
}) => {
  const { token } = theme.useToken();
  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();
  const direction = useContext(ConfigProvider.ConfigContext)?.direction;
  const LinkComponent = useLink();
  const translate = useTranslate();
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({});
  const isExistAuthentication = useIsExistAuthentication();
  const { mutate: mutateLogout } = useLogout();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const breakpoint = Grid.useBreakpoint();
  const isMobile =
    typeof breakpoint.lg === "undefined" ? false : !breakpoint.lg;

  const accessControl = useContext(AccessControlContext);
  const can = accessControl?.can;
  const flatItems = useMemo(() => flattenItems(menuItems), [menuItems]);
  const accessResults = useQueries({
    queries: flatItems.map((item) => ({
      queryKey: ["app-sider-access", item.name],
      queryFn: () =>
        can
          ? can({
              resource: item.name,
              action: "list",
              params: { resource: item },
            })
          : Promise.resolve({ can: true }),
      enabled: !!can,
      retry: false,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const allowed = useMemo(() => {
    const map = new Map<string, boolean>();
    flatItems.forEach((item, index) => {
      map.set(item.name, can ? accessResults[index]?.data?.can === true : true);
    });
    return map;
  }, [accessResults, can, flatItems]);

  const buildItems = (
    items: TreeMenuItem[],
  ): NonNullable<MenuProps["items"]> => {
    const result: NonNullable<MenuProps["items"]> = [];

    for (const item of items) {
      if (!allowed.get(item.name)) {
        continue;
      }

      const children = buildItems(item.children);
      const label = item.label ?? item.name;

      if (children.length > 0) {
        result.push({
          key: item.key,
          icon: item.meta?.icon ?? <UnorderedListOutlined />,
          label,
          children,
        });
        continue;
      }

      if (!item.list) {
        continue;
      }

      result.push({
        key: item.key,
        icon: item.meta?.icon ?? <UnorderedListOutlined />,
        label: (
          <LinkComponent to={item.route ?? item.list}>{label}</LinkComponent>
        ),
      });
    }

    return result;
  };

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        translate(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes.",
        ),
      );
      if (!confirm) {
        return;
      }
      setWarnWhen(false);
    }
    mutateLogout();
  };

  const items: NonNullable<MenuProps["items"]> = [
    ...buildItems(menuItems),
    ...(isExistAuthentication
      ? [
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: translate("buttons.logout", "Logout"),
            onClick: handleLogout,
          },
        ]
      : []),
  ];

  const renderMenu = () => (
    <Menu
      selectedKeys={selectedKey ? [selectedKey] : []}
      defaultOpenKeys={defaultOpenKeys}
      mode="inline"
      items={items}
      style={{
        paddingTop: "8px",
        border: "none",
        overflow: "auto",
        height: "calc(100% - 72px)",
      }}
      onClick={() => setMobileSiderOpen(false)}
    />
  );

  const RenderTitle = Title ?? ThemedTitle;

  const renderDrawerSider = () => (
    <>
      <Drawer
        open={mobileSiderOpen}
        onClose={() => setMobileSiderOpen(false)}
        placement={direction === "rtl" ? "right" : "left"}
        closable={false}
        width={200}
        styles={{ body: { padding: 0 } }}
        maskClosable
      >
        <Layout>
          <Layout.Sider
            style={{
              height: "100vh",
              backgroundColor: token.colorBgContainer,
              borderRight: `1px solid ${token.colorBgElevated}`,
            }}
          >
            <div
              style={{
                width: "200px",
                padding: "0 16px",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                height: "64px",
                backgroundColor: token.colorBgElevated,
              }}
            >
              <RenderTitle collapsed={false} />
            </div>
            {renderMenu()}
          </Layout.Sider>
        </Layout>
      </Drawer>
      <Button
        style={drawerButtonStyles}
        size="large"
        onClick={() => setMobileSiderOpen(true)}
        icon={<BarsOutlined />}
      />
    </>
  );

  if (isMobile) {
    return renderDrawerSider();
  }

  const siderStyles: CSSProperties = {
    backgroundColor: token.colorBgContainer,
    borderRight: `1px solid ${token.colorBgElevated}`,
  };

  const renderClosingIcons = () => {
    const iconProps = { style: { color: token.colorPrimary } };
    const OpenIcon = direction === "rtl" ? RightOutlined : LeftOutlined;
    const CollapsedIcon = direction === "rtl" ? LeftOutlined : RightOutlined;
    const IconComponent = siderCollapsed ? CollapsedIcon : OpenIcon;
    return <IconComponent {...iconProps} />;
  };

  return (
    <Layout.Sider
      style={siderStyles}
      collapsible
      collapsed={siderCollapsed}
      onCollapse={(collapsed, type) => {
        if (type === "clickTrigger") {
          setSiderCollapsed(collapsed);
        }
      }}
      collapsedWidth={80}
      breakpoint="lg"
      trigger={
        <Button
          type="text"
          style={{
            borderRadius: 0,
            height: "100%",
            width: "100%",
            backgroundColor: token.colorBgElevated,
          }}
        >
          {renderClosingIcons()}
        </Button>
      }
    >
      <div
        style={{
          width: siderCollapsed ? "80px" : "200px",
          padding: siderCollapsed ? "0" : "0 16px",
          display: "flex",
          justifyContent: siderCollapsed ? "center" : "flex-start",
          alignItems: "center",
          height: "64px",
          backgroundColor: token.colorBgElevated,
          fontSize: "14px",
        }}
      >
        <RenderTitle collapsed={siderCollapsed} />
      </div>
      {renderMenu()}
    </Layout.Sider>
  );
};
