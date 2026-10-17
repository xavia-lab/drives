"use client";

import { Edit, useForm } from "@refinedev/antd";
import { CpuModelForm } from "@app/cpu-models/_components/cpu-model-form";

export default function CpuModelEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CpuModelForm formProps={formProps} />
    </Edit>
  );
}
