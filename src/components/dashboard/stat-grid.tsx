"use client";

import type { ComponentProps } from "react";
import { useHoverLift } from "@/components/motion/hover-lift";
import { Reveal } from "@/components/motion/reveal";

/** The metric row: cards reveal in sequence and rise slightly under the pointer. */
export function StatGrid(props: ComponentProps<"div">) {
  const ref = useHoverLift();
  return (
    <div ref={ref}>
      <Reveal role="region" {...props} />
    </div>
  );
}
