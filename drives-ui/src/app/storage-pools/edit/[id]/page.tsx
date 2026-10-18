"use client";

import { Edit, useForm } from "@refinedev/antd";
import { StoragePoolForm } from "@app/storage-pools/_components/storage-pool-form";

export default function StoragePoolEdit() {
  const { formProps, form, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <StoragePoolForm formProps={formProps} form={form} mode="edit" />
    </Edit>
  );
}
