"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { PhysicalDriveForm } from "@app/physical-drives/_components/physical-drive-form";

export default function PhysicalDriveEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Physical Drive"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Physical Drives</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <PhysicalDriveForm formProps={formProps} />
    </Edit>
  );
}
