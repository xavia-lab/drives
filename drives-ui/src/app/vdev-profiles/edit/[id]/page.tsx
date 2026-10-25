"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { VdevProfileForm } from "../../_components/vdev-profile-form";

export default function VdevProfileEdit() {
  const { form, formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit VDEV Profile"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>VDEV Profiles</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <VdevProfileForm form={form} formProps={formProps} />
    </Edit>
  );
}
