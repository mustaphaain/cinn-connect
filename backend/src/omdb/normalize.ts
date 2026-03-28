export function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Clé stable pour le cache de recherche : type OMDb + requête + page. */
export function searchCacheKey(type: 'movie' | 'series' | 'episode', query: string, page: number): string {
  const q = normalizeTitle(query)
  return `${type}|${q}|${page}`
}
