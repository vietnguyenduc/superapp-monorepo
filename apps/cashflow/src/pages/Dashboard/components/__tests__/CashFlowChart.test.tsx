import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CashFlowChart from "../CashFlowChart";

vi.mock("recharts", async () => {
  const actual = await vi.importActual<any>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      React.cloneElement(children, { width: 700, height: 300 }),
  };
});

describe("CashFlowChart", () => {
  it("toggles balance visibility from legend control", () => {
    render(
      <CashFlowChart
        data={[
          { date: "2024-01-01", inflow: 1000, outflow: 300, netFlow: 700 },
          { date: "2024-02-01", inflow: 400, outflow: 900, netFlow: -500 },
        ]}
        timeRange="month"
        startBalance={10000}
        endBalance={10200}
      />,
    );

    const toggle = screen.getByText("dashboard.balance");
    expect(screen.getByText("✓")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });
});
