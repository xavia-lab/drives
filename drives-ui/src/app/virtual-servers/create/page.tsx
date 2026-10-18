"use client";

import { Create, useForm } from "@refinedev/antd";
import { VirtualServerForm } from "@app/virtual-servers/_components/virtual-server-form";

export default function VirtualServerCreate() {
  const { formProps, form, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <VirtualServerForm formProps={formProps} form={form} />
    </Create>
  );
}
