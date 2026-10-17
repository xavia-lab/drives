"use client";

import { Edit, useForm } from "@refinedev/antd";
import { PhysicalDriveForm } from "@app/physical-drives/_components/physical-drive-form";

export default function PhysicalDriveEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <PhysicalDriveForm formProps={formProps} />
    </Edit>
  );
}
