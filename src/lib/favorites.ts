import { useSyncExternalStore } from 'react'

/**
 * Hearted demos for whoever is signed in to Unreleased. The Unreleased page
 * loads them; the now-playing bar reads them too, so the heart works from any
 * page. Saved on the server against the person's access code.
 */
interface FavoritesState {
  /** False until someone is signed in (or when favorites aren't available). */
  enabled: boolean
  ids: ReadonlySet<string>
}

let state: FavoritesState = { enabled: false, ids: new Set() }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function setFavorites(ids: string[] | null) {
  state = { enabled: ids !== null, ids: new Set(ids ?? []) }
  emit()
}

export function clearFavorites() {
  setFavorites(null)
}

/** Heart or un-heart a demo. Updates straight away and rolls back if saving fails. */
export async function toggleFavorite(id: string) {
  if (!state.enabled) return
  const on = !state.ids.has(id)
  const apply = (add: boolean) => {
    const ids = new Set(state.ids)
    if (add) ids.add(id)
    else ids.delete(id)
    state = { ...state, ids }
    emit()
  }
  apply(on)
  try {
    const res = await fetch('/api/demos/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, on }),
    })
    if (!res.ok) apply(!on)
  } catch {
    apply(!on)
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, () => state)
}
