"use client";

import { Autocomplete, Box, Select, TextField } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { Edit, useAutocomplete } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";

export default function DriveEdit() {
  const {
    saveButtonProps,
    refineCore: { queryResult, formLoading, onFinish },
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm({});

  const drivesData = queryResult?.data?.data;

  const { autocompleteProps: modelAutocompleteProps } = useAutocomplete({
    resource: "models",
    defaultValue: drivesData?.modelId,
  });

  const { autocompleteProps: retailerAutocompleteProps } = useAutocomplete({
    resource: "retailers",
    defaultValue: drivesData?.retailerId,
  });

  return (
    <Edit isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <TextField
          {...register("name", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.name}
          helperText={(errors as any)?.name?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Name"}
          name="name"
        />
        <TextField
          {...register("label", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.label}
          helperText={(errors as any)?.label?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Label"}
          name="label"
        />
        <TextField
          {...register("serial", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.serial}
          helperText={(errors as any)?.serial?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Serial"}
          name="serial"
        />
        <TextField
          {...register("datePurchased", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.datePurchased}
          helperText={(errors as any)?.datePurchased?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="date"
          label={"Date Purchased"}
          name="datePurchased"
        />
        <Controller
          control={control}
          name={"modelId"}
          rules={{ required: "This field is required" }}
          // eslint-disable-next-line
          defaultValue={null as any}
          render={({ field }) => (
            <Autocomplete
              {...modelAutocompleteProps}
              {...field}
              onChange={(_, value) => {
                field.onChange(value.id);
              }}
              getOptionLabel={(item) => {
                return (
                  modelAutocompleteProps?.options?.find((p) => {
                    const itemId =
                      typeof item === "object"
                        ? item?.id?.toString()
                        : item?.toString();
                    const pId = p?.id?.toString();
                    return itemId === pId;
                  })?.title ?? ""
                );
              }}
              isOptionEqualToValue={(option, value) => {
                const optionId = option?.id?.toString();
                const valueId =
                  typeof value === "object"
                    ? value?.id?.toString()
                    : value?.toString();
                return value === undefined || optionId === valueId;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={"Model"}
                  margin="normal"
                  variant="outlined"
                  error={!!(errors as any)?.model?.id}
                  helperText={(errors as any)?.model?.id?.message}
                  required
                />
              )}
            />
          )}
        />
        <Controller
          control={control}
          name={"retailerId"}
          rules={{ required: "This field is required" }}
          // eslint-disable-next-line
          defaultValue={null as any}
          render={({ field }) => (
            <Autocomplete
              {...retailerAutocompleteProps}
              {...field}
              onChange={(_, value) => {
                field.onChange(value.id);
              }}
              getOptionLabel={(item) => {
                return (
                  retailerAutocompleteProps?.options?.find((p) => {
                    const itemId =
                      typeof item === "object"
                        ? item?.id?.toString()
                        : item?.toString();
                    const pId = p?.id?.toString();
                    return itemId === pId;
                  })?.title ?? ""
                );
              }}
              isOptionEqualToValue={(option, value) => {
                const optionId = option?.id?.toString();
                const valueId =
                  typeof value === "object"
                    ? value?.id?.toString()
                    : value?.toString();
                return value === undefined || optionId === valueId;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={"Retailer"}
                  margin="normal"
                  variant="outlined"
                  error={!!(errors as any)?.retailer?.id}
                  helperText={(errors as any)?.retailer?.id?.message}
                  required
                />
              )}
            />
          )}
        />
      </Box>
    </Edit>
  );
}
