CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "quotes" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"form_id" uuid NOT NULL,
"material_id" uuid NOT NULL,
"supplier_id" uuid NOT NULL,
"status" "quote_status" DEFAULT 'draft' NOT NULL,
"material_cost" numeric(12, 2),
"quote_number" varchar(50),
"created_at" timestamp DEFAULT now() NOT NULL,
"updated_at" timestamp DEFAULT now() NOT NULL,
CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number")
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;