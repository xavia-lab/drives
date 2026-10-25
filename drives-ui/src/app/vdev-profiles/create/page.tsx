"use client";

import { Create, useForm } from "@refinedev/antd";
import { VdevProfileForm } from "../_components/vdev-profile-form";

export default function VdevProfileCreate() {
  const { form, formProps, saveButtonProps } = useForm({});

  return (
    <Create title={"Create VDEV Profile"} saveButtonProps={saveButtonProps}>
      <VdevProfileForm form={form} formProps={formProps} />
    </Create>
  );
}
