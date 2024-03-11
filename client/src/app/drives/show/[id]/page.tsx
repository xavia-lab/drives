"use client";

import { Stack, Typography } from "@mui/material";
import { useOne, useShow } from "@refinedev/core";
import {
  DateField,
  NumberField,
  Show,
  TextFieldComponent as TextField,
} from "@refinedev/mui";

export default function DriveShow() {
  const { queryResult } = useShow({});

  const { data, isLoading } = queryResult;

  const record = data?.data;

  const { data: modelData, isLoading: modelIsLoading } = useOne({
    resource: "models",
    id: record?.modelId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const { data: retailerData, isLoading: retailerIsLoading } = useOne({
    resource: "retailers",
    id: record?.retailerId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

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
          {"Label"}
        </Typography>
        <TextField value={record?.label} />

        <Typography variant="body1" fontWeight="bold">
          {"Serial"}
        </Typography>
        <TextField value={record?.serial} />

        <Typography variant="body1" fontWeight="bold">
          {"Date Purchased"}
        </Typography>
        <DateField value={record?.datePurchased} />

        <Typography variant="body1" fontWeight="bold">
          {"Model"}
        </Typography>
        {modelIsLoading ? <>Loading...</> : <>{modelData?.data?.title}</>}

        <Typography variant="body1" fontWeight="bold">
          {"Retailer"}
        </Typography>
        {retailerIsLoading ? <>Loading...</> : <>{retailerData?.data?.title}</>}
      </Stack>
    </Show>
  );
}
