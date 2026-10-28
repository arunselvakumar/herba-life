import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { attendance, inquiry, inquiryActivity, member, memberCheckin, memberPackage, packagePlan, user } from "../src/db/schema";
import { addDays, packageEndDate, parseDay, today } from "../src/lib/members/dates";
import { periodFor } from "../src/lib/attendance/time";

/**
 * Sample members for local development only. Never run this against a real
 * branch database: it inserts made-up people. Safe to re-run; it skips when
 * any of the sample members already exist.
 */

type DemoCheckin = { daysAgo: number; weight: number; fat: number; vf: number; bmr: number; ba: number; mm: number; waist: number; remarks?: string };

type DemoMember = {
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  dateOfBirth: string;
  mobile: string;
  email?: string;
  address: string;
  referredBy?: string;
  joinedDaysAgo: number;
  heightCm: number;
  diet: "veg" | "non_veg" | "eggetarian";
  habits: Partial<Record<"wakeUpTime" | "teaCoffee" | "breakfast" | "lunch" | "eveningSnacks" | "dinner" | "waterIntake", string>>;
  health: { bp?: boolean; sugar?: boolean; cardiac?: boolean; medicines?: string; symptoms?: string[]; painAreas?: string[] };
  remarks?: string;
  pkg?: { name: string; days: number; extra?: number; startDaysAgo: number; price: number; paid: number; status?: "active" | "completed" | "cancelled" };
  checkins: DemoCheckin[];
};

const PLANS = [
  { name: "1 month", durationDays: 30, price: 4500, description: "Starter programme", sortOrder: 1 },
  { name: "3 months", durationDays: 90, price: 12000, description: "Most popular", sortOrder: 2 },
  { name: "6 months", durationDays: 180, price: 22000, description: "Best value for bigger goals", sortOrder: 3 },
  { name: "12 months", durationDays: 365, price: 40000, description: "Full year of coaching", sortOrder: 4 },
] as const;

