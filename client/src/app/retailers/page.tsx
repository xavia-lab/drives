"use client";

import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useDataGrid,
} from "@refinedev/mui";
import React from "react";

export default function RetailerList() {
  const { dataGridProps } = useDataGrid({});

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
        minWidth: 100,
      },
      {
        field: "address",
        flex: 1,
        headerName: "Address",
        minWidth: 200,
      },
      {
        field: "country",
        flex: 1,
        headerName: "Country",
        minWidth: 30,
      },
      {
        field: "phone",
        flex: 1,
        headerName: "Phone",
        minWidth: 30,
      },
      {
        field: "email",
        flex: 1,
        headerName: "Email",
        type: "email",
        minWidth: 50,
      },
      {
        field: "website",
        flex: 1,
        headerName: "Website",
        type: "url",
        minWidth: 50,
      },
      {
        field: "managed",
        flex: 1,
        headerName: "Provider",
        minWidth: 100,
        renderCell: function render({ row }) {
          if (row.managed) return <>System</>;
          else return <>User</>;
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
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  );
}
