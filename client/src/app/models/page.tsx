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

export default function ModelList() {
  const { dataGridProps } = useDataGrid({
    syncWithLocation: true,
  });

  const { data: capacityData, isLoading: capacityIsLoading } = useMany({
    resource: "capacities",
    ids:
      dataGridProps?.rows
        ?.map((item: any) => item?.capacity?.id)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!dataGridProps?.rows,
    },
  });

  const { data: interfaceData, isLoading: interfaceIsLoading } = useMany({
    resource: "interfaces",
    ids:
      dataGridProps?.rows
        ?.map((item: any) => item?.interface?.id)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!dataGridProps?.rows,
    },
  });

  const { data: manufacturerData, isLoading: manufacturerIsLoading } = useMany({
    resource: "manufacturers",
    ids:
      dataGridProps?.rows
        ?.map((item: any) => item?.manufacturer?.id)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!dataGridProps?.rows,
    },
  });

  const { data: storageTypeData, isLoading: storageTypeIsLoading } = useMany({
    resource: "storageTypes",
    ids:
      dataGridProps?.rows
        ?.map((item: any) => item?.storageType?.id)
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
        field: "number",
        flex: 1,
        headerName: "Number",
        minWidth: 50,
      },
      {
        field: "manufacturer",
        flex: 1,
        headerName: "Manufacturer",
        minWidth: 50,
        valueGetter: ({ row }) => {
          const value = row?.manufacturer;
          return value;
        },
        renderCell: function render({ value }) {
          return manufacturerIsLoading ? (
            <>Loading...</>
          ) : (
            manufacturerData?.data?.find((item) => item.id === value?.id)?.title
          );
        },
      },
      {
        field: "capacity",
        flex: 1,
        headerName: "Capacity",
        minWidth: 50,
        valueGetter: ({ row }) => {
          const value = row?.capacity;
          return value;
        },
        renderCell: function render({ value }) {
          return capacityIsLoading ? (
            <>Loading...</>
          ) : (
            capacityData?.data?.find((item) => item.id === value?.id)?.title
          );
        },
      },
      {
        field: "interface",
        flex: 1,
        headerName: "Interface",
        minWidth: 50,
        valueGetter: ({ row }) => {
          const value = row?.interface;
          return value;
        },
        renderCell: function render({ value }) {
          return interfaceIsLoading ? (
            <>Loading...</>
          ) : (
            interfaceData?.data?.find((item) => item.id === value?.id)?.title
          );
        },
      },
      {
        field: "storageType",
        flex: 1,
        headerName: "StorageType",
        minWidth: 50,
        valueGetter: ({ row }) => {
          const value = row?.storageType;
          return value;
        },
        renderCell: function render({ value }) {
          return storageTypeIsLoading ? (
            <>Loading...</>
          ) : (
            storageTypeData?.data?.find((item) => item.id === value?.id)?.title
          );
        },
      },
      {
        field: "createdAt",
        flex: 1,
        headerName: "Created at",
        minWidth: 250,
        renderCell: function render({ value }) {
          return <DateField value={value} />;
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
    [capacityData]
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  );
}
