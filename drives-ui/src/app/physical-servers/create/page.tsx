"use client";

import { Create, useForm } from "@refinedev/antd";
import { PhysicalServerForm } from "@app/physical-servers/_components/physical-server-form";

export default function PhysicalServerCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <PhysicalServerForm formProps={formProps} />
    </Create>
  );
}
