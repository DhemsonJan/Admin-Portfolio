import { useEffect, useMemo, useState } from 'react';
import Intro from '../components/Intro.jsx';
import PublicNav from '../components/PublicNav.jsx';
import Footer from '../components/Footer.jsx';
import BackToTop from '../components/BackToTop.jsx';
import ScrollProgress from '../components/fx/ScrollProgress.jsx';
import CursorGlow from '../components/fx/CursorGlow.jsx';
import { LoadingBlock } from '../components/Spinner.jsx';
import Hero from '../sections/Hero.jsx';
import Marquee from '../components/Marquee.jsx';
import Statement from '../sections/Statement.jsx';
import WhatIDo from '../sections/WhatIDo.jsx';
import FeaturedProject from '../sections/FeaturedProject.jsx';
import OtherProjects from '../sections/OtherProjects.jsx';
import TechStack from '../sections/TechStack.jsx';
import About from '../sections/About.jsx';
import Experience from '../sections/Experience.jsx';
import Education from '../sections/Education.jsx';
import Focus from '../sections/Focus.jsx';
import Contact from '../sections/Contact.jsx';
import { identity } from '../site.js';
import api from '../lib/api.js';

/**
 * The public site.
 *
 * Projects are fetched from the API and split into one featured entry plus the
 * remainder, so the featured project follows whatever is marked as featured in
 * the Project Manager instead of being hardcoded here.
 *
 * A fetch failure does not take the page down: the sections that are not
 * project-dependent still render, which keeps the site usable if the API blips.
 */
export default function Home() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('loading');
  const [resumeUrl, setResumeUrl] = useState(hero.secondary.href);

  useEffect(() => {
    document.title = `${identity.fullName} — ${identity.roleLine}`;

    const controller = new AbortController();

    api
      .listPublicProjects(controller.signal)
      .then((result) => {
        setProjects(result.projects ?? []);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setStatus('error');
      });

    api.getMeta(controller.signal)
      .then((m) => setResumeUrl(m.resumeUrl || hero.secondary.href))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const { featured, others } = useMemo(() => {
    const featuredProject = projects.find((project) => project.featured) ?? projects[0] ?? null;
    return {
      featured: featuredProject,
      others: projects.filter((project) => project.id !== featuredProject?.id),
    };
  }, [projects]);

  if (status === 'loading') {
    return (
      <div className="page-loading">
        <Intro />
        <LoadingBlock label="Loading portfolio…" />
      </div>
    );
  }

  return (
    <>
      <Intro />
      <ScrollProgress />
      <CursorGlow />
      <PublicNav />

      <main id="main" data-resume={resumeUrl}>
        <Hero />
        <Marquee />
        <Statement />
        <WhatIDo />
        {featured && <FeaturedProject project={featured} />}
        <OtherProjects projects={others} />
        <TechStack />
        <About />
        <Experience />
        <Education />
        <Focus />
        <Contact />
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}