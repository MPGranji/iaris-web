import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDots,
  CheckCircle,
  Clock,
  FileText,
  Megaphone,
  PencilSimple,
  Tray,
} from "@phosphor-icons/react";
import { LEAD_STATUSES } from "../../../shared/admin-demo";
import { Badge, EmptyState, Modal, RecordPreview } from "../components";
import { formatDate } from "../schema";
import { useAdmin } from "../context";
import { LearningTabs } from "./Content";
import { useState, type FormEvent } from "react";
import { toSiteContent } from "../../../shared/site-settings";

export function Dashboard() {
  const {
    workspace: { data, publications, attempts },
    navigate,
    allowed,
  } = useAdmin();
  const newLeads = data.leads.filter((r) => r.status === "NEW");
  const latest = [...data.leads]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 5);
  const stats = [
    {
      label: "Khóa nền tảng",
      value: data.courses.length,
      detail: "Chương trình IARIS Academy",
      page: "courses",
      icon: BookOpen,
    },
    {
      label: "Đạo luật",
      value: data.laws.length,
      detail: "Văn bản trên trang giới thiệu",
      page: "laws",
      icon: FileText,
    },
    {
      label: "Dịch vụ Media",
      value: data.media.length,
      detail: "Kênh và dịch vụ truyền thông",
      page: "media",
      icon: Megaphone,
    },
    {
      label: "Sự kiện",
      value: data.events.length,
      detail: "Diễn đàn, webinar và workshop",
      page: "events",
      icon: CalendarDots,
    },
  ] as const;
  const contact = data.website.find((r) => r.id === "contact");
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">IARIS ADMIN</span>
          <h1>Tổng quan</h1>
          <p>Nội dung website và yêu cầu tư vấn mới.</p>
        </div>
        <button className="button primary" onClick={() => navigate("website")}>
          <PencilSimple size={18} />
          Biên tập website
        </button>
      </div>
      <div className="stats-grid">
        {stats.map(({ label, value, detail, page, icon: Icon }) => (
          <button
            className="stat-card"
            key={page}
            onClick={() => navigate(page)}
          >
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={22} />
            </div>
            <strong>{value}</strong>
            <div className="stat-bottom">
              <span>{detail}</span>
              <ArrowUpRight size={17} />
            </div>
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        {allowed("leads") ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Yêu cầu gần đây</h2>
                <p>{newLeads.length} yêu cầu mới đang chờ tiếp nhận</p>
              </div>
              <button
                className="text-button"
                disabled={!allowed("leads")}
                onClick={() => navigate("leads")}
              >
                Xem tất cả
                <ArrowRight size={16} />
              </button>
            </div>
            {!latest.length ? (
              <EmptyState
                title="Hộp thư đang trống"
                description="Gửi form tư vấn trên website rồi bấm tải lại dữ liệu để xem tại đây."
              />
            ) : (
              <div className="table-scroll">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Doanh nghiệp</th>
                      <th>Trạng thái</th>
                      <th>
                        <span className="sr-only">Chi tiết</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <button
                            className="table-record-link"
                            onClick={() => navigate("leads", r.id)}
                          >
                            {String(r.fullName)}
                          </button>
                          <small className="cell-subtitle">
                            {String(r.email)}
                          </small>
                        </td>
                        <td>
                          <span className="cell-summary">
                            {String(r.organization)}
                          </span>
                        </td>
                        <td>
                          <Badge value={String(r.status)}>
                            {
                              LEAD_STATUSES.find((s) => s.value === r.status)
                                ?.label
                            }
                          </Badge>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`Xem yêu cầu của ${r.fullName}`}
                            onClick={() => navigate("leads", r.id)}
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
            <div className="panel-footnote">
              <Clock size={15} />
              Yêu cầu mới nhất được gửi từ website
            </div>
          </section>
        ) : (
          <section className="panel">
            <div className="panel-heading">
              <h2>Xuất bản gần đây</h2>
              <button
                className="text-button"
                onClick={() => navigate("publishing")}
              >
                Xem tất cả <ArrowRight size={16} />
              </button>
            </div>
            {publications.length ? (
              <div className="review-list">
                {publications.slice(0, 5).map((publication) => (
                  <button
                    key={publication.id}
                    onClick={() => navigate("publishing")}
                  >
                    <span>
                      <strong>{publication.label}</strong>
                      <small>
                        {formatDate(publication.createdAt, true)} ·{" "}
                        {publication.recordCount} mục
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Chưa có bản xuất bản"
                description="Nội dung sẽ xuất hiện trên website sau khi xuất bản."
              />
            )}
          </section>
        )}
        <div className="dashboard-side">
          <section className="panel">
            <div className="panel-heading">
              <h2>Việc cần rà soát</h2>
              <Badge>
                {
                  [
                    !(contact?.phone && contact?.email),
                    !publications.length,
                    !data.quiz.length,
                  ].filter(Boolean).length
                }
              </Badge>
            </div>
            <div className="review-list">
              <button onClick={() => navigate("website", "contact")}>
                <span
                  className={`review-marker ${contact?.phone && contact?.email ? "complete" : ""}`}
                />
                <span>
                  <strong>Thông tin liên hệ</strong>
                  <small>
                    {contact?.phone && contact?.email
                      ? "Đã nhập hotline và email"
                      : "Bổ sung hotline và email tiếp nhận"}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button onClick={() => navigate("publishing")}>
                <span
                  className={`review-marker ${publications.length ? "complete" : ""}`}
                />
                <span>
                  <strong>Bản xuất bản</strong>
                  <small>
                    {publications.length
                      ? `${publications.length} lần xuất bản`
                      : "Chưa có bản xuất bản"}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button onClick={() => navigate("results")}>
                <span
                  className={`review-marker ${data.quiz.length ? "complete" : ""}`}
                />
                <span>
                  <strong>Bộ câu hỏi B6</strong>
                  <small>
                    {data.quiz.length
                      ? `${data.quiz.length} câu hỏi · ${attempts.length} lượt làm`
                      : "Chưa có câu hỏi"}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            </div>
          </section>
          <section className="quick-start">
            <span className="eyebrow">KHÓA HỌC</span>
            <h2>Cập nhật khóa học</h2>
            <p>Sửa thông tin khóa học, lưu nháp rồi xuất bản.</p>
            <button
              className="button"
              onClick={() => navigate("courses", data.courses[0]?.id)}
            >
              Xem khóa học
              <ArrowRight size={17} />
            </button>
            <div className="quick-start-lines" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </section>
        </div>
      </div>
      <div className="overview-bottom">
        {allowed("leads") && (
          <div>
            <Tray size={18} />
            <strong>{data.leads.length}</strong>
            <span>yêu cầu tư vấn</span>
          </div>
        )}
        <div>
          <BookOpen size={18} />
          <strong>{data.programs.length}</strong>
          <span>chương trình theo ngành</span>
        </div>
        <div>
          <CalendarDots size={18} />
          <strong>
            {publications.length
              ? formatDate(publications[0].createdAt)
              : "Chưa có"}
          </strong>
          <span>bản xuất bản gần nhất</span>
        </div>
      </div>
    </>
  );
}

export function ResultsPage() {
  const {
    workspace: { data, attempts },
    addAttempt,
    notify,
  } = useAdmin();
  const [testing, setTesting] = useState(false);
  const [grading, setGrading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const questions = [...data.quiz].sort(
    (a, b) => Number(a.position) - Number(b.position),
  );
  const mean = attempts.length
    ? Math.round(
        (attempts.reduce((n, a) => n + a.correct / a.total, 0) /
          attempts.length) *
          100,
      )
    : null;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (grading) return;
    setGrading(true);
    try {
      const result = await addAttempt(questions.map((q) => answers[q.id]));
      setTesting(false);
      notify(`Đã chấm và lưu: ${result.score}/${result.total} câu đúng.`);
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setGrading(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">E-LEARNING · B6</span>
          <h1>Kết quả quiz</h1>
          <p>100 lượt làm gần nhất.</p>
        </div>
        <button
          className="button primary"
          disabled={!questions.length}
          onClick={() => {
            setAnswers({});
            setTesting(true);
          }}
        >
          Thử bộ câu hỏi
          <ArrowRight size={18} />
        </button>
      </div>
      <LearningTabs active="results" />
      <div className="result-metrics">
        <div>
          <strong>{attempts.length}</strong>
          <span>Lượt làm thử</span>
        </div>
        <div>
          <strong>{questions.length}</strong>
          <span>Câu hỏi hiện có</span>
        </div>
        <div>
          <strong>{mean === null ? "—" : `${mean}%`}</strong>
          <span>Tỷ lệ đúng trung bình</span>
        </div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Lịch sử kết quả</h2>
          <Badge>{attempts.length} lượt</Badge>
        </div>
        {!attempts.length ? (
          <EmptyState
            title="Chưa có lượt làm thử"
            description="Thử bộ câu hỏi B6 để kiểm tra nội dung và cách chấm đáp án."
            action={
              <button
                className="button"
                disabled={!questions.length}
                onClick={() => {
                  setAnswers({});
                  setTesting(true);
                }}
              >
                Bắt đầu lượt thử
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Câu đúng / tổng</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.createdAt, true)}</td>
                    <td>
                      {a.correct} / {a.total}
                    </td>
                    <td>
                      <Badge value={a.correct === a.total ? "won" : "pending"}>
                        {Math.round((a.correct / a.total) * 100)}% đúng
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {testing && (
        <Modal
          title="Làm thử bộ câu hỏi B6"
          onClose={() => setTesting(false)}
          className="quiz-modal"
        >
          <form onSubmit={submit}>
            {questions.map((q, index) => (
              <fieldset className="quiz-question" key={q.id}>
                <legend>
                  {index + 1}. {String(q.scenario)}
                </legend>
                <p className="quiz-message">{String(q.message)}</p>
                {(Array.isArray(q.options) ? q.options : []).map(
                  (option, i) => (
                    <label className="quiz-option" key={i}>
                      <input
                        type="radio"
                        name={q.id}
                        value={i}
                        required
                        checked={answers[q.id] === i}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [q.id]: i }))
                        }
                      />
                      {option}
                    </label>
                  ),
                )}
              </fieldset>
            ))}
            <div className="modal-actions">
              <button
                className="button"
                type="button"
                onClick={() => setTesting(false)}
              >
                Hủy
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={grading}
              >
                {grading ? "Đang chấm…" : "Chấm và lưu kết quả"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function PublishingPage() {
  const { workspace, publish, confirm, notify, navigate, busy } = useAdmin();
  const [preview, setPreview] = useState(false);
  const [label, setLabel] = useState("Cập nhật nội dung website");
  const [source, setSource] = useState<"draft" | "published">("draft");
  const [tab, setTab] = useState<"courses" | "laws" | "media" | "events">(
    "courses",
  );
  const data = workspace.data;
  const contact = data.website.find((r) => r.id === "contact");
  const checks = [
    {
      title: "Nội dung giới thiệu",
      detail: `${data.website.length} khối nội dung`,
      okay: data.website.every((r) => Boolean(String(r.title).trim())),
      page: "website",
    },
    {
      title: "Academy",
      detail: `${data.courses.length} khóa nền tảng · ${data.programs.length} chương trình ngành`,
      okay: data.courses.length > 0,
      page: "courses",
    },
    {
      title: "Danh mục hiển thị",
      detail: `${data.laws.length} đạo luật · ${data.media.length} dịch vụ · ${data.events.length} sự kiện`,
      okay: data.laws.length > 0 && data.media.length > 0,
      page: "laws",
    },
    {
      title: "Thông tin liên hệ",
      detail:
        contact?.phone && contact?.email
          ? "Đã nhập hotline và email"
          : "Hotline hoặc email còn trống",
      okay: Boolean(contact?.phone && contact?.email),
      page: "website",
    },
  ] as const;
  const snapshot = source === "published" ? workspace.publishedData : data;
  async function createPublication(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || busy) return;
    if (
      !(await confirm(
        "Xuất bản nội dung?",
        "Website sẽ hiển thị bản nháp hiện tại sau khi xác nhận.",
        "Xuất bản",
      ))
    )
      return;
    try {
      await publish(label.trim());
      notify("Đã xuất bản.");
    } catch (error) {
      notify((error as Error).message);
    }
  }
  function exportFile() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            content: toSiteContent(workspace.data),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "iaris-content.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Đã tải nội dung.");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">HỆ THỐNG</span>
          <h1>Xuất bản</h1>
          <p>Kiểm tra bản nháp trước khi cập nhật website.</p>
        </div>
        <button className="button" onClick={exportFile}>
          Tải nội dung JSON
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="publishing-layout">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Rà soát trước khi xuất bản</h2>
              <p>Các mục cần kiểm tra.</p>
            </div>
            <Badge>
              {checks.filter((c) => c.okay).length}/{checks.length} mục
            </Badge>
          </div>
          <div className="publishing-checks">
            {checks.map((c) => (
              <button key={c.title} onClick={() => navigate(c.page)}>
                <span className={`check-icon ${c.okay ? "complete" : ""}`}>
                  {c.okay ? <CheckCircle size={22} /> : <Clock size={22} />}
                </span>
                <span>
                  <strong>{c.title}</strong>
                  <small>{c.detail}</small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel publication-form">
          <h2>Xuất bản website</h2>
          <p>Website chỉ hiển thị bản được xuất bản gần nhất.</p>
          <form onSubmit={createPublication}>
            <label className="form-field">
              Tên bản cập nhật
              <input
                required
                maxLength={120}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <button className="button primary" type="submit" disabled={busy}>
              Xuất bản lên website
              <ArrowRight size={17} />
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => {
              setSource("draft");
              setPreview(true);
            }}
          >
            Xem trước nội dung hiện tại
            <ArrowUpRight size={16} />
          </button>
          <div className="info-strip">
            Xuất bản chỉ gồm nội dung công khai; không kèm tài khoản, yêu cầu tư
            vấn và ghi chú.
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Lịch sử xuất bản</h2>
          <Badge>{workspace.publications.length}</Badge>
        </div>
        {!workspace.publications.length ? (
          <EmptyState
            title="Chưa có bản xuất bản"
            description="Kiểm tra nội dung rồi xuất bản lần đầu."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tên bản</th>
                  <th>Thời gian</th>
                  <th>Nội dung</th>
                  <th>Phạm vi</th>
                </tr>
              </thead>
              <tbody>
                {workspace.publications.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.label}</strong>
                      {i === 0 && <Badge value="won">Gần nhất</Badge>}
                    </td>
                    <td>{formatDate(p.createdAt, true)}</td>
                    <td>{p.recordCount} bản ghi</td>
                    <td>
                      {i === 0 ? (
                        <button
                          className="text-button"
                          onClick={() => {
                            setSource("published");
                            setPreview(true);
                          }}
                        >
                          Xem nội dung
                          <ArrowUpRight size={16} />
                        </button>
                      ) : (
                        <span className="muted">Nhật ký</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {preview && snapshot && (
        <Modal
          title={
            source === "published"
              ? "Nội dung đã xuất bản"
              : "Xem trước bản nháp"
          }
          className="large-modal"
          onClose={() => setPreview(false)}
        >
          <nav className="tabs" aria-label="Danh mục xem trước">
            {(
              [
                { key: "courses", title: "Academy" },
                { key: "laws", title: "Đạo luật" },
                { key: "media", title: "Media" },
                { key: "events", title: "Sự kiện" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                className={tab === item.key ? "active" : ""}
                onClick={() => setTab(item.key)}
              >
                {item.title}
              </button>
            ))}
          </nav>
          <div className="preview-grid">
            {snapshot[tab].length ? (
              snapshot[tab].map((row) => (
                <RecordPreview
                  key={row.id}
                  collection={tab}
                  row={row}
                  data={snapshot}
                />
              ))
            ) : (
              <EmptyState
                title="Danh mục đang trống"
                description="Thêm nội dung để xem trước."
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
