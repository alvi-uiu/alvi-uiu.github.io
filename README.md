# Riasad Alvi — Homepage

Personal academic homepage: a single static page with no build step, no framework and no
external requests at runtime.

**Live sections:** biography, research experience, news, selected publications (with abstract
windows), education, professional activities, contact, and a rotating citation globe.

## Files

```
index.html                the whole page (markup + styles)
jemdoc.css                base stylesheet
abstracts.js              abstract windows for the publication list
globe.js                  rotating dot-matrix citation globe
images/                   profile photo, favicon, One Piece mark, paper diagrams
data/country_grid.json    288 x 144 ISO country grid used by the globe
data/snapshots/           dated OpenAlex pulls for the citation counts
tools/update_citations.py one-command refresh of the globe data
MyCitationCountSkill.md   procedure for refreshing citations
```

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

Opening `index.html` directly also works; the page uses only relative paths.

## Publications

Each entry shows the paper's main framework figure, venue, title, authors, affiliations and
links. Where a paper is accepted but not yet published, the **Paper** link is intentionally a
grey, non-clickable label. Clicking **Abstract** opens the abstract in a grey card.

To add a paper, copy its figure to `images/papers/`, add an `<article class="pub">` block in
`index.html`, and put the abstract text in the matching hidden `.pub-abstract` node.

The CV link in the header is still a placeholder (`href="#"`); point it at the public CV URL
when available.

## Citation globe

`globe.js` draws a 240 px globe whose countries are coloured by how many citing papers come
from that country (light blue to navy; grey = no citations). Counts come from the OpenAlex
citation graph, grouped by citing-institution country, and are compiled into the `CITED`
table. The per-dot `CIDS` string is positional and must be regenerated whenever `CITED`
changes; `tools/update_citations.py` does both.

```bash
python3 tools/update_citations.py --dry-run   # show the change
python3 tools/update_citations.py             # rewrite globe.js + snapshot
```

See `MyCitationCountSkill.md` for the full procedure, data model and troubleshooting.

## Deployment

The repository root is the site root. On GitHub:

1. Push the repository.
2. **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Choose `main` and `/ (root)`.

For a `<username>.github.io` repository the site is served at that address; for any other
repository name it is served at `https://<username>.github.io/<repository>/`. All paths are
relative, so either works.

## Credits

- Page design derived from the [jemdoc](https://jemdoc.jaboc.net/) layout.
- Country geometry from Natural Earth (public domain).
- Citation data from [OpenAlex](https://openalex.org) (CC0).
- Paper figures and abstracts © their respective authors.

Site content © Riasad Alvi.
