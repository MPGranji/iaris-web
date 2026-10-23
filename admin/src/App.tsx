import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowSquareOut,
  BookOpen,
  Bell,
  CalendarDots,
  CaretRight,
  CheckCircle,
  FileText,
  GearSix,
  House,
  Info,
  List,
  MagnifyingGlass,
  Megaphone,
  Monitor,
  Question,
  SignOut,
  SquaresFour,
  Stack,
  Users,
  X,
} from "@phosphor-icons/react";
import { COLLECTIONS } from "../../shared/admin-demo";
import { Badge, EmptyState, Modal, SearchInput } from "./components";
import { AdminContext } from "./context";
import { CollectionPage, WebsitePage } from "./pages/Content";
import { Dashboard, PublishingPage, ResultsPage } from "./pages/Dashboard";
import { LeadsPage } from "./pages/Leads";
import { matchesSearch, pageTitle, schemas, type Page } from "./schema";
import { useWorkspace } from "./store";

const navGroups = [
  {
    label: "Điều hành",
    items: [
      { page: "overview", label: "Tổng quan", icon: SquaresFour },
      { page: "leads", label: "Yêu cầu tư vấn", icon: Users },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { page: "website", label: "Nội dung website", icon: Monitor },
      { page: "laws", label: "Đạo luật", icon: FileText },
      {
        page: "courses",
        label: "Khóa nền tảng",
        icon: BookOpen,
        section: "Academy",
      },
      { page: "tiers", label: "Nhóm ngành", icon: Stack, child: true },
      {
        page: "programs",
        label: "Chương trình ngành",
        icon: Stack,
        child: true,
      },
      { page: "media", label: "IARIS Media", icon: Megaphone },
      { page: "events", label: "Sự kiện & webinar", icon: CalendarDots },
      { page: "lessons", label: "E-learning & quiz", icon: Question },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { page: "members", label: "Tài khoản & phân quyền", icon: Users },
      { page: "publishing", label: "Xuất bản", icon: GearSix },
    ],
  },
] as const;
const pages: Page[] = ["overview", ...COLLECTIONS, "publishing", "results"];
function readRoute() {
  const [page = "overview", query = ""] = window.location.hash
    .replace(/^#\/?/, "")
    .split("?");
  return {
    page: page || "overview",
    id: new URLSearchParams(query).get("id") ?? undefined,
  };
}
const routeHash = (page: string, id?: string) =>
  `#/${page}${id ? `?id=${encodeURIComponent(id)}` : ""}`;

export function App() {
  const store = useWorkspace();
  const [route, setRoute] = useState(readRoute);
  const routeRef = useRef(route);
  const dirty = useRef(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    action: string;
    resolve: (v: boolean) => void;
  } | null>(null);
  const confirm = useCallback(
    (title: string, message: string, action = "Tiếp tục") =>
      new Promise<boolean>((resolve) =>
        setConfirmation({ title, message, action, resolve }),
      ),
    [],
  );
  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  const notify = useCallback((message: string) => setToast(message), []);
  useEffect(() => {
    if (store.incomingLead)
      notify(`Có yêu cầu tư vấn mới từ ${store.incomingLead.fullName}. Mở chuông thông báo để xem.`);
  }, [store.incomingLead, notify]);
  const navigate = useCallback((page: Page, id?: string) => {
    window.location.hash = routeHash(page, id);
  }, []);
  useEffect(() => {
    const change = async () => {
      const next = readRoute();
      if (
        next.page === routeRef.current.page &&
        next.id === routeRef.current.id
      )
        return;
      if (
        dirty.current &&
        !(await confirm(
          "Bạn còn thay đổi chưa lưu",
          "Rời trang sẽ bỏ những thay đổi chưa lưu trên biểu mẫu này.",
          "Bỏ thay đổi",
        ))
      ) {
        history.replaceState(
          null,
          "",
          routeHash(routeRef.current.page, routeRef.current.id),
        );
        return;
      }
      dirty.current = false;
      routeRef.current = next;
      setRoute(next);
      setMobileNav(false);
      window.scrollTo({ top: 0 });
    };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("hashchange", change);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [confirm]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!store.loading)
      document.title = `${pages.includes(route.page as Page) ? pageTitle(route.page as Page) : "Không tìm thấy"} · IARIS Admin`;
  }, [route.page, store.loading]);
  async function exit() {
    if (
      dirty.current &&
      !(await confirm(
        "Đăng xuất?",
        "Biểu mẫu còn thay đổi chưa lưu.",
        "Đăng xuất",
      ))
    )
      return;
    try {
      await store.logout();
      dirty.current = false;
    } catch (error) {
      notify((error as Error).message);
    }
  }
  const page = route.page as Page;
  const newCount = store.leadNotifications?.newCount ?? store.workspace.data.leads.filter(
    (r) => r.status === "NEW",
  ).length;
  async function openLeadNotification(id: string) {
    if (dirty.current && !(await confirm(
      "Bạn còn thay đổi chưa lưu",
      "Mở yêu cầu tư vấn sẽ bỏ những thay đổi chưa lưu trên biểu mẫu này.",
      "Mở yêu cầu",
    ))) return;
    try {
      await store.refresh();
      dirty.current = false;
      setNotificationsOpen(false);
      navigate("leads", id);
    } catch (error) {
      notify((error as Error).message);
    }
  }
  const results = search.trim()
    ? COLLECTIONS.flatMap((collection) =>
        store.workspace.data[collection]
          .filter((r) => matchesSearch(r, search))
          .map((r) => ({
            page: collection,
            id: r.id,
            title: String(
              r.title ?? r.name ?? r.fullName ?? r.label ?? r.scenario ?? r.id,
            ),
          })),
      ).slice(0, 16)
    : [];
  return (
    <AdminContext.Provider
      value={{ ...store, navigate, notify, confirm, setDirty }}
    >
      {!store.user ? (
        <div className="welcome">
          <div className="welcome-brand">
            <img src="/favicon.svg" alt="" />
            <strong>IARIS</strong>
            <span>CYBER & DATA</span>
          </div>
          <section className="welcome-card">
            <Badge value="active">IARIS ADMIN</Badge>
            <h1>Đăng nhập quản trị</h1>
            <p>Quản lý nội dung và yêu cầu tư vấn.</p>
            <form
              className="login-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (loggingIn) return;
                setLoggingIn(true);
                setLoginError("");
                try {
                  await store.login(loginEmail, loginPassword);
                  setLoginPassword("");
                } catch (error) {
                  setLoginError((error as Error).message);
                } finally {
                  setLoggingIn(false);
                }
              }}
            >
              <label className="form-field">
                Email hoặc tên đăng nhập
                <input
                  type="text"
                  autoComplete="username"
                  name="username"
                  autoCapitalize="none"
                  maxLength={200}
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </label>
              <label className="form-field">
                Mật khẩu
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </label>
              {(loginError || store.storageError) && (
                <p className="inline-error" role="alert">
                  {loginError || store.storageError}
                </p>
              )}
              <button
                className="button primary welcome-button"
                disabled={loggingIn || store.loading}
              >
                {loggingIn ? "Đang đăng nhập…" : "Đăng nhập"}
                <ArrowRight size={18} />
              </button>
            </form>
            {store.demoLogin ? (
              <div className="demo-login-hint">
                <strong>Tài khoản dùng thử</strong>
                <p>Tài khoản: <code>admin</code> · Mật khẩu: <code>admin</code></p>
                <small>Dùng để kiểm tra nội dung và form tư vấn của bản demo.</small>
              </div>
            ) : <small>Tài khoản được cấp bởi quản trị viên.</small>}
          </section>
          <p className="welcome-footnote">
            IARIS Admin · Môi trường thử nghiệm
          </p>
        </div>
      ) : (
        <div className="app-layout">
          <a
            className="skip-link"
            href="#main-content"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("main-content")?.focus();
            }}
          >
            Đến nội dung chính
          </a>
          {mobileNav && (
            <button
              className="nav-scrim"
              aria-label="Đóng điều hướng"
              onClick={() => setMobileNav(false)}
            />
          )}
          <aside className={`sidebar ${mobileNav ? "nav-open" : ""}`}>
            <a
              className="brand"
              href="#/overview"
              onClick={(e) => {
                e.preventDefault();
                navigate("overview");
              }}
            >
              <img src="/favicon.svg" alt="" />
              <span>
                <strong>IARIS</strong>
                <small>CYBER & DATA</small>
              </span>
              <Badge>ADMIN</Badge>
            </a>
            <nav className="main-nav" aria-label="Điều hướng quản trị">
              {navGroups.map((group) => (
                <div className="nav-group" key={group.label}>
                  <span className="nav-group-label">{group.label}</span>
                  {group.items
                    .filter((item) => store.allowed(item.page))
                    .map((item) => {
                      const active =
                        page === item.page ||
                        (item.page === "lessons" &&
                          (page === "quiz" || page === "results"));
                      const Icon = item.icon;
                      return (
                        <div key={item.page}>
                          {"section" in item && (
                            <span className="nav-section-label">
                              {item.section}
                            </span>
                          )}
                          <a
                            href={routeHash(item.page)}
                            className={`nav-item ${active ? "active" : ""} ${"child" in item ? "nav-child" : ""}`}
                            aria-current={active ? "page" : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(item.page);
                            }}
                          >
                            <Icon
                              size={19}
                              weight={active ? "fill" : "regular"}
                            />
                            <span>{item.label}</span>
                            {item.page === "leads" && newCount > 0 && (
                              <span className="nav-count">{newCount}</span>
                            )}
                          </a>
                        </div>
                      );
                    })}
                </div>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button className="nav-item" onClick={() => setHelp(true)}>
                <Info size={19} />
                Hướng dẫn sử dụng
                <ArrowSquareOut size={14} />
              </button>
              <button className="nav-item" disabled={store.busy} onClick={exit}>
                <SignOut size={19} />
                Đăng xuất
              </button>
              <div className="sidebar-environment">
                <span />
                Môi trường thử nghiệm
              </div>
            </div>
          </aside>
          <div className="app-body">
            <header className="topbar">
              <div className="breadcrumb">
                <button
                  className="icon-button mobile-menu"
                  aria-label="Mở điều hướng"
                  aria-expanded={mobileNav}
                  onClick={() => setMobileNav((v) => !v)}
                >
                  <List size={23} />
                </button>
                <House size={17} />
                <span>IARIS Admin</span>
                <CaretRight size={13} />
                <strong>
                  {pages.includes(page) ? pageTitle(page) : "Không tìm thấy"}
                </strong>
              </div>
              <div className="topbar-actions">
                {store.allowed("leads") && (
                  <button
                    className="notification-trigger"
                    aria-label={`Thông báo tư vấn: ${newCount} yêu cầu mới`}
                    onClick={() => setNotificationsOpen(true)}
                  >
                    <Bell size={21} />
                    {newCount > 0 && <span className="notification-count">{newCount > 99 ? "99+" : newCount}</span>}
                  </button>
                )}
                <button
                  className="command-trigger"
                  aria-label="Tìm nhanh trong admin"
                  onClick={() => {
                    setSearch("");
                    setSearching(true);
                  }}
                >
                  <MagnifyingGlass size={17} />
                  <span>Tìm nhanh…</span>
                  <kbd>Ctrl K</kbd>
                </button>
                <button
                  className="button compact"
                  disabled={store.busy}
                  onClick={async () => {
                    if (dirty.current) {
                      notify(
                        "Lưu hoặc rời biểu mẫu trước khi tải lại dữ liệu.",
                      );
                      return;
                    }
                    try {
                      await store.refresh();
                      notify("Đã cập nhật.");
                    } catch (error) {
                      notify((error as Error).message);
                    }
                  }}
                >
                  Làm mới
                </button>
                <button
                  className="demo-avatar"
                  onClick={() => setHelp(true)}
                  aria-label="Thông tin tài khoản"
                >
                  {store.user.name
                    .trim()
                    .split(/\s+/)
                    .filter(
                      (_, index, parts) =>
                        index === 0 || index === parts.length - 1,
                    )
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </button>
              </div>
            </header>
            <main id="main-content" tabIndex={-1} className="main-content">
              {store.storageError && (
                <div role="alert" className="inline-error">
                  {store.storageError}
                </div>
              )}
              {store.loading ? (
                <div className="loading-layout" role="status">
                  <span className="sr-only">Đang tải dữ liệu…</span>
                  <div className="skeleton skeleton-heading" />
                  <div className="stats-grid">
                    {[1, 2, 3, 4].map((i) => (
                      <div className="skeleton skeleton-card" key={i} />
                    ))}
                  </div>
                  <div className="skeleton skeleton-table" />
                </div>
              ) : !store.allowed(page) ? (
                <EmptyState
                  title="Không có quyền truy cập"
                  description="Tài khoản này không được mở mục đã chọn."
                />
              ) : page === "overview" ? (
                store.user.role === "advisor" ? (
                  <LeadsPage />
                ) : (
                  <Dashboard />
                )
              ) : page === "website" ? (
                <WebsitePage recordId={route.id} />
              ) : page === "leads" ? (
                <LeadsPage recordId={route.id} />
              ) : page === "publishing" ? (
                <PublishingPage />
              ) : page === "results" ? (
                <ResultsPage />
              ) : page in schemas ? (
                <CollectionPage
                  key={`${page}-${route.id ?? ""}`}
                  collection={page as keyof typeof schemas}
                  recordId={route.id}
                />
              ) : (
                <EmptyState
                  title="Trang này không tồn tại"
                  description="Chọn một mục trong điều hướng để tiếp tục."
                  action={
                    <button
                      className="button"
                      onClick={() => navigate("overview")}
                    >
                      Về tổng quan
                    </button>
                  }
                />
              )}
              <footer className="app-footer">
                <span>IARIS Cyber & Data</span>
                <span>Môi trường thử nghiệm</span>
              </footer>
            </main>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          <span>{toast}</span>
          <button aria-label="Đóng thông báo" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {notificationsOpen && store.user && store.allowed("leads") && (
        <Modal title="Thông báo tư vấn" onClose={() => setNotificationsOpen(false)}>
          <p className="muted">{newCount} yêu cầu mới đang chờ tiếp nhận.</p>
          {store.notificationError && <p role="status" className="inline-error">{store.notificationError}</p>}
          <div className="command-results notification-list">
            {store.leadNotifications?.latest.map((lead) => (
              <button key={lead.id} disabled={store.busy} onClick={() => void openLeadNotification(lead.id)}>
                <span>
                  <strong>{lead.fullName}</strong>
                  <small>{lead.organization}</small>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
            {store.leadNotifications && !store.leadNotifications.latest.length && (
              <EmptyState title="Chưa có yêu cầu mới" description="Gửi form trên website để thử. Thông báo sẽ tự cập nhật tại đây." />
            )}
            {!store.leadNotifications && !store.notificationError && <p role="status">Đang tải thông báo…</p>}
          </div>
        </Modal>
      )}
      {help && (
        <Modal title="Tài khoản & hướng dẫn" onClose={() => setHelp(false)}>
          <div className="help-content">
            <p>
              {store.user?.name} · {store.user?.email}
            </p>
            <p>
              Vai trò:{" "}
              {store.user?.role === "admin"
                ? "Quản trị viên"
                : store.user?.role === "editor"
                  ? "Biên tập viên"
                  : "Tư vấn viên"}
            </p>
            <ul>
              {store.allowed("website") && (
                <li>Lưu bản nháp khi sửa nội dung.</li>
              )}
              {store.allowed("publishing") && (
                <li>Xuất bản để cập nhật website.</li>
              )}
              {store.allowed("leads") && (
                <li>Mở Yêu cầu tư vấn để xử lý và ghi chú liên hệ.</li>
              )}
            </ul>
            <a
              className="button"
              href={store.websiteUrl}
              target="_blank"
              rel="noreferrer"
            >
              Xem website
              <ArrowSquareOut size={16} />
            </a>
          </div>
        </Modal>
      )}
      {searching && (
        <Modal
          title="Tìm nhanh trong admin"
          onClose={() => setSearching(false)}
          className="search-modal"
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            label="Tìm nội dung toàn bộ admin"
            placeholder="Tên khóa học, sự kiện, khách hàng…"
          />
          <div className="command-results">
            {search.trim() ? (
              results.length ? (
                results.map((result) => (
                  <button
                    key={`${result.page}-${result.id}`}
                    onClick={() => {
                      setSearching(false);
                      navigate(result.page, result.id);
                    }}
                  >
                    <span>
                      <strong>{result.title}</strong>
                      <small>{pageTitle(result.page)}</small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                ))
              ) : (
                <EmptyState
                  title="Không tìm thấy nội dung"
                  description="Thử một từ khóa khác."
                />
              )
            ) : (
              <div className="command-shortcuts">
                {["website", "courses", "leads", "publishing"]
                  .filter((p) => store.allowed(p))
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSearching(false);
                        navigate(p as Page);
                      }}
                    >
                      {pageTitle(p as Page)}
                      <ArrowRight size={16} />
                    </button>
                  ))}
              </div>
            )}
          </div>
        </Modal>
      )}
      {confirmation && (
        <Modal
          title={confirmation.title}
          onClose={() => {
            confirmation.resolve(false);
            setConfirmation(null);
          }}
        >
          <p className="confirm-message">{confirmation.message}</p>
          <div className="modal-actions">
            <button
              className="button"
              onClick={() => {
                confirmation.resolve(false);
                setConfirmation(null);
              }}
            >
              Hủy
            </button>
            <button
              className="button primary"
              onClick={() => {
                confirmation.resolve(true);
                setConfirmation(null);
              }}
            >
              {confirmation.action}
            </button>
          </div>
        </Modal>
      )}
    </AdminContext.Provider>
  );
}
