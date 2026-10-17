"use client";

import { Edit, useForm } from "@refinedev/antd";
import { CapacityForm } from "@app/capacities/_components/capacity-form";

export default function CapacityEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CapacityForm formProps={formProps} />
    </Edit>
  );
}
