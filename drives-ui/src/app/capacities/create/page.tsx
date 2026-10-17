"use client";

import { Create, useForm } from "@refinedev/antd";
import { CapacityForm } from "@app/capacities/_components/capacity-form";

export default function CapacityCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CapacityForm formProps={formProps} />
    </Create>
  );
}
