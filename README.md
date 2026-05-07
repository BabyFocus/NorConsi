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
- cache-busting på CSS/JS med `?v=7`

Roadmap-innholdet kan endres i `roadmap.html` under `window.NC_ROADMAP = { ... }`.

## Alternativer

Alternativer-siden er også dynamisk og bruker samme visuelle stil som roadmap-siden. Den har statuskort, søk, filter på vurdering/type/rolle, kompakt visning, dynamisk sammenligningstabell og lukkede accordion-bokser som kan åpnes.

Alternativene kan endres i `alternatives.html` under `window.NC_ALTERNATIVES = [ ... ]`.

## Tjenester

Tjenester-siden er gjort dynamisk med statuskort, søk, filter på kategori/nivå og lukkede accordion-bokser som kan åpnes.

Tjenestene kan endres i `services.html` under `window.NC_SERVICES = [ ... ]`.

## Feilsøking

Hvis roadmap-siden viser teksten `Roadmap lastes …`, eller alternativer-siden viser `Alternativer lastes …`, finner ikke nettleseren `app.js`. Kontroller at `app.js` ligger i samme mappe som `roadmap.html`.

Hvis designet ser gammelt ut etter opplasting, gjør en hard refresh i nettleseren. På Windows kan du bruke `Ctrl + F5`.


## Mandat

Mandatsiden er gjort dynamisk med statuskort, søk, filter på område/status, kompakt visning og lukkede accordion-bokser. Innholdet dekker formål, bakgrunn, mandatperiode, myndighet, leveransemodell, økonomistyring, KPI-er og foreslått mandattekst.

Mandatet kan endres i `mandate.html` under `window.NC_MANDATE = { ... }`.

## Business case

Business case-siden er gjort dynamisk med statuskort, søk, filter på kategori/status, kompakt visning og lukkede accordion-bokser. Siden inneholder utfyllende tekst, femårs økonomisk modell, scenarioanalyse, kommersiell logikk, investeringsbehov, KPI-er og anbefalt beslutning.

Business case-data kan endres i `business-case.html` under `window.NC_BUSINESS_CASE = { ... }`.
