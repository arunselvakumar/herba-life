import type { Inquiry } from "@/db/schema";
import { MEASUREMENTS } from "@/lib/members/constants";
import type { Defaults } from "@/lib/members/form-state";

const str = (v: string | number | null) => (v === null ? "" : String(v));

/** The fields an inquiry shares with the member record, flattened for either form. */
function sharedDefaults(row: Inquiry): Defaults {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    gender: str(row.gender),
    dateOfBirth: str(row.dateOfBirth),
    age: str(row.age),
    mobile: str(row.mobile),
    email: str(row.email),
    address: str(row.address),
    referredBy: str(row.referredBy),
    heightCm: str(row.heightCm),
    wakeUpTime: str(row.wakeUpTime),
    teaCoffee: str(row.teaCoffee),
    breakfast: str(row.breakfast),
    lunch: str(row.lunch),
    eveningSnacks: str(row.eveningSnacks),
    dinner: str(row.dinner),
    diet: str(row.diet),
    waterIntake: str(row.waterIntake),
    hasBloodPressure: row.hasBloodPressure,
    hasSugar: row.hasSugar,
    hasCardiac: row.hasCardiac,
    medicines: str(row.medicines),
    "symptoms[]": row.symptoms,
    "painAreas[]": row.painAreas,
    healthNotes: str(row.healthNotes),
  };
}

/** Flatten an inquiry row into the field names used by the inquiry form. */
export function inquiryToDefaults(row: Inquiry): Defaults {
  const defaults: Defaults = {
    ...sharedDefaults(row),
    inquiredOn: row.inquiredOn,
    source: row.source,
    preferredContactTime: str(row.preferredContactTime),
    referredByMemberId: str(row.referredByMemberId),
    assignedTo: str(row.assignedTo),
    "goals[]": row.goals,
    goalNotes: str(row.goalNotes),
    interestedPlanId: str(row.interestedPlanId),
    remarks: str(row.remarks),
    nextFollowUpOn: str(row.nextFollowUpOn),
  };
  for (const m of MEASUREMENTS) defaults[m.key] = str(row[m.key]);
  return defaults;
}

/**
 * Pre-fill the "New member" form from an inquiry: the free-check readings
 * become the baseline measurements, the interested package is pre-selected
 * and the goal notes are folded into the remarks.
 */
export function inquiryToMemberDefaults(row: Inquiry, today: string): Defaults {
  const remarks = [row.goalNotes ? `Goal: ${row.goalNotes}` : null, row.remarks]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
  const defaults: Defaults = {
    ...sharedDefaults(row),
    joinedOn: today,
    remarks,
  };
  for (const m of MEASUREMENTS) defaults[`baseline.${m.key}`] = str(row[m.key]);
  if (row.interestedPlanId) {
    defaults["package.enabled"] = true;
    defaults["package.planId"] = row.interestedPlanId;
  }
  return defaults;
}
