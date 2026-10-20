"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  ListButton,
  Show,
} from "@refinedev/antd";
import { useApiUrl, useCustom, useShow } from "@refinedev/core";
import { LinkedLabel } from "@components/linked-label";
import {
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { WarrantyClaimStatusTag } from "@app/warranty-claims/_components/warranty-claim-status-tag";
import { WarrantyClaimTrackingActions } from "@app/warranty-claims/_components/warranty-claim-tracking-actions";
import {
  WarrantyClaimTrackingTimeline,
  type WarrantyClaimTrackingTimelineResponse,
} from "@app/warranty-claims/_components/warranty-claim-tracking-timeline";

const { Text } = Typography;

export default function WarrantyClaimShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;
  const apiUrl = useApiUrl();

  const { query: trackingQuery, result: trackingResult } = useCustom({
    url: `${apiUrl}/warranty-claims/${record?.id}/tracking`,
    method: "get",
    queryOptions: { enabled: Boolean(record?.id) },
  });
  const tracking = trackingResult?.data as
    WarrantyClaimTrackingTimelineResponse | undefined;

  const physicalDrive = record?.physicalDrive as
    { serialNumber?: string } | undefined;
  const vendor = record?.handledByVendor as { name?: string } | undefined;
  const currentEvent = record?.currentEvent as
    { eventType?: string; eventTimestamp?: string } | null | undefined;

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({
        editButtonProps,
        deleteButtonProps,
        listButtonProps,
      }) => (
        <>
          {listButtonProps && <ListButton {...listButtonProps} />}
          {editButtonProps && <EditButton {...editButtonProps} />}
          {deleteButtonProps && <DeleteButton {...deleteButtonProps} />}
        </>
      )}
    >
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Warranty Claim"}>
          <Card size="small">
            <Descriptions title="Details" bordered column={2}>
              <Descriptions.Item label="ID" span={2}>
                <Text
                  copyable={{ text: record?.id?.toString() }}
                  style={{ fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  {record?.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Display Key">
                {record?.displayKey}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <WarrantyClaimStatusTag
                  status={record?.currentStatus as string}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Drive" span={2}>
                <LinkedLabel
                  resource="physical-drives"
                  value={record?.physicalDriveId}
                  label={physicalDrive?.serialNumber}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Vendor" span={2}>
                <LinkedLabel
                  resource="vendors"
                  value={record?.handledByVendorId}
                  label={vendor?.name}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="RMA Tracking Number">
                {record?.rmaTrackingNumber ? (
                  <Text copyable>{record.rmaTrackingNumber}</Text>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Opened">
                {record?.openedAt ? (
                  <DateField value={record.openedAt} format="LLL" />
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Resolved">
                {record?.resolvedAt ? (
                  <DateField value={record.resolvedAt} format="LLL" />
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Latest Event" span={2}>
                {currentEvent ? (
                  <Space>
                    <Tag>{currentEvent.eventType}</Tag>
                    {currentEvent.eventTimestamp ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(currentEvent.eventTimestamp).toLocaleString()}
                      </Text>
                    ) : null}
                  </Space>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {record?.notes ?? "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Card>

        <Card
          title={"Tracking History"}
          extra={
            <WarrantyClaimTrackingActions
              claimId={record?.id as string}
              allowedEvents={tracking?.allowedEvents ?? []}
              onDone={async () => {
                await Promise.all([query.refetch(), trackingQuery.refetch()]);
              }}
            />
          }
        >
          {trackingQuery.isLoading ? (
            <Spin />
          ) : (
            <WarrantyClaimTrackingTimeline events={tracking?.events ?? []} />
          )}
        </Card>

        <Row justify="center" gutter={32}>
          <Col style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Created
            </Text>
            <DateField value={record?.createdAt} format="LLL" />
          </Col>
          <Col style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Last Updated
            </Text>
            <DateField value={record?.updatedAt} format="LLL" />
          </Col>
        </Row>
      </Space>
    </Show>
  );
}
