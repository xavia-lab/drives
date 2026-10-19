"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SlotAssignmentBoardView } from "../../_components/slot-assignment";

export default function SlotAssignmentPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!id) {
    return null;
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <Link href="/">
                <HomeOutlined />
              </Link>
            ),
          },
          {
            title: <Link href="/physical-servers">Physical Servers</Link>,
          },
          { title: "Assign Drives" },
        ]}
      />
      <SlotAssignmentBoardView serverId={id} />
    </div>
  );
}
