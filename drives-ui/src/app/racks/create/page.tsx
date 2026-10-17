"use client";

import { Create, useForm } from "@refinedev/antd";
import { RackForm } from "@app/racks/_components/rack-form";

export default function RackCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <RackForm formProps={formProps} />
    </Create>
  );
}
