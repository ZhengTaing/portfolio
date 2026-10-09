export type RoomTheme = 'paper' | 'ink' | 'signal' | 'graphite' | 'jade'

export interface NavItem {
  number: string
  label: string
  path: string
  theme: RoomTheme
}

export const navItems: NavItem[] = [
  { number: '00', label: 'Home', path: '/', theme: 'paper' },
  { number: '01', label: 'Projects', path: '/projects', theme: 'ink' },
  { number: '02', label: 'Music', path: '/music', theme: 'signal' },
  { number: '03', label: 'Visual Art', path: '/visual-art', theme: 'graphite' },
  { number: '04', label: 'About', path: '/about', theme: 'jade' },
]

/** Theme ("room") for a given pathname, based on its top-level section. */
export function themeForPath(pathname: string): RoomTheme {
  const section = '/' + (pathname.split('/')[1] ?? '')
  return navItems.find((n) => n.path === section)?.theme ?? 'paper'
}

/** Public address of the site (used for canonical links, sharing tags and the sitemap). */
export const SITE_URL = 'https://zhengtaing.github.io'
export const SITE_NAME = 'Zheng Taing'
