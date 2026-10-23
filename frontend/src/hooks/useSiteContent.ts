import { useEffect, useState } from "react";
import { api } from "../api/client";
import { staticContent } from "../../../shared/content";
import type { SiteContent } from "../../../shared/types";

/**
 * Renders the bundled content instantly (no loading state, identical first paint),
 * then swaps in the live content from the API once it arrives.
 * If the API is unreachable the bundled content simply stays.
 */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(staticContent);

  useEffect(() => {
    const ctrl = new AbortController();
    const refresh = () =>
      api
        .get<SiteContent>("/content", ctrl.signal)
        .then((data) => {
          if (Array.isArray(data?.courses) && Array.isArray(data?.tiers)) {
            setContent(data);
            const seo = data.settings?.footer;
            if (seo?.seoTitle) document.title = seo.seoTitle;
            const description = document.querySelector(
              'meta[name="description"]',
            );
            if (description && seo?.seoDescription)
              description.setAttribute("content", seo.seoDescription);
          }
        })
        .catch((err) => {
          if (err?.name !== "AbortError")
            console.warn(
              "[IARIS] API unavailable, using bundled content.",
              err,
            );
        });
    refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(onFocus, 30000);
    window.addEventListener("focus", onFocus);
    return () => {
      ctrl.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return content;
}
