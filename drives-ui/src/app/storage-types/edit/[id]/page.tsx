"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { StorageTypeForm } from "@app/storage-types/_components/storage-type-form";

export default function StorageTypeEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Storage Type"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Storage Types</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <StorageTypeForm formProps={formProps} />
    </Edit>
  );
}
