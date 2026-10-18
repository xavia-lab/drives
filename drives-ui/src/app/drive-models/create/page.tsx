"use client";

import { Create, useForm } from "@refinedev/antd";
import { DriveModelForm } from "@app/drive-models/_components/drive-model-form";

export default function DriveModelCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <DriveModelForm formProps={formProps} />
    </Create>
  );
}
