CREATE TYPE "public"."admin_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('login', 'logout', 'password_change', 'profile_update');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "admin" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "admin" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "username" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "password_hash" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "status" "admin_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "password_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "admin" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_admin_id_admin_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "admin" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_email_unique" UNIQUE("email");