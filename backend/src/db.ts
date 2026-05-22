import { Database } from "bun:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

export interface Task {
  id: number;
  title: string;
  created_at: string;
}

const DB_PATH = process.env.DB_PATH ?? "./data/tasks.sqlite";

// Ensure the directory for the SQLite file exists (e.g. ./data in the container).
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH, { create: true });

// WAL improves concurrent read/write performance for a small API like this.
db.exec("PRAGMA journal_mode = WAL;");

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function listTasks(): Task[] {
  return db.query("SELECT id, title, created_at FROM tasks ORDER BY id DESC;").all() as Task[];
}

export function addTask(title: string): Task {
  const row = db
    .query("INSERT INTO tasks (title) VALUES (?) RETURNING id, title, created_at;")
    .get(title) as Task;
  return row;
}

export function deleteTask(id: number): boolean {
  const result = db.run("DELETE FROM tasks WHERE id = ?;", [id]);
  return result.changes > 0;
}
