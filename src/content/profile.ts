import type { Profile } from '../types/content'

// PLACEHOLDER: replace every bracketed value and the example URLs below with
// approved, real information before launch.
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
    '[Placeholder bio] Zheng Taing is a software engineer who writes and produces music and works behind a camera. The projects range from AI-powered iOS apps and Unreal Engine games to records and photo series.',
    '[Placeholder bio] The same instincts carry across all three: structure, rhythm and an eye for detail. Code gets composed like a song, and a song gets framed like a photograph.',
  ],
  practice:
    'Technology is how I build things; music and photography are how I notice things. Each discipline sharpens the others: debugging teaches patience in the studio, arranging a track teaches restraint in an interface, and framing a photograph teaches what to leave out.',
  // Add the PDF to public/ (e.g. public/resume.pdf) and set resumeUrl: '/resume.pdf'.
  resumeUrl: undefined,
  email: 'hello@example.com',
  availability: 'Open to software roles, music collaborations and photo commissions',
  socialLinks: [
    { platform: 'email', label: 'Email', url: 'mailto:hello@example.com', primary: true },
    { platform: 'github', label: 'GitHub', url: 'https://github.com/', primary: true },
    { platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/', primary: true },
    { platform: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/4Uk3l2GWB8dG0v4OaImCw7', primary: true },
    { platform: 'apple-music', label: 'Apple Music', url: 'https://music.apple.com/ca/artist/zheng-taing/1451245421' },
    { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@ZhengTaing' },
    { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/zhengtaing' },
    { platform: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@zhengtaingg' },
  ],
  education: [{ title: '[Degree, Major]', organization: '[University]', period: '[Year – Year]' }],
  experience: [
    {
      title: '[Software Engineer]',
      organization: '[Company]',
      period: '[Year – Present]',
      detail: '[One line on scope, stack and impact.]',
    },
    {
      title: '[Songwriter / Producer]',
      organization: 'Independent',
      period: '[Year – Present]',
      detail: '[Releases, sessions and collaborations.]',
    },
  ],
  achievements: ['[Selected achievement or award]', '[Selected songwriting or production credit]', '[Exhibition or publication]'],
}
