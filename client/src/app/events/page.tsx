"use client";

import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMany } from "@refinedev/core";
import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  MarkdownField,
  ShowButton,
  useDataGrid,
} from "@refinedev/mui";
import React from "react";

export default function EventList() {
  const { dataGridProps } = useDataGrid({
    syncWithLocation: true,
  });

  const { data: driveData, isLoading: driveIsLoading } = useMany({
    resource: "drives",
    ids:
      dataGridProps?.rows?.map((item: any) => item?.driveId).filter(Boolean) ??
      [],
    queryOptions: {
      enabled: !!dataGridProps?.rows,
    },
  });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        type: "number",
        minWidth: 50,
      },
      {
        field: "eventDate",
        flex: 1,
        headerName: "Date",
        minWidth: 50,
        renderCell: function render({ value }) {
          return <DateField format="LL" value={value} />;
        },
      },
      {
        field: "heading",
        flex: 1,
        headerName: "Heading",
        minWidth: 200,
      },
      {
        field: "drive",
        flex: 1,
        headerName: "Drive",
        minWidth: 50,
        valueGetter: ({ row }) => {
          const value = row?.driveId;
          return value;
        },
        renderCell: function render({ value }) {
          return driveIsLoading ? (
            <>Loading...</>
          ) : (
            driveData?.data?.find((item) => item.id === value)?.title
          );
        },
      },
      {
        field: "content",
        flex: 1,
        headerName: "Content",
        minWidth: 250,
        renderCell: function render({ value }) {
          if (!value) return "-";
          return <MarkdownField value={value?.slice(0, 80) + "..." || ""} />;
        },
      },
      {
        field: "createdAt",
        flex: 1,
        headerName: "Created at",
        minWidth: 250,
        renderCell: function render({ value }) {
          return <DateField format="LL" value={value} />;
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.id} />
              <ShowButton hideText recordItemId={row.id} />
              <DeleteButton hideText recordItemId={row.id} />
            </>
          );
        },
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
    ],
    [driveData]
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  );
}
