-- Packages are counted in visits, not calendar days. This migration adds the
-- visit columns and carries the existing data over; 0010 drops the day columns.

-- A plan's days become its visits, one for one ("30 days" is 30 visits).
ALTER TABLE "package_plan" ADD COLUMN "visits" integer;--> statement-breakpoint
UPDATE "package_plan" SET "visits" = "duration_days";--> statement-breakpoint
ALTER TABLE "package_plan" ALTER COLUMN "visits" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "member_package" ADD COLUMN "visits" integer;--> statement-breakpoint
ALTER TABLE "member_package" ADD COLUMN "extra_visits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "member_package" ADD COLUMN "visits_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "member_package" ADD COLUMN "low_visits_reminder_sent_at" timestamp;--> statement-breakpoint
UPDATE "member_package" SET "visits" = "duration_days", "extra_visits" = "extra_days";--> statement-breakpoint
ALTER TABLE "member_package" ALTER COLUMN "visits" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "attendance" ADD COLUMN "member_package_id" uuid;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_package_id_member_package_id_fk" FOREIGN KEY ("member_package_id") REFERENCES "public"."member_package"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- One visit a day: where a member has several check-ins on a day, the earliest is kept.
DELETE FROM "attendance" a USING "attendance" b
WHERE a."member_id" = b."member_id" AND a."day" = b."day"
  AND (a."checked_in_at" > b."checked_in_at" OR (a."checked_in_at" = b."checked_in_at" AND a."id" > b."id"));--> statement-breakpoint

-- Each remaining visit is taken from the package whose dates covered that day.
UPDATE "attendance" a SET "member_package_id" = (
  SELECT mp."id" FROM "member_package" mp
  WHERE mp."member_id" = a."member_id" AND mp."start_date" <= a."day" AND mp."end_date" >= a."day"
  ORDER BY (mp."status" = 'active') DESC, mp."end_date" DESC, mp."created_at" DESC
  LIMIT 1
);--> statement-breakpoint
UPDATE "member_package" mp SET "visits_used" = (SELECT count(*) FROM "attendance" a WHERE a."member_package_id" = mp."id");--> statement-breakpoint

-- A package whose last day had already passed was over under the old rules.
-- It is closed rather than brought back with its unused visits; staff can
-- reopen one from the member's page.
UPDATE "member_package" SET "status" = 'completed'
WHERE "status" = 'active' AND "end_date" < (now() AT TIME ZONE 'Asia/Kolkata')::date;--> statement-breakpoint

CREATE INDEX "member_package_status_idx" ON "member_package" USING btree ("status","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_member_day_uq" ON "attendance" USING btree ("member_id","day");--> statement-breakpoint
CREATE INDEX "attendance_package_idx" ON "attendance" USING btree ("member_package_id");
