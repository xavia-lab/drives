"use client";

import { Edit, useForm } from "@refinedev/antd";
import { RackForm } from "@app/racks/_components/rack-form";

export default function RackEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <RackForm formProps={formProps} />
    </Edit>
  );
}
