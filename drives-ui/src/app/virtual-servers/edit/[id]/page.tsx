"use client";

import { Edit, useForm } from "@refinedev/antd";
import { VirtualServerForm } from "@app/virtual-servers/_components/virtual-server-form";

export default function VirtualServerEdit() {
  const { formProps, form, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <VirtualServerForm formProps={formProps} form={form} />
    </Edit>
  );
}
