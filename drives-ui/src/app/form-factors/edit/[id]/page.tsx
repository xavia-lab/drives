"use client";

import { Edit, useForm } from "@refinedev/antd";
import { FormFactorForm } from "@app/form-factors/_components/form-factor-form";

export default function FormFactorEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <FormFactorForm formProps={formProps} />
    </Edit>
  );
}
