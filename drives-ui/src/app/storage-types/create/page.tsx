"use client";

import { Create, useForm } from "@refinedev/antd";
import { StorageTypeForm } from "@app/storage-types/_components/storage-type-form";

export default function StorageTypeCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <StorageTypeForm formProps={formProps} />
    </Create>
  );
}
