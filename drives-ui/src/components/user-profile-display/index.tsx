import { useGetIdentity } from "@refinedev/core";
import { Avatar, Tooltip, Typography } from "antd"; // Example using Ant Design components

const UserProfileDisplay = () => {
  // Define the identity type for better IDE support
  const { data: user, isLoading } = useGetIdentity<{
    name: string;
    avatar: string;
    email: string;
  }>();

  if (isLoading) return null;
  if (!user) return null;

  const userContent = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
      }}
    >
      {user.name && <Typography.Text strong>{user.name}</Typography.Text>}
      <Avatar src={user.avatar}>{user.name?.charAt(0)}</Avatar>
    </div>
  );

  return user.email ? (
    <Tooltip title={user.email}>{userContent}</Tooltip>
  ) : (
    userContent
  );
};

export default UserProfileDisplay;
