"use client";

import { Edit, useForm } from "@refinedev/antd";
import { CurrencyForm } from "@app/currencies/_components/currency-form";

export default function CurrencyEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CurrencyForm formProps={formProps} />
    </Edit>
  );
}
