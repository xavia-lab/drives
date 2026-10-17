"use client";

import { Create, useForm } from "@refinedev/antd";
import { VendorForm } from "@app/vendors/_components/vendor-form";

export default function VendorCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <VendorForm formProps={formProps} />
    </Create>
  );
}
