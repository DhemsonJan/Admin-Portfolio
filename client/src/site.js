/**
 * Single source of truth for everything on the public site that is NOT stored in
 * the database.
 *
 * Projects come from the API (edit them in the Project Manager). Everything else
 * — identity, copy, links, timeline, stack — lives here so it can be edited in
 * one file without touching components.
 *
 * ------------------------------------------------------------------
 * PLACEHOLDERS TO REPLACE
 * Everything marked TODO below is a placeholder. Each one is used in a single
 * place, so replacing it here updates the whole site.
 * ------------------------------------------------------------------
 */

export const identity = {
  firstName: 'Dhemson',
  lastName: 'Tubod',
  fullName: 'Dhemson Jan P. Tubod',
  shortName: 'DHEMSON JAN P. TUBOD',
  initials: 'DT',
  location: 'Philippines',
  headline: 'Fresh Computer Engineering Graduate',
  roleLine: 'Aspiring Web Developer / Front-End Developer',
  availability: 'Open to junior developer opportunities',
  photo: '/TUBOD.jpg',
  alt: 'Portrait of Dhemson Jan P. Tubod',
};

export const links = {
  github: 'https://github.com/DhemsonJan',
  githubAlt: 'https://github.com/dhemsonjanpilapiltubod-creator',
  linkedin: 'https://www.linkedin.com/in/dhemson-jan-pilapil-tubod-13b7a8402/',
  email: 'Dhemsonjanpilapiltubod@gmail.com',
  // TODO(placeholder): point at a hosted PDF once a resume exists.
  resume: '/resume.pdf',
};

export const mailto = `mailto:${links.email}`;

export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Education', href: '#education' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  eyebrow: identity.availability,
  headline: ['I build digital experiences', 'that turn ideas into', 'real products.'],
  body: `I'm ${identity.fullName}, a fresh Computer Engineering graduate passionate about web development, front-end development, UI/UX design, and practical software solutions.`,
  primary: { label: 'Explore My Work', href: '#projects' },
  secondary: { label: 'Download Resume', href: links.resume, download: true },
  // Floating labels around the portrait. The first entry is what renders in the
  // centre of the orbit; the rest distribute around it.
  labels: ['HTML5', 'CSS3', 'JavaScript', 'React', 'PHP', 'MySQL', 'Figma'],
};

export const statement = {
  title: 'Engineered with curiosity.',
  body: "I'm a fresh Computer Engineering graduate who enjoys turning ideas into functional and user-friendly digital experiences. My background combines software development, web technologies, UI/UX design, databases, and embedded systems.",
};

export const whatIDo = {
  eyebrow: 'Capabilities',
  title: 'What I do',
  items: [
    {
      number: '01',
      title: 'Front-End Development',
      body: 'Responsive and interactive interfaces using modern web technologies.',
      icon: 'layout',
    },
    {
      number: '02',
      title: 'Web Applications',
      body: 'Building practical web applications with front-end, back-end, APIs, and databases.',
      icon: 'server',
    },
    {
      number: '03',
      title: 'UI / UX Design',
      body: 'Creating wireframes, prototypes, and clean user experiences using Figma.',
      icon: 'pen',
    },
    {
      number: '04',
      title: 'Computer Engineering',
      body: 'Combining software, hardware, sensors, microcontrollers, and intelligent systems.',
      icon: 'chip',
    },
  ],
};

export const stack = {
  eyebrow: 'Toolkit',
  title: 'The tools I work with',
  note: 'Technologies I use in academic, internship, and personal projects.',
  groups: [
    {
      title: 'Front-End',
      items: ['HTML5', 'CSS3', 'JavaScript', 'React.js', 'Responsive Web Design'],
    },
    {
      title: 'Back-End',
      items: ['PHP', 'REST APIs', 'Server-side Development'],
    },
    {
      title: 'Database',
      items: ['MySQL', 'SQL', 'Firebase', 'Database Management'],
    },
    {
      title: 'UI/UX',
      items: ['Figma', 'Wireframing', 'Prototyping'],
    },
    {
      title: 'Programming Fundamentals',
      items: [
        'Object-Oriented Programming',
        'Data Structures',
        'Algorithms',
        'Problem Solving',
        'Debugging',
      ],
    },
  ],
};

