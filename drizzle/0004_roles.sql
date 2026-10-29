CREATE TABLE "role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "role" ("name", "description", "permissions", "is_system") VALUES
	('Administrator', 'Full access to every module, including users and roles. Built in and cannot be changed.', '{}', true),
	('Staff', 'Day-to-day front-desk work: members, enquiries, follow-ups and attendance.', '{dashboard.view,members.view,members.create,members.update,members.followups,members.packages,inquiries.view,inquiries.create,inquiries.update,inquiries.activities,inquiries.convert,packages.view,attendance.view,attendance.record,attendance.kiosk}', false);--> statement-breakpoint
UPDATE "user" SET "role_id" = (SELECT "id" FROM "role" WHERE "name" = 'Administrator') WHERE "role" = 'admin';--> statement-breakpoint
UPDATE "user" SET "role_id" = (SELECT "id" FROM "role" WHERE "name" = 'Staff') WHERE "role_id" IS NULL;
