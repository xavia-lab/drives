"use client";

import { Edit, useForm } from "@refinedev/antd";
import { VdevProfileForm } from "../../_components/vdev-profile-form";

export default function VdevProfileEdit() {
  const { form, formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <VdevProfileForm form={form} formProps={formProps} />
    </Edit>
  );
}
