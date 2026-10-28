# Attendance module – requirements and design

Status: implemented (first version). Open questions are listed at the end.

## 1. Purpose

Members come to the nutrition centre for their shake or tea, often twice a
day. Attendance records every one of those visits so the branch knows who is
coming, how often, and who has gone quiet. Members mark their own attendance
on a tablet at the entrance; staff only step in when something goes wrong.

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
| Checked in at | Exact time of the tap |
| Day | Local calendar day (stored, so reports never depend on time zones) |
| Period | Morning (before 12), afternoon (12–16), evening (16 onwards), derived from the time |
| Source | `kiosk` = self check-in on the tablet; `manual` = recorded by staff |
| Note | Optional, manual check-ins only ("tablet was off") |
| Recorded by | The signed-in staff account on the device, or the staff member who recorded it |

A member can have any number of check-ins in a day. A second tap within
45 minutes (`CHECKIN_COOLDOWN_MINUTES`) is treated as the same visit: the
kiosk says "You're already in" and nothing is written.

## 4. Attendance Mode (kiosk)

Route: `/attendance/kiosk`. Lives outside the admin shell (no sidebar or
header) in its own route group, `src/app/(kiosk)`.

Opening it:

- The **Attendance Mode** button on the attendance page requests full screen
  (browsers only allow this from a click) and then navigates to the kiosk.
- The sidebar link opens it without full screen; the kiosk's own full-screen
  button (top right) can be used instead.
- The kiosk asks the browser for a screen wake lock so the tablet does not
  dim while idle.

Checking in:

1. A big search box (auto-focused) and a grid of large name tiles. With no
   search, every member is listed alphabetically; typing narrows by first or
   last name, member number, or the last digits of the mobile. Tiles show the
   name, member number and the last four digits of the mobile so two people
   with the same name can tell themselves apart. Nothing else private is on
   screen.
2. Tapping a tile asks "Yes, check me in" / "Not me", and mentions the
   running package and days left.
3. A full-screen welcome ("Welcome, Priya! Checked in at 9:14 am · Visit 12
   this month") shows for six seconds, or until tapped, then the kiosk goes
   back to the search screen. Already-in and error states have their own
   screens.
4. The confirmation step times out after 30 seconds if nobody acts.

The header shows the date, a live clock and today's check-in count. The
member list refreshes every 10 minutes (new members appear, and the day rolls
over at midnight).

Leaving: the **Staff** button asks for the signed-in staff member's password.
It is verified against the stored hash without touching the session, so a
member at the tablet cannot wander into the admin screens by tapping around.

## 5. Attendance page (admin)

Route: `/attendance`, with `?day=YYYY-MM-DD` and `?range=14d|30d|90d|12m`.

- **Day navigation**: previous / next / pick a date / today.
- **Stats** for the selected day: check-ins (with unique members and the
  previous day's count), morning · afternoon · evening split, the month so far
  (visits, members, average per open day), and the number of members on an
  active package not seen for 7+ days (`NOT_SEEN_AFTER_DAYS`).
- **Check-ins over time**: bars per day (2 weeks, 30 days, 90 days) or per
  month (12 months), ending on the selected day. Darker bar = check-ins,
  lighter inner bar = unique members. The selected day is highlighted.
- **Busy hours** and **By weekday** for the same range.
- **Regulars**: most visits in the range, with last visit.
- **Not seen lately**: members on an active package whose last visit is
  7+ days ago (or who have never checked in), oldest first.
- **Who came in**: the day's log in order of arrival, with period, source and
  a remove button.
- **Record a visit**: staff fallback dialog (member, day, time, note) for
  when someone forgot to tap. Saved as `manual`.

The dashboard gets a "Check-ins today" stat; the member profile gets an
Attendance card (this month, all time, last visit, a 4-week day strip).

## 6. Rules

- Check-ins can only be recorded for existing members; deleting a member
  deletes their attendance.
- Manual check-ins cannot be in the future.
- Removing a check-in is permanent (there is no audit trail yet).
- The day and period are computed in the server's local time zone, which is
  assumed to be the branch's.

## 7. Non-goals (for now)

- Linking attendance to package consumption (e.g. counting shakes against a
  package).
- Member photos on the kiosk.
- QR / card scanning.
- Notifications to members who have gone quiet.

## 8. Open questions

1. Should the kiosk hide members without an active package, or let them check
   in and flag it for staff?
2. Is 45 minutes the right duplicate window, or should morning and evening be
   the only two slots per day?
3. Should "not seen lately" use a different threshold per package (e.g. daily
   programmes vs. weekly ones)?
4. Does the branch want a PIN for leaving Attendance Mode instead of the
   staff password (easier on a shared tablet)?
