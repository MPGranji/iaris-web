import { prisma } from "../lib/prisma";
import { staticContent } from "../../../shared/content";
import type { SiteContent } from "../../../shared/types";

/** Draft tables are private. Every public endpoint reads the same published snapshot. */
export async function getSiteContent(): Promise<SiteContent> {
  if (!prisma) return staticContent;
  const publication = await prisma.publication.findFirst({
    orderBy: { revision: "desc" },
    select: { content: true },
  });
  return publication
    ? (publication.content as unknown as SiteContent)
    : { ...staticContent, source: "database" };
}
export const getLaws = async () => (await getSiteContent()).laws;
export const getCourses = async () => (await getSiteContent()).courses;
export const getTiers = async () => (await getSiteContent()).tiers;
export const getMedia = async (group?: string) =>
  (await getSiteContent()).media.filter(
    (row) => !["M1", "M2", "M3"].includes(group ?? "") || row.group === group,
  );
export const getEvents = async (status?: string) =>
  (await getSiteContent()).events.filter(
    (row) =>
      !["up", "web", "past"].includes(status ?? "") || row.status === status,
  );
export const getElearning = async () => {
  const content = await getSiteContent();
  return { lessons: content.lessons, quiz: content.quiz };
};
