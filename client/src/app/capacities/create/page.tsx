"use client";

import { Box, TextField } from "@mui/material";
import { Create, NumberField } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";

export default function CapacityCreate() {
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    formState: { errors },
  } = useForm({});

  return (
    <Create isLoading={formLoading} saveButtonProps={saveButtonProps}>
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
          {...register("value", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.value}
          helperText={(errors as any)?.value?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Value"}
          name="value"
        />
        <TextField
          {...register("unit", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.unit}
          helperText={(errors as any)?.unit?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Unit"}
          name="unit"
        />
      </Box>
    </Create>
  );
}
