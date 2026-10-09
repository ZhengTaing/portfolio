import type { MediaImage, Project, ProjectCategory } from '../types/content'

export const projectCategories: { id: ProjectCategory; label: string }[] = [
  { id: 'ios-ai', label: 'iOS / AI' },
  { id: 'apps', label: 'Apps' },
  { id: 'games', label: 'Games' },
  { id: 'ml', label: 'Machine Learning' },
  { id: 'design', label: 'Software Design' },
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
// CPSC 411 presentation, Lost CPSC 362 design document, CPSC 481 Naive Bayes
// presentation, CPSC 462 HOMIE design deck) and the résumé.
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
    technologies: ['Swift', 'Xcode', 'OpenAI API', 'ElevenLabs API'],
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
      role: 'Solo project (Jan–May 2024): research, design and iOS development. Implemented Swift with the OpenAI and ElevenLabs APIs in Xcode to power texting, voice calls and video calls with characters. Mentored by Dr. Lidia Morrison and presented at the ECS Student Project Innovation Expo 2024.',
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
    year: 2023,
    summary:
      'An iOS shopping app that brings online clothing stores into one place, with a virtual try-on feature.',
    description:
      'Looklab is a mobile app designed to improve online clothing shopping. It simplifies shopping by bringing many online clothing stores into a single platform, and keeps people engaged with an innovative try-on feature.',
    category: 'apps',
    technologies: ['Swift', 'SwiftUI', 'Xcode'],
    context: 'CPSC 411 · Cal State Fullerton · Sept–Dec 2023',
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
      role: 'Front-end developer on a team of four: built the app\u2019s front-end mechanics in Swift, letting users try on clothes and archive their closet.',
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
      'A first-person, sound-driven multiplayer horror game in Unreal Engine: find your way through a dark forest maze to a cabin before something catches you.',
    description:
      'Lost is a maze game built in Unreal Engine. Players navigate a forest of intricate pathways and obstacles to reach a cabin before an entity catches up, using problem-solving, observation and quick reflexes as the maze grows more complex.',
    category: 'games',
    technologies: ['Unreal Engine', 'C#', 'Blueprints', 'C++', 'Git'],
    context: 'CPSC 362 · Cal State Fullerton · Jan–May 2023',
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
      role: 'Developer on a team of five: used C# and Blueprints in Unreal Engine, focusing on dynamic, audio-driven gameplay and AI enemy mechanics.',
      process:
        'The team wrote requirements with user stories and use cases, then designed the game mechanics, levels and UI (use-case, activity and UML class diagrams). Development was split into blocks, each unit-tested at checkpoints to isolate errors. A risk table tracked issues like software complexity, memory use and limited engine resources, and the team shared tool versions and clear Git workflows to keep branches merging smoothly.',
      outcomes:
        'A playable Unreal Engine prototype with opening credits, a main menu, atmospheric first-person gameplay and a pause menu, plus a full design document covering requirements, architecture, testing and risks.',
    },
  },
  {
    id: 'p-naive-bayes',
    slug: 'naive-bayes-spam',
    title: 'Naive Bayes Spam Classifier',
    year: 2024,
    summary:
      'Research comparing a self-built Naive Bayes spam filter with scikit-learn Naive Bayes, logistic regression and a neural network.',
    description:
      'An evaluation of how well Naive Bayes classifiers detect spam email. We built one from scratch, then compared it with Multinomial and Complement Naive Bayes, logistic regression and a TensorFlow/Keras neural network on the same data.',
    category: 'ml',
    technologies: ['Python', 'scikit-learn', 'TensorFlow / Keras', 'Google Colab'],
    context: 'CPSC 481 research · Cal State Fullerton · Jan–May 2024',
    team: ['Benjamin Seidel', 'Juan Aguirre', 'Keang Zheng Taing'],
    thumbnail: img('naive-bayes-spam', 'evaluation-accuracy', 2000, 1125, 'Bar charts comparing accuracy, precision, recall and F1 score of the spam classifiers'),
    gallery: [
      img('naive-bayes-spam', 'self-built', 2000, 1125, 'Four-step pipeline of the self-built Naive Bayes classifier: vectorize, priors, conditional probabilities, classify', 'Self-built classifier pipeline'),
      img('naive-bayes-spam', 'approach', 2000, 1125, 'Approach: two datasets, preprocessing with merging, cleaning, stemming and lemmatization, and two attempts', 'Approach and preprocessing'),
      img('naive-bayes-spam', 'confusion-matrices', 2000, 1125, 'Confusion matrices for each model on the test set', 'Confusion matrices'),
      img('naive-bayes-spam', 'neural-network', 2000, 1125, 'TensorFlow/Keras code defining a four-layer neural network for spam detection', 'Neural network model'),
    ],
    status: 'complete',
    featured: true,
    caseStudy: {
      problem:
        'Build an effective spam filter with Naive Bayes classification, improving productivity and security by accurately identifying spam, and measure how its \u201cnaive\u201d independence assumption holds up against other models.',
      features: [
        'Self-built Naive Bayes: bag-of-words vectorizing, prior and conditional probabilities, classification',
        'Multinomial Naive Bayes with CountVectorizer (about 93.05% accuracy)',
        'Complement Naive Bayes with TF-IDF for imbalanced data (about 93% accuracy)',
        'Logistic regression with TF-IDF (about 97% accuracy)',
        'TensorFlow/Keras neural network for comparison',
      ],
      role: 'Co-researcher on a team of three: used Python and scikit-learn in Google Colab to build, evaluate and compare the classifiers.',
      process:
        'Two spam datasets were merged and cleaned, then normalized with stemming and lemmatization. The first attempt followed the lecture approach; the second improved on it with better preprocessing. Each model was trained on the same split and evaluated with accuracy, precision, recall, F1 and confusion matrices.',
      outcomes:
        'Naive Bayes stayed accurate despite its simplifying assumption, but regression models outperformed it, with an F1 gap of around 10%, showing the cost of ignoring correlation between words. Better preprocessing helps, but the naive assumption still limits Naive Bayes regardless of how clean the data is.',
    },
  },
  {
    id: 'p-homie',
    slug: 'homie',
    title: 'HOMIE',
    year: 2024,
    summary:
      'Home Ownership Made Insanely Easy: the software design for a real-estate rental and buying platform with listings, learning and a cost estimator.',
    description:
      'HOMIE is a real-estate rental platform designed to make home ownership insanely easy. Buyers search and save listings, sellers manage them, everyone can learn about the process, and a financial estimator works out buying and renting costs.',
    category: 'design',
    technologies: ['UML', 'React', 'React Native', 'SQL Server', 'REST API'],
    context: 'CPSC 462 · Cal State Fullerton',
    team: [
      'Dahlia M. Sukaik',
      'Keang Zheng Taing',
      'Esteban',
      'Allen Zapata',
      'Karl Susi',
      'Jovani Antonio',
      'Aaron Vuong-Ton Nguyen',
      'Alex Duc Nguyen',
      'Jason Tri Pham',
      'Angela Reyes',
    ],
    thumbnail: img('homie', 'cover', 2000, 1125, 'HOMIE Real Estate Rental title slide over a view looking up between skyscrapers'),
    gallery: [
      img('homie', 'logical-structure', 2000, 1125, 'Logical structure diagram with presentation, domain and technical-service layers', 'Logical structure'),
      img('homie', 'class-listing', 2000, 1125, 'Class diagram for the listing management subsystem', 'Class diagram: listing management'),
      img('homie', 'sequence-listing', 2000, 1125, 'Sequence diagram for listing management between user, authentication, listings and database', 'Sequence diagram: listing management'),
      img('homie', 'sequence-estimator', 2000, 1125, 'Sequence diagram for the estimator calculating mortgage and monthly rates', 'Sequence diagram: estimator'),
      img('homie', 'class-estimator', 2000, 1125, 'Class diagram for the financial estimator subsystem', 'Class diagram: estimator'),
    ],
    status: 'complete',
    featured: false,
    caseStudy: {
      problem:
        'Buying or renting a home is confusing: listings are scattered, the process is hard to learn, and costs are hard to estimate. HOMIE brings searching, learning and estimating into one place.',
      features: [
        'Buyer and seller accounts with authentication',
        'Listing display with search, filters, preferences and saved homes',
        'Listing management for sellers to create, update and remove listings',
        'Learning section with content and progress tracking',
        'Financial estimator for buying and renting, with mortgage and monthly rate calculations',
      ],
      role: 'Member of a ten-person design team.',
      process:
        'The system is organized into presentation (React web and React Native mobile), domain (authentication, listings, learning, financial calculator, preferences) and technical-service layers (SQL Server persistence, security, REST API). Each of the three core subsystems (Listing Management, Education and Estimator) was modeled with sequence, communication and class diagrams.',
      outcomes:
        'A complete design package: logical architecture plus sequence, communication and class diagrams for all three subsystems, ready to guide implementation.',
    },
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
export const featuredProjects = () => projects.filter((p) => p.featured)
