// A D1 database for the Worker's tests, as much of it as the Worker uses, on SQLite in memory (node:sqlite).
import { DatabaseSync } from 'node:sqlite';

export function d1() {
  const db = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...values) => statement(sql, values),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
    all: async () => ({
      results: db
        .prepare(sql)
        .all(...args)
        .map((row) => ({ ...row })),
    }),
    first: async (column) => db.prepare(sql).get(...args)?.[column] ?? null,
  });
  return { db, prepare: (sql) => statement(sql), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}
