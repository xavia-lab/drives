"use client";

import { LookupSelect } from "@components/lookup-select";
import {
  Card,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Switch,
  Typography,
} from "antd";
import type { FormInstance, FormProps } from "antd";
import { useEffect, useRef, useState } from "react";

const { Text } = Typography;

type TargetType = "physical" | "virtual";

type StoragePoolFormProps = {
  formProps: FormProps;
  form: FormInstance;
  /** `edit` hides the host section: attaching/detaching a pool is done through
   * the IMPORT/EXPORT actions on the show page so it is recorded in history. */
  mode?: "create" | "edit";
};

const POOL_NAME_RULES = [
  { required: true, message: "Pool name is required" },
  { max: 64, message: "Pool name cannot exceed 64 characters" },
];

const POOL_TYPE_RULES = [{ required: true, message: "Pool type is required" }];

export const StoragePoolForm = ({
  formProps,
  form,
  mode = "create",
}: StoragePoolFormProps) => {
  const [targetType, setTargetType] = useState<TargetType>("physical");
  const initializedRef = useRef(false);

  const serverId = Form.useWatch("serverId", form) as string | undefined;
  const virtualServerId = Form.useWatch("virtualServerId", form) as
    string | undefined;

  // Derive the target from the loaded record exactly once (before interaction).
  useEffect(() => {
    if (initializedRef.current) return;
    if (virtualServerId && !serverId) {
      setTargetType("virtual");
      initializedRef.current = true;
    } else if (serverId) {
      initializedRef.current = true;
    }
  }, [serverId, virtualServerId]);

  // A storage pool targets at most one resource. Switching the type clears the
  // other side so the payload always satisfies the server's XOR rule.
  const handleTargetChange = (next: TargetType) => {
    setTargetType(next);
    if (next === "physical") {
      form.setFieldValue("virtualServerId", null);
    } else {
      form.setFieldValue("serverId", null);
    }
  };

  return (
    <Form {...formProps} form={form} layout="vertical">
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Storage Pool Information"}>
          <Row gutter={[16, 24]}>
            <Col span={12}>
              <Form.Item
                label={"Pool Name"}
                name={["poolName"]}
                rules={POOL_NAME_RULES}
              >
                <Input maxLength={64} placeholder="e.g. tank-nvme-cache" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={"Pool Type"}
                name={["poolTypeId"]}
                rules={POOL_TYPE_RULES}
              >
                <LookupSelect
                  resource="pool-types"
                  placeholder="Select pool type"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={"Encryption"}
            name={"encryptionEnabled"}
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
        </Card>

        {mode === "create" && (
          <Card title={"Initial Host (optional)"}>
            <Form.Item label={"Host Type"} style={{ marginBottom: 16 }}>
              <Radio.Group
                value={targetType}
                onChange={(event) =>
                  handleTargetChange(event.target.value as TargetType)
                }
              >
                <Radio.Button value="physical">Physical Server</Radio.Button>
                <Radio.Button value="virtual">Virtual Server</Radio.Button>
              </Radio.Group>
              <Text
                type="secondary"
                style={{ display: "block", marginTop: 8, fontSize: 12 }}
              >
                Optionally IMPORT the new pool onto a host. Leave empty to
                create a detached pool; it can be attached later via the Import
                action.
              </Text>
            </Form.Item>

            <Form.Item
              label={"Physical Server"}
              name={["serverId"]}
              hidden={targetType !== "physical"}
            >
              <LookupSelect
                resource="physical-servers"
                optionLabel="hostname"
                placeholder="Select physical server"
              />
            </Form.Item>
            <Form.Item
              label={"Virtual Server"}
              name={["virtualServerId"]}
              hidden={targetType !== "virtual"}
            >
              <LookupSelect
                resource="virtual-servers"
                optionLabel="hostname"
                placeholder="Select virtual server"
              />
            </Form.Item>
          </Card>
        )}
      </Space>
    </Form>
  );
};
