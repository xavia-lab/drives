"use client";

import { Create, useForm } from "@refinedev/antd";
import { WarrantyClaimForm } from "@app/warranty-claims/_components/warranty-claim-form";

export default function WarrantyClaimCreate() {
  const { formProps, saveButtonProps, form } = useForm({
    redirect: "show",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <WarrantyClaimForm formProps={formProps} form={form} />
    </Create>
  );
}
