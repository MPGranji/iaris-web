import type { Collection, DemoWorkspace } from "./admin-demo";

export const DEMO_ADMIN_EMAIL = "admin@demo.iaris.local";

export interface LeadNotifications {
  newCount: number;
  latest: {
    id: string;
    fullName: string;
    organization: string;
    createdAt: string;
  }[];
}

export type AdminRole = "admin" | "editor" | "advisor";
export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}
export interface AdminBootstrap {
  user: AdminIdentity;
  workspace: DemoWorkspace;
  revision: number;
  websiteUrl: string;
}

export function canAccess(role: AdminRole, page: string): boolean {
  if (role === "admin") return true;
  if (page === "overview") return true;
  if (role === "advisor") return page === "leads";
  return page !== "members" && page !== "leads";
}
export const canEdit = (role: AdminRole, collection: Collection) =>
  canAccess(role, collection);
