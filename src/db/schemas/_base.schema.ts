import { integer, serial, timestamp, uuid } from "drizzle-orm/pg-core"

export function id(name: string = "id") {
  return serial(name).primaryKey()
}

export function uuidColumn(name: string = "uuid") {
  return uuid(name).defaultRandom().notNull().unique()
}

export function idRef(name: string) {
  return integer(name).notNull()
}

export function uuidRef(name: string) {
  return uuid(name).notNull()
}

export function createdAt(name: string = "created_at") {
  return timestamp(name, { withTimezone: true }).defaultNow().notNull()
}

export function updatedAt(name: string = "updated_at") {
  return timestamp(name, { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull()
}

export function expiresAt(name: string = "expires_at") {
  return timestamp(name, { withTimezone: true }).notNull()
}

export function deletedAt(name: string = "deleted_at") {
  return timestamp(name, { withTimezone: true })
}
