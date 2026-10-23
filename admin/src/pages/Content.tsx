import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  Eye,
  FloppyDisk,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import type { Collection, DemoRecord } from "../../../shared/admin-demo";
import {
  Badge,
  EmptyState,
  FieldInput,
  Modal,
  RecordPreview,
  SearchInput,
} from "../components";
import { useAdmin } from "../context";
import {
  displayValue,
  matchesSearch,
  newRecord,
  schemaFor,
  schemas,
  validateFields,
  validateRecord,
  type Field,
} from "../schema";

type EditableCollection = keyof typeof schemas;
function cleanRecord(row: DemoRecord): DemoRecord {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === "string" && key !== "password"
        ? value.trim()
        : Array.isArray(value)
          ? value.map((s) => s.trim()).filter(Boolean)
          : value,
    ]),
  ) as DemoRecord;
}

export function RecordEditor({
  collection,
  original,
  fields,
  title,
  onDone,
  allowDelete = false,
}: {
  collection: Collection;
  original: DemoRecord;
  fields: Field[];
  title: string;
  onDone?: () => void;
  allowDelete?: boolean;
}) {
  const {
    workspace: { data },
    save,
    remove,
    notify,
    confirm,
    setDirty,
    busy,
  } = useAdmin();
  const [draft, setDraft] = useState(() => structuredClone(original));
  const [baseline, setBaseline] = useState(() => JSON.stringify(original));
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const dirty = JSON.stringify(draft) !== baseline;
  const unsaved =
    dirty || !data[collection].some((row) => row.id === original.id);
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
  const change = (key: string, value: DemoRecord[string]) => {
    setDraft((r) => ({ ...r, [key]: value }));
    setError("");
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const row = cleanRecord(draft);
    const invalid =
      validateFields(fields, row) ?? validateRecord(collection, row, data);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (
      collection === "courses" &&
      original.code !== row.code &&
      [...data.lessons, ...data.quiz].some(
        (r) => r.courseCode === original.code,
      )
    ) {
      setError(
        "Khóa này đang có bài học hoặc câu hỏi. Giữ nguyên mã khóa để bảo toàn liên kết.",
      );
      return;
    }
    try {
      await save(collection, row);
    } catch (error) {
      setError((error as Error).message);
      return;
    }
    if (collection === "members") delete row.password;
    setDraft(row);
    setBaseline(JSON.stringify(row));
    setDirty(false);
    notify(collection === "members" ? "Đã lưu tài khoản." : "Đã lưu bản nháp.");
    onDone?.();
  }
  async function deleteRecord() {
    if (
      collection === "tiers" &&
      data.programs.some((r) => r.tierId === original.id)
    ) {
      setError(
        "Nhóm này đang có chương trình. Chuyển các chương trình sang nhóm khác trước khi xóa.",
      );
      return;
    }
    if (
      collection === "courses" &&
      [...data.lessons, ...data.quiz].some(
        (r) => r.courseCode === original.code,
      )
    ) {
      setError(
        "Khóa này đang có bài học hoặc câu hỏi. Không thể xóa khi còn dữ liệu liên kết.",
      );
      return;
    }
    if (
      !(await confirm(
        "Xóa bản ghi?",
        "Bản ghi sẽ được xóa khỏi bản nháp. Website thay đổi sau lần xuất bản tiếp theo.",
        "Xóa bản ghi",
      ))
    )
      return;
    try {
      await remove(collection, original.id);
    } catch (error) {
      setError((error as Error).message);
      return;
    }
    setDirty(false);
    notify("Đã xóa bản ghi khỏi bản nháp.");
    onDone?.();
  }
  return (
    <>
      <form onSubmit={submit} className="editor-layout">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">BIÊN TẬP NỘI DUNG</span>
              <h2>{title}</h2>
            </div>
            <Badge value={unsaved ? "pending" : "neutral"}>
              {unsaved ? "Chưa lưu" : "Đã lưu"}
            </Badge>
          </div>
          {error && (
            <div className="inline-error" role="alert">
              {error}
            </div>
          )}
          <div className="form-grid">
            {fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                row={draft}
                data={data}
                onChange={change}
              />
            ))}
          </div>
          <div className="editor-footer">
            <div>
              {allowDelete && (
                <button
                  className="button danger-text"
                  type="button"
                  onClick={deleteRecord}
                >
                  <Trash size={17} />
                  Xóa bản ghi
                </button>
              )}
            </div>
            <div className="button-group">
              <button
                className="button"
                type="button"
                onClick={() => setPreview(true)}
              >
                <Eye size={17} />
                Xem trước
              </button>
              <button className="button primary" type="submit" disabled={busy}>
                <FloppyDisk size={17} />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </section>
        <aside className="editor-aside">
          <div className="aside-label">
            <Eye size={17} />
            <span>Xem trước</span>
          </div>
          <RecordPreview collection={collection} row={draft} data={data} />
          <p className="helper-text">
            Lưu bản nháp trước khi xuất bản lên website.
          </p>
        </aside>
      </form>
      {preview && (
        <Modal
          title="Xem trước nội dung"
          onClose={() => setPreview(false)}
          className="preview-modal"
        >
          <RecordPreview collection={collection} row={draft} data={data} />
        </Modal>
      )}
    </>
  );
}

