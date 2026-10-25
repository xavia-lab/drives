"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { OperatingSystemForm } from "@app/operating-systems/_components/operating-system-form";

export default function OperatingSystemEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Operating System"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Operating Systems</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <OperatingSystemForm formProps={formProps} />
    </Edit>
  );
}
