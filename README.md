# NorConsi – GitHub Pages-versjon

Dette er en ren statisk nettside som kan publiseres direkte på GitHub Pages.

## Publisering

Pakk ut ZIP-filen og legg filene direkte i publish-mappen for GitHub Pages. Dersom Pages er satt til `root`, skal `index.html`, `roadmap.html`, `app.js`, `.nojekyll` og `assets/` ligge direkte i repo-roten. Dersom Pages er satt til `/docs`, skal de samme filene ligge direkte i `/docs`.

## Roadmap

Roadmap-siden er dynamisk, men bruker kun vanlig HTML, CSS og JavaScript. Den trenger derfor ingen backend, database eller Node-server.

Funksjoner:

- dynamiske statuskort
- søk i roadmap
- filter på status, tema og fase
- kompakt/fasevis visning
- lokale avhukinger for fullførte milepæler via `localStorage`
- cache-busting på CSS/JS med `?v=4`

Roadmap-innholdet kan endres i `roadmap.html` under `window.NC_ROADMAP = { ... }`.

## Feilsøking

Hvis roadmap-siden viser teksten `Roadmap lastes …`, finner ikke nettleseren `app.js`. Kontroller at `app.js` ligger i samme mappe som `roadmap.html`.

Hvis designet ser gammelt ut etter opplasting, gjør en hard refresh i nettleseren. På Windows kan du bruke `Ctrl + F5`.
