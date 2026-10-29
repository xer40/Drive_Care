// Groups maintenance records into categories (for the maintenance page's list, icons and costs chart).
// The add-record form only asks for the service name, so the category is worked out from that name.
// The first category whose keywords appear in the name wins, so more specific ones are listed first.

const CATEGORIES = [
  { name: 'Brakes', icon: '🛑', keywords: ['brake', 'rotor', 'caliper', 'pad'] },
  { name: 'Tires', icon: '🛞', keywords: ['tire', 'tyre', 'rotation', 'alignment', 'balance', 'wheel'] },
  // Before Filters, so "Oil change and filter" counts as an oil change
  {
    name: 'Oil & Fluids',
    icon: '🛢️',
    keywords: ['oil', 'fluid', 'coolant', 'antifreeze', 'flush', 'lube'],
  },
  { name: 'Filters', icon: '🌬️', keywords: ['filter'] },
  // Before Electrical, so "Check engine light" counts as engine work
  {
    name: 'Engine',
    icon: '⚙️',
    keywords: ['engine', 'belt', 'timing', 'water pump', 'thermostat', 'radiator', 'hose', 'gasket', 'exhaust', 'muffler'],
  },
  {
    name: 'Electrical',
    icon: '🔋',
    keywords: ['battery', 'alternator', 'starter', 'spark plug', 'ignition', 'coil', 'fuse', 'bulb', 'light'],
  },
]

const OTHER = { name: 'Other', icon: '🔧' }

// Every category name, in a fixed order, so a chart can show the same legend every time
const CATEGORY_NAMES = [...CATEGORIES.map((c) => c.name), OTHER.name]

// Icon for each category name, e.g. CATEGORY_ICONS.Brakes === '🛑'
const CATEGORY_ICONS = Object.fromEntries([...CATEGORIES, OTHER].map((c) => [c.name, c.icon]))

const categorize = (serviceType) => {
  const text = String(serviceType || '').toLowerCase()
  return CATEGORIES.find((c) => c.keywords.some((word) => text.includes(word))) || OTHER
}

// Adds { category, category_icon } to a maintenance record from the database
const withCategory = (record) => {
  const { name, icon } = categorize(record.service_type)
  return { ...record, category: name, category_icon: icon }
}

module.exports = { categorize, withCategory, CATEGORY_NAMES, CATEGORY_ICONS }
