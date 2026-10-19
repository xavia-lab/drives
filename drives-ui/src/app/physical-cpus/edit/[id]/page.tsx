"use client";

import { Edit, useForm } from "@refinedev/antd";
import { PhysicalCpuForm } from "@app/physical-cpus/_components/physical-cpu-form";

export default function PhysicalCpuEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <PhysicalCpuForm formProps={formProps} />
    </Edit>
  );
}
