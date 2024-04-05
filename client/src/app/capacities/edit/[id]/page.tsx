"use client";

import { Box, MenuItem, Select, TextField } from "@mui/material";
import { Edit } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";

export default function CapacityEdit() {
  const {
    saveButtonProps,
    refineCore: { queryResult, formLoading, onFinish },
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
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
          type="number"
          label={"Value"}
          name="value"
        />
        <Controller
          name="unit"
          control={control}
          defaultValue="TB"
          render={({ field }) => {
            return (
              <Select {...field} value={field?.value || "TB"} label={"Unit"}>
                <MenuItem value="MB">MB</MenuItem>
                <MenuItem value="GB">GB</MenuItem>
                <MenuItem value="TB">TB</MenuItem>
              </Select>
            );
          }}
        />
      </Box>
    </Edit>
  );
}
