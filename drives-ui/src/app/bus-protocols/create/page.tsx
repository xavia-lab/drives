"use client";

import { Create, useForm } from "@refinedev/antd";
import { BusProtocolForm } from "@app/bus-protocols/_components/bus-protocol-form";

export default function BusProtocolCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create title={"Create Bus Protocol"} saveButtonProps={saveButtonProps}>
      <BusProtocolForm formProps={formProps} />
    </Create>
  );
}
