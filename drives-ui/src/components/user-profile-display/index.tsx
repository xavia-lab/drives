import {
  useGetIdentity,
  useLogout,
  useTranslate,
  useWarnAboutChange,
} from "@refinedev/core";
import { Avatar, Button, Dropdown, Typography } from "antd";
import type { MenuProps } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

const { Text } = Typography;

const UserProfileDisplay = () => {
  const { data: user, isLoading } = useGetIdentity<{
    name: string;
    avatar: string;
    email: string;
  }>();
  const { mutate: mutateLogout } = useLogout();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const translate = useTranslate();

  if (isLoading) return null;
  if (!user) return null;

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        translate(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes.",
        ),
      );
      if (!confirm) return;
      setWarnWhen(false);
    }
    mutateLogout();
  };

  const items: MenuProps["items"] = [
    ...(user.email
      ? [
          {
            key: "email",
            disabled: true,
            label: (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user.email}
              </Text>
            ),
          },
          { type: "divider" as const },
        ]
      : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: translate("buttons.logout", "Logout"),
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <Button
        type="text"
        aria-label="User menu"
        style={{
          height: 40,
          paddingInline: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {user.name && <Text strong>{user.name}</Text>}
        <Avatar src={user.avatar}>{user.name?.charAt(0)}</Avatar>
      </Button>
    </Dropdown>
  );
};

export default UserProfileDisplay;
