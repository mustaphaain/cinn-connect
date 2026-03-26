type PosterQuality = 'thumb' | 'card' | 'gallery' | 'detail'

const QUALITY_WIDTH: Record<PosterQuality, number> = {
  thumb: 320,
  card: 640,
  gallery: 900,
  detail: 1200,
}

export function getBestPosterUrl(
  url: string | null | undefined,
  quality: PosterQuality = 'card'
): string | null {
  if (!url || url === 'N/A') return null

  // IMDb/OMDb posters include transform tags after "._V1_".
  // We pick a quality based on context to keep pages fast.
  if (/m\.media-amazon\.com|imdb/i.test(url) && /_V1_/i.test(url)) {
    const width = QUALITY_WIDTH[quality]
    const upgraded = url.replace(
      /(\._V1_).*?(\.(jpg|jpeg|png|webp))(?:\?.*)?$/i,
      `._V1_FMjpg_UX${width}_.$3`
    )
    if (upgraded !== url) return upgraded

    const upgradedFallback = url.replace(
      /(\._V1_)(\.(jpg|jpeg|png|webp))(?:\?.*)?$/i,
      `$1FMjpg_UX${width}_$2`
    )
    if (upgradedFallback !== url) return upgradedFallback
  }

  return url
}

