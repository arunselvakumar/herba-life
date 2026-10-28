CREATE TYPE "public"."diet" AS ENUM('veg', 'non_veg', 'eggetarian');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_no" serial NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"gender" "gender",
	"date_of_birth" date,
	"age" integer,
	"mobile" text,
	"email" text,
	"address" text,
	"referred_by" text,
	"joined_on" date NOT NULL,
	"height_cm" numeric(6, 2),
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
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_serial_no_unique" UNIQUE("serial_no")
);
--> statement-breakpoint
CREATE TABLE "member_checkin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"recorded_on" date NOT NULL,
	"weight_kg" numeric(6, 2),
	"body_fat_pct" numeric(6, 2),
	"bmi" numeric(6, 2),
	"visceral_fat" numeric(6, 2),
	"bmr" integer,
	"body_age" integer,
	"muscle_mass_pct" numeric(6, 2),
	"waist_cm" numeric(6, 2),
	"remarks" text,
	"recorded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_package" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"plan_id" uuid,
	"name" text NOT NULL,
	"duration_days" integer NOT NULL,
	"extra_days" integer DEFAULT 0 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"price" numeric(10, 2),
	"amount_paid" numeric(10, 2) DEFAULT 0 NOT NULL,
	"status" "package_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"duration_days" integer NOT NULL,
	"price" numeric(10, 2),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_checkin" ADD CONSTRAINT "member_checkin_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_checkin" ADD CONSTRAINT "member_checkin_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_package" ADD CONSTRAINT "member_package_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_package" ADD CONSTRAINT "member_package_plan_id_package_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."package_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_package" ADD CONSTRAINT "member_package_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_plan" ADD CONSTRAINT "package_plan_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_last_name_idx" ON "member" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "member_mobile_idx" ON "member" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "member_checkin_member_idx" ON "member_checkin" USING btree ("member_id","recorded_on");--> statement-breakpoint
CREATE INDEX "member_package_member_idx" ON "member_package" USING btree ("member_id","start_date");--> statement-breakpoint
CREATE INDEX "member_package_end_idx" ON "member_package" USING btree ("status","end_date");--> statement-breakpoint
CREATE INDEX "member_package_plan_idx" ON "member_package" USING btree ("plan_id");