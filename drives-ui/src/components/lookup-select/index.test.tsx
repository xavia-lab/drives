import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LookupSelect } from "@components/lookup-select";

vi.mock("@refinedev/core", async () => {
  const actual =
    await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");
  return {
    ...actual,
    useList: () => ({
      query: {
        isLoading: false,
        isError: false,
        data: {
          data: [
            { id: "1", name: "China" },
            { id: "2", name: "Japan" },
            { id: "3", name: "United States" },
          ],
        },
      },
    }),
  };
});

describe("LookupSelect", () => {
  it("filters options in the browser as the user types", async () => {
    const user = userEvent.setup();

    render(
      <LookupSelect resource="countries" optionLabel="name" optionValue="id" />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "Chi");

    expect(await screen.findByTitle("China")).toBeInTheDocument();
    expect(screen.queryByTitle("Japan")).not.toBeInTheDocument();
  });
});
