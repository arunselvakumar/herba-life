import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";
import ExportPage from "@/app/(app)/export/page";
import { countExportRows } from "@/lib/export/build";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { frontDeskUser } from "@/stories/fixtures/users";
import type { CurrentUser } from "@/lib/session";

/** Row counts per sheet, as `countExportRows()` returns them. */
const rowCounts = {
  Members: 142,
  Enrolments: 318,
  "Follow-ups": 1204,
  Attendance: 9876,
  Enquiries: 87,
  "Enquiry log": 412,
  Packages: 6,
  "Attendance by member": 139,
  Products: 18,
  "Stock movements": 264,
  Sales: 531,
  "Sale items": 902,
  Users: 6,
  Roles: 5,
  Permissions: 41,
} satisfies Awaited<ReturnType<typeof countExportRows>>;

/** Allowed to export members and stock, nothing else. */
const reportingUser = {
  ...frontDeskUser,
  permissions: [...frontDeskUser.permissions, "members.export", "stock.export"],
} satisfies CurrentUser;

const meta = {
  title: "Screens/Export",
  component: ExportPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/export" } } },
  decorators: [withAppShell],
  globals: { viewport: { value: "desktop" } },
  beforeEach: () => {
    mocked(countExportRows).mockResolvedValue(rowCounts);
  },
} satisfies Meta<typeof ExportPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The administrator can export every module, or everything in one file. */
export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Backup & export" })).toBeVisible();
    const grid = await canvas.findByRole("region", { name: "Exports" });
    await expect(grid).toHaveTextContent("9,876");
    await expect(canvas.getByRole("link", { name: "Download members" })).toHaveAttribute("href", "/api/export/members");
    await expect(canvas.getAllByRole("link", { name: "Download everything" })[0]).toHaveAttribute("href", "/api/export/everything");
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("region", { name: "Exports" })).toBeInTheDocument();
  },
};

/** Only the modules the role may export get a card. */
export const SomeModules: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(reportingUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Download stock" })).toBeInTheDocument();
    await expect(canvas.queryByRole("link", { name: "Download users" })).toBeNull();
  },
};

/** No export permission at all: the page explains what to ask for. */
export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Nothing to export")).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Download everything" })).toBeNull();
  },
};
