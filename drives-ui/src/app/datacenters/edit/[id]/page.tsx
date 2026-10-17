"use client";

import { Edit, useForm } from "@refinedev/antd";
import { DatacenterForm } from "@app/datacenters/_components/datacenter-form";

export default function DatacenterEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <DatacenterForm formProps={formProps} />
    </Edit>
  );
}
