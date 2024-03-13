"use client";

import { Box, MenuItem, Select, TextField } from "@mui/material";
import { Create, NumberField } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";

export default function InterfaceCreate() {
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
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
          {...register("form", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.form}
          helperText={(errors as any)?.form?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Form"}
          name="form"
        />
        <TextField
          {...register("throughput", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.throughput}
          helperText={(errors as any)?.throughput?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Throughput"}
          name="throughput"
        />
      </Box>
    </Create>
  );
}
