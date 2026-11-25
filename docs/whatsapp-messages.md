# WhatsApp messages

The app sends members four WhatsApp messages through the branch's MSG91
account. Each is a template approved by Meta. The wording below is what must
be registered in MSG91 (WhatsApp → Templates); the app only names the template
and supplies the values.

All four: category **Utility**, language **English (`en`)**, body only (no
header, footer or buttons), sender number 918072738519.

## 1. `checkin`

Sent for each recorded visit. See [attendance-module.md](attendance-module.md#5-whatsapp-confirmation)
for when a visit does and does not send one.

```
Hi {{1}}, thanks for coming in today!

You checked in at {{2}}.
Package: {{3}}
Visits remaining: {{4}}

See you at your next visit.
```

| Value   | Filled with               | Sample            |
| ------- | ------------------------- | ----------------- |
| `{{1}}` | First name                | Arun              |
| `{{2}}` | Check-in time in India    | 7:45 am           |
| `{{3}}` | Package name              | 3 months          |
| `{{4}}` | Visits left on the package after this one | 29 |

The template was first approved with "Days remaining" on that line. The value
sent is now the number of visits left, so the wording has to be edited in
MSG91 to "Visits remaining" and approved again; until then members read the
visit count under the old label.

## 2. `welcome`

Sent once when a member is enrolled, from **New member** or by converting an
enquiry.

```
Hi {{1}}, welcome to Herbalife! Your membership is now registered.

Member number: {{2}}
Joined on: {{3}}

You will receive your check-in and package updates on this number.
```

| Value   | Filled with                    | Sample      |
| ------- | ------------------------------ | ----------- |
| `{{1}}` | First name                     | Arun        |
| `{{2}}` | Member number (the "Sl. No.")  | 42          |
| `{{3}}` | Joining date                   | 19 Nov 2026 |

- **Not sent** when the joining date is not today. Records typed in later from
  the paper sheets carry their own earlier date, and those members joined long
  ago.
- A member enrolled together with a first package gets this message only, not
  the package confirmation as well.

## 3. `package_confirmation_visits`

Sent when a package is added to a member who is already enrolled: a renewal,
or a first package taken some time after joining.

```
Hi {{1}}, your Herbalife package is confirmed.

Package: {{2}}
Starts on: {{3}}
Visits: {{4}}

Thank you. See you at your next visit.
```

| Value   | Filled with      | Sample      |
| ------- | ---------------- | ----------- |
| `{{1}}` | First name       | Arun        |
| `{{2}}` | Package name     | 3 months    |
| `{{3}}` | First day        | 19 Nov 2026 |
| `{{4}}` | Visits in the package, extra visits included | 90 |

- **Not sent** for a package whose start date is before today: that is
  history being filled in.
- This replaces `package_confirmation`, whose fourth line was a "Valid until"
  date. Packages no longer have an end date, so that template is not used.

## 4. `package_low_visits_reminder`

Sent once per package, when it is down to its last 3 visits
(`LOW_VISITS_REMINDER`).

```
Hi {{1}}, this is a reminder that your Herbalife package is almost used up.

Package: {{2}}
Visits remaining: {{3}}

Please renew at the front desk to continue without a break.
```

| Value   | Filled with      | Sample      |
| ------- | ---------------- | ----------- |
| `{{1}}` | First name       | Arun        |
| `{{2}}` | Package name     | 3 months    |
| `{{3}}` | Visits left      | 3           |

- This replaces `package_expiry_reminder`, which named the package's last
  day.
- **When**: Vercel Cron calls `GET /api/cron/package-reminder` once a day at
  03:30 UTC, about 9 am in India (`vercel.json`). On Vercel's Hobby plan the
  call can arrive any time within that hour.
- **Who**: members whose open package has 1 to 3 visits left and has been
  visited on at least once. Members who have already taken another package
  with visits left are left alone.
- **Once**: the package is marked
  (`member_package.low_visits_reminder_sent_at`) just before the reminder is
  sent, so two runs that overlap cannot both send it. The mark stays when
  MSG91 accepts the reminder or the member has no usable number. It is
  cleared when MSG91 refuses the request or cannot be reached, so the next
  day's run tries again while the package still has visits left.
- **Protected** by `CRON_SECRET`: Vercel sends it as a bearer token, and the
  route refuses every call when it is missing or different.

## Common rules

- **Numbers**: a ten-digit mobile is treated as Indian. A number with another
  country code must be saved with a leading `+`. Members with no usable number
  are skipped, and the skip is logged.
- **Failures**: a message goes out after the work that triggered it has
  finished, so a failure never blocks or undoes that work. Failures appear
  only in the server logs, and in MSG91 under WhatsApp → Logs.
- **Switching it on**: nothing is sent unless `MSG91_AUTH_KEY` is set. It is
  left out locally so development and tests never message anyone. The
  few-visits-left reminder also needs `CRON_SECRET`.
- **A template that is not approved yet**: MSG91 still accepts the request and
  fails it afterwards, so the failure shows only in MSG91's logs and the app
  counts the message as sent. A reminder lost that way is not tried
  again. Do not deploy a message before its template is approved.
- **Code**: template names, the order of the values, the sender number and
  the namespace are in `src/lib/whatsapp/messages.ts`. Change a template's
  wording or values there and in MSG91 together.
