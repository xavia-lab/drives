"use client";

import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMany } from "@refinedev/core";
import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useDataGrid,
} from "@refinedev/mui";
import React from "react";

export default function DriveList() {
  const { dataGridProps } = useDataGrid({
    syncWithLocation: true,
  });

  const { data: modelData, isLoading: modelIsLoading } = useMany({
    resource: "models",
    ids:
      dataGridProps?.rows?.map((item: any) => item?.modelId).filter(Boolean) ??
      [],
    queryOptions: {
      enabled: !!dataGridProps?.rows,
    },
  });

  const { data: retailerData, isLoading: retailerIsLoading } = useMany({
    resource: "retailers",
    ids:
      dataGridProps?.rows
        ?.map((item: any) => item?.retailerId)
        .filter(Boolean) ?? [],
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
        field: "name",
        flex: 1,
        headerName: "Name",
        minWidth: 50,
      },
      {
        field: "label",
        flex: 1,
        headerName: "Label",
        minWidth: 50,
      },
      {
        field: "serial",
        flex: 1,
        headerName: "Serial",
        minWidth: 50,
      },
      {
        field: "datePurchased",
        flex: 1,
        headerName: "Date Purchased",
        minWidth: 50,
        renderCell: function render({ value }) {
          return <DateField value={value} />;
        },
      },
      {
        field: "model",
        flex: 1,
        headerName: "Model",
        minWidth: 50,
        valueGetter: ({ row }) => {
          const value = row?.modelId;
          return value;
        },
        renderCell: function render({ value }) {
          return modelIsLoading ? (
            <>Loading...</>
          ) : (
            modelData?.data?.find((item) => item.id === value)?.title
          );
        },
      },
      {
        field: "retailer",
        flex: 1,
        headerName: "Retailer",
        minWidth: 50,
        valueGetter: ({ row }) => {
          const value = row?.retailerId;
          return value;
        },
        renderCell: function render({ value }) {
          return retailerIsLoading ? (
            <>Loading...</>
          ) : (
            retailerData?.data?.find((item) => item.id === value)?.title
          );
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
    [modelData, retailerData]
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  );
}
