import { asc, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const TAX_SEASON_STATUSES = [
  "upcoming",
  "active",
  "archived",
] as const;

export type PersistentTaxSeasonStatus =
  (typeof TAX_SEASON_STATUSES)[number];

export const taxSeason = pgTable(
  "tax_season",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    year: integer("year").notNull(),
    name: text("name").notNull(),
    status: varchar("status", {
      length: 16,
      enum: TAX_SEASON_STATUSES,
    }).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("tax_season_code_uq").on(table.code),
    unique("tax_season_year_uq").on(table.year),
    check(
      "tax_season_name_nonempty_chk",
      sql`length(trim(${table.name})) > 0`,
    ),
    check(
      "tax_season_status_chk",
      sql`${table.status} in ('upcoming', 'active', 'archived')`,
    ),
    check(
      "tax_season_archived_not_default_chk",
      sql`not (${table.status} = 'archived' and ${table.isDefault})`,
    ),
    uniqueIndex("tax_season_one_active_idx")
      .on(table.status)
      .where(sql`${table.status} = 'active'`),
    uniqueIndex("tax_season_one_default_idx")
      .on(table.isDefault)
      .where(sql`${table.isDefault} = true`),
    index("tax_season_status_idx").on(table.status),
  ],
);

export const taxSeasonProject = pgTable(
  "tax_season_project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taxSeasonId: uuid("tax_season_id")
      .notNull()
      .references(() => taxSeason.id, { onDelete: "restrict" }),
    asanaProjectGid: varchar("asana_project_gid", {
      length: 64,
    }).notNull(),
    asanaProjectName: text("asana_project_name").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    priority: integer("priority").notNull(),
    validatedAt: timestamp("validated_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    }).defaultNow().notNull(),
  },
  (table) => [
    unique("tax_season_project_asana_gid_uq").on(table.asanaProjectGid),
    unique("tax_season_project_season_priority_uq").on(
      table.taxSeasonId,
      table.priority,
    ),
    check(
      "tax_season_project_name_nonempty_chk",
      sql`length(trim(${table.asanaProjectName})) > 0`,
    ),
    check(
      "tax_season_project_priority_chk",
      sql`${table.priority} >= 0`,
    ),
    index("tax_season_project_season_idx").on(table.taxSeasonId),
    index("tax_season_project_enabled_order_idx").on(
      table.taxSeasonId,
      table.enabled,
      table.priority,
    ),
  ],
);

export const TAX_SEASON_PROJECT_CANONICAL_ORDER = [
  { column: "priority", direction: "asc" },
  { column: "asanaProjectGid", direction: "asc" },
] as const;

export function getTaxSeasonProjectOrderBy() {
  return [
    asc(taxSeasonProject.priority),
    asc(taxSeasonProject.asanaProjectGid),
  ] as const;
}

export type PersistentTaxSeason = typeof taxSeason.$inferSelect;
export type NewPersistentTaxSeason = typeof taxSeason.$inferInsert;
export type PersistentTaxSeasonProject = typeof taxSeasonProject.$inferSelect;
export type NewPersistentTaxSeasonProject =
  typeof taxSeasonProject.$inferInsert;
