"use client";

import { Create, useForm } from "@refinedev/antd";
import { PhysicalDriveForm } from "@app/physical-drives/_components/physical-drive-form";

export default function PhysicalDriveCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create title={"Create Physical Drive"} saveButtonProps={saveButtonProps}>
      <PhysicalDriveForm formProps={formProps} />
    </Create>
  );
}
