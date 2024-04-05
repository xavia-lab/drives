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

export default function CapacityList() {
  const { dataGridProps } = useDataGrid({
    sorters: {
      initial: [{ field: "absoluteCapacity", order: "asc" }],
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
        field: "absoluteCapacity",
        flex: 1,
        headerName: "Name",
        minWidth: 100,
        renderCell: function render({ row }) {
          return <>{row.title}</>;
        },
      },
      {
        field: "value",
        flex: 1,
        headerName: "Value",
        minWidth: 50,
      },
      {
        field: "unit",
        flex: 1,
        headerName: "Unit",
        type: "number",
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
