"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { PoolTypeForm } from "@app/pool-types/_components/pool-type-form";

export default function PoolTypeEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Pool Type"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Pool Types</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <PoolTypeForm formProps={formProps} />
    </Edit>
  );
}
