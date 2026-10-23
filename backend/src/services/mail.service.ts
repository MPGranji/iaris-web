import nodemailer, { type SendMailOptions } from "nodemailer";
import type { Lead, Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env";
import { database } from "./auth.service";
import { INTEREST_OPTIONS, type LeadMailHistory } from "../../../shared/types";
import { HttpError } from "../lib/http-error";

export interface MailConfiguration {
  mode: "preview" | "smtp";
  sender: string;
  owner: string;
  replyTo: string;
  adminUrl: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  error: string | null;
}
export function mailConfiguration(): MailConfiguration {
  const mode = env.mailMode === "smtp" ? "smtp" : "preview";
  const sender =
    env.mailFrom || (mode === "preview" ? "no-reply@example.com" : "");
  const owner =
    env.consultationTo || (mode === "preview" ? "owner@example.com" : "");
  const replyTo = env.mailReplyTo || owner;
  const validEmail = (email: string) =>
    z.string().email().safeParse(email).success;
  const adminUrl = env.adminAppUrl.replace(/\/$/, "");
  const validUrl =
    z.string().url().safeParse(adminUrl).success &&
    /^https?:\/\//.test(adminUrl);
  let error: string | null = null;
  if (!["smtp", "preview"].includes(env.mailMode))
    error = "MAIL_MODE cần là preview hoặc smtp.";
  else if (![sender, owner, replyTo].every(validEmail))
    error =
      "Cần cấu hình MAIL_FROM, CONSULTATION_TO và MAIL_REPLY_TO bằng email hợp lệ.";
  else if (!validUrl)
    error = "ADMIN_APP_URL cần là địa chỉ website admin hợp lệ.";
  else if (
    mode === "smtp" &&
    (!env.smtpHost ||
      !env.smtpUser ||
      !env.smtpPassword ||
      !Number.isInteger(env.smtpPort) ||
      env.smtpPort < 1 ||
      env.smtpPort > 65535)
  )
    error =
      "Chưa đủ cấu hình SMTP_HOST, SMTP_PORT, SMTP_USER hoặc SMTP_PASSWORD.";
  return {
    mode,
    sender,
    owner,
    replyTo,
    adminUrl,
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    user: env.smtpUser,
    password: env.smtpPassword,
    error,
  };
}
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
const htmlMessage = (title: string, body: string) =>
  `<html lang="vi"><body style="margin:0;background:#f2f6fc;color:#172540;font-family:Arial,sans-serif;line-height:1.65"><div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #dce4ef;border-radius:12px;padding:32px"><p style="color:#245de6;font-weight:bold">IARIS CYBER &amp; DATA</p><h1 style="font-size:22px">${escapeHtml(title)}</h1><div style="white-space:pre-wrap">${escapeHtml(body)}</div><hr style="border:0;border-top:1px solid #dce4ef;margin:24px 0"><small style="color:#52627b">IARIS Cyber &amp; Data · Tiếp nhận và tư vấn chương trình dành cho doanh nghiệp.</small></div></body></html>`;

export function notificationDrafts(
  lead: Lead,
  config = mailConfiguration(),
): Prisma.LeadEmailCreateManyInput[] {
  const interests =
    lead.interests
      .map(
        (code) =>
          INTEREST_OPTIONS.find((option) => option.code === code)?.label ??
          code,
      )
      .join(", ") || "Chưa chọn";
  const summary = `Mã yêu cầu: ${lead.id}\nHọ và tên: ${lead.fullName}\nDoanh nghiệp: ${lead.organization}\nChức vụ: ${lead.jobTitle || "Chưa cung cấp"}\nEmail: ${lead.email}\nĐiện thoại: ${lead.phone || "Chưa cung cấp"}\nNgành: ${lead.sectorLabel || "Chưa chọn"}\nQuan tâm: ${interests}\n\nNội dung khách gửi:\n${lead.message || "Chưa để lại lời nhắn."}`;
  const ownerBody = `Có yêu cầu tư vấn mới từ website IARIS.\n\n${summary}\n\nMở hồ sơ trong admin:\n${config.adminUrl}/#/leads?id=${encodeURIComponent(lead.id)}\n\nBấm Trả lời email này để liên hệ trực tiếp với khách hàng.`;
  const customerBody = `Chào ${lead.fullName},\n\nIARIS đã tiếp nhận yêu cầu tư vấn của bạn. Đội ngũ phụ trách sẽ liên hệ qua email hoặc số điện thoại bạn đã cung cấp.\n\n${summary}\n\nBạn có thể trả lời email này để bổ sung thông tin hoặc tiếp tục trao đổi với IARIS.\n\nTrân trọng,\nIARIS Cyber & Data`;
  return [
    {
      leadId: lead.id,
      kind: "OWNER_NOTICE",
      mode: config.mode,
      recipient: config.owner,
      sender: config.sender,
      replyTo: lead.email,
      subject: `[IARIS] Yêu cầu tư vấn mới · ${lead.id}`,
      text: ownerBody,
      html: htmlMessage("Yêu cầu tư vấn mới", ownerBody),
    },
    {
      leadId: lead.id,
      kind: "CUSTOMER_RECEIPT",
      mode: config.mode,
      recipient: lead.email,
      sender: config.sender,
      replyTo: config.replyTo,
      subject: `[IARIS] Đã tiếp nhận yêu cầu tư vấn · ${lead.id}`,
      text: customerBody,
      html: htmlMessage("IARIS đã nhận yêu cầu của bạn", customerBody),
    },
  ];
}

export interface MailSender {
  sendMail(
    message: SendMailOptions,
  ): Promise<{ messageId?: string; accepted?: unknown[] }>;
}
function createSender(config: MailConfiguration): MailSender {
  if (config.mode === "preview")
    return nodemailer.createTransport({ streamTransport: true, buffer: true });
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
function safeSendError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code === "EAUTH")
    return "SMTP từ chối đăng nhập. Kiểm tra SMTP_USER và mật khẩu ứng dụng.";
  if (code === "EENVELOPE")
    return "Máy chủ SMTP từ chối người gửi hoặc người nhận.";
  if (
    ["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "EDNS"].includes(
      code,
    )
  )
    return "Không kết nối được máy chủ gửi mail. Kiểm tra host, cổng và TLS.";
  return "Chưa xác nhận được máy chủ SMTP đã nhận thư. Kiểm tra hộp thư trước khi thử gửi lại.";
}