export function CollectionPage({
  collection,
  recordId,
}: {
  collection: EditableCollection;
  recordId?: string;
}) {
  const {
    workspace: { data },
    navigate,
    reorder,
    notify,
  } = useAdmin();
  const schema = schemaFor(collection, data);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const rows = useMemo(
    () =>
      [...data[collection]].sort((a, b) =>
        schema.orderKey
          ? Number(a[schema.orderKey]) - Number(b[schema.orderKey])
          : 0,
      ),
    [data, collection, schema.orderKey],
  );
  const filtered = rows.filter(
    (r) =>
      matchesSearch(r, query) &&
      (!filter || !schema.filter || r[schema.filter.key] === filter),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * size, safePage * size);
  const [newRow] = useState(() =>
    recordId === "new" ? newRecord(collection, data) : null,
  );
  const selected =
    recordId === "new" ? newRow : rows.find((r) => r.id === recordId);
  const orderedRows =
    filter && schema.filter
      ? rows.filter((row) => String(row[schema.filter!.key]) === filter)
      : rows;
  if (recordId && !selected)
    return (
      <EmptyState
        title="Không tìm thấy bản ghi"
        description="Bản ghi có thể đã được xóa. Tải lại dữ liệu để kiểm tra."
        action={
          <button className="button" onClick={() => navigate(collection)}>
            Về danh sách
          </button>
        }
      />
    );
  return (
    <>
      <div className="page-heading">
        <div>
          {recordId && (
            <button className="back-link" onClick={() => navigate(collection)}>
              <ArrowLeft size={16} />
              {schema.title}
            </button>
          )}
          <span className="eyebrow">
            {collection === "members"
              ? "HỆ THỐNG"
              : collection === "lessons" || collection === "quiz"
                ? "E-LEARNING · B6"
                : "QUẢN TRỊ NỘI DUNG"}
          </span>
          <h1>
            {recordId
              ? recordId === "new"
                ? `Thêm ${schema.singular}`
                : `Chỉnh sửa ${schema.singular}`
              : schema.title}
          </h1>
          <p>{schema.description}</p>
        </div>
        {!recordId && (
          <button
            className="button primary"
            onClick={() => navigate(collection, "new")}
          >
            <Plus size={18} />
            Thêm {schema.singular}
          </button>
        )}
      </div>
      {selected ? (
        <RecordEditor
          key={selected.id}
          collection={collection}
          original={selected}
          fields={schema.fields}
          title={
            recordId === "new"
              ? `Thông tin ${schema.singular}`
              : String(selected[schema.titleKey])
          }
          onDone={() => navigate(collection)}
          allowDelete={recordId !== "new" && collection !== "members"}
        />
      ) : (
        <>
          {(collection === "lessons" || collection === "quiz") && (
            <LearningTabs active={collection} />
          )}
          <section className="panel collection-panel">
            <div className="table-toolbar">
              <div className="toolbar-title">
                <h2>Danh sách {schema.singular}</h2>
                <Badge>{rows.length}</Badge>
              </div>
              <div className="toolbar-controls">
                <SearchInput
                  value={query}
                  label={`Tìm ${schema.singular}`}
                  onChange={(s) => {
                    setQuery(s);
                    setPage(1);
                  }}
                  placeholder={`Tìm ${schema.singular}…`}
                />
                {schema.filter && (
                  <select
                    aria-label={schema.filter.label}
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">{schema.filter.label}</option>
                    {schema.filter.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {!shown.length ? (
              <EmptyState
                title={
                  rows.length
                    ? "Không có kết quả phù hợp"
                    : `Chưa có ${schema.singular}`
                }
                description={
                  rows.length
                    ? "Thử từ khóa hoặc bộ lọc khác."
                    : "Thêm bản ghi đầu tiên để bắt đầu biên tập."
                }
                action={
                  <button
                    className="button"
                    onClick={() =>
                      rows.length
                        ? (setQuery(""), setFilter(""))
                        : navigate(collection, "new")
                    }
                  >
                    {rows.length ? "Xóa bộ lọc" : `Thêm ${schema.singular}`}
                  </button>
                }
              />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {schema.columns.map((c) => (
                        <th key={c.key}>{c.label}</th>
                      ))}
                      <th className="actions-heading">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((row) => (
                      <tr key={row.id}>
                        {schema.columns.map((column, index) => (
                          <td
                            key={column.key}
                            className={
                              column.key === "code" || column.key === "position"
                                ? "mono-cell"
                                : ""
                            }
                          >
                            {index === 0 || column.key === schema.titleKey ? (
                              <button
                                className="table-record-link"
                                onClick={() => navigate(collection, row.id)}
                              >
                                {displayValue(
                                  column.key,
                                  row[column.key],
                                  data,
                                )}
                              </button>
                            ) : column.key === "status" ||
                              column.key === "role" ||
                              column.key === "group" ? (
                              <Badge value={String(row[column.key])}>
                                {displayValue(
                                  column.key,
                                  row[column.key],
                                  data,
                                )}
                              </Badge>
                            ) : column.key === "featured" ? (
                              row.featured ? (
                                <span className="feature-label">
                                  <Check size={14} />
                                  Nổi bật
                                </span>
                              ) : (
                                <span className="muted">—</span>
                              )
                            ) : (
                              <span className="cell-summary">
                                {displayValue(
                                  column.key,
                                  row[column.key],
                                  data,
                                )}
                              </span>
                            )}
                          </td>
                        ))}
                        <td>
                          <div className="row-actions">
                            {schema.orderKey && (
                              <>
                                <button
                                  className="icon-button"
                                  aria-label={`Di chuyển lên: ${row[schema.titleKey]}`}
                                  title="Di chuyển lên"
                                  disabled={orderedRows[0]?.id === row.id}
                                  onClick={async () => {
                                    try {
                                      await reorder(
                                        collection,
                                        row.id,
                                        -1,
                                        schema.orderKey!,
                                        filter,
                                      );
                                      notify("Đã lưu thứ tự vào bản nháp.");
                                    } catch (error) {
                                      notify((error as Error).message);
                                    }
                                  }}
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Di chuyển xuống: ${row[schema.titleKey]}`}
                                  title="Di chuyển xuống"
                                  disabled={
                                    orderedRows[orderedRows.length - 1]?.id ===
                                    row.id
                                  }
                                  onClick={async () => {
                                    try {
                                      await reorder(
                                        collection,
                                        row.id,
                                        1,
                                        schema.orderKey!,
                                        filter,
                                      );
                                      notify("Đã lưu thứ tự vào bản nháp.");
                                    } catch (error) {
                                      notify((error as Error).message);
                                    }
                                  }}
                                >
                                  <ArrowDown size={16} />
                                </button>
                              </>
                            )}
                            <button
                              className="icon-button"
                              aria-label={`Chỉnh sửa: ${row[schema.titleKey]}`}
                              title="Chỉnh sửa"
                              onClick={() => navigate(collection, row.id)}
                            >
                              <PencilSimple size={18} />
                            </button>
                          </div>
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
          {collection === "members" && <PermissionsMatrix />}
          {collection === "quiz" && (
            <div className="info-strip">
              Đáp án và giải thích dùng cho e-learning minh họa, chưa phải hệ
              thống thi cấp chứng nhận.
            </div>
          )}
        </>
      )}
    </>
  );
}

export function Pagination({
  total,
  page,
  size,
  onPage,
  onSize,
}: {
  total: number;
  page: number;
  size: number;
  onPage: (p: number) => void;
  onSize: (n: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)}`
          : "0"}{" "}
        trong {total} bản ghi
      </span>
      <div className="pagination-controls">
        <select
          aria-label="Số bản ghi mỗi trang"
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
        >
          {[5, 10, 20].map((n) => (
            <option value={n} key={n}>
              {n} / trang
            </option>
          ))}
        </select>
        <button
          className="button compact"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Trang trước"
        >
          Trước
        </button>
        <span>
          {page} / {count}
        </span>
        <button
          className="button compact"
          disabled={page >= count}
          onClick={() => onPage(page + 1)}
          aria-label="Trang sau"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
export function LearningTabs({
  active,
}: {
  active: "lessons" | "quiz" | "results";
}) {
  const { navigate } = useAdmin();
  return (
    <nav className="tabs" aria-label="E-learning">
      {(
        [
          { page: "lessons", label: "Bài học" },
          { page: "quiz", label: "Câu hỏi tình huống" },
          { page: "results", label: "Kết quả" },
        ] as const
      ).map((item) => (
        <button
          key={item.page}
          className={item.page === active ? "active" : ""}
          aria-current={item.page === active ? "page" : undefined}
          onClick={() => navigate(item.page)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
function PermissionsMatrix() {
  const capabilities = [
    ["Biên tập nội dung", true, true, false],
    ["Xử lý yêu cầu tư vấn", true, false, true],
    ["Quản lý thành viên", true, false, false],
    ["Xuất bản nội dung", true, true, false],
  ] as const;
  return (
    <section className="panel permissions-panel">
      <div className="panel-heading">
        <div>
          <h2>Quyền theo vai trò</h2>
          <p>Quyền truy cập của từng nhóm tài khoản.</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Chức năng</th>
              <th>Quản trị viên</th>
              <th>Biên tập viên</th>
              <th>Tư vấn viên</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.map(([name, ...flags]) => (
              <tr key={name}>
                <td>{name}</td>
                {flags.map((f, i) => (
                  <td key={i}>
                    {f ? (
                      <span className="permission-yes">
                        <Check size={16} />
                        Có
                      </span>
                    ) : (
                      <span className="muted">Không</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function WebsitePage({ recordId }: { recordId?: string }) {
  const {
    workspace: { data },
    navigate,
  } = useAdmin();
  const selected =
    data.website.find((r) => r.id === recordId) ?? data.website[0];
  if (!selected)
    return (
      <EmptyState
        title="Chưa có nội dung website"
        description="Nạp nội dung ban đầu trước khi biên tập."
      />
    );
  const fields: Field[] = [
    { key: "title", label: "Tiêu đề", required: true },
    { key: "subtitle", label: "Mô tả ngắn", type: "textarea", required: true },
    ...(selected.id === "contact"
      ? [
          { key: "phone", label: "Hotline" },
          { key: "email", label: "Email liên hệ", type: "email" as const },
          { key: "address", label: "Địa chỉ" },
          { key: "legalEntity", label: "Pháp nhân", required: true },
        ]
      : [
          {
            key: "body",
            label:
              selected.id === "partners"
                ? "Đối tác (mỗi tên một dòng)"
                : "Nội dung",
            type: "textarea" as const,
            required: true,
          },
        ]),
    ...("buttonLabel" in selected
      ? [{ key: "buttonLabel", label: "Nhãn nút hành động", required: true }]
      : []),
    ...(selected.id === "footer"
      ? [
          { key: "seoTitle", label: "Tiêu đề SEO", required: true },
          {
            key: "seoDescription",
            label: "Mô tả SEO",
            type: "textarea" as const,
            required: true,
          },
        ]
      : []),
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">NỘI DUNG WEBSITE</span>
          <h1>Biên tập trang giới thiệu</h1>
          <p>Nội dung giới thiệu và thông tin liên hệ trên website.</p>
        </div>
        <Badge>Bản nháp</Badge>
      </div>
      <div
        className="section-switcher"
        role="navigation"
        aria-label="Các khối website"
      >
        {data.website.map((r) => (
          <button
            key={r.id}
            className={selected.id === r.id ? "active" : ""}
            aria-current={selected.id === r.id ? "page" : undefined}
            onClick={() => navigate("website", r.id)}
          >
            {String(r.name)}
            <ArrowUpRight size={15} />
          </button>
        ))}
      </div>
      <RecordEditor
        key={selected.id}
        collection="website"
        original={selected}
        fields={fields}
        title={String(selected.name)}
      />
    </>
  );
}
