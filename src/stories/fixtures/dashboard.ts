import type { Inquiry } from "@/db/schema";
import type { countDay } from "@/lib/attendance/queries";
import type { getInquiryDashboard } from "@/lib/inquiries/queries";
import type { getDashboardData } from "@/lib/members/queries";
import type { getStockDashboard } from "@/lib/stock/queries";
import { makeCheckin, makeMember, makePackage, memberRows } from "./members";
import { at, daysFromToday } from "./time";
import { adminUser, frontDeskUser } from "./users";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type InquiryDashboard = Awaited<ReturnType<typeof getInquiryDashboard>>;
type InquiryRow = InquiryDashboard["recent"][number];
type DayCount = Awaited<ReturnType<typeof countDay>>;
type StockDashboard = Awaited<ReturnType<typeof getStockDashboard>>;

// ---------------------------------------------------------------------------
// Members: getDashboardData()
// ---------------------------------------------------------------------------

const anjali = makeMember({ serialNo: 120, firstName: "Anjali", lastName: "Menon", mobile: "98410 22001" });
const karthik = makeMember({ serialNo: 121, firstName: "Karthik", lastName: "Rajan", gender: "male", mobile: "98410 22002" });
const shalini = makeMember({ serialNo: 122, firstName: "Shalini", lastName: "Devi", mobile: "98410 22003" });

/** On a package, but not measured in the last 30 days (or never). */
const followUpsDue = memberRows.filter(
  (row) => row.currentPackage !== null && (row.latestCheckin === null || row.latestCheckin.recordedOn < daysFromToday(-30)),
);

export const dashboardData = {
  totalMembers: 142,
  activePackages: 96,
  expiringSoon: 7,
  checkinsThisMonth: 38,
  newMembersThisMonth: 9,
  followUpsDue,
  expiringPackages: [
    { ...makePackage({ memberId: anjali.id, name: "1 month", durationDays: 30, startDate: daysFromToday(-29) }), member: anjali },
    { ...makePackage({ memberId: karthik.id, name: "3 months", durationDays: 90, startDate: daysFromToday(-85) }), member: karthik },
    { ...makePackage({ memberId: shalini.id, name: "3 months", durationDays: 90, startDate: daysFromToday(-78) }), member: shalini },
  ],
  recentCheckins: [
    {
      ...makeCheckin({ memberId: anjali.id, recordedOn: daysFromToday(0), weightKg: 64.2, bodyFatPct: 29.8, bmi: 24.4, remarks: "Down 1.2 kg since last month" }),
      member: anjali,
      recordedByUser: { name: frontDeskUser.name },
    },
    {
      ...makeCheckin({ memberId: karthik.id, recordedOn: daysFromToday(-1), weightKg: 88.5, bodyFatPct: 27.1, bmi: 28.9 }),
      member: karthik,
      recordedByUser: { name: adminUser.name },
    },
    {
      ...makeCheckin({ memberId: shalini.id, recordedOn: daysFromToday(-3), weightKg: null, bodyFatPct: null, bmi: null, remarks: "Scale unavailable" }),
      member: shalini,
      recordedByUser: null,
    },
  ],
} satisfies DashboardData;

/** A branch that has just opened: nothing recorded yet. */
export const emptyDashboardData = {
  totalMembers: 0,
  activePackages: 0,
  expiringSoon: 0,
  checkinsThisMonth: 0,
  newMembersThisMonth: 0,
  followUpsDue: [],
  expiringPackages: [],
  recentCheckins: [],
} satisfies DashboardData;

// ---------------------------------------------------------------------------
// Enquiries: getInquiryDashboard()
// ---------------------------------------------------------------------------

let inquirySeq = 0;

function makeInquiry(overrides: Partial<Inquiry> = {}): InquiryRow {
  inquirySeq += 1;
  return {
    id: `4d5e6f70-0000-4000-8000-${String(inquirySeq).padStart(12, "0")}`,
    serialNo: 300 + inquirySeq,
    status: "new",
    source: "walk_in",
    inquiredOn: daysFromToday(-2),
    firstName: "Deepa",
    lastName: "Srinivasan",
    gender: "female",
    dateOfBirth: null,
    age: 34,
    mobile: "97890 31001",
    email: null,
    address: null,
    referredBy: null,
    preferredContactTime: "Evenings",
    referredByMemberId: null,
    assignedTo: frontDeskUser.id,
    goals: ["weight_loss"],
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
    nextFollowUpOn: daysFromToday(0),
    lostReason: null,
    closedAt: null,
    convertedMemberId: null,
    createdBy: frontDeskUser.id,
    createdAt: at(-2, 11),
    updatedAt: at(-2, 11),
    ...overrides,
    interestedPlan: null,
    assignedUser: { name: frontDeskUser.name },
  };
}

const deepa = makeInquiry();
const vikram = makeInquiry({
  firstName: "Vikram",
  lastName: "Sethi",
  gender: "male",
  status: "in_progress",
  source: "phone",
  inquiredOn: daysFromToday(-12),
  nextFollowUpOn: daysFromToday(-3),
  mobile: null,
});
const nisha = { ...makeInquiry({ firstName: "Nisha", lastName: "Paul", source: "referral", inquiredOn: daysFromToday(-1), nextFollowUpOn: null }), interestedPlan: { name: "3 months" } };
const harish = makeInquiry({ firstName: "Harish", lastName: "Gopal", gender: "male", source: "social_media", inquiredOn: daysFromToday(-5), nextFollowUpOn: daysFromToday(4) });

export const inquiryDashboard = {
  open: 12,
  due: 2,
  newThisMonth: 15,
  convertedThisMonth: 4,
  dueList: [vikram, deepa],
  recent: [nisha, deepa, harish, vikram],
} satisfies InquiryDashboard;

export const emptyInquiryDashboard = {
  open: 0,
  due: 0,
  newThisMonth: 0,
  convertedThisMonth: 0,
  dueList: [],
  recent: [],
} satisfies InquiryDashboard;

// ---------------------------------------------------------------------------
// Attendance: countDay(today)
// ---------------------------------------------------------------------------

export const attendanceToday = { visits: 23, members: 21 } satisfies DayCount;
export const noAttendanceToday = { visits: 0, members: 0 } satisfies DayCount;

// ---------------------------------------------------------------------------
// Stock: getStockDashboard()
// ---------------------------------------------------------------------------

export const stockDashboard = {
  products: 18,
  low: 3,
  out: 1,
  stockValue: 186400,
  salesThisMonth: 27,
  revenueThisMonth: 48650,
  salesLast30: 61,
  lowList: [
    { id: "6f708192-0000-4000-8000-000000000001", stockNo: "P-004", name: "Formula 1 Shake, Kulfi", onHand: 0, reorderLevel: 4, state: "out" },
    { id: "6f708192-0000-4000-8000-000000000002", stockNo: "P-009", name: "Afresh, Lemon", onHand: 2, reorderLevel: 5, state: "low" },
    { id: "6f708192-0000-4000-8000-000000000003", stockNo: "P-012", name: "Protein Drink Mix", onHand: 3, reorderLevel: 3, state: "low" },
    { id: "6f708192-0000-4000-8000-000000000004", stockNo: "P-015", name: "Cell-U-Loss", onHand: 3, reorderLevel: 4, state: "low" },
  ],
} satisfies StockDashboard;

export const emptyStockDashboard = {
  products: 0,
  low: 0,
  out: 0,
  stockValue: 0,
  salesThisMonth: 0,
  revenueThisMonth: 0,
  salesLast30: 0,
  lowList: [],
} satisfies StockDashboard;
