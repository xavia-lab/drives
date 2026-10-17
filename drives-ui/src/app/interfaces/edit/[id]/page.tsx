"use client";

import { Edit, useForm } from "@refinedev/antd";
import { InterfaceForm } from "@app/interfaces/_components/interface-form";

export default function InterfaceEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <InterfaceForm formProps={formProps} />
    </Edit>
  );
}
