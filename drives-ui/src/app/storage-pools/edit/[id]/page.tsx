"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { StoragePoolForm } from "@app/storage-pools/_components/storage-pool-form";

export default function StoragePoolEdit() {
  const { formProps, form, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Storage Pool"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Storage Pools</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <StoragePoolForm formProps={formProps} form={form} mode="edit" />
    </Edit>
  );
}
