# Attendance module – requirements and design

Status: implemented (first version). Open questions are listed at the end.

## 1. Purpose

Members come to the nutrition centre for their shake or tea. A package buys a
number of visits (a "1 month" package is 30 visits), and a member can take at
most one visit a day. Attendance records each visit and takes it off the
member's package, so the branch knows who is coming, how often, who has gone
quiet and how many visits everyone has left. Members mark their own
attendance on a tablet at the entrance; staff only step in when something
goes wrong.

Two audiences, two screens:

- **Attendance Mode** – the member-facing kiosk, full screen on a tablet or
  laptop. Find your name, tap, done. Think of the visitor sign-in tablet at an
  office reception.
- **Attendance** – the admin page: who came in today, trends over days and
  months, busy hours, regulars, and members who have not been seen lately.

## 2. Users

- **Members** (not signed in): use the kiosk only. The tablet is signed in
  with a staff account; members never see a login or the admin screens.
- **Staff**: open Attendance Mode, view the attendance page, record a visit
  by hand, remove a mistaken check-in.
- **Administrators**: no extra privileges in this module.

## 3. What a check-in records

| Field | Notes |
| --- | --- |
| Member | The member who checked in |
| Package | The package the visit was taken from (`member_package_id`) |
| Checked in at | Exact time of the tap |
| Day | The branch's calendar day (stored, so reports never depend on time zones) |
| Period | Morning (before 12), afternoon (12–16), evening (16 onwards), derived from the time |
| Source | `kiosk` = self check-in on the tablet; `manual` = recorded by staff |
| Note | Optional, manual check-ins only ("tablet was off") |
| Recorded by | The signed-in staff account on the device, or the staff member who recorded it |

A member can have one check-in a day, and the database enforces it (a unique
index on member and day). A second try on the same day writes nothing: the
kiosk says "You have already checked in today at 9:14 am. You can't check in
again today.", and the staff dialog shows the same as an error.

Each check-in takes one visit from a package, in the same transaction. Visits
come off the member's oldest open package that has started and has visits
left, so a renewal bought early is only touched once the package before it is
used up.

## 4. Attendance Mode (kiosk)

Route: `/attendance/kiosk`. Lives outside the admin shell (no sidebar or
header) in its own route group, `src/app/(kiosk)`.

Opening it:

- The **Attendance Mode** button (attendance page, and the header for anyone
  whose role has it) does a full page load of the kiosk URL. It is never a
  client-side navigation: the browser tab must not keep earlier admin pages
  alive or cached behind the kiosk.
- The kiosk first shows a **Start Attendance Mode** card naming the signed-in
  staff member. No member data is loaded until **Start** is pressed. Start
  requests full screen (browsers only allow this from a click) and locks this
  device; **Go back** returns to the admin screens.
- The lock is per sign-in, not per account. Starting it writes a row to the
  `kiosk_lock` table for this browser's session. While the row exists the
  server treats the session as holding `attendance.kiosk` and nothing else:
  every admin page redirects back to the kiosk, every other Server Action is
  refused, exports answer 403, Better Auth's own endpoints answer 403, and
  `/signed-out` sends the tablet back to the kiosk instead of signing it out.
  Other devices signed in with the same account are not affected.
- The lock lives in the database, so clearing cookies on the tablet can only
  sign it out, never unlock it.
- A page restored by the Back button is reloaded from the server, so admin
  screens from before the lock cannot be brought back that way.
- The kiosk's own full-screen button (top right) can be used if full screen
  was refused.
- The kiosk asks the browser for a screen wake lock so the tablet does not
  dim while idle.

Checking in:

1. A big search box (auto-focused) and a belt of large name tiles. Only
   members with visits left on a package are listed, plus anyone who has
   already checked in today (so someone who used their last visit this
   morning still finds their name and is told so). With no search, they are listed
   alphabetically; typing narrows by first or last name, exact member number
   (`12` or `#12`), or mobile number. Tiles show the name, member number and
   the last four digits of the mobile so two people with the same name can
   tell themselves apart. Nothing else private is on screen.

   Mobile search takes any part of the number from four digits up, with or
   without spaces, dashes, a country code or a leading zero. The tablet only
   ever holds the last four digits, so longer numbers are matched on the
   server, which returns member ids and never the numbers themselves.
2. Tapping a tile asks "Yes, check me in" / "Not me", and shows the member
   number, the last four digits of the mobile, the package and the visits
   left on it.
3. A full-screen welcome ("Welcome, Priya! Checked in at 9:14 am · Visit 12
   this month · 17 visits left") shows for six seconds, or until tapped, then
   the kiosk goes back to the search screen. After the last visit on a
   package it asks the member to renew at the front desk. Already checked in
   today, no-package and error states have their own screens.
4. The confirmation step times out after 30 seconds if nobody acts.

The header shows the date, a live clock and today's check-in count. The
member list refreshes every 10 minutes (new members appear, and the day rolls
over at midnight).

Leaving: the **Exit** button asks for the signed-in staff member's password,
verified against the stored hash. The right password deletes this device's
lock and loads the attendance page in full. Wrong passwords are counted on
the lock: after five in a row, the server refuses every attempt (right or
wrong) for 60 seconds and the dialog says how long to wait.

A tablet whose staff password is forgotten: clear the site's cookies (site
data) in the tablet's browser. That signs it out, and signing in again starts
a new, unlocked session. The old session can no longer be used, and its lock
row is deleted with it when the session expires (seven days) or is revoked.

