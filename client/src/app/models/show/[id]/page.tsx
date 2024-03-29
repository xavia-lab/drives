"use client";

import { Stack, Typography } from "@mui/material";
import { useOne, useShow } from "@refinedev/core";
import {
  DateField,
  NumberField,
  Show,
  TextFieldComponent as TextField,
} from "@refinedev/mui";

export default function ModelShow() {
  const { queryResult } = useShow({});

  const { data, isLoading } = queryResult;

  const record = data?.data;

  const { data: capacityData, isLoading: capacityIsLoading } = useOne({
    resource: "capacities",
    id: record?.capacityId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const { data: formFactorData, isLoading: formFactorIsLoading } = useOne({
    resource: "formFactors",
    id: record?.formFactorId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const { data: interfaceData, isLoading: interfaceIsLoading } = useOne({
    resource: "interfaces",
    id: record?.interfaceId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const { data: manufacturerData, isLoading: manufacturerIsLoading } = useOne({
    resource: "manufacturers",
    id: record?.manufacturerId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const { data: storageTypeData, isLoading: storageTypeIsLoading } = useOne({
    resource: "storageTypes",
    id: record?.storageTypeId || "",
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
          {"Number"}
        </Typography>
        <TextField value={record?.number} />

        <Typography variant="body1" fontWeight="bold">
          {"Manufacturer"}
        </Typography>
        {manufacturerIsLoading ? (
          <>Loading...</>
        ) : (
          <>{manufacturerData?.data?.title}</>
        )}

        <Typography variant="body1" fontWeight="bold">
          {"Capacity"}
        </Typography>
        {capacityIsLoading ? <>Loading...</> : <>{capacityData?.data?.title}</>}

        <Typography variant="body1" fontWeight="bold">
          {"Form Factor"}
        </Typography>
        {formFactorIsLoading ? (
          <>Loading...</>
        ) : (
          <>{formFactorData?.data?.title}</>
        )}

        <Typography variant="body1" fontWeight="bold">
          {"Interface"}
        </Typography>
        {interfaceIsLoading ? (
          <>Loading...</>
        ) : (
          <>{interfaceData?.data?.title}</>
        )}

        <Typography variant="body1" fontWeight="bold">
          {"Storage Type"}
        </Typography>
        {storageTypeIsLoading ? (
          <>Loading...</>
        ) : (
          <>{storageTypeData?.data?.title}</>
        )}

        <Typography variant="body1" fontWeight="bold">
          {"CreatedAt"}
        </Typography>
        <DateField value={record?.createdAt} />
      </Stack>
    </Show>
  );
}
