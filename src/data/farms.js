// ── KML coordinate converter ──────────────────
// KML = [lng, lat] → Leaflet = [lat, lng]
function kml(pairs) {
  return pairs.map(([lng, lat]) => [lat, lng])
}

export const HOME_ZONES = [
  {
    id: 'A', name: 'Block A', crop: 'Cherry', depth: 8,
    moisture: 24, temp: 21, lastRead: '2d ago', status: 'Critical',
    coords: kml([[-119.6658919,49.5990945],[-119.6659402,49.5985034],[-119.664937,49.5984722],[-119.6649317,49.5986043],[-119.6652267,49.5988407],[-119.6655003,49.5990354],[-119.6658919,49.5990945]]),
  },
  {
    id: 'B', name: 'Block B', crop: 'Cherry', depth: 8,
    moisture: 42, temp: 20, lastRead: '1d ago', status: 'Action Required',
    coords: kml([[-119.6659402,49.5985034],[-119.6659724,49.597888],[-119.6654466,49.5977698],[-119.6654413,49.5984756],[-119.6659402,49.5985034]]),
  },
  {
    id: 'C', name: 'Block C', crop: 'Apple', depth: 12,
    moisture: 68, temp: 18, lastRead: '6h ago', status: 'Optimal',
    coords: kml([[-119.6654413,49.5984756],[-119.6654091,49.5977559],[-119.6650068,49.5977003],[-119.6649746,49.5976307],[-119.6646313,49.5976307],[-119.6646581,49.5983644],[-119.6649692,49.5983678],[-119.664937,49.5984722],[-119.6654413,49.5984756]]),
  },
  {
    id: 'D', name: 'Block D', crop: 'Apple', depth: 12,
    moisture: 72, temp: 17, lastRead: '6h ago', status: 'Optimal',
    coords: kml([[-119.6646366,49.5984826],[-119.6646313,49.5976307],[-119.6640358,49.5976064],[-119.6640304,49.5984722],[-119.6646366,49.5984826]]),
  },
  {
    id: 'E', name: 'Block E', crop: 'Apple', depth: 10,
    moisture: 57, temp: 19, lastRead: '12h ago', status: 'Optimal',
    coords: kml([[-119.6640304,49.5984722],[-119.6640358,49.5976064],[-119.6635155,49.597596],[-119.6634833,49.5984652],[-119.6640304,49.5984722]]),
  },
  {
    id: 'F', name: 'Block F', crop: 'Cherry', depth: 8,
    moisture: 27, temp: 22, lastRead: '2d ago', status: 'Critical',
    coords: kml([[-119.6636572,49.5996305],[-119.6637269,49.5985005],[-119.6634641,49.5985005],[-119.6633997,49.599561],[-119.6636572,49.5996305]]),
  },
  {
    id: 'G', name: 'Block G', crop: 'Cherry', depth: 8,
    moisture: 48, temp: 20, lastRead: '18h ago', status: 'Action Required',
    coords: kml([[-119.6636572,49.5996305],[-119.6638664,49.5997278],[-119.6639468,49.5997105],[-119.6640112,49.5984936],[-119.6637269,49.5985005],[-119.6636572,49.5996305]]),
  },
  {
    id: 'H', name: 'Block H', crop: 'Apple', depth: 10,
    moisture: 63, temp: 18, lastRead: '8h ago', status: 'Optimal',
    coords: kml([[-119.6639468,49.5997105],[-119.6642365,49.5997063],[-119.6642741,49.5985068],[-119.6640304,49.5984722],[-119.6639468,49.5997105]]),
  },
  {
    id: 'I', name: 'Block I', crop: 'Apple', depth: 12,
    moisture: 60, temp: 17, lastRead: '10h ago', status: 'Optimal',
    coords: kml([[-119.6644779,49.5985207],[-119.6642741,49.5985068],[-119.6642741,49.599602],[-119.6644404,49.5995707],[-119.6644779,49.5985207]]),
  },
  {
    id: 'J', name: 'Block J', crop: 'Apple', depth: 12,
    moisture: 54, temp: 17, lastRead: '14h ago', status: 'Optimal',
    coords: kml([[-119.6644779,49.5985207],[-119.6644833,49.5995081],[-119.6646335,49.5994803],[-119.6646281,49.5985276],[-119.6644779,49.5985207]]),
  },
  {
    id: 'K', name: 'Block K', crop: 'Cherry', depth: 8,
    moisture: 39, temp: 21, lastRead: '1d ago', status: 'Action Required',
    coords: kml([[-119.664671,49.599442],[-119.6649071,49.5993621],[-119.6649339,49.5986841],[-119.6646366,49.5984826],[-119.664671,49.599442]]),
  },
]

export const FARMS = [
  {
    id: 0, name: 'Home Farm', icon: '🏡',
    lat: 49.598422, lng: -119.664789,
    zones: HOME_ZONES,
  },
  {
    id: 1, name: 'Jones Flat', icon: '🌳',
    lat: 49.613047, lng: -119.688687,
    zones: [],
  },
  {
    id: 2, name: 'Dump Road', icon: '🍎',
    lat: 49.593296, lng: -119.696523,
    zones: [],
  },
]

export const WEATHER_COORDS = { lat: 49.605, lng: -119.673 }

export const STATUS = {
  Critical:        { color: '#dc2626', bg: '#fff1f2', border: '#fecdd3', bar: '#f43f5e', mapFill: 'rgba(244,63,94,.5)',  mapStroke: '#f43f5e' },
  'Action Required': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', bar: '#fbbf24', mapFill: 'rgba(251,191,36,.5)', mapStroke: '#f59e0b' },
  Optimal:         { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', bar: '#10b981', mapFill: 'rgba(16,185,129,.4)', mapStroke: '#10b981' },
  'Too Wet':       { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', bar: '#3b82f6', mapFill: 'rgba(59,130,246,.45)',mapStroke: '#3b82f6' },
}

export const CROP_ICON = { Cherry: '🍒', Apple: '🍎' }
