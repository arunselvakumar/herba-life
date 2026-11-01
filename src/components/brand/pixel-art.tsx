import type { ComponentProps } from "react";

/**
 * A tiny pixel-art renderer. Each row is a string, each character a pixel,
 * and the palette says what colour (and opacity) a character paints. `.` is
 * always transparent. The SVG scales to whatever size the class name gives
 * it and stays crisp, so one grid serves the tablet and the phone alike.
 *
 * A pixel's `data-px` attribute carries its character, which lets callers
 * pick out groups of pixels (steam, a highlight) to animate with GSAP.
 */
export type PixelPalette = Record<string, { fill: string; opacity?: number }>;

export function PixelArt({
  rows,
  palette,
  ...props
}: ComponentProps<"svg"> & { rows: readonly string[]; palette: PixelPalette }) {
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges" {...props}>
      {rows.flatMap((row, y) =>
        Array.from(row, (char, x) => {
          const paint = char === "." ? undefined : palette[char];
          if (!paint) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={paint.fill} fillOpacity={paint.opacity} data-px={char} />;
        }),
      )}
    </svg>
  );
}
