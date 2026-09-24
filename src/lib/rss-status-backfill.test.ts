import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Database from "better-sqlite3";

const sql = readFileSync(new URL("../../prisma/backfill-rss-status.sql", import.meta.url), "utf8");
const externalId = "69abf9d290ff0a05853770e2";
const description = "Resolved - The system remains stable. We will continue monitoring.";

function fixture() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE Alert (
    source TEXT, externalId TEXT, status TEXT, description TEXT,
    timestamp TEXT, resolvedAt TEXT, lastObservedAt TEXT,
    UNIQUE (source, externalId)
  )`);
  return db;
}

test("backfill corrects only the known resolved Docker row and is idempotent", (t) => {
  const db = fixture();
  t.after(() => db.close());
  const insert = db.prepare(`INSERT INTO Alert VALUES (?, ?, 'monitoring', ?,
    '2026-03-07T11:39:53Z', NULL, '2026-07-24T16:30:00Z')`);
  insert.run("dockerhub", externalId, description);
  insert.run("another-provider", externalId, description);
  insert.run("dockerhub", "another-incident", description);
  db.exec(sql);
  assert.deepEqual(db.prepare("SELECT status, resolvedAt, lastObservedAt FROM Alert WHERE source = ? AND externalId = ?").get("dockerhub", externalId), {
    status: "resolved", resolvedAt: "2026-03-07T11:39:53Z", lastObservedAt: "2026-07-24T16:30:00Z",
  });
  assert.deepEqual(db.prepare("SELECT count(*) AS count FROM Alert WHERE status = 'monitoring'").get(), { count: 2 });
  db.exec(sql);
  assert.deepEqual(db.prepare("SELECT changes() AS count").get(), { count: 0 });
});

test("backfill leaves the known ID alone when the resolution evidence is absent", (t) => {
  const db = fixture();
  t.after(() => db.close());
  db.prepare("INSERT INTO Alert (source, externalId, status, description) VALUES (?, ?, ?, ?)")
    .run("dockerhub", externalId, "monitoring", "Monitoring - Waiting for recovery.");
  db.exec(sql);
  assert.deepEqual(db.prepare("SELECT status, resolvedAt FROM Alert").get(), { status: "monitoring", resolvedAt: null });
});
