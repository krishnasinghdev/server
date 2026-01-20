import { SQL } from "drizzle-orm"
import { AnyPgTable } from "drizzle-orm/pg-core"
export const DEFAULT_LIMIT = 20
export const DEFAULT_OFFSET = 0

export type JoinType = "inner" | "left"

export interface JoinConfig {
  table: any
  on: SQL
  type?: JoinType
}

export interface FindOptions<TTable> {
  select?: (keyof TTable)[]
  where?: SQL | undefined
  limit?: number
  offset?: number
  orderBy?: SQL | SQL[]
  with?: JoinConfig[]
}

export function pickColumns<TTable extends AnyPgTable, TKeys extends readonly (keyof TTable["_"]["columns"])[]>(
  table: TTable,
  keys?: TKeys
) {
  if (!keys || keys.length === 0) {
    return table
  }

  return keys.reduce(
    (acc, key) => {
      acc[key as keyof TTable] = table[key as keyof TTable]
      return acc
    },
    {} as Record<keyof TTable, any>
  )
}
