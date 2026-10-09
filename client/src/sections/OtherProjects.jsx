import { Link } from 'react-router-dom';
import ProjectExternalLinks from '../components/ProjectExternalLinks.jsx';
import ProjectVisual from '../components/ProjectVisual.jsx';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

/**
 * Secondary projects.
 *
 * Numbered 02 / 03 by position rather than by id, so the sequence stays correct
 * when a project is reordered or unpublished in the Project Manager.
 */
function Tile({ project, index }) {
  const position = String(index + 2).padStart(2, '0');

  return (
    <Reveal as="article" className="tile" delay={index * 110}>
      <Link className="tile-link" to={`/projects/${project.slug}`}>
        <div className="tile-visual">
          <ProjectVisual
            src={project.thumbnailUrl}
            alt={`${project.title} preview`}
            label={project.title}
            ratio="16 / 10"
            compact
          />
          <span className="tile-index" aria-hidden="true">
            {position}
          </span>
        </div>

        <div className="tile-body">
          <h3 className="tile-title">{project.title}</h3>
          <p className="tile-text">
            {project.shortDescription || 'Description coming soon.'}
          </p>

          {project.technologies.length > 0 && (
            <ul className="tag-list is-compact" aria-label="Technologies used">
              {project.technologies.map((tech) => (
                <li className="tag" key={tech}>
                  {tech}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>

      <div className="tile-actions">
        <ProjectExternalLinks
          githubUrl={project.githubUrl}
          websiteUrl={project.websiteUrl ?? project.demoUrl}
        />
      </div>
    </Reveal>
  );
}

export default function OtherProjects({ projects = [] }) {
  if (projects.length === 0) return null;

  return (
    <section className="section" id="projects" aria-labelledby="projects-title">
      <div className="wrap">
        <SectionHeading
          eyebrow="More Projects"
          title="Also built."
          lede="Web applications and personal work. Details stay editable from the Project Manager."
          id="projects-title"
        />
        <div className="tile-grid">
          {projects.map((project, index) => (
            <Tile project={project} index={index} key={project.id ?? project.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}