const DEMO: DemoMember[] = [
  {
    firstName: "Priya",
    lastName: "Raghunathan",
    gender: "female",
    dateOfBirth: "1988-04-12",
    mobile: "98400 12345",
    email: "priya.r@example.com",
    address: "14, Kamaraj Street, Anna Nagar, Chennai",
    referredBy: "Lakshmi",
    joinedDaysAgo: 95,
    heightCm: 158,
    diet: "veg",
    habits: { wakeUpTime: "6:00 am", teaCoffee: "2 cups coffee with sugar", breakfast: "Idli, sambar", lunch: "Rice, sambar, poriyal", eveningSnacks: "Biscuits", dinner: "Chapati", waterIntake: "1.5 L" },
    health: { symptoms: ["tiredness", "acidity"], },
    remarks: "Goal: lose 8 kg before her sister's wedding in March.",
    pkg: { name: "3 months", days: 90, extra: 10, startDaysAgo: 95, price: 12000, paid: 12000 },
    checkins: [
      { daysAgo: 95, weight: 74.2, fat: 36.1, vf: 9, bmr: 1380, ba: 46, mm: 24.1, waist: 94, remarks: "Baseline at enrolment" },
      { daysAgo: 64, weight: 72.4, fat: 35.0, vf: 8.5, bmr: 1392, ba: 44, mm: 24.6, waist: 92 },
      { daysAgo: 33, weight: 70.9, fat: 33.8, vf: 8, bmr: 1401, ba: 42, mm: 25.2, waist: 90, remarks: "Added evening shake, less snacking" },
      { daysAgo: 4, weight: 69.5, fat: 32.9, vf: 7.5, bmr: 1410, ba: 41, mm: 25.8, waist: 88, remarks: "Very motivated. Discuss renewal." },
    ],
  },
  {
    firstName: "Karthik",
    lastName: "Subramanian",
    gender: "male",
    dateOfBirth: "1979-11-02",
    mobile: "98410 55667",
    address: "7/2, Bazaar Road, Mylapore, Chennai",
    joinedDaysAgo: 48,
    heightCm: 172,
    diet: "non_veg",
    habits: { wakeUpTime: "7:30 am", teaCoffee: "3 cups tea", breakfast: "Skips mostly", lunch: "Hotel meals", eveningSnacks: "Vada, bajji", dinner: "Rice, chicken", waterIntake: "1 L" },
    health: { bp: true, sugar: true, medicines: "Metformin 500 mg twice daily; Amlodipine 5 mg", symptoms: ["tiredness", "pain", "sleeping_disorder"], painAreas: ["knee", "back"] },
    remarks: "Doctor advised weight loss. Wife is very supportive.",
    pkg: { name: "6 months", days: 180, startDaysAgo: 48, price: 22000, paid: 10000 },
    checkins: [
      { daysAgo: 48, weight: 96.8, fat: 31.4, vf: 16, bmr: 1890, ba: 58, mm: 29.1, waist: 108, remarks: "Baseline at enrolment" },
      { daysAgo: 18, weight: 94.9, fat: 30.6, vf: 15, bmr: 1878, ba: 56, mm: 29.5, waist: 106, remarks: "Replaced breakfast with shake" },
    ],
  },
  {
    firstName: "Meena",
    lastName: "Krishnan",
    gender: "female",
    dateOfBirth: "1995-07-21",
    mobile: "99620 77889",
    email: "meena.k@example.com",
    address: "Velachery, Chennai",
    referredBy: "Priya Raghunathan",
    joinedDaysAgo: 12,
    heightCm: 162,
    diet: "eggetarian",
    habits: { wakeUpTime: "6:45 am", breakfast: "Oats", lunch: "Office canteen", dinner: "Dosa", waterIntake: "2 L" },
    health: { symptoms: ["headache", "constipation"] },
    pkg: { name: "1 month", days: 30, startDaysAgo: 12, price: 4500, paid: 4500 },
    checkins: [{ daysAgo: 12, weight: 61.3, fat: 29.8, vf: 6, bmr: 1290, ba: 30, mm: 27.9, waist: 80, remarks: "Baseline at enrolment" }],
  },
  {
    firstName: "Rajesh",
    lastName: "Iyer",
    gender: "male",
    dateOfBirth: "1990-02-14",
    mobile: "90030 11223",
    address: "Adyar, Chennai",
    joinedDaysAgo: 220,
    heightCm: 178,
    diet: "veg",
    habits: { wakeUpTime: "5:30 am", teaCoffee: "1 cup", breakfast: "Pongal", lunch: "Rice", dinner: "Chapati", waterIntake: "3 L" },
    health: {},
    remarks: "Completed the programme; now on maintenance.",
    pkg: { name: "6 months", days: 180, startDaysAgo: 220, price: 22000, paid: 22000, status: "completed" },
    checkins: [
      { daysAgo: 220, weight: 88.0, fat: 27.0, vf: 12, bmr: 1800, ba: 44, mm: 31.0, waist: 98, remarks: "Baseline at enrolment" },
      { daysAgo: 160, weight: 84.5, fat: 25.1, vf: 11, bmr: 1790, ba: 40, mm: 31.8, waist: 95 },
      { daysAgo: 100, weight: 81.0, fat: 23.0, vf: 10, bmr: 1775, ba: 37, mm: 32.5, waist: 92 },
      { daysAgo: 45, weight: 78.6, fat: 21.4, vf: 9, bmr: 1760, ba: 34, mm: 33.1, waist: 89, remarks: "Target reached" },
    ],
  },
  {
    firstName: "Anitha",
    lastName: "Mohan",
    gender: "female",
    dateOfBirth: "1972-09-30",
    mobile: "94440 99001",
    address: "Tambaram, Chennai",
    joinedDaysAgo: 400,
    heightCm: 155,
    diet: "non_veg",
    habits: { wakeUpTime: "6:00 am", teaCoffee: "2 cups", waterIntake: "1 L" },
    health: { bp: true, cardiac: true, medicines: "Telmisartan 40 mg", symptoms: ["breathing_problem", "giddiness"] },
    pkg: { name: "3 months", days: 90, startDaysAgo: 400, price: 12000, paid: 12000 },
    checkins: [
      { daysAgo: 400, weight: 79.0, fat: 40.2, vf: 12, bmr: 1350, ba: 60, mm: 22.0, waist: 101, remarks: "Baseline at enrolment" },
      { daysAgo: 340, weight: 77.1, fat: 39.0, vf: 11.5, bmr: 1355, ba: 58, mm: 22.4, waist: 99 },
    ],
  },
  {
    firstName: "Suresh",
    lastName: "Babu",
    gender: "male",
    dateOfBirth: "1985-06-05",
    mobile: "98843 33445",
    address: "Porur, Chennai",
    joinedDaysAgo: 3,
    heightCm: 168,
    diet: "non_veg",
    habits: {},
    health: { symptoms: ["gastritis", "indigestion"] },
    checkins: [{ daysAgo: 3, weight: 82.5, fat: 28.9, vf: 13, bmr: 1700, ba: 47, mm: 29.0, waist: 97, remarks: "Baseline at enrolment" }],
  },
];

