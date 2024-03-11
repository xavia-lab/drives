"use client";

import { Stack, Typography } from "@mui/material";
import { useShow } from "@refinedev/core";
import {
  NumberField,
  Show,
  TextFieldComponent as TextField,
} from "@refinedev/mui";

export default function CapacityShow() {
  const { queryResult } = useShow({});
  const { data, isLoading } = queryResult;

  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          {"ID"}
        </Typography>
        <NumberField value={record?.id ?? ""} />
        <Typography variant="body1" fontWeight="bold">
          {"Name"}
        </Typography>
        <TextField value={record?.name} />
        <Typography variant="body1" fontWeight="bold">
          {"Value"}
        </Typography>
        <NumberField value={record?.value ?? ""} />
        <Typography variant="body1" fontWeight="bold">
          {"Unit"}
        </Typography>
        <TextField value={record?.unit} />
      </Stack>
    </Show>
  );
}
