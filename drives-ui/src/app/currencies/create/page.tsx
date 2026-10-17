"use client";

import { Create, useForm } from "@refinedev/antd";
import { CurrencyForm } from "@app/currencies/_components/currency-form";

export default function CurrencyCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CurrencyForm formProps={formProps} />
    </Create>
  );
}
