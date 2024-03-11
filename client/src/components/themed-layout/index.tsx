"use client";

import { Header } from "@components/header";
import { ThemedLayoutV2, ThemedTitleV2 } from "@refinedev/mui";
import React from "react";

export const ThemedLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <ThemedLayoutV2
      Title={({ collapsed }) => (
        <ThemedTitleV2
          // collapsed is a boolean value that indicates whether the <Sidebar> is collapsed or not
          collapsed={collapsed}
          // icon={collapsed ? <MySmallIcon /> : <MyLargeIcon />}
          text="Drives"
        />
      )}
      Header={() => <Header sticky />}
    >
      {children}
    </ThemedLayoutV2>
  );
};
