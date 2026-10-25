"use client";

import { Create, useForm } from "@refinedev/antd";
import { PoolTypeForm } from "@app/pool-types/_components/pool-type-form";

export default function PoolTypeCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create title={"Create Pool Type"} saveButtonProps={saveButtonProps}>
      <PoolTypeForm formProps={formProps} />
    </Create>
  );
}
