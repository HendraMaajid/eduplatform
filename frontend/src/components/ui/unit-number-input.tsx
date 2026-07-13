import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UnitNumberInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  unit: string;
};

export function UnitNumberInput({ unit, className, ...props }: UnitNumberInputProps) {
  return (
    <div className="relative min-w-0">
      <Input type="number" className={cn("pr-20", className)} {...props} />
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground"
        aria-hidden="true"
      >
        {unit}
      </span>
    </div>
  );
}
