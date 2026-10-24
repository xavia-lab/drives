import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@refinedev/core", () => ({
  useApiUrl: () => "/api",
  useList: () => ({
    query: { data: { data: [] }, isLoading: false },
  }),
  useCustom: () => ({
    query: { isLoading: false, isError: false },
    result: { data: undefined },
  }),
  useNotification: () => ({ open: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@providers/binary-data-provider", () => ({
  BinaryService: { put: vi.fn() },
}));

import { DriveMediaManagementWorkflow } from "./drive-media-management-workflow";

describe("DriveMediaManagementWorkflow", () => {
  it("renders without looping when no drive is selected", async () => {
    render(<DriveMediaManagementWorkflow />);

    expect(
      await screen.findByText("Drive Media Management"),
    ).toBeInTheDocument();
  });
});
