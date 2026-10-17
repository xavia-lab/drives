"use client";

import { Edit, useForm } from "@refinedev/antd";
import { OperatingSystemForm } from "@app/operating-systems/_components/operating-system-form";

export default function OperatingSystemEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <OperatingSystemForm formProps={formProps} />
    </Edit>
  );
}
