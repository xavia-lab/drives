"use client";

import { Box, TextField } from "@mui/material";
import { Create, NumberField } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";

export default function RetailerCreate() {
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
          {...register("address", {
            // required: "This field is required",
          })}
          error={!!(errors as any)?.address}
          helperText={(errors as any)?.address?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Address"}
          name="address"
        />
        <TextField
          {...register("country", {
            // required: "This field is required",
          })}
          error={!!(errors as any)?.country}
          helperText={(errors as any)?.country?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Country"}
          name="country"
        />
        <TextField
          {...register("phone", {
            // required: "This field is required",
          })}
          error={!!(errors as any)?.phone}
          helperText={(errors as any)?.phone?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Phone"}
          name="phone"
        />
        <TextField
          {...register("email", {
            // required: "This field is required",
          })}
          error={!!(errors as any)?.email}
          helperText={(errors as any)?.email?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="email"
          label={"Email"}
          name="email"
        />
        <TextField
          {...register("website", {
            // required: "This field is required",
          })}
          error={!!(errors as any)?.website}
          helperText={(errors as any)?.website?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="url"
          label={"Website"}
          name="website"
        />
      </Box>
    </Create>
  );
}
