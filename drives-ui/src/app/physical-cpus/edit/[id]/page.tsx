"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { PhysicalCpuForm } from "@app/physical-cpus/_components/physical-cpu-form";

export default function PhysicalCpuEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Physical CPU"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Physical CPUs</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <PhysicalCpuForm formProps={formProps} />
    </Edit>
  );
}
