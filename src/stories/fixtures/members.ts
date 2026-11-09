import type { Member, MemberCheckin, MemberPackage, PackagePlan } from "@/db/schema";
import { EXPIRING_SOON_DAYS } from "@/lib/members/constants";
import { packageState } from "@/lib/members/format";
import type { MemberDetail, MemberFilter, MemberListRow } from "@/lib/members/queries";
import type { PlanOption } from "@/components/members/package-fields";
import type { PlanRow } from "@/lib/packages/queries";
import { at, daysFromToday, TODAY } from "./time";
import { adminUser } from "./users";

let seq = 0;
const id = (prefix: string) => `${prefix}-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

export function makeMember(overrides: Partial<Member> = {}): Member {
  const serialNo = overrides.serialNo ?? 100 + seq;
  return {
    id: id("1a2b3c4d"),
    serialNo,
    firstName: "Priya",
    lastName: "Sharma",
    gender: "female",
    dateOfBirth: "1991-04-12",
    age: null,
    mobile: "98400 12345",
    email: "priya.sharma@example.com",
    address: "12, 3rd Cross Street, Adyar, Chennai",
    referredBy: "Kavya R.",
    joinedOn: daysFromToday(-120),
    heightCm: 162,
    wakeUpTime: "6:00 am",
    teaCoffee: "Filter coffee, 2 cups",
    breakfast: "Idli, sambar",
    lunch: "Rice, dal, poriyal",
    eveningSnacks: "Biscuits",
    dinner: "Chapati, sabzi",
    diet: "veg",
    waterIntake: "2 litres",
    hasBloodPressure: false,
    hasSugar: false,
    hasCardiac: false,
    medicines: null,
    symptoms: [],
    painAreas: [],
    healthNotes: null,
    remarks: null,
    createdBy: adminUser.id,
    createdAt: at(-120, 9),
    updatedAt: at(-120, 9),
    ...overrides,
  };
}

export function makePackage(overrides: Partial<MemberPackage> = {}): MemberPackage {
  const startDate = overrides.startDate ?? daysFromToday(-30);
  const durationDays = overrides.durationDays ?? 90;
  return {
    id: id("2b3c4d5e"),
    memberId: overrides.memberId ?? "",
    planId: null,
    name: "3 months",
    durationDays,
    extraDays: 0,
    startDate,
    endDate: overrides.endDate ?? addDays(startDate, durationDays - 1),
    price: 9000,
    amountPaid: 9000,
    status: "active",
    notes: null,
    createdBy: adminUser.id,
    createdAt: at(-30, 10),
    updatedAt: at(-30, 10),
    ...overrides,
  };
}

export function makeCheckin(overrides: Partial<MemberCheckin> = {}): MemberCheckin {
  return {
    id: id("3c4d5e6f"),
    memberId: overrides.memberId ?? "",
    recordedOn: daysFromToday(-7),
    weightKg: 68.4,
    bodyFatPct: 31.2,
    bmi: 26.1,
    visceralFat: 7,
    bmr: 1380,
    bodyAge: 38,
    muscleMassPct: 26.5,
    waistCm: 84,
    remarks: null,
    recordedBy: adminUser.id,
    createdAt: at(-7, 8),
    ...overrides,
  };
}

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function listRow(m: Member, pkg: MemberPackage | null, checkin: MemberCheckin | null): MemberListRow {
  return {
    ...m,
    currentPackage: pkg,
    latestCheckin: checkin,
    packageState: pkg ? packageState(pkg, EXPIRING_SOON_DAYS, TODAY) : null,
  };
}

const priya = makeMember({ serialNo: 101 });
const rahul = makeMember({
  serialNo: 102,
  firstName: "Rahul",
  lastName: "Iyer",
  gender: "male",
  mobile: "99620 44120",
  email: null,
  heightCm: 175,
  joinedOn: daysFromToday(-80),
});
const fatima = makeMember({ serialNo: 103, firstName: "Fatima", lastName: "Begum", mobile: "90031 77821", email: null });
const george = makeMember({ serialNo: 104, firstName: "George", lastName: "Mathew", gender: "male", mobile: null, email: "george@example.com" });
const lakshmi = makeMember({ serialNo: 105, firstName: "Lakshmi", lastName: "Narayanan", joinedOn: daysFromToday(-3) });

/** One member in each package state: active, ending soon, upcoming, expired, none. */
export const memberRows: MemberListRow[] = [
  listRow(priya, makePackage({ memberId: priya.id }), makeCheckin({ memberId: priya.id })),
  listRow(
    rahul,
    makePackage({ memberId: rahul.id, name: "1 month", durationDays: 30, startDate: daysFromToday(-26), price: 3500, amountPaid: 2000 }),
    makeCheckin({ memberId: rahul.id, recordedOn: daysFromToday(-40), weightKg: 82.1 }),
  ),
  listRow(fatima, makePackage({ memberId: fatima.id, startDate: daysFromToday(4) }), null),
  listRow(
    george,
    makePackage({ memberId: george.id, startDate: daysFromToday(-120) }),
    makeCheckin({ memberId: george.id, recordedOn: daysFromToday(-35) }),
  ),
  listRow(lakshmi, null, null),
];

export const memberWithEverything: MemberDetail = {
  ...priya,
  createdByUser: { name: adminUser.name },
  packages: [
    makePackage({ memberId: priya.id }),
    makePackage({ memberId: priya.id, name: "1 month", durationDays: 30, startDate: daysFromToday(-61), status: "completed" }),
  ],
  checkins: [
    { ...makeCheckin({ memberId: priya.id, recordedOn: daysFromToday(-7), weightKg: 68.4, bmi: 26.1 }), recordedByUser: { name: adminUser.name } },
    { ...makeCheckin({ memberId: priya.id, recordedOn: daysFromToday(-37), weightKg: 70.2, bmi: 26.7 }), recordedByUser: { name: adminUser.name } },
    { ...makeCheckin({ memberId: priya.id, recordedOn: daysFromToday(-67), weightKg: 72.0, bmi: 27.4 }), recordedByUser: null },
  ],
};

export const newMember: MemberDetail = {
  ...lakshmi,
  createdByUser: { name: adminUser.name },
  packages: [],
  checkins: [],
};

export function makePlan(overrides: Partial<PackagePlan> = {}): PackagePlan {
  return {
    id: id("4d5e6f70"),
    name: "3 months",
    durationDays: 90,
    price: 9000,
    description: "Shakes, coaching and weekly measurements.",
    isActive: true,
    sortOrder: 0,
    createdBy: adminUser.id,
    createdAt: at(-200, 9),
    updatedAt: at(-200, 9),
    ...overrides,
  };
}

export const plans: PackagePlan[] = [
  makePlan({ name: "1 month", durationDays: 30, price: 3500, sortOrder: 0 }),
  makePlan({ name: "3 months", durationDays: 90, price: 9000, sortOrder: 1 }),
  makePlan({ name: "6 months", durationDays: 180, price: 16500, sortOrder: 2 }),
  makePlan({ name: "Trial week", durationDays: 7, price: 0, isActive: false, sortOrder: 3, description: null }),
];

/** The `{ id, name, durationDays, price, description }` options the package pickers take. */
export const planOptions = plans
  .filter((p) => p.isActive)
  .map(({ id: planId, name, durationDays, price, description }) => ({ id: planId, name, durationDays, price, description })) satisfies PlanOption[];

/** The catalog as the Packages page lists it, with enrolment counts. */
export const planRows = [
  { ...plans[0]!, enrolments: 14, activeEnrolments: 3 },
  { ...plans[1]!, enrolments: 22, activeEnrolments: 9 },
  // Never sold: the only one that can be deleted.
  { ...plans[2]!, enrolments: 0, activeEnrolments: 0 },
  { ...plans[3]!, enrolments: 5, activeEnrolments: 0 },
] satisfies PlanRow[];

/** What `listMembers` returns for each filter on the Members page, from `memberRows`. */
export const memberRowsByFilter = {
  all: memberRows,
  active: memberRows.filter((r) => r.packageState === "active" || r.packageState === "expiring"),
  expiring: memberRows.filter((r) => r.packageState === "expiring"),
  "no-package": memberRows.filter((r) => !r.currentPackage || r.packageState === "expired"),
  due: memberRows.filter(
    (r) =>
      (r.packageState === "active" || r.packageState === "expiring") &&
      (!r.latestCheckin || r.latestCheckin.recordedOn <= daysFromToday(-30)),
  ),
} satisfies Record<MemberFilter, MemberListRow[]>;

/** One package in every state the member page shows, newest first. */
export const packagesInEveryState = {
  active: makePackage({ memberId: priya.id, notes: "Formula 1 shake and Afresh included." }),
  expiring: makePackage({ memberId: priya.id, name: "1 month", durationDays: 30, startDate: daysFromToday(-26), price: 3500, amountPaid: 2000 }),
  upcoming: makePackage({ memberId: priya.id, startDate: daysFromToday(4), extraDays: 7, amountPaid: 4000 }),
  expired: makePackage({ memberId: priya.id, startDate: daysFromToday(-120) }),
  completed: makePackage({ memberId: priya.id, name: "1 month", durationDays: 30, startDate: daysFromToday(-180), price: 3500, amountPaid: 3500, status: "completed" }),
  cancelled: makePackage({ memberId: priya.id, name: "6 months", durationDays: 180, startDate: daysFromToday(-240), price: 16500, amountPaid: 5000, status: "cancelled" }),
} satisfies Record<string, MemberPackage>;

/** A member with health conditions, complaints and remarks filled in. */
export const memberWithHealth: MemberDetail = {
  ...memberWithEverything,
  hasBloodPressure: true,
  hasSugar: true,
  medicines: "Metformin 500 mg, twice a day",
  symptoms: ["tiredness", "acidity", "pain"],
  painAreas: ["knee", "back"],
  healthNotes: "Knee pain after long walks.",
  remarks: "Wants to lose 8 kg before her sister's wedding in February.",
};
