import { useEffect, useRef, useState } from "react";
import {
  COLLECTIONS,
  type Collection,
  type DemoRecord,
  type DemoWorkspace,
} from "../../shared/admin-demo";
import {
  canAccess,
  type AdminBootstrap,
  type AdminIdentity,
  type LeadNotifications,
} from "../../shared/admin-access";
import type { LeadMailHistory } from "../../shared/types";

const emptyWorkspace = (): DemoWorkspace => ({
  version: 1,
  data: Object.fromEntries(
    COLLECTIONS.map((key) => [key, []]),
  ) as unknown as DemoWorkspace["data"],
  publications: [],
  publishedData: null,
  changedAt: null,
  attempts: [],
});
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<DemoWorkspace>(emptyWorkspace);
  const [user, setUser] = useState<AdminIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("http://127.0.0.1:5175");
  const [storageError, setStorageError] = useState("");
  const [demoLogin, setDemoLogin] = useState(false);
  const [leadNotifications, setLeadNotifications] = useState<LeadNotifications | null>(null);
  const [notificationError, setNotificationError] = useState("");
  const [incomingLead, setIncomingLead] = useState<LeadNotifications["latest"][number] | null>(null);
  const revision = useRef(0);
  const pending = useRef(false);
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`/api/admin${path}`, {
        method,
        signal: AbortSignal.timeout(25000),
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      throw new Error(
        error instanceof Error && error.name === "TimeoutError"
          ? "Máy chủ phản hồi chậm. Vui lòng thử lại."
          : "Không kết nối được máy chủ. Vui lòng thử lại.",
      );
    }
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401) {
        setUser(null);
        setWorkspace(emptyWorkspace());
      }
      throw new Error(
        result?.error ?? "Không kết nối được máy chủ. Vui lòng thử lại.",
      );
    }
    if (result === null)
      throw new Error("Máy chủ chưa trả về dữ liệu. Vui lòng thử lại.");
    return result as T;
  }
  function accept(result: AdminBootstrap) {
    setWorkspace(result.workspace);
    setUser(result.user);
    revision.current = result.revision;
    setStorageError("");
    setWebsiteUrl(result.websiteUrl || "http://127.0.0.1:5175");
  }
  async function refresh() {
    if (pending.current) throw new Error("Đang lưu dữ liệu. Vui lòng chờ.");
    pending.current = true;
    setBusy(true);
    try {
      accept(await request<AdminBootstrap>("/bootstrap"));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    request<{ demoLogin: boolean }>("/login-info")
      .then((result) => { if (!cancelled) setDemoLogin(result.demoLogin); })
      .catch(() => {});
    request<AdminBootstrap>("/bootstrap")
      .then((result) => {
        if (!cancelled) accept(result);
      })
      .catch((error) => {
        if (!cancelled && error.message !== "Vui lòng đăng nhập.")
          setStorageError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    setLeadNotifications(null);
    setIncomingLead(null);
    setNotificationError("");
    if (!user || user.role === "editor") return;
    let cancelled = false, polling = false;
    let latestSeen: Set<string> | null = null;
    let newestCreatedAt = "";
    async function poll() {
      if (cancelled || polling || document.visibilityState === "hidden") return;
      polling = true;
      try {
        const result = await request<LeadNotifications>("/notifications");
        if (cancelled) return;
        const arrival = latestSeen && result.latest.find(
          (lead) => !latestSeen!.has(lead.id) && lead.createdAt >= newestCreatedAt,
        );
        latestSeen ??= new Set();
        for (const lead of result.latest) {
          latestSeen.add(lead.id);
          if (lead.createdAt > newestCreatedAt) newestCreatedAt = lead.createdAt;
        }
        setLeadNotifications(result);
        setNotificationError("");
        if (arrival) setIncomingLead(arrival);
      } catch {
        if (!cancelled) setNotificationError("Chưa cập nhật được thông báo. Hệ thống sẽ thử lại.");
      } finally {
        polling = false;
      }
    }
    void poll();
    const interval = window.setInterval(poll, 10000);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [user?.id, user?.role]);
  async function mutate(path: string, method: string, values: object) {
    if (pending.current)
      throw new Error("Đang lưu thao tác trước. Vui lòng chờ.");
    pending.current = true;
    setBusy(true);
    try {
      accept(
        await request<AdminBootstrap>(path, method, {
          ...values,
          revision: revision.current,
        }),
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function login(email: string, password: string) {
    accept(
      await request<AdminBootstrap>("/login", "POST", { email, password }),
    );
  }
  async function logout() {
    await request("/logout", "POST", {});
    setUser(null);
    setWorkspace(emptyWorkspace());
  }
  return {
    workspace,
    websiteUrl,
    user,
    loading,
    busy,
    storageError,
    demoLogin,
    leadNotifications,
    notificationError,
    incomingLead,
    source: "api" as const,
    allowed: (page: string) => Boolean(user && canAccess(user.role, page)),
    login,
    logout,
    refresh,
    getLeadEmails: (id: string) =>
      request<LeadMailHistory>(`/leads/${encodeURIComponent(id)}/emails`),
    retryLeadEmail: (id: string, emailId: string) =>
      request<LeadMailHistory>(
        `/leads/${encodeURIComponent(id)}/emails/${encodeURIComponent(emailId)}/retry`,
        "POST",
        {},
      ),
    save: (collection: Collection, row: DemoRecord) =>
      mutate(`/records/${collection}/${encodeURIComponent(row.id)}`, "PUT", {
        row,
      }),
    remove: (collection: Collection, id: string) =>
      mutate(`/records/${collection}/${encodeURIComponent(id)}`, "DELETE", {}),
    reorder: (
      collection: Collection,
      id: string,
      direction: -1 | 1,
      _key: string,
      filter?: string,
    ) => mutate(`/reorder/${collection}`, "POST", { id, direction, filter }),
    publish: (label: string) => mutate("/publish", "POST", { label }),
    async addAttempt(answers: number[]) {
      const result = await request<{ score: number; total: number }>(
        "/quiz-preview",
        "POST",
        { answers },
      );
      await refresh();
      return result;
    },
  };
}
export type WorkspaceStore = ReturnType<typeof useWorkspace>;
