"use client";

import { Edit, useForm } from "@refinedev/antd";
import { WarrantyClaimForm } from "@app/warranty-claims/_components/warranty-claim-form";

export default function WarrantyClaimEdit() {
  const { formProps, saveButtonProps, form } = useForm({
    redirect: "show",
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <WarrantyClaimForm formProps={formProps} form={form} />
    </Edit>
  );
}
