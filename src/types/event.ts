export type EventCategory = 'Wildfires' | 'Severe Storms' | 'Volcanoes'

export type EarthEvent = {
  id: string
  title: string
  category: EventCategory
  location: string
}

export type DisasterEvent = {
  id: string
  title: string
  category: string
  date: string
  longitude: number
  latitude: number
  source: string | null
  link: string | null
  isOpen: boolean
}
