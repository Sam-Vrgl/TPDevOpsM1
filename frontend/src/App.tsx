import { useEffect, useState, type FormEvent } from "react";
import { createTask, fetchTasks, removeTask, type Task } from "./api.ts";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      setTasks(await fetchTasks());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await createTask(trimmed);
      setTitle("");
      await reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: number) {
    try {
      await removeTask(id);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="container">
      <h1>DevOps Task Tracker</h1>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={title}
          placeholder="New task…"
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">⚠ {error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="empty">No tasks yet — add one above.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              <button
                className="delete"
                aria-label={`Delete ${task.title}`}
                onClick={() => handleDelete(task.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
