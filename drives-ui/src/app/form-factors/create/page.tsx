"use client";

import { Create, useForm } from "@refinedev/antd";
import { FormFactorForm } from "@app/form-factors/_components/form-factor-form";

export default function FormFactorCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <FormFactorForm formProps={formProps} />
    </Create>
  );
}
