import type { Request, Response } from "express";
import * as content from "../services/content.service";

// Revalidate published content so admin updates become visible on the next fetch.
const cache = (res: Response) => res.set("Cache-Control", "no-cache");
const q = (v: unknown) => (typeof v === "string" ? v : undefined);

export async function getSiteContent(_req: Request, res: Response) {
  cache(res).json(await content.getSiteContent());
}

export async function getLaws(_req: Request, res: Response) {
  cache(res).json(await content.getLaws());
}

export async function getCourses(_req: Request, res: Response) {
  cache(res).json(await content.getCourses());
}

export async function getTiers(_req: Request, res: Response) {
  cache(res).json(await content.getTiers());
}

/** Flat list used by the "Ngành" dropdown */
export async function getSectors(_req: Request, res: Response) {
  const tiers = await content.getTiers();
  cache(res).json(
    tiers.flatMap((t) =>
      t.programs.map((p) => ({ name: p.name, tier: t.shortLabel })),
    ),
  );
}

export async function getMedia(req: Request, res: Response) {
  cache(res).json(await content.getMedia(q(req.query.group)));
}

export async function getEvents(req: Request, res: Response) {
  cache(res).json(await content.getEvents(q(req.query.status)));
}

export async function getElearning(_req: Request, res: Response) {
  cache(res).json(await content.getElearning());
}
