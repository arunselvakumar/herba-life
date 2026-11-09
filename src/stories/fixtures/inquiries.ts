import type { Inquiry, InquiryActivity, PackagePlan } from "@/db/schema";
import type { CurrentUser } from "@/lib/session";
import type { InquiryDetail, InquiryListRow, MemberOption, StaffOption } from "@/lib/inquiries/queries";
import { memberRows, plans } from "./members";
import { at, daysFromToday } from "./time";
import { adminUser, frontDeskUser } from "./users";

let seq = 0;
const id = (prefix: string) => `${prefix}-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

// ---------------------------------------------------------------------------
// Pickers: staff, members and packages the inquiry form offers.
// ---------------------------------------------------------------------------

export const staff = [
  { id: adminUser.id, name: adminUser.name },
  { id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0004", name: "Karthik Subramanian" },
  { id: frontDeskUser.id, name: frontDeskUser.name },
] satisfies StaffOption[];

/** Every member from the members fixture, as the "referring member" picker lists them. */
export const memberOptions: MemberOption[] = memberRows.map(({ id: memberId, serialNo, firstName, lastName }) => ({
  id: memberId,
  serialNo,
  firstName,
  lastName,
}));

/** What `listActivePlans()` returns: the active plans, in order. */
export const activePlans: PackagePlan[] = plans.filter((p) => p.isActive);

/** The archived "Trial week" plan, for an inquiry that picked it before it was retired. */
export const archivedPlan: PackagePlan = plans.find((p) => !p.isActive) ?? plans[0]!;

const threeMonths = activePlans.find((p) => p.name === "3 months") ?? activePlans[0]!;
const oneMonth = activePlans.find((p) => p.name === "1 month") ?? activePlans[0]!;

const priya = memberOptions[0]!;
const rahul = memberOptions[1]!;

/** Allowed to convert an enquiry, but not to create the member it becomes. */
export const convertOnlyUser = {
  ...frontDeskUser,
  id: "0b5a8c1e-7e1f-4f53-9a43-3c2f7f0a0005",
  name: "Sanjay Kumar",
  email: "sanjay@herbalife.test",
  roleId: "role-sales",
  roleName: "Sales",
  permissions: ["inquiries.view", "inquiries.update", "inquiries.convert"],
} satisfies CurrentUser;

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

export function makeInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id: id("5e6f7a8b"),
    serialNo: 200 + seq,
    status: "new",
    source: "walk_in",
    inquiredOn: daysFromToday(-2),
    firstName: "Anjali",
    lastName: "Menon",
    gender: "female",
    dateOfBirth: null,
    age: 34,
    mobile: "98410 55201",
    email: null,
    address: null,
    referredBy: null,
    preferredContactTime: null,
    referredByMemberId: null,
    assignedTo: adminUser.id,
    goals: [],
    goalNotes: null,
    interestedPlanId: null,
    heightCm: null,
    weightKg: null,
    bodyFatPct: null,
    bmi: null,
    visceralFat: null,
    bmr: null,
    bodyAge: null,
    muscleMassPct: null,
    waistCm: null,
    wakeUpTime: null,
    teaCoffee: null,
    breakfast: null,
    lunch: null,
    eveningSnacks: null,
    dinner: null,
    diet: null,
    waterIntake: null,
    hasBloodPressure: false,
    hasSugar: false,
    hasCardiac: false,
    medicines: null,
    symptoms: [],
    painAreas: [],
    healthNotes: null,
    remarks: null,
    nextFollowUpOn: null,
    lostReason: null,
    closedAt: null,
    convertedMemberId: null,
    createdBy: adminUser.id,
    createdAt: at(-2, 11),
    updatedAt: at(-2, 11),
    ...overrides,
  };
}

type ActivityRow = InquiryDetail["activities"][number];

export function makeActivity(overrides: Partial<InquiryActivity> = {}, recordedBy: { name: string } | null = { name: adminUser.name }): ActivityRow {
  return {
    id: id("6f7a8b9c"),
    inquiryId: "",
    type: "call",
    occurredOn: daysFromToday(-1),
    notes: null,
    recordedBy: recordedBy ? adminUser.id : null,
    createdAt: at(-1, 12),
    ...overrides,
    recordedByUser: recordedBy,
  };
}

function listRow(row: Inquiry, extra: Partial<Pick<InquiryListRow, "interestedPlan" | "assignedUser">> = {}): InquiryListRow {
  return {
    ...row,
    interestedPlan: extra.interestedPlan ?? null,
    assignedUser: extra.assignedUser ?? null,
  };
}

// The open inquiry used on the detail, edit and convert screens.
const kavithaId = "5e6f7a8b-0000-4000-8000-0000000000a1";

const kavitha = makeInquiry({
  id: kavithaId,
  serialNo: 214,
  status: "in_progress",
  source: "referral",
  inquiredOn: daysFromToday(-12),
  firstName: "Kavitha",
  lastName: "Ramesh",
  gender: "female",
  dateOfBirth: "1988-07-21",
  age: null,
  mobile: "98400 12345",
  email: "kavitha.r@example.com",
  address: "45, Lake View Road, Velachery, Chennai",
  referredBy: null,
  referredByMemberId: priya.id,
  preferredContactTime: "Evenings after 6",
  goals: ["weight_loss", "energy"],
  goalNotes: "Wants to lose 8 kg before her sister's wedding in February.",
  interestedPlanId: threeMonths.id,
  heightCm: 158,
  weightKg: 74.6,
  bodyFatPct: 36.4,
  bmi: 29.9,
  visceralFat: 9,
  bmr: 1352,
  bodyAge: 44,
  muscleMassPct: 24.1,
  waistCm: 92,
  wakeUpTime: "6:30 am",
  teaCoffee: "Tea with sugar, 3 cups",
  breakfast: "Dosa, chutney",
  lunch: "Rice, sambar, curd",
  eveningSnacks: "Bajji or biscuits",
  dinner: "Chapati, kurma",
  diet: "eggetarian",
  waterIntake: "1.5 litres",
  hasBloodPressure: false,
  hasSugar: true,
  hasCardiac: false,
  medicines: "Metformin 500 mg",
  symptoms: ["tiredness", "acidity", "pain"],
  painAreas: ["knee", "back"],
  healthNotes: null,
  remarks: "Husband decides on spending; prefers to pay monthly.",
  nextFollowUpOn: daysFromToday(-3),
  createdAt: at(-12, 17),
  updatedAt: at(-3, 18),
});

/** One of each kind: a call, a WhatsApp, a visit, a note and a system status entry. */
export const activities: ActivityRow[] = [
  makeActivity({
    inquiryId: kavithaId,
    type: "whatsapp",
    occurredOn: daysFromToday(-3),
    notes: "Sent the 3-month package brochure and the price list. Read, no reply yet.",
  }),
  makeActivity(
    { inquiryId: kavithaId, type: "call", occurredOn: daysFromToday(-6), notes: "Interested, but wants to talk to her husband first.\nCall back on the weekend." },
    { name: frontDeskUser.name },
  ),
  makeActivity({ inquiryId: kavithaId, type: "note", occurredOn: daysFromToday(-8), notes: "Sister of a member's colleague; mention the referral offer." }, null),
  makeActivity({ inquiryId: kavithaId, type: "status", occurredOn: daysFromToday(-10), notes: "New → In progress" }),
  makeActivity({ inquiryId: kavithaId, type: "visit", occurredOn: daysFromToday(-12), notes: "Walked in with Priya. Took the free body-composition check." }),
];

export const openInquiry: InquiryDetail = {
  ...kavitha,
  activities,
  interestedPlan: {
    id: threeMonths.id,
    name: threeMonths.name,
    durationDays: threeMonths.durationDays,
    price: threeMonths.price,
    isActive: true,
  },
  assignedUser: { name: adminUser.name },
  createdByUser: { name: frontDeskUser.name },
  referredByMember: priya,
  convertedMember: null,
};

/** A brand-new walk-in with only a name and number. */
export const bareInquiry: InquiryDetail = {
  ...makeInquiry({ id: "5e6f7a8b-0000-4000-8000-0000000000a2", serialNo: 219, inquiredOn: daysFromToday(0), firstName: "Vignesh", lastName: "", gender: null, age: null, mobile: "90030 11223" }),
  activities: [],
  interestedPlan: null,
  assignedUser: null,
  createdByUser: { name: frontDeskUser.name },
  referredByMember: null,
  convertedMember: null,
};

/** An inquiry that picked a plan which has since been archived. */
export const archivedPlanInquiry: InquiryDetail = {
  ...openInquiry,
  id: "5e6f7a8b-0000-4000-8000-0000000000a3",
  serialNo: 216,
  interestedPlanId: archivedPlan.id,
  interestedPlan: {
    id: archivedPlan.id,
    name: archivedPlan.name,
    durationDays: archivedPlan.durationDays,
    price: archivedPlan.price,
    isActive: false,
  },
};

export const convertedInquiry: InquiryDetail = {
  ...openInquiry,
  id: "5e6f7a8b-0000-4000-8000-0000000000a4",
  serialNo: 205,
  status: "converted",
  inquiredOn: daysFromToday(-30),
  firstName: "Rahul",
  lastName: "Iyer",
  gender: "male",
  nextFollowUpOn: null,
  closedAt: at(-26, 11),
  convertedMemberId: rahul.id,
  convertedMember: rahul,
  referredByMember: null,
  referredBy: "Instagram ad",
  source: "social_media",
  activities: [
    makeActivity({ type: "status", occurredOn: daysFromToday(-26), notes: "Converted to member #102" }),
    makeActivity({ type: "visit", occurredOn: daysFromToday(-26), notes: "Paid for 1 month, starts tomorrow." }),
    makeActivity({ type: "call", occurredOn: daysFromToday(-29), notes: "Asked about the morning batch timings." }),
  ],
};

export const lostInquiry: InquiryDetail = {
  ...openInquiry,
  id: "5e6f7a8b-0000-4000-8000-0000000000a5",
  serialNo: 198,
  status: "lost",
  inquiredOn: daysFromToday(-45),
  firstName: "Deepak",
  lastName: "Nair",
  gender: "male",
  mobile: "99400 88112",
  nextFollowUpOn: null,
  lostReason: "Joined a gym near his office instead. Said he may come back after the new year.",
  closedAt: at(-20, 16),
  referredByMember: null,
  referredByMemberId: null,
  interestedPlan: { id: oneMonth.id, name: oneMonth.name, durationDays: oneMonth.durationDays, price: oneMonth.price, isActive: true },
  interestedPlanId: oneMonth.id,
  activities: [
    makeActivity({ type: "status", occurredOn: daysFromToday(-20), notes: "Marked lost: joined a gym near his office." }),
    makeActivity({ type: "call", occurredOn: daysFromToday(-20), notes: "Not interested any more." }),
  ],
};

/** A member with the same mobile as `openInquiry`, for the "possibly an existing member" alert. */
export const possibleMatches: MemberOption[] = [priya];

const admin = { name: adminUser.name };
const meena = { name: frontDeskUser.name };

/** The list in every state: new with no date, overdue, due today, upcoming, converted and lost. */
export const inquiryRows: InquiryListRow[] = [
  listRow(makeInquiry({ serialNo: 219, firstName: "Vignesh", lastName: "", mobile: "90030 11223", inquiredOn: daysFromToday(0) })),
  listRow(kavitha, { interestedPlan: { name: threeMonths.name }, assignedUser: admin }),
  listRow(
    makeInquiry({
      serialNo: 211,
      status: "in_progress",
      source: "phone",
      firstName: "Divya",
      lastName: "Krishnan",
      mobile: null,
      email: "divya.k@example.com",
      goals: ["general_wellness", "skin_hair", "digestion"],
      inquiredOn: daysFromToday(-9),
      nextFollowUpOn: daysFromToday(0),
    }),
    { assignedUser: meena },
  ),
  listRow(
    makeInquiry({
      serialNo: 208,
      status: "in_progress",
      source: "event",
      firstName: "Mohammed",
      lastName: "Arshad Abdul Rahman Siddiqui",
      gender: "male",
      mobile: "97890 44567",
      goals: ["sports_nutrition", "weight_gain"],
      inquiredOn: daysFromToday(-15),
      nextFollowUpOn: daysFromToday(4),
    }),
    { interestedPlan: { name: oneMonth.name }, assignedUser: { name: "Karthik Subramanian" } },
  ),
  listRow(
    makeInquiry({ serialNo: 207, status: "new", source: "whatsapp", firstName: "Sneha", lastName: "Pillai", mobile: null, inquiredOn: daysFromToday(-5), nextFollowUpOn: daysFromToday(-1) }),
  ),
  listRow(convertedInquiry, { interestedPlan: { name: oneMonth.name }, assignedUser: admin }),
  listRow(lostInquiry, { interestedPlan: { name: oneMonth.name }, assignedUser: meena }),
];

/** The "Follow-up due" filter: open inquiries due today or earlier, plus new ones with no date. */
export const dueRows: InquiryListRow[] = inquiryRows.filter(
  (r) => (r.status === "new" || r.status === "in_progress") && (r.nextFollowUpOn === null ? r.status === "new" : r.nextFollowUpOn <= daysFromToday(0)),
);

/** Open inquiries only, as the default list shows them. */
export const openRows: InquiryListRow[] = inquiryRows.filter((r) => r.status === "new" || r.status === "in_progress");
