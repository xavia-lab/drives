"use client";

import { Edit, useForm } from "@refinedev/antd";
import { PhysicalServerForm } from "@app/physical-servers/_components/physical-server-form";

export default function PhysicalServerEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <PhysicalServerForm formProps={formProps} />
    </Edit>
  );
}
