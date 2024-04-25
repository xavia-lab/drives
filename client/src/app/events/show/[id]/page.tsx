"use client";

import { Stack, Typography } from "@mui/material";
import { useOne, useShow } from "@refinedev/core";
import {
  DateField,
  MarkdownField,
  NumberField,
  Show,
  TextFieldComponent as TextField,
} from "@refinedev/mui";

export default function EventShow() {
  const { queryResult } = useShow({});

  const { data, isLoading } = queryResult;

  const record = data?.data;

  const { data: driveData, isLoading: driveIsLoading } = useOne({
    resource: "drives",
    id: record?.driveId || "",
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
          {"Date"}
        </Typography>
        <DateField format="LL" value={record?.eventDate} />

        <Typography variant="body1" fontWeight="bold">
          {"Heading"}
        </Typography>
        <TextField value={record?.heading} />

        <Typography variant="body1" fontWeight="bold">
          {"Model"}
        </Typography>
        {driveIsLoading ? <>Loading...</> : <>{driveData?.data?.title}</>}

        <Typography variant="body1" fontWeight="bold">
          {"Content"}
        </Typography>
        <MarkdownField value={record?.content} />

        <Typography variant="body1" fontWeight="bold">
          {"CreatedAt"}
        </Typography>
        <DateField format="LL" value={record?.createdAt} />
      </Stack>
    </Show>
  );
}
