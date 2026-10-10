# Daylight — Productivity dashboard

A responsive, single-page dashboard built with plain HTML, CSS, and JavaScript.

## Run

Open `index.html` in a browser, or serve this directory with `python -m http.server 8000` and visit `http://localhost:8000`. A local HTTP server is recommended for browser storage and API behavior.

## Features

- Five dashboard cards open individual feature views; use Back or Escape to return.
- Tasks support adding, completion, importance, deletion, and browser persistence.
- Planner contains all 24 hourly slots, saves edits immediately, and highlights the current hour.
- Daily goals include completion, deletion, and a progress indicator.
- Planner and goals are stored separately for each local calendar date; prior dates remain in browser storage.
- Pomodoro provides 25-minute work and 5-minute break sessions, Start, Pause, Reset, and completion messages. It uses a deadline to account for inactive tabs. The timer continues between feature views but resets on page reload.
- Quotes use DummyJSON, with loading states and an explicitly labeled offline collection.
- Weather uses the keyless Open-Meteo API. Defaults to New Delhi; the location button requests browser geolocation, with a default-city fallback if denied. Secure context (localhost or HTTPS) is needed for geolocation.
- Clock updates every second. Four backgrounds follow local morning, afternoon, evening, and night.
- Light/dark theme persists and is applied before the page renders.

All personal data stays in this browser. Storage failures display a notification. Network failures do not block the productivity tools. Google Fonts are optional; system fonts are used when offline. Weather and quote APIs need internet access; no API keys are included or required.

## Files

`index.html` contains semantic structure, `style.css` contains responsive styles and themes, and `script.js` handles DOM events, storage, timers, and API calls. Illustrations use CSS and text, so there are no required image assets or build dependencies.
