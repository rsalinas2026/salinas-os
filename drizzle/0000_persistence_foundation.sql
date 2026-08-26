CREATE TABLE "tax_season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"year" integer NOT NULL,
	"name" text NOT NULL,
	"status" varchar(16) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_season_code_uq" UNIQUE("code"),
	CONSTRAINT "tax_season_year_uq" UNIQUE("year"),
	CONSTRAINT "tax_season_name_nonempty_chk" CHECK (length(trim("tax_season"."name")) > 0),
	CONSTRAINT "tax_season_status_chk" CHECK ("tax_season"."status" in ('upcoming', 'active', 'archived')),
	CONSTRAINT "tax_season_archived_not_default_chk" CHECK (not ("tax_season"."status" = 'archived' and "tax_season"."is_default"))
);
--> statement-breakpoint
CREATE TABLE "tax_season_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_season_id" uuid NOT NULL,
	"asana_project_gid" varchar(64) NOT NULL,
	"asana_project_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer NOT NULL,
	"validated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_season_project_asana_gid_uq" UNIQUE("asana_project_gid"),
	CONSTRAINT "tax_season_project_season_priority_uq" UNIQUE("tax_season_id","priority"),
	CONSTRAINT "tax_season_project_name_nonempty_chk" CHECK (length(trim("tax_season_project"."asana_project_name")) > 0),
	CONSTRAINT "tax_season_project_priority_chk" CHECK ("tax_season_project"."priority" >= 0)
);
--> statement-breakpoint
ALTER TABLE "tax_season_project" ADD CONSTRAINT "tax_season_project_tax_season_id_tax_season_id_fk" FOREIGN KEY ("tax_season_id") REFERENCES "public"."tax_season"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_season_one_active_idx" ON "tax_season" USING btree ("status") WHERE "tax_season"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "tax_season_one_default_idx" ON "tax_season" USING btree ("is_default") WHERE "tax_season"."is_default" = true;--> statement-breakpoint
CREATE INDEX "tax_season_status_idx" ON "tax_season" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tax_season_project_season_idx" ON "tax_season_project" USING btree ("tax_season_id");--> statement-breakpoint
CREATE INDEX "tax_season_project_enabled_order_idx" ON "tax_season_project" USING btree ("tax_season_id","enabled","priority");