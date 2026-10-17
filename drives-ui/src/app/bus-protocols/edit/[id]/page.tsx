"use client";

import { Edit, useForm } from "@refinedev/antd";
import { BusProtocolForm } from "@app/bus-protocols/_components/bus-protocol-form";

export default function BusProtocolEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <BusProtocolForm formProps={formProps} />
    </Edit>
  );
}
