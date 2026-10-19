"use client";

import { Create, useForm } from "@refinedev/antd";
import { PhysicalCpuForm } from "@app/physical-cpus/_components/physical-cpu-form";

export default function PhysicalCpuCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <PhysicalCpuForm formProps={formProps} />
    </Create>
  );
}
