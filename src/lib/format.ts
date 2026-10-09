export function formatDate(iso?: string) {
  if (!iso) return 'TBA'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
