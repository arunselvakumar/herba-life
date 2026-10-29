import { NextResponse, type NextRequest } from "next/server";
import { can } from "@/lib/access/can";
import { buildExport, ExportNotFoundError } from "@/lib/export/build";
import { canExportAnything, EVERYTHING_KEY, findExport } from "@/lib/export/catalog";
import { UUID_RE } from "@/lib/members/form-defaults";
import { findCurrentUser } from "@/lib/session";

/**
 * `GET /api/export/<module>` downloads that module's workbook;
 * `GET /api/export/everything` bundles every module the person may export.
 * `?member=<id>` narrows the Members workbook to one member.
 *
 * Links to this route are plain anchors, so a missing session is answered
 * with the same redirect the pages use, and a missing permission with a
 * short 403 rather than a page.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/export/[module]">) {
  const { module: key } = await ctx.params;
  const user = await findCurrentUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (key === EVERYTHING_KEY) {
    if (!canExportAnything(user)) return denied();
  } else {
    const def = findExport(key);
    if (!def) return new NextResponse("No such export.", { status: 404 });
    if (!can(user, def.permission)) return denied();
  }

  const memberParam = request.nextUrl.searchParams.get("member");
  const memberId = key === "members" && memberParam && UUID_RE.test(memberParam) ? memberParam : undefined;

  try {
    const { filename, body } = await buildExport(key, user, { memberId });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ExportNotFoundError) return new NextResponse("Nothing to export.", { status: 404 });
    throw error;
  }
}

function denied() {
  return new NextResponse("Your role does not allow exporting this module.", { status: 403 });
}
