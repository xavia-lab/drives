"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { BusProtocolForm } from "@app/bus-protocols/_components/bus-protocol-form";

export default function BusProtocolEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Bus Protocol"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Bus Protocols</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <BusProtocolForm formProps={formProps} />
    </Edit>
  );
}
