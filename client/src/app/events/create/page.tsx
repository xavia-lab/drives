"use client";

import { Autocomplete, Box, MenuItem, Select, TextField } from "@mui/material";
import { Create, useAutocomplete } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";

export default function EventCreate() {
  const {
    saveButtonProps,
    refineCore: { formLoading, onFinish },
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm({});

  const { autocompleteProps: driveAutocompleteProps } = useAutocomplete({
    resource: "drives",
  });

  return (
    <Create isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <TextField
          {...register("eventDate", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.eventDate}
          helperText={(errors as any)?.eventDate?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="date"
          label={"Date"}
          name="eventDate"
        />
        <TextField
          {...register("heading", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.heading}
          helperText={(errors as any)?.heading?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={"Heading"}
          name="heading"
        />
        <TextField
          {...register("content", {
            required: "This field is required",
          })}
          error={!!(errors as any)?.content}
          helperText={(errors as any)?.content?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          multiline
          label={"Content"}
          name="content"
        />
        <Controller
          control={control}
          name={"driveId"}
          rules={{ required: "This field is required" }}
          // eslint-disable-next-line
          defaultValue={null as any}
          render={({ field }) => (
            <Autocomplete
              {...driveAutocompleteProps}
              {...field}
              onChange={(_, value) => {
                field.onChange(value.id);
              }}
              getOptionLabel={(item) => {
                return (
                  driveAutocompleteProps?.options?.find((p) => {
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
                  label={"Drive"}
                  margin="normal"
                  variant="outlined"
                  error={!!(errors as any)?.drive?.id}
                  helperText={(errors as any)?.drive?.id?.message}
                  required
                />
              )}
            />
          )}
        />
      </Box>
    </Create>
  );
}
