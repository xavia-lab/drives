"use client";

import { Edit, useForm } from "@refinedev/antd";
import { StorageTypeForm } from "@app/storage-types/_components/storage-type-form";

export default function StorageTypeEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <StorageTypeForm formProps={formProps} />
    </Edit>
  );
}
