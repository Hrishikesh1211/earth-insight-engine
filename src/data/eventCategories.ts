type EventCategoryStyle = {
  label: string
  color: string
}

const DEFAULT_CATEGORY: EventCategoryStyle = {
  label: 'Other',
  color: '#64748b',
}

const CATEGORY_STYLES = [
  {
    label: 'Drought',
    color: '#8f6a24',
  },
  {
    label: 'Dust and Haze',
    color: '#9a6532',
  },
  {
    label: 'Earthquakes',
    color: '#7760b8',
  },
  {
    label: 'Floods',
    color: '#247ba0',
  },
  {
    label: 'Landslides',
    color: '#82613b',
  },
  {
    label: 'Manmade',
    color: '#667085',
  },
  {
    label: 'Sea and Lake Ice',
    color: '#2a889b',
  },
  {
    label: 'Severe Storms',
    color: '#4f74c8',
  },
  {
    label: 'Snow',
    color: '#4b8ea3',
  },
  {
    label: 'Temperature Extremes',
    color: '#bd4f7a',
  },
  {
    label: 'Volcanoes',
    color: '#bd4b45',
  },
  {
    label: 'Water Color',
    color: '#2f8f83',
  },
  {
    label: 'Wildfires',
    color: '#c96534',
  },
]

export const eventCategories = CATEGORY_STYLES.map((category) => ({
  id: getEventCategoryId(category.label),
  ...category,
}))

const CATEGORY_STYLE_BY_ID = new Map(
  eventCategories.map((category) => [category.id, category]),
)

export function getEventCategoryStyle(category: string): EventCategoryStyle {
  const categoryKey = getEventCategoryId(category)

  return CATEGORY_STYLE_BY_ID.get(categoryKey) ?? {
    label: category.trim() || DEFAULT_CATEGORY.label,
    color: DEFAULT_CATEGORY.color,
  }
}

export function getEventCategoryId(category: string) {
  return category.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}
