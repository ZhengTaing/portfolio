import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { artworks } from '../content/artworks'
import { projects } from '../content/projects'
import { publicReleases, releases } from '../content/releases'
import { findAudioUrl, releaseTracks } from '../lib/audio'
import type { MusicRelease } from '../types/content'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('navigation', () => {
  it('home shows the three disciplines and links to all five sections', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Software/)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    for (const label of ['Projects', 'Music', 'Visual Art', 'About']) {
      expect(within(nav).getByRole('link', { name: new RegExp(label) })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Zheng Taing, home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /Explore projects/ })).toHaveAttribute('href', '/projects')
    expect(screen.getAllByRole('link', { name: /Listen to my music/i })[0]).toHaveAttribute('href', '/music')
    expect(screen.getAllByRole('link', { name: /View visual art/ })[0]).toHaveAttribute('href', '/visual-art')
  })

  it.each([
    ['/projects', /Selected Works/],
    ['/music', /Sonic Structures/],
    ['/visual-art', /Visual Art/],
    ['/photography', /Visual Art/],
    ['/about', /Let.s\s*Connect/],
  ])('%s renders its page heading', async (path, heading) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('unknown routes show a 404 with a way back', async () => {
    renderAt('/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Lost signal' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Home' })[0]).toHaveAttribute('href', '/')
  })

  it('mobile menu opens, closes with Escape and returns focus', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const toggle = screen.getByRole('button', { name: 'Menu' })
    await user.click(toggle)
    expect(screen.getByRole('dialog', { name: 'Site menu' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Site menu' })).not.toBeInTheDocument()
    expect(toggle).toHaveFocus()
  })
})

describe('projects', () => {
  it('every project card links to its detail page', async () => {
    renderAt('/projects')
    await screen.findByRole('heading', { level: 1 })
    for (const p of projects) {
      expect(screen.getByRole('link', { name: p.title })).toHaveAttribute('href', `/projects/${p.slug}`)
    }
  })

  it('category filters narrow the grid', async () => {
    const user = userEvent.setup()
    renderAt('/projects')
    await screen.findByRole('heading', { level: 1 })
    await user.click(screen.getByRole('button', { name: /Games/ }))
    const games = projects.filter((p) => p.category === 'games')
    expect(screen.getByRole('status')).toHaveTextContent(`Showing ${games.length}`)
    expect(screen.getByRole('link', { name: /^Lost/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Looklab' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /All/ }))
    expect(screen.getByRole('link', { name: 'Looklab' })).toBeInTheDocument()
  })

  it.each(projects.map((p) => [p.slug, p]))('detail page for %s renders and handles missing links', async (_slug, p) => {
    renderAt(`/projects/${p.slug}`)
    expect(await screen.findByRole('heading', { level: 1, name: p.title })).toBeInTheDocument()
    const repo = screen.queryByRole('link', { name: /View repository/ })
    if (p.repositoryUrl) expect(repo).toHaveAttribute('href', p.repositoryUrl)
    else expect(repo).toBeNull()
    if (p.repositoryUrl || p.demoUrl) {
      for (const link of screen.getAllByRole('link', { name: /opens in a new tab/ })) {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      }
    } else {
      expect(screen.getByText(/Source is private/)).toBeInTheDocument()
    }
  })

  it('unknown project slug shows not-found', async () => {
    renderAt('/projects/nope')
    expect(await screen.findByText(/That project could not be found/)).toBeInTheDocument()
  })
})

describe('music', () => {
  it('never exposes private releases', () => {
    const base = releases[0]
    const list: MusicRelease[] = [
      { ...base, id: 'x1', slug: 'public-one', visibility: 'public' },
      { ...base, id: 'x2', slug: 'secret-demo', visibility: 'private' },
    ]
    expect(publicReleases(list).map((r) => r.slug)).toEqual(['public-one'])
    expect(releases.every((r) => r.visibility === 'public')).toBe(true)
  })

  it('matches audio files to releases by name, in any supported format', () => {
    const rose = releases.find((r) => r.slug === 'rose')!
    expect(findAudioUrl(rose, [])).toBeUndefined()
    expect(findAudioUrl(rose, ['Rose.m4a', 'romeo.mp3'])).toBe('/media/audio/Rose.m4a')
    expect(findAudioUrl(rose, ['rosey.mp3'])).toBeUndefined()
    const tracks = releaseTracks(releases, ['rose.mp3', 'karma.mp3'])
    // Order follows release dates, which change as content is edited.
    expect(tracks.map((t) => t.title).sort()).toEqual(['Karma', 'rose'])
    expect(tracks.find((t) => t.title === 'Karma')?.subtitle).toMatch(/Written by Zheng Taing/)
  })

  it('release detail shows credits and streaming links', async () => {
    const r = releases.find((x) => Object.keys(x.platformLinks).length > 0)!
    renderAt(`/music/${r.slug}`)
    expect(await screen.findByRole('heading', { level: 1, name: r.title })).toBeInTheDocument()
    for (const c of r.credits) expect(screen.getByText(c.role)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: `Listen to ${r.title}` })).toBeInTheDocument()
  })
})

describe('photography', () => {
  it('opens the lightbox, navigates with arrow keys and closes back to the gallery', async () => {
    const user = userEvent.setup()
    renderAt('/visual-art')
    await screen.findByRole('heading', { level: 1 })
    const first = artworks[0]
    const trigger = screen.getByRole('button', { name: `Open ${first.title} in viewer` })
    await user.click(trigger)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: first.title })).toBeInTheDocument()
    expect(within(dialog).getByRole('img')).toHaveAttribute('alt', first.altText)

    within(dialog).getByRole('button', { name: /Close/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(within(dialog).getByRole('heading', { name: artworks[1].title })).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')
    expect(within(dialog).getByRole('heading', { name: first.title })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: /Close/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('category filter shows only matching images', async () => {
    const user = userEvent.setup()
    renderAt('/visual-art')
    await screen.findByRole('heading', { level: 1 })
    await user.click(screen.getByRole('button', { name: /^Painting/ }))
    const n = artworks.filter((a) => a.category === 'painting').length
    expect(screen.getAllByRole('button', { name: /in viewer/ })).toHaveLength(n)

    // Photography has its own collections.
    await user.click(screen.getByRole('button', { name: /^Photography/ }))
    expect(screen.getAllByRole('button', { name: /in viewer/ })).toHaveLength(
      artworks.filter((a) => a.category === 'photography').length,
    )
    await user.click(screen.getByRole('button', { name: 'Travel & Architecture' }))
    expect(screen.getAllByRole('button', { name: /in viewer/ })).toHaveLength(
      artworks.filter((a) => a.collection === 'travel').length,
    )
  })

  it('every artwork has alt text and dimensions', () => {
    for (const a of artworks) {
      expect(a.altText.length).toBeGreaterThan(5)
      expect(a.width).toBeGreaterThan(0)
      expect(a.height).toBeGreaterThan(0)
    }
  })
})

describe('about', () => {
  it('shows contact email and external profiles open safely', async () => {
    renderAt('/about')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getAllByRole('link', { name: /zhengofficially@gmail.com/i })[0]).toHaveAttribute('href', expect.stringMatching(/^mailto:/))
    const github = screen.getAllByRole('link', { name: /GitHub/ })[0]
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('unreleased demos', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('music page separates released from the password-protected unreleased section', async () => {
    renderAt('/music')
    expect(await screen.findByRole('heading', { name: 'Released' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Unreleased' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Demos & works in progress/ })).toHaveAttribute('href', '/music/unreleased')
  })

  it('asks for an access code, rejects a wrong one, and shows demos after unlocking', async () => {
    const demos = [
      {
        id: 'd1',
        title: 'Secret Song',
        audioUrl: '/api/demos/audio?id=d1',
        status: 'available',
        demoArtist: 'Zheng Taing',
        targetArtists: ['Artist A'],
        market: 'K-pop',
        actType: 'Girl group',
        genre: 'Dance pop',
        bpm: 118,
      },
      {
        id: 'd2',
        title: 'Second Song',
        audioUrl: '/api/demos/audio?id=d2',
        status: 'on-hold',
        holdUntil: '2026-10-30',
        market: 'Western pop',
        actType: 'Solo artist',
        genre: 'Pop ballad',
      },
    ]
    let authed = false
    const favorites: string[] = []
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/demos/login') {
        const { code } = JSON.parse(String(init?.body))
        authed = code === 'right'
        return new Response('{}', { status: authed ? 200 : 401 })
      }
      if (url === '/api/demos') {
        return authed
          ? new Response(JSON.stringify({ demos, me: { name: 'Paul' }, favorites }), { status: 200 })
          : new Response('{}', { status: 401 })
      }
      if (url === '/api/demos/favorite') {
        const { id } = JSON.parse(String(init?.body))
        favorites.push(id)
        return new Response(JSON.stringify({ ok: true, favorites }), { status: 200 })
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/music/unreleased')

    const input = await screen.findByLabelText('Access code')
    expect(screen.queryByText('Secret Song')).not.toBeInTheDocument()

    await user.type(input, 'wrong')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not right/)

    await user.type(screen.getByLabelText('Access code'), 'right')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    const cards = await screen.findByRole('list', { name: 'Song pitches' })
    expect(within(cards).getByRole('heading', { name: 'Secret Song' })).toBeInTheDocument()
    expect(screen.getByText('Paul')).toBeInTheDocument()
    expect(within(cards).getAllByText('Demo: Zheng Taing')).toHaveLength(2)
    expect(within(cards).getByText('Artist A')).toBeInTheDocument()
    expect(within(cards).getByText(/On hold · Oct 30/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play Secret Song' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Playlist' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument()
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    await user.click(screen.getByRole('button', { name: 'Play Secret Song' }))
    expect(document.querySelector('audio')).toHaveAttribute('src', '/api/demos/audio?id=d1')

    // Filters narrow both the cards and the playlist.
    await user.click(screen.getByRole('button', { name: /^Filters/ }))
    await user.click(screen.getByRole('button', { name: 'K-pop' }))
    expect(within(cards).queryByRole('heading', { name: 'Second Song' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Playlist' })).getAllByRole('listitem')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Remove filter K-pop' }))
    expect(within(cards).getByRole('heading', { name: 'Second Song' })).toBeInTheDocument()

    // Hearts save to the server and feed the "My favorites" view.
    const heart = within(cards).getByRole('button', { name: 'Add Second Song to favorites' })
    await user.click(heart)
    expect(fetchMock).toHaveBeenCalledWith('/api/demos/favorite', expect.objectContaining({ body: JSON.stringify({ id: 'd2', on: true }) }))
    expect(within(cards).getByRole('button', { name: 'Remove Second Song from favorites' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /My favorites \(1\)/ }))
    expect(within(cards).queryByRole('heading', { name: 'Secret Song' })).not.toBeInTheDocument()
    expect(within(cards).getByRole('heading', { name: 'Second Song' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /All songs/ }))

    // "+ Queue" puts a song in Up next, which plays after the current one.
    await user.click(within(cards).getByRole('button', { name: 'Add Second Song to queue' }))
    expect(within(cards).getByRole('button', { name: 'Add Second Song to queue' })).toHaveTextContent('✓ Queued')
    const bar = screen.getByRole('region', { name: 'Now playing' })
    expect(within(bar).getByText(/Added “Second Song” to your queue/)).toBeInTheDocument()
  })
})

describe('site-wide player', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('play'))
      return Promise.resolve()
    })
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('pause'))
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('switches tracks from the tracklist and the next button', async () => {
    const { MediaPlayer } = await import('../components/MediaPlayer')
    const { PlayerProvider } = await import('../lib/player')
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PlayerProvider>
          <MediaPlayer
            tracks={[
              { id: 'a', title: 'First', audioUrl: '/a' },
              { id: 'b', title: 'Second', audioUrl: '/b' },
            ]}
          />
        </PlayerProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'First' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next track' }))
    expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next track' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /^Play$/ }))
    expect(document.querySelector('audio')).toHaveAttribute('src', '/b')
    await user.click(screen.getByRole('button', { name: 'Play First' }))
    expect(screen.getByRole('heading', { name: 'First' })).toBeInTheDocument()
    expect(document.querySelector('audio')).toHaveAttribute('src', '/a')
  })

  it('keeps playing in the now-playing bar after leaving the page', async () => {
    const user = userEvent.setup()
    renderAt('/music')
    const listen = await screen.findByRole('region', { name: 'Player' })
    await user.click(within(listen).getByRole('button', { name: 'Play' }))
    const bar = await screen.findByRole('region', { name: 'Now playing' })
    const title = within(bar).getByRole('link').textContent
    await user.click(screen.getAllByRole('link', { name: /Projects/ })[0])
    expect(await screen.findByRole('heading', { level: 1, name: /Selected Works/ })).toBeInTheDocument()
    const stillThere = screen.getByRole('region', { name: 'Now playing' })
    expect(within(stillThere).getByRole('link')).toHaveTextContent(title!)
    expect(within(stillThere).getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    await user.click(within(stillThere).getAllByRole('button', { name: 'Close player' })[0])
    expect(screen.queryByRole('region', { name: 'Now playing' })).not.toBeInTheDocument()
  })
})

describe('unreleased auto-lock', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('locks again when the visitor leaves the page', async () => {
    let authed = true
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/demos/logout') {
        authed = false
        return new Response('{}', { status: 200 })
      }
      if (url === '/api/demos') {
        return authed
          ? new Response(JSON.stringify({ demos: [{ id: 'd1', title: 'Secret Song', audioUrl: '/api/demos/audio?id=d1', status: 'available' }], favorites: [] }), { status: 200 })
          : new Response('{}', { status: 401 })
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/music/unreleased')

    await screen.findByRole('list', { name: 'Song pitches' })
    expect(fetchMock).not.toHaveBeenCalledWith('/api/demos/logout', expect.anything())

    await user.click(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', { name: 'Music' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/demos/logout', expect.objectContaining({ method: 'POST' })))
    expect(authed).toBe(false)
  })
})
