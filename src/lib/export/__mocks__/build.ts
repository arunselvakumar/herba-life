// Storybook mock for `build.ts`, registered with sb.mock() in .storybook/preview.tsx.
// These read the database, so there is no sensible default: a story that renders
// a server component sets the data it needs, e.g.
//   beforeEach: () => { mocked(buildExport).mockResolvedValue(fixture) }
import { fn } from "storybook/test";
import type * as Actual from "../build";

function unset(name: string) {
  return async (): Promise<never> => {
    throw new Error(`build.${name}() is not mocked in this story. Set it with mocked(${name}).mockResolvedValue(...).`);
  };
}

export const buildExport: typeof Actual.buildExport = fn(unset("buildExport")).mockName("buildExport");
export const countExportRows: typeof Actual.countExportRows = fn(unset("countExportRows")).mockName("countExportRows");
