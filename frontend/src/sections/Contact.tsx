import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  INTEREST_OPTIONS,
  type InterestCode,
  type LeadInput,
  type LeadResult,
  type SectorTier,
} from "../../../shared/types";
import { api, ApiRequestError } from "../api/client";
import { useSiteSection } from "../hooks/useSiteSection";

const ADMIN_APP_URL =
  import.meta.env.VITE_ADMIN_APP_URL || "http://127.0.0.1:5176";

export interface ContactPrefill {
  message: string;
  eventSlug: string;
  /** changes on every click so the same event can be picked twice */
  nonce: number;
}

const EMPTY = {
  fullName: "",
  jobTitle: "",
  organization: "",
  sector: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};
type Fields = typeof EMPTY;

const warnStyle = {
  background: "var(--copper-soft)",
  borderColor: "var(--copper)",
};

export function Contact({
  tiers,
  prefill,
}: {
  tiers: SectorTier[];
  prefill: ContactPrefill | null;
}) {
  const section = useSiteSection("contact");
  const [f, setF] = useState<Fields>(EMPTY);
  const [interests, setInterests] = useState<Set<InterestCode>>(new Set());
  const [eventSlug, setEventSlug] = useState("");
  const [out, setOut] = useState<ReactNode>(null);
  const [sending, setSending] = useState(false);
  const submissionKey = useRef(crypto.randomUUID());
  const submissionBody = useRef("");
  const refs = {
    fullName: useRef<HTMLInputElement>(null),
    organization: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
  };

  const sectors = tiers
    .flatMap((t) => t.programs.map((p) => p.name))
    .concat(["Ngành khác"]);

  // Event CTA → "Đăng ký: <title>" in the message box (same behaviour as the original page)
  useEffect(() => {
    if (!prefill) return;
    setF((x) => ({ ...x, message: prefill.message }));
    setEventSlug(prefill.eventSlug);
    setInterests((s) => {
      const n = new Set(s);
      n.delete("EVENT_SPONSOR");
      return n;
    });
  }, [prefill]);

  const set =
    (k: keyof Fields) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setF((x) => ({ ...x, [k]: e.target.value }));

  const toggle = (code: InterestCode) =>
    setInterests((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const required = ["fullName", "organization", "email"] as const;
    const miss = required.filter((k) => !f[k].trim());
    if (miss.length) {
      setOut(
        <div className="ok" style={warnStyle}>
          Vui lòng điền họ tên, doanh nghiệp và email công việc.
        </div>,
      );
      refs[miss[0]].current?.focus();
      return;
    }
    if (!refs.email.current?.checkValidity()) {
      setOut(
        <div className="ok" style={warnStyle}>
          Email chưa đúng định dạng, ví dụ: ten@congty.vn.
        </div>,
      );
      refs.email.current?.focus();
      return;
    }

    const name = f.fullName;
    const reset = () => {
      submissionKey.current = crypto.randomUUID();
      setF((x) => ({ ...EMPTY, sector: x.sector }));
      setInterests(new Set());
      setEventSlug("");
    };

    const payload: LeadInput = {
      submissionKey: submissionKey.current,
      fullName: f.fullName,
      jobTitle: f.jobTitle,
      organization: f.organization,
      sector: f.sector,
      email: f.email,
      phone: f.phone,
      message: f.message,
      interests: [...interests],
      eventSlug: eventSlug || undefined,
      website: f.website,
    };
    const fingerprint = JSON.stringify({
      ...payload,
      submissionKey: undefined,
    });
    if (submissionBody.current !== fingerprint) {
      submissionKey.current = crypto.randomUUID();
      submissionBody.current = fingerprint;
    }
    payload.submissionKey = submissionKey.current;

    setOut(null);
    setSending(true);
    let stored = false;
    let adminUrl: string | undefined;
    try {
      const result = await api.post<LeadResult>("/leads", payload);
      stored = result.stored;
      adminUrl = result.adminUrl;
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        [400, 409, 429].includes(err.status)
      ) {
        const first = Object.values(err.body?.details ?? {})[0]?.[0];
        setOut(
          <div className="ok" style={warnStyle}>
            {first ?? err.message}
          </div>,
        );
        setSending(false);
        return;
      }
      setOut(
        <div className="ok" style={warnStyle}>
          Chưa gửi được yêu cầu. Vui lòng thử lại sau. Nội dung bạn đã nhập được
          giữ nguyên.
        </div>,
      );
      setSending(false);
      return;
    }
    setSending(false);

    setOut(
      <div className="ok" style={stored ? undefined : warnStyle}>
        <span style={{ color: stored ? "var(--signal)" : "var(--copper)" }}>
          ●
        </span>
        <span>
          {stored
            ? `Cảm ơn ${name}. IARIS đã nhận yêu cầu tư vấn. Đội ngũ phụ trách sẽ liên hệ qua email hoặc điện thoại bạn đã cung cấp.`
            : `Cảm ơn ${name}. Biểu mẫu đang trong giai đoạn thử nghiệm nên yêu cầu chưa được gửi đi. Vui lòng liên hệ hotline hoặc email của IARIS để được tư vấn.`}
          {stored && adminUrl && /^https?:\/\//.test(adminUrl) && (
            <a
              className="form-admin-link"
              href={adminUrl}
              target="_blank"
              rel="noreferrer"
            >
              Mở admin để kiểm tra yêu cầu ↗
            </a>
          )}
        </span>
      </div>,
    );
    // Only clear a request after the API confirms it was saved.
    if (!stored) return;
    reset();
  };

  return (
    <section className="block alt" id="contact">
      <div className="wrap contact">
        <div className="info">
          <div className="mono" style={{ color: "var(--copper)" }}>
            Đăng ký và tư vấn
          </div>
          <h2>{section.title}</h2>
          <p>{section.subtitle}</p>
          <dl className="cinfo">
            <div>
              <dt>Hotline</dt>
              <dd>{section.phone || "[cập nhật]"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{section.email || "[cập nhật]"}</dd>
            </div>
            <div>
              <dt>Địa chỉ</dt>
              <dd>{section.address || "[cập nhật]"}</dd>
            </div>
            <div>
              <dt>Pháp nhân</dt>
              <dd>{section.legalEntity}</dd>
            </div>
          </dl>
        </div>

        <form
          className="card"
          id="leadForm"
          noValidate
          onSubmit={onSubmit}
          aria-busy={sending}
        >
          <label>
            Họ và tên
            <input
              id="f-name"
              name="name"
              required
              autoComplete="name"
              ref={refs.fullName}
              value={f.fullName}
              onChange={set("fullName")}
            />
          </label>
          <label>
            Chức vụ
            <input
              id="f-role"
              name="role"
              autoComplete="organization-title"
              value={f.jobTitle}
              onChange={set("jobTitle")}
            />
          </label>
          <label>
            Doanh nghiệp
            <input
              id="f-org"
              name="org"
              required
              autoComplete="organization"
              ref={refs.organization}
              value={f.organization}
              onChange={set("organization")}
            />
          </label>
          <label>
            Ngành
            <select
              id="f-sector"
              name="sector"
              value={f.sector}
              onChange={set("sector")}
            >
              <option value="">Chọn ngành</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Email công việc
            <input
              id="f-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              ref={refs.email}
              value={f.email}
              onChange={set("email")}
            />
          </label>
          <label>
            Số điện thoại
            <input
              id="f-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={f.phone}
              onChange={set("phone")}
            />
          </label>

          {/* honeypot: invisible to people, bots tend to fill it */}
          <label
            aria-hidden="true"
            style={{
              position: "absolute",
              left: -9999,
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            Website
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={f.website}
              onChange={set("website")}
            />
          </label>

          <div className="full">
            <span style={{ fontSize: ".84rem", fontWeight: 600 }}>
              Quan tâm
            </span>
            <div className="checks" style={{ marginTop: 8 }}>
              {INTEREST_OPTIONS.map((o, i) => (
                <label key={o.code}>
                  <input
                    type="checkbox"
                    id={`i${i + 1}`}
                    value={o.value}
                    checked={interests.has(o.code)}
                    onChange={() => toggle(o.code)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <label className="full">
            Nội dung
            <textarea
              id="f-msg"
              name="msg"
              placeholder="Ví dụ: đào tạo DPO cho 3 nhân sự pháp chế, khai giảng trong Q1/2027"
              value={f.message}
              onChange={set("message")}
            />
          </label>
          <div
            className="full"
            id="formOut"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {out}
          </div>
          <div
            className="full"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="note">
              Thông tin của bạn chỉ dùng để tư vấn chương trình, theo Luật Bảo
              vệ dữ liệu cá nhân.
            </span>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={sending}
            >
              {sending ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
            </button>
          </div>
          <div className="full">
            <p className="form-delivery-note">
              Sau khi gửi, thông tin yêu cầu sẽ được lưu trên web admin và gửi
              thông báo tới Gmail của chủ website.
            </p>
            <a
              className="form-admin-entry"
              href={ADMIN_APP_URL}
              target="_blank"
              rel="noreferrer"
            >
              Mở web admin demo ↗
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
