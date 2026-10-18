"use client";

import { Edit, useForm } from "@refinedev/antd";
import { PoolTypeForm } from "@app/pool-types/_components/pool-type-form";

export default function PoolTypeEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <PoolTypeForm formProps={formProps} />
    </Edit>
  );
}
