export interface Task {
  id: number;
  title: string;
  created_at: string;
}

const BASE = "/api/tasks";

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
  return res.json();
}

export async function createTask(title: string): Promise<Task> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to add task (${res.status})`);
  return res.json();
}

export async function removeTask(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete task (${res.status})`);
}
