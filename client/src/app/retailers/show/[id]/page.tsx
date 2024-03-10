"use client";

import { Stack, Typography } from "@mui/material";
import { useShow } from "@refinedev/core";
import {
  NumberField,
  Show,
  TextFieldComponent as TextField,
} from "@refinedev/mui";

export default function RetailerShow() {
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
          {"Address"}
        </Typography>
        <TextField value={record?.address} />
        <Typography variant="body1" fontWeight="bold">
          {"Country"}
        </Typography>
        <TextField value={record?.country} />
        <Typography variant="body1" fontWeight="bold">
          {"Phone"}
        </Typography>
        <TextField value={record?.phone} />
        <Typography variant="body1" fontWeight="bold">
          {"Email"}
        </Typography>
        <TextField value={record?.email} />
        <Typography variant="body1" fontWeight="bold">
          {"Website"}
        </Typography>
        <TextField value={record?.website} />
      </Stack>
    </Show>
  );
}
