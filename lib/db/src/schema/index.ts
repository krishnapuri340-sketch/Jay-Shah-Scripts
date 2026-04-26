import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const predictions = pgTable("predictions", {
  matchId:   text("match_id").notNull(),
  userId:    text("user_id").notNull(),
  pick:      text("pick"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.matchId, t.userId] }) }));

export const userPins = pgTable("user_pins", {
  userId:    text("user_id").primaryKey(),
  pinHash:   text("pin_hash").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPredictionSchema = createInsertSchema(predictions);
export type Prediction = typeof predictions.$inferSelect;
export type UserPin    = typeof userPins.$inferSelect;
