"use client";

import { Edit, useForm } from "@refinedev/antd";
import { StorageModelForm } from "@app/storage-models/_components/storage-model-form";

export default function StorageModelEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <StorageModelForm formProps={formProps} />
    </Edit>
  );
}
