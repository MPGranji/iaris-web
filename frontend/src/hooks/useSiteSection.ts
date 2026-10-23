import { createContext, useContext } from "react";
import {
  defaultSections,
  type SiteSection,
} from "../../../shared/site-settings";

export const SiteSettingsContext = createContext<Record<string, SiteSection>>(
  {},
);
export function useSiteSection(id: string): SiteSection {
  const settings = useContext(SiteSettingsContext);
  return (
    settings[id] ??
    (defaultSections.find((section) => section.id === id) as SiteSection) ??
    {}
  );
}
