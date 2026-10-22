import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { staticContent } from '../../../shared/content';
import type { SiteContent } from '../../../shared/types';

/**
 * Renders the bundled content instantly (no loading state, identical first paint),
 * then swaps in the live content from the API once it arrives.
 * If the API is unreachable the bundled content simply stays.
 */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(staticContent);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .get<SiteContent>('/content', ctrl.signal)
      .then((data) => {
        if (data?.courses?.length) setContent(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.warn('[IARIS] API unavailable, using bundled content.', err);
      });
    return () => ctrl.abort();
  }, []);

  return content;
}
