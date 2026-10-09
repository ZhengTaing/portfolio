import type { MediaImage, Project, ProjectCategory } from '../types/content'

export const projectCategories: { id: ProjectCategory; label: string }[] = [
  { id: 'ios-ai', label: 'iOS / AI' },
  { id: 'apps', label: 'Apps' },
  { id: 'games', label: 'Games' },
  { id: 'tools', label: 'Tools & automation' },
  { id: 'creative-code', label: 'Creative code' },
]

const img = (slug: string, file: string, width: number, height: number, alt: string, caption?: string): MediaImage => ({
  src: `/media/projects/${slug}/${file}.jpg`,
  alt,
  width,
  height,
  caption,
})

// Case-study text comes from the project documents (mAgI expo poster, Looklab
// CPSC 411 presentation, Lost CPSC 362 design document).
export const projects: Project[] = [
  {
    id: 'p-magi',
    slug: 'magi',
    title: 'mAgI',
    year: 2024,
    summary:
      'An AI companion app that lets you text, call and video-chat with your favorite characters for company and emotional support.',
    description:
      'mAgI bridges our need for companionship with the convenience of technology. Users pick favorite characters and celebrities, then talk with them by text, voice or video, as a friendly, non-judgmental presence through the day.',
    category: 'ios-ai',
    technologies: ['iOS', 'Conversational AI', 'UI/UX design', 'Research'],
    context: 'CSUF Computer Science · ECS Student Project Innovation Expo 2024 · Faculty mentor: Dr. Lidia Morrison',
    thumbnail: img('magi', 'home-screens', 1795, 1215, 'mAgI home screens showing a featured animated character and rows of music, movie, TV and cartoon favorites'),
    gallery: [
      img('magi', 'login-discover', 1769, 1215, 'mAgI login screen and Discover page with a grid of character portraits', 'Login and Discover'),
      img('magi', 'profile-call', 1795, 1215, 'Character profile page with call, message and video buttons, next to a voice call screen', 'Character profile and voice call'),
      img('magi', 'message-video', 1795, 1215, 'Text conversation screen next to a video call with an animated character', 'Messaging and video call'),
      img('magi', 'poster', 2000, 1125, 'mAgI research poster from the ECS Student Project Innovation Expo 2024', 'Innovation Expo 2024 poster'),
    ],
    status: 'prototype',
    featured: true,
    caseStudy: {
      problem:
        'Loneliness and stress are widespread: global anxiety and depression rose by about 25% during the COVID-19 lockdowns, many seniors are isolated, and 83% of teens name school as a major source of stress. Therapy works but is not always affordable, stigma keeps people from asking for help, and evidence for existing mental-health apps is thin. mAgI explores a friendlier, always-available kind of companionship.',
      features: [
        'Search and choose a favorite character, whose profile opens like a contact card',
        'Text, call or video-chat with that character',
        'Record moments from conversations and save or share them',
        'Everyday help: to-do lists, reminders and motivational quotes',
        'Personalized from the user’s chosen characters and past conversations',
      ],
      role: 'Solo research and design project, mentored by Dr. Lidia Morrison (CSUF Computer Science) and presented at the ECS Student Project Innovation Expo 2024.',
      process:
        'The goal was an app that feels trustworthy, reliable and friendly, and is usable by people who are not tech-savvy. Users start by picking a few favorite characters; the app keeps track of their experiences and conversations so the AI can read their mood and respond appropriately, creating a safe, customized space to talk about their day.',
      outcomes:
        'A full interface prototype covering login, discovery, character profiles, messaging, voice and video calls, presented as a research poster. Next steps: wellness check-ins and reminders built into daily routines and home systems, and experiences for theme parks and concerts.',
    },
  },
  {
    id: 'p-looklab',
    slug: 'looklab',
    title: 'Looklab',
    year: 2024,
    summary:
      'An iOS shopping app that brings online clothing stores into one place, with a virtual try-on feature.',
    description:
      'Looklab is a mobile app designed to improve online clothing shopping. It simplifies shopping by bringing many online clothing stores into a single platform, and keeps people engaged with an innovative try-on feature.',
    category: 'apps',
    technologies: ['Swift', 'SwiftUI', 'Xcode'],
    context: 'CPSC 411 · Cal State Fullerton',
    team: ['Keang Zheng Taing', 'Derek Le', 'Roy Joacquin Masepequena', 'Jeremy Braneke-Hite'],
    thumbnail: img('looklab', 'ui-showcase', 2000, 1125, 'Looklab UI showcase comparing the built app screens with the original mockups'),
    gallery: [
      img('looklab', 'product-detail', 2000, 1125, 'Looklab product detail screen for a buckle-detail jacket dress', 'Product detail'),
      img('looklab', 'technical-details', 2000, 1125, 'SwiftUI code for the ProductTryOnView screen', 'SwiftUI try-on view'),
      img('looklab', 'testing', 2000, 1125, 'Slide outlining unit, integration and usability testing', 'Testing and QA'),
      img('looklab', 'overview', 2000, 1125, 'Looklab logo with a short description of the app', 'Overview'),
    ],
    repositoryUrl: 'https://github.com/ZhengTaing/cpsc411_TUCP',
    status: 'prototype',
    featured: true,
    caseStudy: {
      problem:
        'Shopping for clothes online means jumping between many stores and guessing how things will look. Looklab aims to simplify that by gathering stores into one app and letting people try items on virtually.',
      features: [
        'One place to browse products from multiple online clothing stores',
        '“For You” feed with categories and product cards',
        'Product detail pages with sizes, price and add to cart',
        'Try-on view for seeing how a piece might look',
      ],
      role: 'One of four developers on the team.',
      process:
        'The interface was designed as mockups first, then built screen by screen in SwiftUI and compared against the designs. Quality was checked with unit tests for individual components, integration tests to make sure modules worked together, and usability testing of the interface and overall experience.',
      outcomes:
        'A working iOS prototype matching the mockups. Future development focuses on web scraping to pull live product information from many stores (real-time updates, price comparison, wider retailer coverage) and on improving try-on through an API or a custom machine-learning model.',
    },
  },
  {
    id: 'p-lost',
    slug: 'lost',
    title: 'Lost: A Hidden Odyssey',
    year: 2023,
    summary:
      'A first-person horror maze game in Unreal Engine: find your way through a dark forest to a cabin before something catches you.',
    description:
      'Lost is a maze game built in Unreal Engine. Players navigate a forest of intricate pathways and obstacles to reach a cabin before an entity catches up, using problem-solving, observation and quick reflexes as the maze grows more complex.',
    category: 'games',
    technologies: ['Unreal Engine', 'C++', 'Git', 'VS Code'],
    context: 'CPSC 362 · Cal State Fullerton',
    team: ['Dillon Noronha', 'Keang Zheng Taing', 'Brian Baik', 'Zihua Yang', 'Bemwa Habashy'],
    thumbnail: img('lost', 'menu', 1459, 865, 'Lost main menu: the Hidden Odyssey title glowing over a dark field of wildflowers'),
    gallery: [
      img('lost', 'gameplay', 1418, 912, 'First-person gameplay in a misty, moonlit forest holding a flashlight', 'Gameplay'),
      img('lost', 'opening-credits', 1459, 849, 'Opening screen with the Hidden Odyssey tree logo and "Press to start game"', 'Opening credits'),
      img('lost', 'pause-menu', 1425, 836, 'Pause menu with resume, options and exit over the darkened forest', 'Pause menu'),
      img('lost', 'activity-diagram', 1627, 1609, 'Activity diagram of the game flow from login through maze generation to game over', 'Activity diagram'),
      img('lost', 'uml-diagram', 1495, 708, 'UML class diagram of the game’s main classes and relationships', 'UML class diagram'),
    ],
    status: 'prototype',
    featured: true,
    caseStudy: {
      problem:
        'Build a tense, replayable survival game: a maze that changes as you move, with atmosphere doing as much work as enemies, and difficulty that ramps up level by level.',
      features: [
        'Map system that spawns obstacles and NPCs as the player moves through the maze',
        'Randomly placed enemies and hazards that scale with difficulty',
        'Health and combat systems',
        'Dynamic lighting that limits vision to build suspense',
        'Multiple levels and themes, a leaderboard, and a settings menu',
        'Menu, new game / load game, and pause flows',
      ],
      role: 'One of five developers on the team.',
      process:
        'The team wrote requirements with user stories and use cases, then designed the game mechanics, levels and UI (use-case, activity and UML class diagrams). Development was split into blocks, each unit-tested at checkpoints to isolate errors. A risk table tracked issues like software complexity, memory use and limited engine resources, and the team shared tool versions and clear Git workflows to keep branches merging smoothly.',
      outcomes:
        'A playable Unreal Engine prototype with opening credits, a main menu, atmospheric first-person gameplay and a pause menu, plus a full design document covering requirements, architecture, testing and risks.',
    },
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
export const featuredProjects = () => projects.filter((p) => p.featured)
