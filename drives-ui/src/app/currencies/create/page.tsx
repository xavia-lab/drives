"use client";

import { Create, useForm } from "@refinedev/antd";
import { CurrencyForm } from "@app/currencies/_components/currency-form";

export default function CurrencyCreate() {
  const { form, formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CurrencyForm form={form} formProps={formProps} />
    </Create>
  );
}
