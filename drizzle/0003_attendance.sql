CREATE TYPE "public"."attendance_period" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TYPE "public"."attendance_source" AS ENUM('kiosk', 'manual');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"day" date NOT NULL,
	"period" "attendance_period" NOT NULL,
	"source" "attendance_source" DEFAULT 'kiosk' NOT NULL,
	"note" text,
	"recorded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_day_idx" ON "attendance" USING btree ("day","checked_in_at");--> statement-breakpoint
CREATE INDEX "attendance_member_idx" ON "attendance" USING btree ("member_id","checked_in_at");