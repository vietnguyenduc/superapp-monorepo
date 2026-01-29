import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BalanceByBankChart from "../BalanceByBankChart";

vi.mock("recharts", async () => {
  const actual = await vi.importActual<any>("recharts");

  const BarChart = ({ children, data }: any) => (
    <div data-testid="barchart">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { __data: data })
          : child,
      )}
    </div>
  );

  const Bar = ({ children, dataKey, __data }: any) => (
    <div data-testid="bar">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              value: __data?.[0]?.[dataKey],
            })
          : child,
      )}
    </div>
  );

  const LabelList = ({ formatter, value }: any) => (
    <span>{formatter ? formatter(value) : value}</span>
  );

  const Noop = () => null;

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      React.cloneElement(children, { width: 600, height: 300 }),
    BarChart,
    Bar,
    LabelList,
    XAxis: Noop,
    YAxis: Noop,
    CartesianGrid: Noop,
    Tooltip: Noop,
    AreaChart: Noop,
    Area: Noop,
  };
});

describe("BalanceByBankChart", () => {
  it("renders balance labels without currency symbols", () => {
    const value = 273_072_157;
    const formatted = Math.round(value).toLocaleString("vi-VN");

    render(
      <BalanceByBankChart
        data={[
          {
            bank_account_id: "acc-1",
            account_name: "ACB - TK Vốn lưu động",
            account_number: "22012345678",
            balance: value,
            historical_data: [
              { date: "2024-01-01", balance: 200_000_000 },
              { date: "2024-02-01", balance: value },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText(formatted)).toBeInTheDocument();
    expect(screen.queryByText("₫")).not.toBeInTheDocument();
  });
});
