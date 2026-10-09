import type { Profile } from '../types/content'

// Filled in from the résumé and Linktree. The phone number is intentionally
// left off the public site.
export const profile: Profile = {
  name: 'Zheng Taing',
  headline: 'Software Engineer · Singer-Songwriter · Photographer',
  tagline: 'Software, sound & image',
  portraits: [
    { src: '/media/profile/portrait-4.jpg', srcSmall: '/media/profile/portrait-4-sm.jpg', width: 1200, height: 1800, alt: 'Zheng Taing in a dark coat on a city rooftop, looking off to the side with a slight smile' },
    { src: '/media/profile/portrait-3.jpg', srcSmall: '/media/profile/portrait-3-sm.jpg', width: 1200, height: 1800, alt: 'Zheng Taing smiling at the camera on a city rooftop, office buildings behind' },
    { src: '/media/profile/portrait-1.jpg', srcSmall: '/media/profile/portrait-1-sm.jpg', width: 1200, height: 1800, alt: 'Zheng Taing leaning against a rooftop ledge, smiling with head tilted' },
    { src: '/media/profile/portrait-2.jpg', srcSmall: '/media/profile/portrait-2-sm.jpg', width: 1200, height: 1800, alt: 'Zheng Taing laughing with eyes closed and head tilted, wearing a dark coat and shoulder bag' },
  ],
  feature: {
    src: '/media/profile/architecture.jpg',
    srcSmall: '/media/profile/architecture-md.jpg',
    width: 2304,
    height: 1536,
    alt: 'Zheng Taing standing in sunlight beside towering classical columns, looking up, with a long shadow across the ground',
  },
  location: 'Los Angeles, California',
  introduction:
    'Engineer, songwriter and photographer building at the intersection of algorithmic precision and human expression.',
  biography: [
    'I\u2019m Keang Zheng Taing: a software developer, singer-songwriter and photographer. I studied Computer Science with a minor in Animation at Cal State Fullerton, building iOS apps, games in Unreal Engine and machine-learning research along the way.',
    'Outside of code I release my own music (ily., romeo and rose), write songs for other artists, and shoot weddings, portraits, food and travel photography. I also spent years running the floor at a superfood bar, which taught me to lead teams and fix whatever breaks.',
  ],
  practice:
    'Technology is how I build things; music and photography are how I notice things. Each discipline sharpens the others: debugging teaches patience in the studio, arranging a track teaches restraint in an interface, and framing a photograph teaches what to leave out.',
  // Add the PDF to public/ (e.g. public/resume.pdf) and set resumeUrl: '/resume.pdf'.
  resumeUrl: undefined,
  email: 'zhengofficially@gmail.com',
  availability: 'Open to software roles, music collaborations and photo commissions',
  socialLinks: [
    { platform: 'email', label: 'Email', url: 'mailto:zhengofficially@gmail.com', primary: true },
    { platform: 'github', label: 'GitHub', url: 'https://github.com/ZhengTaing', primary: true },
    { platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/keangzhengtaing/', primary: true },
    { platform: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/4Uk3l2GWB8dG0v4OaImCw7', primary: true },
    { platform: 'apple-music', label: 'Apple Music', url: 'https://music.apple.com/ca/artist/zheng-taing/1451245421' },
    { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@ZhengTaing' },
    { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/zhengtaing' },
    { platform: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@zhengtaingg' },
  ],
  education: [
    {
      title: 'B.S. Computer Science, Minor in Animation',
      organization: 'California State University, Fullerton',
      period: '2025',
    },
  ],
  experience: [
    {
      title: 'Operational Manager',
      organization: 'TRU Bowl Superfood Bar',
      period: 'Mar 2022 – Present',
      detail: 'Lead a team of 12+, managing weekly schedules and payroll, and diagnosed 20+ IT issues across communications, point-of-sale and printer systems.',
    },
    {
      title: 'Council Member',
      organization: 'ECS Diversity & Leadership Summit',
      period: 'Sept 2024 – Feb 2025',
      detail: 'Built the summit timeline, from keynotes and panels to networking, and recruited and coordinated speakers and industry leaders.',
    },
    { title: 'Algorithm Officer', organization: 'Association for Computing Machinery (ACM), CSUF', period: 'Dec 2024 – May 2025' },
    { title: 'Marketing Committee', organization: 'FullyHacks 2025', period: 'Sept 2024 – Apr 2025' },
  ],
  achievements: [
    'Best Beginner Hack, FullyHacks (2021)',
    'ICPC 2025 participant (Nov 2024)',
    'RTX Autonomous Vehicle Competition, Mapping & Path Team (2024–2025)',
    'mAgI presented at the ECS Student Project Innovation Expo (2024)',
  ],
  skills: ['Python', 'C++', 'C#', 'Swift', 'JavaScript', 'HTML', 'R', 'Assembly', 'Adobe Creative Suite'],
}
