"use client";

import { Edit, useForm } from "@refinedev/antd";
import { VendorForm } from "@app/vendors/_components/vendor-form";

export default function VendorEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <VendorForm formProps={formProps} />
    </Edit>
  );
}
