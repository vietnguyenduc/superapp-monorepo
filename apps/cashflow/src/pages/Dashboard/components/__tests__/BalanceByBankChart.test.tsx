import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BalanceByBankChart from "../BalanceByBankChart";

// Loose props shape used by the mocked Recharts components.
interface MockChartProps {
  children?: React.ReactNode;
  data?: Record<string, unknown>[];
  dataKey?: string;
  __data?: Record<string, unknown>[];
  formatter?: (value: unknown) => unknown;
  value?: unknown;
}

vi.mock("recharts", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("recharts");

  const BarChart: React.FC<MockChartProps> = ({ children, data }) => (
    <div data-testid="barchart">
      {React.Children.map(children, (child) =>
        React.isValidElement<MockChartProps>(child)
          ? React.cloneElement(child, { __data: data })
          : child,
      )}
    </div>
  );

  const Bar: React.FC<MockChartProps> = ({ children, dataKey, __data }) => (
    <div data-testid="bar">
      {React.Children.map(children, (child) =>
        React.isValidElement<MockChartProps>(child)
          ? React.cloneElement(child, {
              value:
                __data && __data[0] ? __data[0][dataKey ?? ""] : undefined,
            })
          : child,
      )}
    </div>
  );

  const LabelList: React.FC<MockChartProps> = ({ formatter, value }) => (
    <span>{formatter ? formatter(value) : value}</span>
  );

  const Noop: React.FC = () => null;

  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactElement;
    }) => React.cloneElement(children, { width: 600, height: 300 }),
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
    // Component uses compact format: Math.round(value / 1_000_000) + "M"
    const expectedLabel = "273M";

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

    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    expect(screen.queryByText("₫")).not.toBeInTheDocument();
  });
});
