"use client";

import { Create, useForm } from "@refinedev/antd";
import { CpuModelForm } from "@app/cpu-models/_components/cpu-model-form";

export default function CpuModelCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create title="Create CPU Model" saveButtonProps={saveButtonProps}>
      <CpuModelForm formProps={formProps} />
    </Create>
  );
}
