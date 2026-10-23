import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  FloppyDisk,
  Tray,
} from "@phosphor-icons/react";
import { LEAD_STATUSES, type DemoRecord } from "../../../shared/admin-demo";
import { Badge, EmptyState, SearchInput } from "../components";
import { useAdmin } from "../context";
import { Pagination } from "./Content";
import { formatDate, matchesSearch } from "../schema";
import type { LeadMailHistory } from "../../../shared/types";

export function LeadsPage({ recordId }: { recordId?: string }) {
  const {
    workspace: { data },
    navigate,
    websiteUrl,
  } = useAdmin();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const rows = [...data.leads].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  );
  const filtered = rows.filter(
    (r) => (!status || r.status === status) && matchesSearch(r, query),
  );
  const safePage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / size)),
  );
  const shown = filtered.slice((safePage - 1) * size, safePage * size);
  const selected = recordId ? rows.find((r) => r.id === recordId) : null;
  if (recordId && !selected)
    return (
      <EmptyState
        title="Không tìm thấy yêu cầu"
        description="Tải lại dữ liệu để lấy yêu cầu mới nhất."
        action={
          <button className="button" onClick={() => navigate("leads")}>
            Về danh sách
          </button>
        }
      />
    );
  if (selected) return <LeadDetail key={selected.id} lead={selected} />;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ĐIỀU HÀNH</span>
          <h1>
            Yêu cầu tư vấn <span className="heading-count">{rows.length}</span>
          </h1>
          <p>
            Tiếp nhận nhu cầu, ghi chú trao đổi và theo dõi trạng thái xử lý.
          </p>
        </div>
        <a
          className="button primary"
          href={`${websiteUrl}/#contact`}
          target="_blank"
          rel="noreferrer"
        >
          Xem biểu mẫu
          <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="lead-summary">
        <div>
          <Tray size={20} />
          <strong>{rows.filter((r) => r.status === "NEW").length}</strong>
          <span>yêu cầu mới</span>
        </div>
        <p>500 yêu cầu gần nhất từ website.</p>
      </div>
      <section className="panel collection-panel">
        <div
          className="status-tabs"
          role="group"
          aria-label="Lọc trạng thái yêu cầu"
        >
          {[{ value: "", label: "Tất cả" }, ...LEAD_STATUSES].map((s) => (
            <button
              key={s.value}
              className={status === s.value ? "active" : ""}
              aria-pressed={status === s.value}
              onClick={() => {
                setStatus(s.value);
                setPage(1);
              }}
            >
              {s.label}
              <span>
                {s.value
                  ? rows.filter((r) => r.status === s.value).length
                  : rows.length}
              </span>
            </button>
          ))}
        </div>
        <div className="table-toolbar">
          <h2>Hộp thư yêu cầu</h2>
          <SearchInput
            value={query}
            onChange={(s) => {
              setQuery(s);
              setPage(1);
            }}
            label="Tìm yêu cầu tư vấn"
            placeholder="Tìm theo tên, email, doanh nghiệp…"
          />
        </div>
        {!shown.length ? (
          <EmptyState
            title="Không có yêu cầu phù hợp"
            description="Thử đổi từ khóa, trạng thái hoặc gửi yêu cầu từ website."
            action={
              <button
                className="button"
                onClick={() => {
                  setQuery("");
                  setStatus("");
                }}
              >
                Xóa bộ lọc
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Doanh nghiệp</th>
                  <th>Quan tâm</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>
                    <span className="sr-only">Mở yêu cầu</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button
                        className="table-record-link"
                        onClick={() => navigate("leads", r.id)}
                      >
                        {String(r.fullName)}
                      </button>
                      <small className="cell-subtitle">{String(r.email)}</small>
                    </td>
                    <td>
                      <span className="cell-summary">
                        {String(r.organization)}
                      </span>
                      <small className="cell-subtitle">
                        {String(r.jobTitle)}
                      </small>
                    </td>
                    <td>
                      <span className="interest-label">
                        {Array.isArray(r.interests)
                          ? r.interests.join(", ")
                          : ""}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(r.createdAt)}</td>
                    <td>
                      <Badge value={String(r.status)}>
                        {LEAD_STATUSES.find((s) => s.value === r.status)?.label}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => navigate("leads", r.id)}
                        aria-label={`Xem chi tiết ${r.fullName}`}
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          total={filtered.length}
          page={safePage}
          size={size}
          onPage={setPage}
          onSize={(n) => {
            setSize(n);
            setPage(1);
          }}
        />
      </section>
    </>
  );
}

