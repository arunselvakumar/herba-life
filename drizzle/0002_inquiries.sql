CREATE TYPE "public"."inquiry_activity_type" AS ENUM('call', 'whatsapp', 'visit', 'note', 'status');--> statement-breakpoint
CREATE TYPE "public"."inquiry_source" AS ENUM('walk_in', 'phone', 'whatsapp', 'referral', 'social_media', 'event', 'other');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'in_progress', 'converted', 'lost');--> statement-breakpoint
CREATE TABLE "inquiry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_no" serial NOT NULL,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"source" "inquiry_source" DEFAULT 'walk_in' NOT NULL,
	"inquired_on" date NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"gender" "gender",
	"date_of_birth" date,
	"age" integer,
	"mobile" text,
	"email" text,
	"address" text,
	"referred_by" text,
	"preferred_contact_time" text,
	"referred_by_member_id" uuid,
	"assigned_to" text,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"goal_notes" text,
	"interested_plan_id" uuid,
	"height_cm" numeric(6, 2),
	"weight_kg" numeric(6, 2),
	"body_fat_pct" numeric(6, 2),
	"bmi" numeric(6, 2),
	"visceral_fat" numeric(6, 2),
	"bmr" integer,
	"body_age" integer,
	"muscle_mass_pct" numeric(6, 2),
	"waist_cm" numeric(6, 2),
	"wake_up_time" text,
	"tea_coffee" text,
	"breakfast" text,
	"lunch" text,
	"evening_snacks" text,
	"dinner" text,
	"diet" "diet",
	"water_intake" text,
	"has_blood_pressure" boolean DEFAULT false NOT NULL,
	"has_sugar" boolean DEFAULT false NOT NULL,
	"has_cardiac" boolean DEFAULT false NOT NULL,
	"medicines" text,
	"symptoms" text[] DEFAULT '{}' NOT NULL,
	"pain_areas" text[] DEFAULT '{}' NOT NULL,
	"health_notes" text,
	"remarks" text,
	"next_follow_up_on" date,
	"lost_reason" text,
	"closed_at" timestamp,
	"converted_member_id" uuid,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inquiry_serial_no_unique" UNIQUE("serial_no")
);
--> statement-breakpoint
CREATE TABLE "inquiry_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"type" "inquiry_activity_type" NOT NULL,
	"occurred_on" date NOT NULL,
	"notes" text,
	"recorded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_referred_by_member_id_member_id_fk" FOREIGN KEY ("referred_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_interested_plan_id_package_plan_id_fk" FOREIGN KEY ("interested_plan_id") REFERENCES "public"."package_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_converted_member_id_member_id_fk" FOREIGN KEY ("converted_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_activity" ADD CONSTRAINT "inquiry_activity_inquiry_id_inquiry_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_activity" ADD CONSTRAINT "inquiry_activity_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiry_status_follow_up_idx" ON "inquiry" USING btree ("status","next_follow_up_on");--> statement-breakpoint
CREATE INDEX "inquiry_name_idx" ON "inquiry" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "inquiry_mobile_idx" ON "inquiry" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "inquiry_converted_member_idx" ON "inquiry" USING btree ("converted_member_id");--> statement-breakpoint
CREATE INDEX "inquiry_activity_inquiry_idx" ON "inquiry_activity" USING btree ("inquiry_id","occurred_on");