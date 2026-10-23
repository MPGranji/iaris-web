import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  Check,
  X,
  MagnifyingGlass,
  FileText,
  ArrowRight,
} from "@phosphor-icons/react";
import type { Collection, DemoData, DemoRecord } from "../../shared/admin-demo";
import { displayValue, formatDate, type Field } from "./schema";
export function Badge({
  value,
  children,
}: {
  value?: string;
  children: ReactNode;
}) {
  return (
    <span className={`badge badge-${(value ?? "neutral").toLowerCase()}`}>
      {children}
    </span>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  label = "Tìm kiếm",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="search-input">
      <MagnifyingGlass size={18} aria-hidden />
      <input
        aria-label={label}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <FileText size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPressed = useRef(false);
  const id = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && backdropPressed.current) onClose();
        backdropPressed.current = false;
      }}
      onPointerDown={(e) => {
        backdropPressed.current = e.target === ref.current;
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function FieldInput({
  field,
  row,
  onChange,
  data,
}: {
  field: Field;
  row: DemoRecord;
  onChange: (key: string, value: DemoRecord[string]) => void;
  data?: DemoData;
}) {
  const id = useId();
  const { key, label, type = "text", required, hint } = field;
  const raw = row[key];
  const options =
    key === "correctIndex"
      ? (Array.isArray(row.options) ? row.options : []).map((s, i) => ({
          value: String(i),
          label: `${i + 1}. ${s}`,
        }))
      : (field.options ??
        (key === "tierId"
          ? data?.tiers.map((t) => ({ value: t.id, label: String(t.label) }))
          : []) ??
        []);
  const hintId = hint ? `${id}-hint` : undefined;
  const updateInput = (value: string) =>
    onChange(
      key,
      type === "number" ? (value === "" ? "" : Number(value)) : value,
    );
  const control =
    type === "checkbox" ? (
      <input
        id={id}
        type="checkbox"
        checked={raw === true}
        onChange={(e) => onChange(key, e.target.checked)}
      />
    ) : type === "select" ? (
      <select
        id={id}
        value={String(raw ?? "")}
        required={required}
        aria-describedby={hintId}
        onChange={(e) =>
          onChange(
            key,
            key === "correctIndex" ? Number(e.target.value) : e.target.value,
          )
        }
      >
        <option value="" disabled>
          Chọn {label.toLowerCase()}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ) : type === "textarea" || type === "lines" ? (
      <textarea
        id={id}
        required={required}
        aria-describedby={hintId}
        maxLength={8000}
        rows={type === "lines" ? 4 : 3}
        value={Array.isArray(raw) ? raw.join("\n") : String(raw ?? "")}
        onChange={(e) =>
          onChange(
            key,
            type === "lines" ? e.target.value.split("\n") : e.target.value,
          )
        }
      />
    ) : (
      <input
        id={id}
        type={type}
        required={required}
        aria-describedby={hintId}
        min={field.min}
        max={field.max}
        maxLength={type === "text" ? 500 : undefined}
        value={String(raw ?? "")}
        onInput={(e) => updateInput(e.currentTarget.value)}
        onChange={(e) => updateInput(e.currentTarget.value)}
      />
    );
  return (
    <div
      className={`form-field ${type === "textarea" || type === "lines" ? "field-wide" : ""} ${type === "checkbox" ? "field-checkbox" : ""}`}
    >
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="required-mark" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {control}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}

export function RecordPreview({
  collection,
  row,
  data,
}: {
  collection: Collection;
  row: DemoRecord;
  data: DemoData;
}) {
  const [title, subtitle] =
    collection === "website"
      ? [row.title, row.subtitle]
      : collection === "quiz"
        ? [row.scenario, row.message]
        : [
            row.title ?? row.name ?? row.label,
            row.tagline ?? row.summary ?? row.detail ?? row.introLead,
          ];
  return (
    <div className="content-preview">
      <div className="preview-browser">
        <span />
        <span />
        <span />
        <small>Xem trước bản nháp</small>
      </div>
      <div className="preview-content">
        <span className="eyebrow">
          IARIS{" "}
          {collection === "courses"
            ? "ACADEMY"
            : collection === "media"
              ? "MEDIA"
              : "CYBER & DATA"}
        </span>
        {row.code && <Badge>{String(row.code)}</Badge>}
        <h3>{String(title || "Tiêu đề nội dung")}</h3>
        {subtitle && <p>{String(subtitle)}</p>}
        {collection === "website" && row.id === "contact" && (
          <dl className="preview-contact">
            {[
              ["phone", "Hotline"],
              ["email", "Email"],
              ["address", "Địa chỉ"],
              ["legalEntity", "Pháp nhân"],
            ].map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{String(row[key] || "Chưa cập nhật")}</dd>
              </div>
            ))}
          </dl>
        )}
        {collection === "website" && row.body && (
          <p className="preserve-lines">{String(row.body)}</p>
        )}
        {collection === "courses" && (
          <>
            <span className="preview-meta">
              {String(row.duration || "Thời lượng")}
            </span>
            <h4>Dành cho</h4>
            <p>{String(row.audience ?? "")}</p>
            <h4>Bạn nhận được</h4>
            <p>{String(row.outcomes ?? "")}</p>
          </>
        )}
        {collection === "laws" && (
          <span className="preview-meta">
            Hiệu lực: {formatDate(row.effectiveDate)}
          </span>
        )}
        {collection === "media" && (
          <>
            {Array.isArray(row.benefits) && (
              <ul className="preview-benefits">
                {row.benefits.filter(Boolean).map((b, i) => (
                  <li key={i}>
                    <Check size={15} />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <span className="preview-meta">{String(row.meta ?? "")}</span>
          </>
        )}
        {collection === "programs" && (
          <>
            <span className="preview-meta">
              {displayValue("tierId", row.tierId, data)} ·{" "}
              {String(row.launchPeriod ?? "")}
            </span>
            <h4>Trọng tâm</h4>
            <p>{String(row.focus ?? "")}</p>
            <h4>Chuẩn tham chiếu</h4>
            <p>{String(row.standards ?? "")}</p>
          </>
        )}
        {collection === "events" && (
          <>
            <span className="preview-meta">
              {String(row.dateLabel ?? "")} · {String(row.periodLabel ?? "")}
            </span>
            <span className="preview-cta">
              {String(row.ctaLabel || "Đăng ký tư vấn")}
              <ArrowRight size={16} />
            </span>
          </>
        )}
        {collection === "quiz" && Array.isArray(row.options) && (
          <ol className="quiz-preview">
            {row.options.map((o, i) => (
              <li
                className={
                  i === Number(row.correctIndex) ? "answer-correct" : ""
                }
                key={i}
              >
                <span>{i + 1}</span>
                {o}
                {i === Number(row.correctIndex) && <Check size={16} />}
              </li>
            ))}
          </ol>
        )}
        {collection === "lessons" && (
          <span className="preview-meta">
            Bài {String(row.position)} · {String(row.durationMin)} phút
          </span>
        )}
        {collection === "members" && (
          <>
            <p>{String(row.email ?? "")}</p>
            <Badge>{displayValue("role", row.role)}</Badge>
          </>
        )}
      </div>
    </div>
  );
}
