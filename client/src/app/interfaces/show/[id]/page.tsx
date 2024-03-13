"use client";

import { Stack, Typography } from "@mui/material";
import { useShow } from "@refinedev/core";
import {
  NumberField,
  Show,
  TextFieldComponent as TextField,
} from "@refinedev/mui";

export default function InterfaceShow() {
  const { queryResult } = useShow({});
  const { data, isLoading } = queryResult;

  const record = data?.data;

  const providerLabel = record?.managed ? "System" : "User";


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
          {"Throughput"}
        </Typography>
        <TextField value={record?.throughput} />
        <Typography variant="body1" fontWeight="bold">
          {"Provider"}
        </Typography>
        <TextField value={providerLabel} />
      </Stack>
    </Show>
  );
}
