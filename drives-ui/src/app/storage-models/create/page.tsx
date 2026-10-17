"use client";

import { Create, useForm } from "@refinedev/antd";
import { StorageModelForm } from "@app/storage-models/_components/storage-model-form";

export default function StorageModelCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <StorageModelForm formProps={formProps} />
    </Create>
  );
}
