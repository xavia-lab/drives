"use client";

import { Create, useForm } from "@refinedev/antd";
import { StoragePoolForm } from "@app/storage-pools/_components/storage-pool-form";

export default function StoragePoolCreate() {
  const { formProps, form, saveButtonProps } = useForm({});

  return (
    <Create title={"Create Storage Pool"} saveButtonProps={saveButtonProps}>
      <StoragePoolForm formProps={formProps} form={form} />
    </Create>
  );
}
