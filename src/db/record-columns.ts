import { boolean, date, integer, numeric, pgEnum, text } from "drizzle-orm/pg-core";

/**
 * Column groups shared by the member record and the inquiry record.
 *
 * An inquiry captures the same personal details, eating habits, health
 * condition and body-composition readings as the paper "Wellness Record", so
 * both tables are built from these factories. Keeping the column names
 * identical is what makes converting an inquiry into a member a straight
 * copy. Each factory returns fresh column builders; Drizzle must not share
 * builder instances between tables.
 */

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const dietEnum = pgEnum("diet", ["veg", "non_veg", "eggetarian"]);

export const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });
export const measure = (name: string) => numeric(name, { precision: 6, scale: 2, mode: "number" });

/** Who the person is and how to reach them. */
export const personColumns = () => ({
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  /** Only used when the date of birth is unknown; otherwise derived. */
  age: integer("age"),
  mobile: text("mobile"),
  email: text("email"),
  address: text("address"),
  referredBy: text("referred_by"),
});

/** A typical day's food, as the person describes it. */
export const habitColumns = () => ({
  wakeUpTime: text("wake_up_time"),
  teaCoffee: text("tea_coffee"),
  breakfast: text("breakfast"),
  lunch: text("lunch"),
  eveningSnacks: text("evening_snacks"),
  dinner: text("dinner"),
  diet: dietEnum("diet"),
  waterIntake: text("water_intake"),
});

/** Existing conditions, medication and complaints from the intake sheet. */
export const healthColumns = () => ({
  hasBloodPressure: boolean("has_blood_pressure").notNull().default(false),
  hasSugar: boolean("has_sugar").notNull().default(false),
  hasCardiac: boolean("has_cardiac").notNull().default(false),
  medicines: text("medicines"),
  /** Keys from SYMPTOMS in src/lib/members/constants.ts */
  symptoms: text("symptoms").array().notNull().default([]),
  /** Keys from PAIN_AREAS in src/lib/members/constants.ts */
  painAreas: text("pain_areas").array().notNull().default([]),
  healthNotes: text("health_notes"),
});

/** Readings from the body-composition scale, stored as entered. */
export const measurementColumns = () => ({
  weightKg: measure("weight_kg"),
  bodyFatPct: measure("body_fat_pct"),
  bmi: measure("bmi"),
  visceralFat: measure("visceral_fat"),
  bmr: integer("bmr"),
  bodyAge: integer("body_age"),
  muscleMassPct: measure("muscle_mass_pct"),
  waistCm: measure("waist_cm"),
});
