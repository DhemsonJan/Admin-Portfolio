/**
 * Seeds the three starter projects. Safe to run repeatedly: existing slugs are
 * left untouched.
 *
 *   npm run seed          add anything missing
 *   npm run seed -- --reset   restore the starter set exactly
 */
import config from '../config/env.js';
import { getDb, initDb } from './index.js';
import { migrate } from './schema.js';
import { initStorage } from '../storage/index.js';
import { createProject, findBySlug, listAll } from '../services/projects.js';

const STARTER_PROJECTS = [
  {
    slug: 'binbot',
    title: 'AI-Enabled Smart Trash Bin with Sensor and Image Detection for Automated Waste Sorting',
    shortDescription:
      'An AI-enabled smart trash bin that assists automated waste classification and monitoring by combining image detection, sensors, microcontrollers, and a web dashboard.',
    fullDescription:
      'An AI-enabled smart trash bin that assists automated waste classification and monitoring by combining image detection, sensors, microcontrollers, and a web dashboard. The device captures each item at the point of disposal, classifies it, and routes it into the correct compartment, while a dashboard keeps the system observable and controllable. It brings hardware, a trained model, a back end, and an interface together in one working system.',
    category: 'Computer Engineering',
    categories: ['Computer Engineering', 'AI / Machine Learning', 'IoT', 'Web Development'],
    technologies: ['ESP32-S3', 'ESP32-CAM', 'Python', 'Flask', 'JavaScript', 'HTML5', 'CSS3'],
    keyFeatures: [
      'Waste classification',
      'Image detection',
      'Sensor monitoring',
      'Automated sorting',
      'Web dashboard',
      'Manual monitoring / control',
    ],
    problem:
      'Waste segregation still depends heavily on people sorting their own trash correctly. When items are thrown in the wrong bin, contamination happens, recyclables end up in landfill, and the mistake is rarely noticed until collection day. Manual sorting also does not scale, and most people are not given clear feedback at the moment they dispose of something.',
    solution:
      'Binbot combines a camera module, sensors, and a microcontroller to identify waste at the point of disposal. The camera captures the item, an image-detection model classifies it, and the microcontroller coordinates the sorting mechanism so the waste is directed into the correct compartment. A Python back end and a web dashboard let the system be monitored, and the bin can also be controlled manually when a decision needs to be confirmed.',
    contribution:
      'I worked on the system design and overall project implementation, built the web dashboard front end, designed the user interface, and integrated the hardware and software sides of the system. I also handled the database and API work needed to move detection and sensor data between the device and the dashboard.',
    role: 'Developer',
    year: null,
    githubUrl:
      'https://github.com/DhemsonJan/AI-Smart-Trash-Bin-for-Automated-Waste-Sorting',
    demoUrl: 'https://vercel.com/dhemson-jan-tubod/ai-smart-trash-bin',
    status: 'published',
    featured: true,
    sortOrder: 0,
  },
  {
    slug: 'vendura-aterra',
    title: 'Vendura Aterra X7',
    shortDescription:
      'A fully responsive, single-page marketing site for a fictional luxury capability SUV, built with clean visual hierarchy, refined typography, and a quiet-luxury automotive aesthetic.',
    fullDescription:
      'Vendura Aterra X7 is a premium single-page marketing website for a fictional luxury capability SUV. The site presents the vehicle through storytelling, feature highlights, trim configurations, technical specifications, and a test-drive enquiry form. The design leans on a dark, modern luxury style with strong typography and smooth scrolling, and every section is built to stay readable and composed at any screen size.',
    category: 'Web Development',
    categories: ['Web Development', 'Front-End', 'UI/UX'],
    technologies: ['React.js', 'Vite', 'JavaScript', 'HTML5', 'CSS3'],
    keyFeatures: [
      'Single-page luxury landing design',
      'Hero with clear calls to action',
      'Story and philosophy sections',
      'Feature grid: engine, suspension, terrain modes, infotainment',
      'Gallery with four trim variants and pricing',
      'Detailed technical specifications',
      'Test-drive booking form (demo)',
      'Fully responsive layout',
      'Sticky navigation with smooth section linking',
    ],
    problem:
      'Luxury automotive brands live or die on presentation. A spec sheet alone does not sell a premium vehicle; the brand has to tell a story, make the product feel considered, and give buyers a reason to imagine themselves behind the wheel. Recreating that quiet-luxury experience in the browser means strong typography, confident spacing, and a flow that guides a visitor from the headline to an enquiry without friction.',
    solution:
      'I built a single-page site that walks a visitor through the Aterra X7 in a deliberate order: a hero with clear calls to action, story and philosophy sections, a feature grid covering the engine, suspension, terrain modes, and infotainment, a gallery with four trim variants and pricing, detailed technical specifications, and a test-drive booking form. A sticky navigation with smooth section links lets people move through the story at their own pace, and the whole layout is fully responsive.',
    contribution:
      'I designed and developed the site end to end: the visual direction and typography, the page structure and copy, the responsive behaviour, and the interactive sections such as the trim gallery and test-drive form. I built it with React and Vite and deployed it to Vercel.',
    role: 'Front-End Developer',
    year: null,
    githubUrl: 'https://github.com/dhemsonjanpilapiltubod-creator/Vendura-Atterra-',
    demoUrl: 'https://vendura-atterra.vercel.app/',
    status: 'published',
    featured: false,
    sortOrder: 1,
  },
  {
    slug: 'ultra-hotel',
    title: 'Ultra Hotel',
    shortDescription:
      'A 5-star family-friendly beachfront resort presented as a group portfolio site, with a static front end and a zero-dependency booking and enquiry back end that shares one pricing engine with the browser.',
    fullDescription:
      'Ultra Hotel is a group portfolio site for a 5-star family-friendly beachfront resort. The front end is a set of static pages with no build step, and the booking and enquiry back end runs entirely on the Node standard library with no third-party dependencies and no lockfile. The catalogue, booking validation, and pricing logic live in a shared module that both the browser and the server import, so the live quote a guest watches and the amount the API charges can never drift apart. Reservations and enquiries are persisted to SQLite through the built-in node:sqlite module, with a JSON fallback where that is unavailable.',
    category: 'Web Development',
    categories: ['Web Development', 'Back-End', 'Full-Stack'],
    technologies: ['JavaScript', 'Node.js', 'SQLite', 'HTML5', 'CSS3', 'REST APIs'],
    keyFeatures: [
      'Thirteen static pages, including hotels, booking, dining, events, weddings, and gallery',
      'Live booking quote shared between browser and server',
      'Reservations, enquiries, newsletter, dining, spa, and proposal APIs',
      'Shared catalogue and pricing engine imported by client and server',
      'Zero dependencies, no build step, no lockfile',
      'SQLite storage via node:sqlite with a JSON fallback',
      'Integer PHP centavo pricing and timezone-free dates',
    ],
    problem:
      'A hotel group needs both halves of a hospitality site to work at once: rich marketing pages for properties, dining, events, and weddings, and a booking flow people can trust enough to hand over their details. That usually means a heavy framework, a build pipeline, and a stack of dependencies just to get started, which is a lot of machinery for a site that mostly serves content and takes enquiries.',
    solution:
      'I kept the front end static and dependency-free so the browser loads the same modules the server runs, and moved the booking logic into one shared, side-effect-free module used on both sides. The Node HTTP server exposes a small JSON API for the catalogue, live quotes, reservations, newsletter signups, and enquiries, and persists data to SQLite through node:sqlite with a JSON fallback. There is no build step, no lockfile, and nothing to install.',
    contribution:
      'I built the full project: the thirteen static pages and their components, the shared catalogue and pricing engine, the booking and enquiry APIs, and the SQLite persistence layer with its JSON fallback. Money is handled as integer PHP centavos and dates as local calendar strings so nothing drifts across time zones. I deployed the site to Vercel.',
    role: 'Full-Stack Developer',
    year: null,
    githubUrl: 'https://github.com/DhemsonJan/Ultra-Hotel',
    demoUrl: 'https://ultra-hotel.vercel.app/',
    status: 'published',
    featured: false,
    sortOrder: 2,
  },
];

const run = async () => {
  await initDb(config);
  await migrate();
  await initStorage();

  // Tests and experiments reorder rows and toggle featured, which a plain seed
  // cannot undo because it skips existing slugs. `--reset` restores the starter
  // set exactly as defined here.
  const reset = process.argv.includes('--reset');
  if (reset) {
    const db = await getDb();
    const { changes } = await db.run('DELETE FROM projects');
    const removed = Number(changes ?? 0);
    if (removed > 0) console.log(`- reset   removed ${removed} existing project(s)`);
  }

  let created = 0;
  let skipped = 0;

  for (const project of STARTER_PROJECTS) {
    const existing = await findBySlug(project.slug);
    if (existing) {
      console.log(`· skipped  ${project.slug} (already exists)`);
      skipped += 1;
      continue;
    }

    await createProject(project);
    console.log(`+ created  ${project.slug}`);
    created += 1;
  }

  const all = await listAll();
  console.log('');
  console.log(`Seed complete. ${created} created, ${skipped} skipped, ${all.length} total.`);
  process.exit(0);
};

run().catch((error) => {
  console.error('\n[seed] failed\n', error);
  process.exit(1);
});