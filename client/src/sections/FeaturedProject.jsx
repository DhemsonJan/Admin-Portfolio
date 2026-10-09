import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ProjectExternalLinks from '../components/ProjectExternalLinks.jsx';
import ProjectVisual from '../components/ProjectVisual.jsx';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';
import MagneticButton from '../components/fx/MagneticButton.jsx';
import Parallax from '../components/fx/Parallax.jsx';

/**
 * Featured project, presented as a case study.
 *
 * All copy comes from the project record — including the problem / solution /
 * contribution blocks, which are editable in the Project Manager — so editing
 * the project updates this section with no code change.
 */
function CaseBlock({ label, body, delay }) {
  if (!body) return null;
  return (
    <Reveal className="case-block" delay={delay}>
      <h3 className="case-label">{label}</h3>
      <p className="case-body">{body}</p>
    </Reveal>
  );
}

export default function FeaturedProject({ project }) {
  if (!project) return null;

  const blocks = [
    { label: 'The problem', body: project.problem },
    { label: 'The solution', body: project.solution },
    { label: 'My contribution', body: project.contribution },
  ];

  return (
    <section className="section featured" id="featured" aria-labelledby="featured-title">
      <div className="featured-aura" aria-hidden="true" />
      <div className="wrap">
        <SectionHeading
          eyebrow="Featured Project"
          title="The one I would build again."
          lede="A full system, not a mockup — hardware, a trained model, a back end, and an interface people actually use."
          id="featured-title"
        />

        <Reveal className="featured-frame">
          <Parallax speed={0.06} className="featured-visual">
            <ProjectVisual
              src={project.thumbnailUrl}
              alt={`${project.title} preview`}
              label={project.title}
              ratio="16 / 9"
            />
          </Parallax>

          <div className="featured-meta">
            <p className="featured-index" aria-hidden="true">
              01
            </p>
            <div className="featured-head">
              <h3 className="featured-title">{project.title}</h3>
              <p className="featured-subtitle">{project.shortDescription}</p>
            </div>

            <ul className="tag-list" aria-label="Technologies used">
              {project.technologies.map((tech) => (
                <li className="tag" key={tech}>
                  {tech}
                </li>
              ))}
            </ul>

            {project.role && (
              <dl className="featured-facts">
                <div>
                  <dt>Role</dt>
                  <dd>{project.role}</dd>
                </div>
                {project.year && (
                  <div>
                    <dt>Year</dt>
                    <dd>{project.year}</dd>
                  </div>
                )}
                <div>
                  <dt>Focus</dt>
                  <dd>{project.categories.join(' · ')}</dd>
                </div>
              </dl>
            )}
          </div>
        </Reveal>

        <div className="case-grid">
          {blocks.map((block, index) => (
            <CaseBlock key={block.label} {...block} delay={index * 90} />
          ))}

          {project.keyFeatures.length > 0 && (
            <Reveal className="case-block case-features" delay={270}>
              <h3 className="case-label">Key features</h3>
              <ul className="feature-list">
                {project.keyFeatures.map((feature) => (
                  <li key={feature}>
                    <Icon name="check" size={15} />
                    {feature}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        <Reveal className="featured-actions" delay={200}>
          <MagneticButton as={Link} to={`/projects/${project.slug}`} className="btn btn-primary">
            View Project
            <Icon name="arrow" size={17} />
          </MagneticButton>

          {/* Icon-only external links, matching the project cards. */}
          <ProjectExternalLinks
            githubUrl={project.githubUrl}
            websiteUrl={project.websiteUrl ?? project.demoUrl}
          />
        </Reveal>
      </div>
    </section>
  );
}