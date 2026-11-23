# Riasad Alvi — Homepage

Static academic homepage, hosted at <https://alvi-uiu.github.io/>. No build step and no
external requests at runtime.

## Structure

```
index.html                 page markup and styles
jemdoc.css                 base stylesheet
abstracts.js               abstract windows
globe.js                   citation globe and its data
images/                    profile photo, favicon, paper figures
data/country_grid.json     country geometry for the globe
data/snapshots/            dated OpenAlex citation pulls
tools/update_citations.py  citation data refresh
MyCitationCountSkill.md    citation refresh procedure
```

## Local preview

```bash
python3 -m http.server 8000   # http://localhost:8000/
```

## Publications

Each entry presents the paper's framework figure, venue, title, authors, affiliations and
links. Papers accepted but not yet published carry a grey, non-clickable **Paper** label in
place of a link. **Abstract** opens the abstract in a grey card.

## Citation globe

The globe colours each country by the number of citing papers from that country, using the
OpenAlex citation graph grouped by citing-institution country.

```bash
python3 tools/update_citations.py --dry-run   # preview
python3 tools/update_citations.py             # rewrite globe.js and snapshot
```

The data model and full procedure are documented in `MyCitationCountSkill.md`.

## Deployment

The repository root is the site root, published through GitHub Pages:

1. Push to `main`.
2. **Settings → Pages → Build and deployment**.
3. Source **Deploy from a branch**, branch `main`, folder `/ (root)`.

The address <https://alvi-uiu.github.io/> requires the repository to be named
`alvi-uiu.github.io`; any other name serves the site at `https://alvi-uiu.github.io/<repository>/`.
All paths are relative, so either works.

## Credits

- Page design based on the jemdoc layout.
- Country geometry: Natural Earth (public domain).
- Citation data: OpenAlex (CC0).
- Paper figures and abstracts © their respective authors.

Site content © Riasad Alvi.
