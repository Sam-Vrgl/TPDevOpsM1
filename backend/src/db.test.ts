import { afterAll, expect, test } from "bun:test";
import { rmSync } from "node:fs";

// Use an isolated throwaway DB file for the test run.
process.env.DB_PATH = "./data/test.sqlite";

const { addTask, listTasks, deleteTask, db } = await import("./db.ts");

test("addTask then listTasks returns the new task", () => {
  const before = listTasks().length;
  const task = addTask("write tests");
  expect(task.id).toBeGreaterThan(0);
  expect(task.title).toBe("write tests");
  expect(listTasks().length).toBe(before + 1);
});

test("deleteTask removes the task", () => {
  const task = addTask("temporary");
  expect(deleteTask(task.id)).toBe(true);
  expect(deleteTask(task.id)).toBe(false);
});

afterAll(() => {
  // Close the connection before removing the file (Windows locks open DB files).
  db.close();
  rmSync("./data/test.sqlite", { force: true });
  rmSync("./data/test.sqlite-wal", { force: true });
  rmSync("./data/test.sqlite-shm", { force: true });
});
