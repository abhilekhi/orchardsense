# Lekhi Farm Monitoring

Soil moisture monitoring app for Lekhi Farms, BC Okanagan.  
Mobile-first PWA. No build step required.

## Project structure

```
lekhi-farm/
├── index.html               Entry point + CDN imports
└── src/
    ├── App.jsx              Root: tab navigation, farm switcher
    ├── data/
    │   └── farms.js         Farm coords, zone KML, status config, GDD config
    ├── hooks/
    │   ├── useWeather.js    Open-Meteo fetch + GDD/frost/ET parsing
    │   └── useZones.js      Zone state + moisture simulation (replace with real sensors)
    ├── components/
    │   ├── FarmMap.jsx      Leaflet satellite/street map
    │   ├── TodayScreen.jsx  Morning briefing + dot strip + block detail
    │   └── WeatherScreen.jsx  Signals + GDD stages + 7-day forecast
    └── styles/
        └── index.css        Mobile-first styles + design tokens
```

## Running locally

Just open `index.html` directly in Chrome/Safari — no server needed.

For best results (avoids CORS on some systems):
```bash
# Python (built-in)
python3 -m http.server 8080
# then open http://localhost:8080

# Or Node
npx serve .
```

## Deploying to GitHub Pages

1. Create a new GitHub repo called `lekhi-farm`
2. Push this folder as the root of the repo
3. Settings → Pages → Source: Deploy from branch → main → / (root)
4. Your app will be live at: `https://yourusername.github.io/lekhi-farm`
5. On Android Chrome: open URL → ⋮ menu → "Add to Home Screen"
6. On iPhone Safari: open URL → Share → "Add to Home Screen"

## Connecting real sensors

When your Raspberry Pi + soil sensors are ready:

1. Edit `src/hooks/useZones.js`
2. Uncomment the `fetchSensorData()` function and add your Google Sheet ID
3. Replace the `setInterval` simulation block with a real fetch call
4. The rest of the app will update automatically

## Adding Jones Flat / Dump Road blocks

1. Trace block polygons in Google My Maps
2. Export as KML
3. Paste the coordinates into `src/data/farms.js` following the HOME_ZONES pattern
4. Update the farm object's `zones` array

## Future: NDVI via Sentinel-2

A stub is in `src/hooks/useWeather.js` → `fetchNDVI()`.  
When ready, implement using Microsoft Planetary Computer STAC API:
- Collection: `sentinel-2-l2a`
- Query by zone polygon bounding box
- Filter cloud cover < 20%
- Compute: `(B08 - B04) / (B08 + B04)` averaged over polygon pixels
- Returns health score 0–1 per zone, date of last clear image

## GDD calibration

GDD stages in `src/data/farms.js → GDD_CONFIG` are based on standard BC tree fruit models.  
For maximum accuracy:
- Track GDD from January 1 each year (or from bud break)
- Connect a local AgriMet station for hourly temps vs Open-Meteo modelled temps
- Adjust stage thresholds based on your specific varieties
