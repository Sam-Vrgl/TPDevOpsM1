import { addTask, deleteTask, listTasks } from "./db.ts";

const PORT = Number(process.env.PORT ?? 3000);
const startedAt = Date.now();
let requestCount = 0;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    requestCount++;
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method;

    // CORS pre-flight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Liveness probe used by Docker healthcheck + Prometheus blackbox-style scrape.
    if (pathname === "/health") {
      return json({ status: "ok" });
    }

    // Minimal Prometheus text exposition format.
    if (pathname === "/metrics" && method === "GET") {
      const uptimeSeconds = (Date.now() - startedAt) / 1000;
      const taskCount = listTasks().length;
      const body =
        "# HELP app_uptime_seconds Process uptime in seconds.\n" +
        "# TYPE app_uptime_seconds gauge\n" +
        `app_uptime_seconds ${uptimeSeconds}\n` +
        "# HELP app_http_requests_total Total HTTP requests handled.\n" +
        "# TYPE app_http_requests_total counter\n" +
        `app_http_requests_total ${requestCount}\n` +
        "# HELP app_tasks_total Current number of tasks stored.\n" +
        "# TYPE app_tasks_total gauge\n" +
        `app_tasks_total ${taskCount}\n`;
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/plain; version=0.0.4" },
      });
    }

    // ---- Task CRUD ----
    if (pathname === "/api/tasks" && method === "GET") {
      return json(listTasks());
    }

    if (pathname === "/api/tasks" && method === "POST") {
      let payload: { title?: unknown };
      try {
        payload = await req.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }
      const title = typeof payload.title === "string" ? payload.title.trim() : "";
      if (!title) {
        return json({ error: "Field 'title' is required" }, 400);
      }
      return json(addTask(title), 201);
    }

    const deleteMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (deleteMatch && method === "DELETE") {
      const id = Number(deleteMatch[1]);
      return deleteTask(id)
        ? json({ deleted: id })
        : json({ error: "Task not found" }, 404);
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Backend listening on http://localhost:${server.port}`);
