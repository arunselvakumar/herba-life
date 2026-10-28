import type { Member } from "@/db/schema";
import type { Defaults } from "./form-state";

/** Flatten a member row into the field names used by the member form. */
export function memberToDefaults(member: Member): Defaults {
  const str = (v: string | number | null) => (v === null ? "" : String(v));
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    gender: str(member.gender),
    dateOfBirth: str(member.dateOfBirth),
    age: str(member.age),
    mobile: str(member.mobile),
    email: str(member.email),
    address: str(member.address),
    referredBy: str(member.referredBy),
    joinedOn: member.joinedOn,
    heightCm: str(member.heightCm),
    wakeUpTime: str(member.wakeUpTime),
    teaCoffee: str(member.teaCoffee),
    breakfast: str(member.breakfast),
    lunch: str(member.lunch),
    eveningSnacks: str(member.eveningSnacks),
    dinner: str(member.dinner),
    diet: str(member.diet),
    waterIntake: str(member.waterIntake),
    hasBloodPressure: member.hasBloodPressure,
    hasSugar: member.hasSugar,
    hasCardiac: member.hasCardiac,
    medicines: str(member.medicines),
    "symptoms[]": member.symptoms,
    "painAreas[]": member.painAreas,
    healthNotes: str(member.healthNotes),
    remarks: str(member.remarks),
  };
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