function LeadDetail({ lead }: { lead: DemoRecord }) {
  const { save, navigate, notify, setDirty, busy } = useAdmin();
  const [status, setStatus] = useState(String(lead.status));
  const [note, setNote] = useState(String(lead.note ?? ""));
  const dirty = status !== lead.status || note !== lead.note;
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify("Đã sao chép.");
    } catch {
      notify(
        "Không sao chép được. Bạn có thể chọn và sao chép nội dung trực tiếp.",
      );
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    try {
      await save("leads", { ...lead, status, note: note.trim() });
    } catch (error) {
      notify((error as Error).message);
      return;
    }
    setNote(note.trim());
    setDirty(false);
    notify("Đã lưu thay đổi.");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <button className="back-link" onClick={() => navigate("leads")}>
            <ArrowLeft size={16} />
            Yêu cầu tư vấn
          </button>
          <span className="eyebrow">{lead.id}</span>
          <h1>{String(lead.fullName)}</h1>
          <p>{String(lead.organization)}</p>
        </div>
        <Badge value={String(lead.status)}>
          {LEAD_STATUSES.find((s) => s.value === lead.status)?.label}
        </Badge>
      </div>
      <div className="lead-detail-grid">
        <div className="detail-stack">
          <section className="panel detail-card">
            <h2>Thông tin khách hàng</h2>
            <dl className="detail-grid">
              {[
                ["fullName", "Họ và tên"],
                ["jobTitle", "Chức vụ"],
                ["organization", "Doanh nghiệp"],
                ["sectorLabel", "Lĩnh vực"],
                ["email", "Email"],
                ["phone", "Điện thoại"],
              ].map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>
                    {String(lead[key] || "Chưa cung cấp")}
                    {(key === "email" || key === "phone") && lead[key] && (
                      <button
                        className="icon-button"
                        onClick={() => copy(String(lead[key]))}
                        aria-label={`Sao chép ${label.toLowerCase()}`}
                      >
                        <Copy size={16} />
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="panel detail-card">
            <h2>Nhu cầu tư vấn</h2>
            <div className="interest-badges">
              {(Array.isArray(lead.interests) ? lead.interests : []).map(
                (i) => (
                  <Badge key={i}>{i}</Badge>
                ),
              )}
            </div>
            <h3>Lời nhắn từ khách hàng</h3>
            <blockquote>
              {String(lead.message || "Khách hàng chưa để lại lời nhắn.")}
            </blockquote>
            {lead.eventTitle && (
              <div className="linked-event">
                <span>Sự kiện nguồn</span>
                <strong>{String(lead.eventTitle)}</strong>
              </div>
            )}
            <div className="detail-timestamps">
              <span>Gửi: {formatDate(lead.createdAt, true)}</span>
              <span>Cập nhật: {formatDate(lead.updatedAt, true)}</span>
            </div>
          </section>
          <LeadEmailPanel lead={lead} />
        </div>
        <section className="panel lead-actions">
          <div className="panel-heading">
            <h2>Xử lý yêu cầu</h2>
            {dirty ? (
              <Badge value="pending">Chưa lưu</Badge>
            ) : (
              <Badge value="won">
                <Check size={12} />
                Đã lưu
              </Badge>
            )}
          </div>
          <form onSubmit={submit}>
            <label className="form-field">
              Trạng thái
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Ghi chú nội bộ
              <textarea
                rows={8}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi lại nhu cầu, nội dung đã trao đổi và bước tiếp theo…"
              />
              <small>{note.length}/2000 ký tự</small>
            </label>
            <button
              className="button primary"
              type="submit"
              disabled={!dirty || busy}
            >
              <FloppyDisk size={17} />
              Lưu thay đổi
            </button>
          </form>
          <p className="helper-text">Ghi chú chỉ dùng nội bộ.</p>
        </section>
      </div>
    </>
  );
}

function LeadEmailPanel({ lead }: { lead: DemoRecord }) {
  const { getLeadEmails, retryLeadEmail, notify } = useAdmin();
  const [history, setHistory] = useState<LeadMailHistory | null>(null);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    getLeadEmails(lead.id)
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          setError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setError((error as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [lead.id, version]);
  const labels = {
    PENDING: "Chờ xử lý",
    PROCESSING: "Đang gửi",
    SENT: "Đã gửi",
    FAILED: "Gửi lỗi",
    PREVIEW: "Chưa gửi (thử nghiệm)",
  };
  async function retry(emailId: string) {
    if (retrying) return;
    setRetrying(emailId);
    try {
      const data = await retryLeadEmail(lead.id, emailId);
      setHistory(data);
      const email = data.items.find((item) => item.id === emailId);
      notify(
        email?.status === "SENT"
          ? "Đã gửi email."
          : email?.status === "PREVIEW"
            ? "Đã lưu bản xem trước."
            : (email?.error ?? "Đã cập nhật trạng thái."),
      );
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setRetrying("");
    }
  }
  return (
    <section className="panel detail-card lead-mail-panel">
      <div className="mail-panel-heading">
        <h2>Email liên quan</h2>
        <button
          className="text-button"
          onClick={() => setVersion((v) => v + 1)}
        >
          Làm mới
        </button>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {!history && !error && (
        <p role="status" className="helper-text">
          Đang tải lịch sử email…
        </p>
      )}
      {history && (
        <>
          <p className="helper-text">
            {history.mode === "preview"
              ? "Chế độ thử nghiệm: email chỉ được lưu tại đây."
              : "Kiểm tra hộp thư hoặc thư rác nếu chưa nhận được email."}
          </p>
          {history.configurationError && (
            <p className="inline-error">{history.configurationError}</p>
          )}
          {!history.items.length && (
            <p className="helper-text">
              Hồ sơ cũ chưa có email tự động. Yêu cầu mới sẽ tạo thông báo cho
              chủ website.
            </p>
          )}
          {history.items.map((item) => (
            <article className="lead-mail-item" key={item.id}>
              <div className="mail-panel-heading">
                <h3>
                  {item.kind === "OWNER_NOTICE"
                    ? "Thông báo cho người phụ trách"
                    : "Xác nhận cho khách hàng (lịch sử cũ)"}
                </h3>
                <Badge
                  value={
                    item.status === "SENT"
                      ? "won"
                      : item.status === "FAILED"
                        ? "spam"
                        : "pending"
                  }
                >
                  {labels[item.status]}
                </Badge>
              </div>
              <dl>
                <div>
                  <dt>Gửi đến</dt>
                  <dd>{item.recipient || "Chưa cấu hình"}</dd>
                </div>
                <div>
                  <dt>Trả lời về</dt>
                  <dd>{item.replyTo || "Chưa cấu hình"}</dd>
                </div>
                <div>
                  <dt>Thời gian</dt>
                  <dd>{formatDate(item.sentAt ?? item.createdAt, true)}</dd>
                </div>
              </dl>
              {item.error && item.error !== history.configurationError && (
                <p role="alert" className="inline-error">
                  {item.error}
                </p>
              )}
              <details>
                <summary>{item.subject}</summary>
                <pre>{item.text}</pre>
              </details>
              {item.kind === "OWNER_NOTICE" && ["FAILED", "PENDING", "PROCESSING"].includes(item.status) && (
                <button
                  className="button compact"
                  disabled={
                    Boolean(retrying) ||
                    item.mode !== history.mode ||
                    !history.configured
                  }
                  onClick={() => retry(item.id)}
                >
                  {retrying === item.id ? "Đang kiểm tra…" : "Thử gửi lại"}
                </button>
              )}
            </article>
          ))}
        </>
      )}
      <a
        className="button"
        href={`mailto:${encodeURIComponent(String(lead.email))}?subject=${encodeURIComponent(`[IARIS ${lead.id}] Phản hồi yêu cầu tư vấn`)}`}
      >
        Soạn email trả lời
        <ArrowUpRight size={16} />
      </a>
      <p className="helper-text">
        Thư khách trả lời sẽ về hộp thư người phụ trách, chưa tự đồng bộ vào
        admin.
      </p>
    </section>
  );
}
