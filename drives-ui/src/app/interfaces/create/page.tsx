"use client";

import { Create, useForm } from "@refinedev/antd";
import { InterfaceForm } from "@app/interfaces/_components/interface-form";

export default function InterfaceCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <InterfaceForm formProps={formProps} />
    </Create>
  );
}
