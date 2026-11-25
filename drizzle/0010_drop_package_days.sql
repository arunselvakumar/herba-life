DROP INDEX "member_package_end_idx";--> statement-breakpoint
ALTER TABLE "member_package" DROP COLUMN "duration_days";--> statement-breakpoint
ALTER TABLE "member_package" DROP COLUMN "extra_days";--> statement-breakpoint
ALTER TABLE "member_package" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "member_package" DROP COLUMN "expiry_reminder_sent_at";--> statement-breakpoint
ALTER TABLE "package_plan" DROP COLUMN "duration_days";