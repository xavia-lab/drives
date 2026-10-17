"use client";

import { Edit, useForm } from "@refinedev/antd";
import { CountryForm } from "@app/countries/_components/country-form";

export default function CountryEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CountryForm formProps={formProps} />
    </Edit>
  );
}