export const about = {
  eyebrow: 'About',
  title: 'Engineer’s mind, developer’s hands.',
  body: [
    `I'm ${identity.fullName}, a fresh Computer Engineering graduate from Cebu Technological University – Danao Campus, currently based in Sabang, Danao City, Cebu, Philippines. I've always been interested in technology, especially in how software and hardware can work together to solve real-world problems. My interest in the field grew as I started building websites, developing software projects, and creating systems that combine both hardware and software.`,
    'Throughout my internship, academic projects, and personal projects, I gained practical experience in web development, UI/UX design, databases, and embedded systems. These experiences helped me strengthen my technical skills and taught me how to approach problems, troubleshoot issues, learn new technologies, and turn ideas into functional solutions.',
    `As a fresh graduate, I'm excited to begin my professional career and continue learning in a real-world environment. I'm eager to collaborate with others, gain valuable experience, and contribute to meaningful projects. My goal is to keep improving as a developer while creating useful, reliable, and user-friendly solutions that can make a positive impact.`,
  ],
  facts: [
    { label: 'Education', value: 'Bachelor of Science in Computer Engineering' },
    { label: 'Experience', value: '3-Month IT Internship' },
    { label: 'Location', value: identity.location },
    { label: 'Career Focus', value: 'Web Development / Front-End Development / Junior Software Development' },
  ],
};

export const experience = {
  eyebrow: 'Experience',
  title: 'Where I have worked',
  items: [
    {
      role: 'IT Intern',
      company: 'Ollopa Corporation',
      meta: '3 Months · Remote',
      summary:
        'Supported website development and UI/UX design, working across both front-end and back-end tasks during a three-month remote internship.',
      tags: [
        'Website Development',
        'UI/UX Design',
        'HTML',
        'CSS3',
        'JavaScript',
        'Figma',
        'Database Tasks',
        'Front-End & Back-End',
      ],
    },
  ],
};

export const education = {
  eyebrow: 'Education',
  title: 'Education',
  items: [
    {
      degree: 'TVL – ICT Programming',
      status: '2019 – 2020',
      detail: 'Liloan National High School, Liloan, Cebu',
    },
    {
      degree: 'Bachelor of Science in Computer Engineering',
      status: '2025 – 2026',
      detail: 'Cebu Technological University – Danao Campus, Danao City, Cebu',
    },
  ],
};

export const focus = {
  eyebrow: 'Current Focus',
  title: "What I'm looking for",
  body: "I'm looking for an opportunity where I can apply what I've learned, work with experienced developers, contribute to real projects, and continue growing professionally.",
  // Presented as equal options on purpose — no ranking, no preference claims.
  roles: [
    'Junior Web Developer',
    'Front-End Developer',
    'Junior Software Developer',
    'Web Application Developer',
  ],
};

export const contact = {
  eyebrow: 'Contact',
  title: "Let's build something.",
  body: "I'm open to opportunities, collaborations, and projects where I can learn, contribute, and grow.",
  actions: [
    { label: 'Gmail', value: 'Dhemsonjanpilapiltubod@gmail.com', href: mailto, icon: 'gmail' },
    { label: 'GitHub', value: '@DhemsonJan', href: links.github, icon: 'github', external: true },
    { label: 'GitHub', value: '@dhemsonjanpilapiltubod-creator', href: links.githubAlt, icon: 'github', external: true },
    { label: 'LinkedIn', value: 'Dhemson Jan P. Tubod', href: links.linkedin, icon: 'linkedin', external: true },
  ],
};

export const footer = {
  name: identity.fullName.toUpperCase(),
  tagline: 'Fresh Computer Engineering Graduate | Aspiring Web Developer',
  year: 2026,
};

export const sectionOrder = {
  home: 'hero',
  about: 'about',
  skills: 'skills',
  projects: 'projects',
  experience: 'experience',
  education: 'education',
  contact: 'contact',
};

export default {
  identity,
  links,
  mailto,
  nav,
  hero,
  statement,
  whatIDo,
  stack,
  about,
  experience,
  education,
  focus,
  contact,
  footer,
};