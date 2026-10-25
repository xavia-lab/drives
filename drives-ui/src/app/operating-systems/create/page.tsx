"use client";

import { Create, useForm } from "@refinedev/antd";
import { OperatingSystemForm } from "@app/operating-systems/_components/operating-system-form";

export default function OperatingSystemCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create title={"Create Operating System"} saveButtonProps={saveButtonProps}>
      <OperatingSystemForm formProps={formProps} />
    </Create>
  );
}
