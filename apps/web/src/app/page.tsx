"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

type AuthResponse = {
  accessToken?: string;
  token?: string;
  user?: { id: string; email: string; firstName?: string };
};

type Project = {
  _id: string;
  name: string;
  description?: string;
  members?: Array<{ userId: string; role: string }>;
};

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string | null;
  dueDate?: string | null;
};

type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Dashboard = {
  projectsCount: number;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  assignedToMeOpen: number;
  completionRate: number;
  statusCounts: Record<string, number>;
};

type Progress = {
  totalTasks: number;
  outstanding: number;
  completed: number;
  completionRate: number;
  statusCounts: Record<string, number>;
};

const TOKEN_KEY = "pulseboard_token";
const USER_KEY = "pulseboard_user";

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("lead@codefyve.dev");
  const [password, setPassword] = useState("Password1!");
  const [firstName, setFirstName] = useState("Isaiah");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [search, setSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_KEY);
    const savedUser = window.localStorage.getItem(USER_KEY);
    if (saved) setToken(saved);
    if (savedUser) setUserId(savedUser);
  }, []);

  const selected = useMemo(
    () => projects.find((p) => p._id === selectedId) ?? null,
    [projects, selectedId],
  );

  async function refreshProjects(activeToken = token, q = search) {
    if (!activeToken) return;
    const page = await apiRequest<Page<Project>>(
      `/projects?limit=50${q ? `&q=${encodeURIComponent(q)}` : ""}`,
      { token: activeToken },
    );
    setProjects(page.items);
    if (!selectedId && page.items[0]) setSelectedId(page.items[0]._id);
  }

  async function refreshTasks(
    projectId: string,
    activeToken = token,
    q = taskSearch,
  ) {
    if (!activeToken) return;
    const page = await apiRequest<Page<Task>>(
      `/projects/${projectId}/tasks?limit=100${q ? `&q=${encodeURIComponent(q)}` : ""}`,
      { token: activeToken },
    );
    setTasks(page.items);
  }

  async function refreshDashboard(activeToken = token) {
    if (!activeToken) return;
    const data = await apiRequest<Dashboard>("/dashboard", {
      token: activeToken,
    });
    setDashboard(data);
  }

  async function refreshProgress(projectId: string, activeToken = token) {
    if (!activeToken) return;
    const data = await apiRequest<Progress>(`/projects/${projectId}/progress`, {
      token: activeToken,
    });
    setProgress(data);
  }

  useEffect(() => {
    if (!token) return;
    Promise.all([refreshProjects(token), refreshDashboard(token)]).catch((e) =>
      setError(String(e.message || e)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !selectedId) return;
    Promise.all([
      refreshTasks(selectedId, token),
      refreshProgress(selectedId, token),
    ]).catch((e) => setError(String(e.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedId]);

  async function onAuth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, firstName, role: "member" };
      const res = await apiRequest<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const next = res.accessToken || res.token;
      if (!next) throw new Error("No token returned");
      window.localStorage.setItem(TOKEN_KEY, next);
      if (res.user?.id) {
        window.localStorage.setItem(USER_KEY, res.user.id);
        setUserId(res.user.id);
      }
      setToken(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function createProject(e: FormEvent) {
    e.preventDefault();
    if (!token || !projectName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await apiRequest<Project>("/projects", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: projectName.trim(),
          description: "Created from PulseBoard web demo",
        }),
      });
      setProjectName("");
      await Promise.all([refreshProjects(token), refreshDashboard(token)]);
      setSelectedId(created._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create project failed");
    } finally {
      setBusy(false);
    }
  }

  async function createTask(e: FormEvent) {
    e.preventDefault();
    if (!token || !selectedId || !taskTitle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/projects/${selectedId}/tasks`, {
        method: "POST",
        token,
        body: JSON.stringify({
          title: taskTitle.trim(),
          priority: "high",
          assigneeId: taskAssignee.trim() || userId || undefined,
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      });
      setTaskTitle("");
      await Promise.all([
        refreshTasks(selectedId, token),
        refreshProgress(selectedId, token),
        refreshDashboard(token),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create task failed");
    } finally {
      setBusy(false);
    }
  }

  async function addMember(e: FormEvent) {
    e.preventDefault();
    if (!token || !selectedId || !memberEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/projects/${selectedId}/members`, {
        method: "POST",
        token,
        body: JSON.stringify({ email: memberEmail.trim(), role: "member" }),
      });
      setMemberEmail("");
      await refreshProjects(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add member failed");
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(task: Task) {
    if (!token || !selectedId) return;
    const order = ["todo", "in_progress", "blocked", "done", "todo"];
    const next = order[order.indexOf(task.status) + 1] || "todo";
    try {
      await apiRequest(`/projects/${selectedId}/tasks/${task._id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: next }),
      });
      await Promise.all([
        refreshTasks(selectedId, token),
        refreshProgress(selectedId, token),
        refreshDashboard(token),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUserId(null);
    setProjects([]);
    setTasks([]);
    setSelectedId(null);
    setDashboard(null);
    setProgress(null);
  }

  if (!token) {
    return (
      <main className="shell">
        <div className="hero">
          <div>
            <div className="brand">PulseBoard</div>
            <h1>Ship work with clear ownership.</h1>
            <p className="muted">
              Project & task platform for the Codefyve engineering assessment.
            </p>
          </div>
        </div>
        <section className="panel" style={{ maxWidth: 460 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={mode === "register" ? "" : "secondary"}
              onClick={() => setMode("register")}
            >
              Register
            </button>
            <button
              type="button"
              className={mode === "login" ? "" : "secondary"}
              onClick={() => setMode("login")}
            >
              Login
            </button>
          </div>
          <form className="stack" onSubmit={onAuth}>
            {mode === "register" && (
              <label>
                First name
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={busy}>
              {busy ? "Working…" : mode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="hero">
        <div>
          <div className="brand">PulseBoard</div>
          <h1>Operations dashboard</h1>
        </div>
        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </div>

      {error && (
        <p className="error" style={{ marginBottom: 12 }}>
          {error}
        </p>
      )}

      {dashboard && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Activity overview</strong>
            <span className="badge done">{dashboard.completionRate}% done</span>
          </div>
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            <div className="card">
              <div className="muted">Projects</div>
              <strong style={{ fontSize: "1.4rem" }}>
                {dashboard.projectsCount}
              </strong>
            </div>
            <div className="card">
              <div className="muted">Open tasks</div>
              <strong style={{ fontSize: "1.4rem" }}>{dashboard.openTasks}</strong>
            </div>
            <div className="card">
              <div className="muted">Assigned to me</div>
              <strong style={{ fontSize: "1.4rem" }}>
                {dashboard.assignedToMeOpen}
              </strong>
            </div>
            <div className="card">
              <div className="muted">By status</div>
              <div className="muted" style={{ marginTop: 6 }}>
                todo {dashboard.statusCounts.todo ?? 0} · in progress{" "}
                {dashboard.statusCounts.in_progress ?? 0} · blocked{" "}
                {dashboard.statusCounts.blocked ?? 0} · done{" "}
                {dashboard.statusCounts.done ?? 0}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-2">
        <section className="panel stack">
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              refreshProjects(token, search).catch((err) =>
                setError(String(err.message || err)),
              );
            }}
          >
            <input
              style={{ flex: 1 }}
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="secondary">
              Search
            </button>
          </form>
          <form className="row" onSubmit={createProject}>
            <input
              style={{ flex: 1 }}
              placeholder="New project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <button type="submit" disabled={busy}>
              Add project
            </button>
          </form>
          <div className="stack">
            {projects.map((p) => (
              <button
                key={p._id}
                type="button"
                className="card"
                style={{
                  textAlign: "left",
                  background:
                    p._id === selectedId ? "rgba(61,156,240,0.12)" : undefined,
                }}
                onClick={() => setSelectedId(p._id)}
              >
                <strong>{p.name}</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  {p.description || "No description"} ·{" "}
                  {p.members?.length ?? 0} members
                </div>
              </button>
            ))}
            {!projects.length && (
              <p className="muted">No projects yet — create one above.</p>
            )}
          </div>
        </section>

        <section className="panel stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{selected?.name || "Select a project"}</strong>
            {progress && (
              <span className="badge">
                {progress.completionRate}% · {progress.outstanding} open
              </span>
            )}
          </div>

          {selected && progress && (
            <div className="muted">
              Completed {progress.completed}/{progress.totalTasks} · todo{" "}
              {progress.statusCounts.todo ?? 0} · in progress{" "}
              {progress.statusCounts.in_progress ?? 0} · blocked{" "}
              {progress.statusCounts.blocked ?? 0}
            </div>
          )}

          {selected && (
            <>
              <form className="row" onSubmit={addMember}>
                <input
                  style={{ flex: 1 }}
                  placeholder="Invite member by email (must be registered)"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
                <button type="submit" className="secondary" disabled={busy}>
                  Invite
                </button>
              </form>
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault();
                  refreshTasks(selectedId!, token, taskSearch).catch((err) =>
                    setError(String(err.message || err)),
                  );
                }}
              >
                <input
                  style={{ flex: 1 }}
                  placeholder="Search tasks…"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                />
                <button type="submit" className="secondary">
                  Search
                </button>
              </form>
              <form className="stack" onSubmit={createTask}>
                <input
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <input
                  placeholder="Assignee user id (defaults to you)"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                />
                <button type="submit" disabled={busy}>
                  Add task (+ assign + due in 7d)
                </button>
              </form>
            </>
          )}

          <div className="stack">
            {tasks.map((t) => (
              <div key={t._id} className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{t.title}</strong>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => cycleStatus(t)}
                  >
                    <span className={`badge ${t.status}`}>{t.status}</span>
                  </button>
                </div>
                <div className="muted" style={{ marginTop: 8 }}>
                  Priority: {t.priority}
                  {t.assigneeId ? ` · assignee ${t.assigneeId.slice(-6)}` : ""}
                  {t.dueDate
                    ? ` · due ${new Date(t.dueDate).toLocaleDateString()}`
                    : ""}
                </div>
              </div>
            ))}
            {selected && !tasks.length && (
              <p className="muted">No tasks yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
