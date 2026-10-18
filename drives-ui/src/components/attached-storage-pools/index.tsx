"use client";

import { useApiUrl, useCustom } from "@refinedev/core";
import type { BaseRecord } from "@refinedev/core";
import { Card, Empty, Table, Tag, Typography } from "antd";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";

const { Link } = Typography;

interface AttachedStoragePoolsProps {
  serverType: "physical" | "virtual";
  /** The host id whose currently-attached pools should be listed. */
  serverId?: string;
}

/**
 * Lists the storage pools currently attached to a host. "Current" is derived by
 * the backend from each pool's latest IMPORT/EXPORT event.
 */
export const AttachedStoragePools = ({
  serverType,
  serverId,
}: AttachedStoragePoolsProps) => {
  const apiUrl = useApiUrl();
  const { options: poolTypeOptions } = useLookupOptions({
    resource: "pool-types",
  });

  const { result, query } = useCustom({
    url: `${apiUrl}/storage-pools/attached`,
    method: "get",
    config: {
      query:
        serverType === "physical"
          ? { physicalServerId: serverId }
          : { virtualServerId: serverId },
    },
    queryOptions: { enabled: Boolean(serverId) },
  });

  const pools = (result?.data ?? []) as BaseRecord[];

  return (
    <Card title={"Attached Storage Pools"}>
      {pools.length > 0 ? (
        <Table
          dataSource={pools}
          rowKey="id"
          loading={query.isLoading}
          pagination={false}
          size="small"
        >
          <Table.Column
            title={"Pool Name"}
            render={(_, row: BaseRecord) => (
              <Link href={`/storage-pools/show/${row.id}`}>{row.poolName}</Link>
            )}
          />
          <Table.Column
            title={"Pool Type"}
            render={(_, row: BaseRecord) => (
              <LinkedLabel
                resource="pool-types"
                options={poolTypeOptions}
                value={row.poolTypeId}
                fallback="-"
              />
            )}
          />
          <Table.Column
            title={"Encryption"}
            width={140}
            render={(_, row: BaseRecord) => (
              <Tag color={row.encryptionEnabled ? "green" : "default"}>
                {row.encryptionEnabled ? "Encrypted" : "Plain"}
              </Tag>
            )}
          />
        </Table>
      ) : (
        <Empty
          description="No storage pools attached"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
};
