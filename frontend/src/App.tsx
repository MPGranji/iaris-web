import { useCallback, useState } from 'react';
import type { SiteEvent } from '../../shared/types';
import { useSiteContent } from './hooks/useSiteContent';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { StatsStrip } from './components/StatsStrip';
import { Footer } from './components/Footer';
import { About } from './sections/About';
import { Courses } from './sections/Courses';
import { Media } from './sections/Media';
import { Elearning } from './sections/Elearning';
import { Events } from './sections/Events';
import { Contact, type ContactPrefill } from './sections/Contact';

export default function App() {
  const content = useSiteContent();
  const [prefill, setPrefill] = useState<ContactPrefill | null>(null);

  const registerForEvent = useCallback((e: SiteEvent) => {
    setPrefill({ message: `Đăng ký: ${e.title}`, eventSlug: e.slug, nonce: Date.now() });
  }, []);

  return (
    <>
      <Nav />
      <Hero laws={content.laws} />
      <StatsStrip content={content} />
      <main>
        <About />
        <Courses courses={content.courses} tiers={content.tiers} />
        <Media media={content.media} />
        <Elearning lessons={content.lessons} quiz={content.quiz} />
        <Events events={content.events} onRegister={registerForEvent} />
        <Contact tiers={content.tiers} prefill={prefill} />
      </main>
      <Footer />
    </>
  );
}
