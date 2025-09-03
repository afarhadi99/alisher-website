import * as React from "react";
import { cn } from "@/lib/utils";

type ElectricBorderLayersProps = {
  className?: string;
};

/**
 * ElectricBorderLayers
 * Renders overlay layers that produce the "Electric Border" effect.
 * Usage:
 * - Place inside a relatively positioned parent that has class "group" and a border radius.
 * - Example:
 *   <Card className="relative group rounded-xl">
 *     <CardContent>...</CardContent>
 *     <ElectricBorderLayers />
 *   </Card>
 *
 * Notes:
 * - Layers are pointer-events: none and inherit border radius from the parent.
 * - Activation is controlled by CSS in globals.css via :hover and :focus-within on the .group parent.
 */
export function ElectricBorderLayers({ className }: ElectricBorderLayersProps) {
  return (
    <div aria-hidden="true" className={cn("electric-layers", className)}>
      <div className="eb-border" />
      <div className="eb-glow-1" />
      <div className="eb-glow-2" />
      <div className="eb-overlay-1" />
      <div className="eb-overlay-2" />
      <div className="eb-background-glow" />
    </div>
  );
}

export default ElectricBorderLayers;