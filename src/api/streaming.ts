import { cacheGet, cacheSet, TTL } from './cache'

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const BASE_URL = 'https://streaming-availability.p.rapidapi.com'

export interface StreamingOption {
  service: string
  serviceLogo: string
  type: 'subscription' | 'rent' | 'buy' | 'free' | 'addon'
  link: string
  price?: { amount: string; currency: string; formatted: string }
  quality?: string
}

interface APIStreamingOption {
  service: { id: string; name: string; imageSet?: { lightThemeImage?: string; darkThemeImage?: string } }
  type: string
  link: string
  price?: { amount: number; currency: string; formatted: string }
  quality?: string
}

interface APIShowResult {
  streamingOptions?: Record<string, APIStreamingOption[]>
}

export async function getStreamingAvailability(tmdbId: number): Promise<StreamingOption[]> {
  const key = `streaming_${tmdbId}`
  const cached = cacheGet<StreamingOption[]>(key)
  if (cached) return cached

  const url = `${BASE_URL}/shows/movie/${tmdbId}`
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com',
    },
  })

  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`Streaming API ${res.status}`)
  }

  const data: APIShowResult = await res.json()
  const usOptions = data.streamingOptions?.us
  if (!usOptions) return []

  const result = usOptions.map((opt) => ({
    service: opt.service.name,
    serviceLogo: opt.service.imageSet?.darkThemeImage ?? opt.service.imageSet?.lightThemeImage ?? '',
    type: opt.type as StreamingOption['type'],
    link: opt.link,
    price: opt.price
      ? { amount: String(opt.price.amount), currency: opt.price.currency, formatted: opt.price.formatted }
      : undefined,
    quality: opt.quality,
  }))

  cacheSet(key, result, TTL.ONE_DAY)
  return result
}
