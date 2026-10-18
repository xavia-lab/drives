"use client";

import { Edit, useForm } from "@refinedev/antd";
import { DriveModelForm } from "@app/drive-models/_components/drive-model-form";

export default function DriveModelEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <DriveModelForm formProps={formProps} />
    </Edit>
  );
}