/** Database lease prevents simultaneous retries. SENT/PREVIEW are never resent. */
export async function deliverEmail(
  id: string,
  dependencies: {
    db?: PrismaClient;
    config?: MailConfiguration;
    sender?: MailSender;
    forceRetry?: boolean;
  } = {},
) {
  const db = dependencies.db ?? database(),
    config = dependencies.config ?? mailConfiguration();
  const lease = new Date();
  const row = await db.leadEmail.findUniqueOrThrow({ where: { id } });
  if (row.mode !== config.mode) return; // Changing .env must not release captured preview mail.
  const claimed = await db.leadEmail.updateMany({
    where: {
      id,
      ...(dependencies.forceRetry ? {} : { attempts: { lt: 5 } }),
      OR: [
        { status: { in: ["PENDING", "FAILED"] } },
        {
          status: "PROCESSING",
          lockedAt: { lt: new Date(Date.now() - 60000) },
        },
      ],
    },
    data: {
      status: "PROCESSING",
      lockedAt: lease,
      attempts: { increment: 1 },
      error: null,
    },
  });
  if (!claimed.count) return;
  const recipient = row.kind === "OWNER_NOTICE" ? config.owner : row.recipient;
  const replyTo =
    row.kind === "CUSTOMER_RECEIPT" ? config.replyTo : row.replyTo;
  try {
    if (config.error) throw new Error("MAIL_CONFIGURATION");
    const messageId =
      row.messageId ?? `<${row.id}@${config.sender.split("@")[1]}>`;
    const result = await (dependencies.sender ?? createSender(config)).sendMail(
      {
        from: { name: "IARIS Cyber & Data", address: config.sender },
        to: { address: recipient, name: "" },
        replyTo,
        subject: row.subject,
        text: row.text,
        html: row.html,
        messageId,
        disableFileAccess: true,
        disableUrlAccess: true,
        headers: {
          "X-Auto-Response-Suppress": "All",
          "Auto-Submitted": "auto-generated",
        },
      },
    );
    if (
      config.mode === "smtp" &&
      !result.accepted?.some(
        (address) => String(address).toLowerCase() === recipient.toLowerCase(),
      )
    )
      throw Object.assign(new Error("Recipient not accepted"), {
        code: "EENVELOPE",
      });
    await db.leadEmail.updateMany({
      where: { id, status: "PROCESSING", lockedAt: lease },
      data: {
        status: config.mode === "preview" ? "PREVIEW" : "SENT",
        recipient,
        sender: config.sender,
        replyTo,
        messageId: result.messageId ?? messageId,
        sentAt: config.mode === "smtp" ? new Date() : null,
        lockedAt: null,
        error: null,
      },
    });
  } catch (error) {
    await db.leadEmail.updateMany({
      where: { id, status: "PROCESSING", lockedAt: lease },
      data: {
        status: "FAILED",
        lockedAt: null,
        error: config.error ?? safeSendError(error),
      },
    });
  }
}
export async function deliverLeadEmails(leadId: string) {
  const rows = await database().leadEmail.findMany({
    where: { leadId },
    select: { id: true },
  });
  await Promise.all(rows.map((row) => deliverEmail(row.id)));
}
export async function customerEmailStatus(
  leadId: string,
): Promise<"preview" | "sent" | "pending"> {
  const row = await database().leadEmail.findUnique({
    where: { leadId_kind: { leadId, kind: "CUSTOMER_RECEIPT" } },
    select: { status: true },
  });
  return row?.status === "PREVIEW"
    ? "preview"
    : row?.status === "SENT"
      ? "sent"
      : "pending";
}
export async function mailHistory(leadId: string): Promise<LeadMailHistory> {
  if (
    !(await database().lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    }))
  )
    throw new HttpError(404, "Không tìm thấy yêu cầu tư vấn.");
  const config = mailConfiguration();
  const rows = await database().leadEmail.findMany({
    where: { leadId },
    orderBy: { createdAt: "asc" },
  });
  return {
    mode: config.mode,
    configured: !config.error,
    configurationError: config.error,
    items: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      mode: row.mode,
      recipient: row.recipient,
      replyTo: row.replyTo,
      subject: row.subject,
      text: row.text,
      attempts: row.attempts,
      error: row.error,
      sentAt: row.sentAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
export async function retryEmail(leadId: string, id: string, actorId: string) {
  const row = await database().leadEmail.findFirst({ where: { id, leadId } });
  if (!row) throw new HttpError(404, "Không tìm thấy email.");
  if (row.status === "SENT" || row.status === "PREVIEW")
    throw new HttpError(
      409,
      "Thư đã gửi hoặc được lưu ở chế độ thử nghiệm; không gửi lại.",
    );
  if (mailConfiguration().error)
    throw new HttpError(503, mailConfiguration().error!);
  if (row.mode !== mailConfiguration().mode)
    throw new HttpError(
      409,
      "Chế độ gửi đã đổi. Thư thử nghiệm cũ không được gửi ra ngoài.",
    );
  await database().auditLog.create({
    data: {
      actorId,
      action: "retry-email",
      collection: "leads",
      recordId: leadId,
    },
  });
  await deliverEmail(id, { forceRetry: true });
  return mailHistory(leadId);
}
