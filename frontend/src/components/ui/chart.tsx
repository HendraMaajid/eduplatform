"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string; icon?: React.ComponentType }
>;

const ChartContext = React.createContext<ChartConfig>({});

export function ChartContainer({
  className,
  children,
  config,
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const colorVariables = Object.fromEntries(
    Object.entries(config).flatMap(([key, item]) =>
      item.color ? [[`--color-${key}`, item.color]] : [],
    ),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn(
          "flex min-h-52 w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        style={colorVariables}
      >
        <RechartsPrimitive.ResponsiveContainer initialDimension={{ width: 640, height: 280 }}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;
export const ChartLegend = RechartsPrimitive.Legend;

type TooltipItem = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly TooltipItem[];
  label?: React.ReactNode;
}) {
  const config = React.useContext(ChartContext);
  if (!active || !payload?.length) return null;

  return (
    <div className="grid min-w-40 gap-2 rounded-lg border bg-popover p-3 text-xs shadow-md">
      {label ? <p className="font-semibold text-popover-foreground">{label}</p> : null}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "value");
        return (
          <div key={key} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color || config[key]?.color }}
              />
              {config[key]?.label ?? item.name}
            </span>
            <span className="font-semibold tabular-nums text-popover-foreground">
              {typeof item.value === "number" ? item.value.toLocaleString("id-ID") : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
