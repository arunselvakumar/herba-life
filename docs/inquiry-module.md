# Inquiry module – requirements

Status: implemented (first version). Open questions are listed at the end.

## 1. Purpose

People walk into the nutrition centre, call, message on WhatsApp or are sent
by an existing member to ask about the programme. Today those conversations
live in a notebook or in someone's head. The inquiry module records every such
person as an **inquiry**, captures as much as the staff can learn in that
first conversation, keeps the follow-up going until the person either joins
(becomes a **member**) or drops off, and makes the join step a review of
already-captured details rather than a fresh intake.

An inquiry is a *prospect*. A member is someone who has enrolled. The two are
separate records: inquiries never clutter the member list, and converting an
inquiry creates a real member record with the full wellness record.

## 2. Users

- **Staff** (any signed-in user): create, edit, follow up, convert, mark lost
  and delete inquiries. Same permissions as for members.
- **Administrators**: no extra privileges in this module.

## 3. What an inquiry records

Everything that is also on the member intake sheet is captured with the same
field names, so conversion is lossless. Only the first name is mandatory; the
form is meant to be filled during a conversation and completed later.

### Inquiry details

| Field | Notes |
| --- | --- |
| Serial number | Auto-incrementing `#` like the member "Sl. No." |
| Inquired on | Date of first contact. Defaults to today. |
| Source | Walk-in, phone call, WhatsApp, referral, social media, event, other |
| Referred by | Free-text name, plus an optional link to the referring **member** |
| Assigned to | The staff member following this up |
| Status | New → In progress → Converted / Lost (see §4) |
| Next follow-up | Date the next call or visit is due; drives the "due" lists |

### Personal details

First name, last name, gender, date of birth (or age), mobile, email, address,
preferred time to contact.

### What they want

| Field | Notes |
| --- | --- |
| Goals | Multi-select: weight loss, weight gain, general wellness, energy / stamina, sports nutrition, skin & hair, digestion, other |
| Goal notes | Target weight, event they are preparing for, anything in their words |
| Interested package | A package from the catalog, if they showed interest in one |

### Free check readings

Height plus the same readings as a member follow-up: weight, body fat %, BMI,
visceral fat, BMR, body age, muscle mass %, waist. Many prospects get a free
body-composition check at the first visit; the readings become the member's
baseline follow-up on conversion.

### Eating habits and health condition

Identical to the member record: wake-up time, tea/coffee, meals, diet, water
intake; blood pressure / sugar / cardiac flags, medicines, complaints, pain
areas and health notes.

### Remarks

Free text.

## 4. Lifecycle

```
            log a call/visit             convert
  New ───────────────────────► In progress ─────────► Converted
   │                               │                    (links to member)
   │         mark lost             │  mark lost
   └──────────────────────────────►└──────────────────► Lost (with reason)
                                                          │ reopen
                                                          └──► In progress
```

- **New**: just recorded, nobody has followed up yet.
- **In progress**: at least one follow-up has been logged (automatic on the
  first call, WhatsApp or visit), or the inquiry was reopened.
- **Converted**: a member record was created from it. Terminal. The inquiry
  stays for history and links to the member; the member profile links back.
- **Lost**: the person is not joining. A reason is required. Can be reopened.

Converted and lost inquiries cannot be edited or followed up further, but can
be deleted.

## 5. Follow-up log

Each inquiry has an activity timeline. Staff log an entry with:

- **Type**: call, WhatsApp, visit, note. Status changes (converted, lost,
  reopened) are logged automatically.
- **Date** (defaults to today) and free-text **notes**.
- **Next follow-up** date, which updates the inquiry. Leaving it blank clears
  the reminder.

The log shows newest first with who recorded it.

## 6. Converting to a member

"Convert to member" on an inquiry opens the normal **New member** form with
every captured field pre-filled: personal details, eating habits, health
condition, height, free-check readings (as the baseline measurements),
referred-by, the interested package (pre-selected, "Start a package now"
ticked) and the remarks (goal notes are folded in). The join date defaults to
today. Staff review, fill in anything missing, and save.

Saving, in one transaction:

1. creates the member (plus baseline follow-up and package, exactly as the
   normal intake does);
2. marks the inquiry converted, stamps the time and links it to the member;
3. logs a "Converted" entry on the inquiry.

The user lands on the new member's profile. An already-converted inquiry
redirects straight to its member.

If a member already exists with the same mobile number the inquiry page says
so, so staff can decide whether this is a renewal rather than a new person.

## 7. Screens

| Route | Screen |
| --- | --- |
| `/inquiries` | List: search by name, mobile, email or number. Filters: Open (default), Follow-up due, New, Converted, Lost, All. Columns: number, name and contact, source, goals, status, next follow-up (overdue highlighted), inquired on. |
| `/inquiries/new` | Create form (sections above). |
| `/inquiries/[id]` | Detail: status, next follow-up, source, assigned staff; convert / edit / mark lost / reopen / delete; goals and interested package; contact; free-check readings; health; eating habits; remarks; follow-up log with the add-entry form; duplicate-member hint; link to the member once converted. |
| `/inquiries/[id]/edit` | Edit form (open inquiries only). |
| `/inquiries/[id]/convert` | Pre-filled new-member form. |

Navigation gets an **Inquiries** group (All inquiries, New inquiry). The
dashboard gets an "Open inquiries" stat, an "Inquiry follow-ups due" list and
a "Recent inquiries" list.

## 8. Rules

- First name is required; everything else optional. Mobile and email are
  validated when present.
- `nextFollowUpOn` may be any date (past dates show as overdue).
- "Due" = open inquiry with a next follow-up on or before today, or a New
  inquiry with no follow-up date at all.
- Deleting an inquiry removes its activity log. It never touches the member it
  was converted into.
- Deleting a member clears the link on its inquiry (the inquiry stays
  Converted).
- Catalog packages that are archived cannot be chosen as the interested
  package for new inquiries; existing links stay.

## 9. Non-goals (for now)

- Automated reminders (SMS/WhatsApp/email). The dashboard list is the reminder.
- A public web form for prospects to fill in themselves.
- Reporting on conversion rates beyond the monthly counts on the dashboard.

## 10. Open questions

1. Should staff other than the assignee see the inquiry? (Currently everyone
   sees everything, like members.)
2. Is there a fixed follow-up cadence (e.g. call after 2 days, then 7) that
   should pre-fill the next follow-up date?
3. Should "Lost" inquiries be auto-archived after some months?
4. Are there extra details worth capturing that are not on the paper
   wellness record (occupation, how they heard about Herbalife, budget)?
