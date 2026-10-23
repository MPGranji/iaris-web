import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";
import { Prisma } from "@prisma/client";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({
        error: "Dữ liệu không hợp lệ",
        details: err.flatten().fieldErrors,
      });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  // express.json() body parse errors
  if (err?.type === "entity.too.large") {
    res
      .status(413)
      .json({ error: "Nội dung quá dài. Vui lòng rút gọn trước khi lưu." });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      err.code === "P2002" || err.code === "P2034"
        ? 409
        : err.code === "P2025"
          ? 404
          : err.code === "P2003"
            ? 400
            : 500;
    res
      .status(status)
      .json({
        error:
          status === 409
            ? "Dữ liệu bị trùng hoặc vừa được cập nhật. Tải lại rồi thử tiếp."
            : status === 404
              ? "Bản ghi không còn tồn tại."
              : status === 400
                ? "Bản ghi đang liên kết dữ liệu khác."
                : "Không thể lưu dữ liệu.",
      });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
