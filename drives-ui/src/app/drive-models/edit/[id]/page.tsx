"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { DriveModelForm } from "@app/drive-models/_components/drive-model-form";

export default function DriveModelEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Drive Model"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Drive Models</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <DriveModelForm formProps={formProps} />
    </Edit>
  );
}