## 5. WhatsApp confirmation

Each recorded visit sends the member the approved `checkin` WhatsApp template
through MSG91, filled with their first name, the check-in time in India, their
package and the visits remaining after this one.

- **Sent for**: kiosk check-ins, and staff-recorded visits for today.
- **Not sent for**: a second try on the same day (nothing is recorded), and
  backdated visits, because the message says "thanks for coming in today".
- **Numbers**: a ten-digit mobile is treated as Indian. A number with another
  country code must be saved with a leading `+`. Members with no usable number
  are skipped, and the skip is logged.
- **Failures**: the message goes out after the check-in has finished, so a
  failure never blocks or undoes it. Failures appear only in the server logs.
- **Switching it on**: nothing is sent unless `MSG91_AUTH_KEY` is set. It is
  left out locally so development and tests never message anyone.

The template's wording, and the other messages members receive (welcome,
package confirmation, few-visits-left reminder), are in
[whatsapp-messages.md](whatsapp-messages.md).

## 6. Attendance page (admin)

Route: `/attendance`, with `?day=YYYY-MM-DD` and `?range=14d|30d|90d|12m`.

- **Day navigation**: previous / next / pick a date / today.
- **Stats** for the selected day: check-ins (with unique members and the
  previous day's count), morning · afternoon · evening split, the month so far
  (visits, members, average per open day), and the number of members on an
  active package not seen for 7+ days (`NOT_SEEN_AFTER_DAYS`).
- **Check-ins over time**: bars per day (2 weeks, 30 days, 90 days) or per
  month (12 months), ending on the selected day. Checkboxes under the chart
  pick the series: unique members (default), check-ins, or both — then the
  darker bar is check-ins with unique members as the lighter inner bar. At
  least one stays on. The selected day is highlighted.
- **Busy hours** and **By weekday** for the same range.
- **Regulars**: most visits in the range, with last visit.
- **Not seen lately**: members on an active package whose last visit is
  7+ days ago (or who have never checked in), oldest first.
- **Who came in**: the day's log in order of arrival, with period, source and
  a remove button. Removing a check-in gives the visit back to its package.
- **Record a visit**: staff fallback dialog (member, day, time, note) for
  when someone forgot to tap. Saved as `manual`, and it takes a visit from
  the package like any other. The picker lists members with a package that
  had started by the day being viewed and has visits left.

The dashboard gets a "Check-ins today" stat; the member profile gets an
Attendance card (this month, all time, last visit, a 4-week day strip).

## 7. Rules

- Check-ins can only be recorded for existing members; deleting a member
  deletes their attendance.
- A package is a number of visits. It has a start date and no end date: a
  member can skip any number of days and loses nothing. It is over when its
  visits (the plan's, plus any extra visits) have all been taken.
- One visit per member per day, from the kiosk or by hand.
- Only members with visits left can have attendance recorded. A visit can be
  taken from a package on a day when its status is `active`, it has started
  by that day and it has visits left, so upcoming, used-up, completed and
  cancelled packages do not count. The server checks this on every check-in:
  the kiosk against today, and a manual visit against the day of the visit.
  Visits already recorded are kept.
- `member_package.visits_used` always equals the number of attendance rows
  pointing at the package. Only `src/lib/attendance/visits.ts` writes either,
  and always both in one transaction.
- Marking a package completed or cancelled closes it with whatever visits it
  has left; reopening it makes them usable again. Deleting a package keeps
  its visits in the attendance record, no longer tied to a package.
- Manual check-ins cannot be in the future.
- Removing a check-in is permanent (there is no audit trail yet).
- Day, period, shown times and the hour and weekday charts all follow the
  branch's clock (`BRANCH_TIME_ZONE`, India), whatever zone the server or the
  browser runs in. Vercel functions cannot be set to India time, because `TZ`
  is reserved there. Times typed in by staff are read as branch time too.

## 8. Non-goals (for now)

- A date limit on a package ("30 visits within 45 days"). The branch counts
  visits only.
- Correcting a package's visit count other than by recording or removing a
  visit.
- Member photos on the kiosk.
- QR / card scanning.
- Notifications to members who have gone quiet.

## 9. Open questions

1. Should "not seen lately" use a different threshold per package (e.g. daily
   programmes vs. weekly ones)?
2. Does the branch want a PIN for leaving Attendance Mode instead of the
   staff password (easier on a shared tablet)?
3. Packages typed in from the paper sheets start with no visits used. Does
   the branch need a way to enter the visits already taken on paper, other
   than recording each past visit?
