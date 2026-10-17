"use client";

import { Create, useForm } from "@refinedev/antd";
import { DatacenterForm } from "@app/datacenters/_components/datacenter-form";

export default function DatacenterCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <DatacenterForm formProps={formProps} />
    </Create>
  );
}
