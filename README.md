# NorConsi – GitHub Pages

Dette er en ren statisk nettside som kan publiseres direkte på GitHub Pages.

## Publisering

Pakk ut ZIP-filen og legg innholdet i repo-roten, eller i `/docs` dersom GitHub Pages er satt til å publisere fra `/docs`.

Viktig: Ikke last opp ZIP-filen alene. GitHub Pages må se `index.html`, `app.js`, `.nojekyll` og `assets/` direkte i publish-mappen.

## Dynamisk roadmap

`roadmap.html` inneholder roadmap-data som JavaScript-objektet `window.NC_ROADMAP`.
`app.js` bygger roadmap-visningen dynamisk i nettleseren.

Funksjoner:

- søk i roadmap
- filtrering på fase, tema og status
- fasevis eller kompakt visning
- fremdriftskort
- lokale avhukinger for ferdige milepæler via nettleserens localStorage

Avhukingene lagres kun lokalt i brukerens nettleser og påvirker ikke filene i GitHub-repoet.

## Redigering av roadmap

For å endre innholdet, rediger `window.NC_ROADMAP` nederst i `roadmap.html`.
Hver milepæl kan ha disse feltene:

- `id`
- `date`
- `title`
- `tag`
- `status`
- `owner`
- `detail`
- `deliverables`
- `success`
