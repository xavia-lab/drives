"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { CpuModelForm } from "@app/cpu-models/_components/cpu-model-form";

export default function CpuModelEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title="Edit CPU Model"
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>CPU Models</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <CpuModelForm formProps={formProps} />
    </Edit>
  );
}
