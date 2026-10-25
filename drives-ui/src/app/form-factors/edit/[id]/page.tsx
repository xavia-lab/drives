"use client";

import { Edit, ListButton, RefreshButton, useForm } from "@refinedev/antd";
import { FormFactorForm } from "@app/form-factors/_components/form-factor-form";

export default function FormFactorEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit
      title={"Edit Form Factor"}
      saveButtonProps={saveButtonProps}
      headerButtons={({ listButtonProps, refreshButtonProps }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Form Factors</ListButton>
          ) : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <FormFactorForm formProps={formProps} />
    </Edit>
  );
}
