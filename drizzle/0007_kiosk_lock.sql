CREATE TABLE "kiosk_lock" (
	"session_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"last_failed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "kiosk_lock" ADD CONSTRAINT "kiosk_lock_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_lock" ADD CONSTRAINT "kiosk_lock_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;