"use client";

import { Create, useForm } from "@refinedev/antd";
import { CountryForm } from "@app/countries/_components/country-form";

export default function CountryCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CountryForm formProps={formProps} />
    </Create>
  );
}