async function main(): Promise<void> {
  const admin = await db.query.user.findFirst({ where: eq(user.email, "admin@herbalife.local") });
  const createdBy = admin?.id ?? null;
  const now = today();

  const planIds = new Map<string, string>();
  for (const plan of PLANS) {
    const existing = await db.query.packagePlan.findFirst({ where: eq(packagePlan.name, plan.name) });
    if (existing) {
      planIds.set(plan.name, existing.id);
      continue;
    }
    const [created] = await db.insert(packagePlan).values({ ...plan, createdBy }).returning({ id: packagePlan.id });
    if (!created) throw new Error("plan insert failed");
    planIds.set(plan.name, created.id);
    console.log(`✓ created package ${plan.name}`);
  }

  for (const demo of DEMO) {
    const existing = await db.query.member.findFirst({ where: eq(member.mobile, demo.mobile) });
    if (existing) {
      console.log(`• ${demo.firstName} ${demo.lastName} already exists, skipping`);
      continue;
    }

    const [created] = await db
      .insert(member)
      .values({
        firstName: demo.firstName,
        lastName: demo.lastName,
        gender: demo.gender,
        dateOfBirth: demo.dateOfBirth,
        mobile: demo.mobile,
        email: demo.email ?? null,
        address: demo.address,
        referredBy: demo.referredBy ?? null,
        joinedOn: addDays(now, -demo.joinedDaysAgo),
        heightCm: demo.heightCm,
        diet: demo.diet,
        ...demo.habits,
        hasBloodPressure: demo.health.bp ?? false,
        hasSugar: demo.health.sugar ?? false,
        hasCardiac: demo.health.cardiac ?? false,
        medicines: demo.health.medicines ?? null,
        symptoms: demo.health.symptoms ?? [],
        painAreas: demo.health.painAreas ?? [],
        remarks: demo.remarks ?? null,
        createdBy,
      })
      .returning({ id: member.id });
    if (!created) throw new Error("insert failed");

    if (demo.pkg) {
      const startDate = addDays(now, -demo.pkg.startDaysAgo);
      await db.insert(memberPackage).values({
        memberId: created.id,
        planId: planIds.get(demo.pkg.name) ?? null,
        name: demo.pkg.name,
        durationDays: demo.pkg.days,
        extraDays: demo.pkg.extra ?? 0,
        startDate,
        endDate: packageEndDate(startDate, demo.pkg.days, demo.pkg.extra ?? 0),
        price: demo.pkg.price,
        amountPaid: demo.pkg.paid,
        status: demo.pkg.status ?? "active",
        createdBy,
      });
    }

    for (const c of demo.checkins) {
      await db.insert(memberCheckin).values({
        memberId: created.id,
        recordedOn: addDays(now, -c.daysAgo),
        weightKg: c.weight,
        bodyFatPct: c.fat,
        bmi: Math.round((c.weight / (demo.heightCm / 100) ** 2) * 10) / 10,
        visceralFat: c.vf,
        bmr: c.bmr,
        bodyAge: c.ba,
        muscleMassPct: c.mm,
        waistCm: c.waist,
        remarks: c.remarks ?? null,
        recordedBy: createdBy,
      });
    }

    console.log(`✓ created ${demo.firstName} ${demo.lastName}`);
  }

  // Inquiries: prospects at various stages of follow-up. Skipped when any exist.
  // Attendance: a realistic 60 days of self check-ins for the demo members.
  // Deterministic (seeded PRNG) so re-runs on a fresh database look the same;
  // skipped entirely once any attendance exists.
  const [existingAttendance] = await db.select({ id: attendance.id }).from(attendance).limit(1);
  if (existingAttendance) {
    console.log("• attendance already seeded, skipping");
  } else {
    let seed = 20261028;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const demoMembers = await db.select({ id: member.id, mobile: member.mobile }).from(member);
    const byMobile = new Map(demoMembers.map((m) => [m.mobile, m.id]));
    // Per member: how often they come (0–1), and whether they tend to come twice a day.
    const habits: { mobile: string; regularity: number; twice: number; morningHour: number; eveningHour: number }[] = [
      { mobile: "98400 12345", regularity: 0.85, twice: 0.5, morningHour: 7, eveningHour: 18 },
      { mobile: "98410 55667", regularity: 0.6, twice: 0.15, morningHour: 8, eveningHour: 19 },
    ];
    for (const demo of DEMO) {
      if (!habits.some((h) => h.mobile === demo.mobile)) {
        habits.push({ mobile: demo.mobile, regularity: 0.3 + random() * 0.5, twice: random() * 0.3, morningHour: 7 + Math.floor(random() * 3), eveningHour: 17 + Math.floor(random() * 3) });
      }
    }
    const rows: (typeof attendance.$inferInsert)[] = [];
    for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
      const day = addDays(now, -daysAgo);
      const weekday = parseDay(day).getDay();
      if (weekday === 0) continue; // closed on Sundays
      for (const habit of habits) {
        const memberId = byMobile.get(habit.mobile);
        if (!memberId) continue;
        const chance = weekday === 6 ? habit.regularity * 0.6 : habit.regularity;
        if (random() > chance) continue;
        const visits = random() < habit.twice ? [habit.morningHour, habit.eveningHour] : [random() < 0.7 ? habit.morningHour : habit.eveningHour];
        for (const hour of visits) {
          const at = parseDay(day);
          at.setHours(hour, Math.floor(random() * 60), 0, 0);
          if (at.getTime() > Date.now()) continue;
          rows.push({ memberId, checkedInAt: at, day, period: periodFor(at), source: "kiosk", recordedBy: createdBy });
        }
      }
    }
    if (rows.length) await db.insert(attendance).values(rows);
    console.log(`✓ created ${rows.length} attendance check-ins`);
  }

  const [existingInquiry] = await db.select({ id: inquiry.id }).from(inquiry).limit(1);
  if (existingInquiry) {
    console.log("• inquiries already seeded, skipping");
    return;
  }
  const priya = await db.query.member.findFirst({ where: eq(member.mobile, "98400 12345"), columns: { id: true } });
  const DEMO_INQUIRIES = [
    {
      firstName: "Divya",
      lastName: "Shankar",
      gender: "female" as const,
      age: 34,
      mobile: "97890 11223",
      source: "referral" as const,
      referredBy: "Priya Raghunathan",
      referredByMemberId: priya?.id ?? null,
      inquiredDaysAgo: 6,
      goals: ["weight_loss", "energy"],
      goalNotes: "Wants to lose 6 kg before a cousin's wedding in January.",
      plan: "3 months",
      heightCm: 160,
      weightKg: 71.4,
      bodyFatPct: 34.2,
      waistCm: 91,
      status: "in_progress" as const,
      nextFollowUpDaysFromNow: -1,
      activities: [
        { daysAgo: 6, type: "visit" as const, notes: "Walked in with Priya. Free check done; very keen but wants to discuss with husband." },
        { daysAgo: 3, type: "call" as const, notes: "Husband is okay with it. Will come on Saturday with the advance." },
      ],
    },
    {
      firstName: "Mohan",
      lastName: "Kumar",
      gender: "male" as const,
      age: 45,
      mobile: "90800 44556",
      source: "walk_in" as const,
      inquiredDaysAgo: 1,
      goals: ["weight_loss"],
      goalNotes: "Doctor told him to reduce weight; sugar is borderline.",
      hasSugar: true,
      heightCm: 170,
      weightKg: 92.3,
      bodyFatPct: 30.1,
      waistCm: 104,
      status: "new" as const,
      nextFollowUpDaysFromNow: null,
      activities: [],
    },
    {
      firstName: "Sneha",
      lastName: "Varma",
      gender: "female" as const,
      age: 27,
      mobile: "99400 77665",
      email: "sneha.v@example.com",
      source: "social_media" as const,
      inquiredDaysAgo: 2,
      goals: ["general_wellness", "skin_hair"],
      preferredContactTime: "After 7 pm",
      status: "in_progress" as const,
      nextFollowUpDaysFromNow: 2,
      activities: [{ daysAgo: 2, type: "whatsapp" as const, notes: "Asked about the 1-month plan price. Sent the brochure." }],
    },
    {
      firstName: "Venkat",
      lastName: "Raman",
      gender: "male" as const,
      age: 52,
      mobile: "98400 99887",
      source: "phone" as const,
      inquiredDaysAgo: 20,
      goals: ["weight_loss"],
      status: "lost" as const,
      lostReason: "Joined a gym near his office instead.",
      nextFollowUpDaysFromNow: null,
      activities: [
        { daysAgo: 20, type: "call" as const, notes: "Called about prices. Will think." },
        { daysAgo: 12, type: "call" as const, notes: "Not interested any more." },
      ],
    },
  ];
  for (const demo of DEMO_INQUIRIES) {
    const planId = "plan" in demo && demo.plan ? (planIds.get(demo.plan) ?? null) : null;
    const [created] = await db
      .insert(inquiry)
      .values({
        firstName: demo.firstName,
        lastName: demo.lastName,
        gender: demo.gender,
        age: demo.age,
        mobile: demo.mobile,
        email: "email" in demo ? demo.email : null,
        source: demo.source,
        referredBy: "referredBy" in demo ? demo.referredBy : null,
        referredByMemberId: "referredByMemberId" in demo ? demo.referredByMemberId : null,
        inquiredOn: addDays(now, -demo.inquiredDaysAgo),
        goals: demo.goals,
        goalNotes: "goalNotes" in demo ? demo.goalNotes : null,
        preferredContactTime: "preferredContactTime" in demo ? demo.preferredContactTime : null,
        interestedPlanId: planId,
        heightCm: "heightCm" in demo ? demo.heightCm : null,
        weightKg: "weightKg" in demo ? demo.weightKg : null,
        bodyFatPct: "bodyFatPct" in demo ? demo.bodyFatPct : null,
        waistCm: "waistCm" in demo ? demo.waistCm : null,
        hasSugar: "hasSugar" in demo ? demo.hasSugar : false,
        status: demo.status,
        lostReason: "lostReason" in demo ? demo.lostReason : null,
        closedAt: demo.status === "lost" ? new Date() : null,
        nextFollowUpOn: demo.nextFollowUpDaysFromNow === null ? null : addDays(now, demo.nextFollowUpDaysFromNow),
        assignedTo: createdBy,
        createdBy,
      })
      .returning({ id: inquiry.id });
    if (!created) throw new Error("inquiry insert failed");
    for (const a of demo.activities) {
      await db.insert(inquiryActivity).values({
        inquiryId: created.id,
        type: a.type,
        occurredOn: addDays(now, -a.daysAgo),
        notes: a.notes,
        recordedBy: createdBy,
      });
    }
    console.log(`✓ created inquiry ${demo.firstName} ${demo.lastName}`);
  }
}

main()
  .then(() => {
    console.log("Demo data ready.");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
