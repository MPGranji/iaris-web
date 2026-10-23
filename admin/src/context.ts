import { createContext, useContext } from "react";
import type { Page } from "./schema";
import type { WorkspaceStore } from "./store";

export interface AdminContextValue extends WorkspaceStore {
  navigate: (page: Page, id?: string) => void;
  notify: (message: string) => void;
  confirm: (
    title: string,
    message: string,
    action?: string,
  ) => Promise<boolean>;
  setDirty: (value: boolean) => void;
}
export const AdminContext = createContext<AdminContextValue | null>(null);
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("AdminContext is missing");
  return context;
}
