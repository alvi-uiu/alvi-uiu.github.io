# MyCitationCountSkill

How to refresh the "Grateful to see my work cited across N countries" globe on
`index.html` from live citation data.

Audience: any agent with shell access to this repository. No prior context about
the homepage is needed. Expected runtime: 2–5 minutes per refresh.

---

## 1. What is being updated

The globe at the bottom of the homepage colours every country that has cited at
least one of Riasad Alvi's papers. Darker blue = more citing papers. The caption
under the globe shows how many countries are coloured.

Two artefacts drive it, both in `globe.js`:

| Artefact | Where | Meaning |
| --- | --- | --- |
| `CITED` | top of `globe.js` | `["ISO2", "Country name", count]`, sorted by count. One row per cited country. |
| `CIDS` | top of `globe.js`, one base64 line | One byte per land dot, in drawing order. `0` = uncited land, `1..N` = 1-based index into `CITED`. |
| `MASK` | top of `globe.js` | 288 × 144 land/sea bitmap, row-major, MSB first. Static. |
| `MICRO` | middle of `globe.js` | Beads for countries too small to own a mask cell (Singapore, Hong Kong, Macau). |

`index.html` contains `<span id="globe-count">47</span>`, but the value is
overwritten at runtime with `CITED.length`; never edit it by hand.

Tier colours (`TIER_RGB`): 1 citation = lightest blue, 2–3, 4–7, 8–19, 20+ =
darkest navy. Uncited land is grey. Changing `CITED` automatically changes the
colours; nothing else needs editing.

**Hard rule:** `CIDS` is positional. If `CITED` is reordered, edited or extended,
`CIDS` must be regenerated in the same commit. Editing `CIDS` by hand corrupts
the map silently.

---

## 2. Where the numbers come from

[OpenAlex](https://openalex.org) (CC0 licence). For each paper:

```
GET https://api.openalex.org/works?filter=cites:<OPENALEX_WORK_ID>
    &group_by=authorships.countries
```

The response's `group_by` is a list of countries with the number of citing
works that have at least one author affiliated in that country. `meta.count` is
the number of citing works for the paper.

Semantics to keep in mind when reading the result:

- One citing work with authors in China and the US adds **1 to both** countries.
  The sum over countries is therefore larger than the number of works.
- If one work cites two of the tracked papers, that country gets **+2**. This is
  intentional: the globe counts paper–country links, not unique works.
- Works whose authors have no resolved institution country are not counted.
- Google Scholar shows a higher number because it also counts preprints,
  theses and reports whose affiliations OpenAlex has not resolved. Do **not**
  mix the two sources.

---

## 3. Files involved

```
globe.js                         CITED, CIDS, MASK, MICRO, rendering
data/country_grid.json           144 x 288 ISO2 codes, one per mask cell
data/snapshots/cites-YYYY-MM-DD.json   dated OpenAlex pull (audit trail)
tools/update_citations.py        the updater described below
README.md                        paper table with per-paper counts
index.html                       caption markup (count filled at runtime)
```

The one pre-existing snapshot, `cites-2026-11-19.raw.json`, is the raw
`{work_id: {ISO2: count}}` map from the original collection. Snapshots written
from now on use the richer schema in §10.

`data/country_grid.json` is the bridge between a country code and the dots: each
land cell that falls inside a country's polygon carries that ISO2 code; ocean and
unassigned land are `""`.

---

## 4. Weekly refresh — the short path

Run from the repository root.

```bash
# 1. See what changed since the live site was last updated
python3 tools/update_citations.py --dry-run

# 2. Apply it (rewrites CITED and CIDS, writes a dated snapshot)
python3 tools/update_citations.py
```

Expected output of a healthy run:

```
  10.1007/s10462-025-11471-9       W7118468219   138 citing works   48 countries
  ...
Countries: 47 -> 49
Country links: 165 -> 179
CIDS bytes: 9111 -> 9111
Changes:
  US United States            +4
  ...
```

What the script does:

1. Resolves every entry in `WORKS` (top of the script) to an OpenAlex work id.
   Entries may be a DOI or a `W...` id.
2. Calls the `cites:<work>` + `group_by=authorships.countries` query for each.
3. Sums the per-country counts across papers.
4. Sorts by count descending (ties by name) and rewrites `CITED`.
5. Rebuilds `CIDS` from `data/country_grid.json` and `MASK`, using the exact
   draw order of `globe.js` (see §7).
6. Writes `data/snapshots/cites-YYYY-MM-DD.json`.
7. Warns if a newly cited country has no land cell (needs a `MICRO` bead).

If the script cannot run, follow §6 manual procedure instead.

---

## 5. After the update

### 5.1 Update the README table

`README.md` → "Where the numbers come from" lists each paper with its DOI and
citing-work count. Take those counts from the script's per-paper lines
(`meta.count`, e.g. `138 citing works`) and update the table. The country total
in the same section is `CITED.length`, not the sum of per-paper counts.

### 5.2 Verify in a browser

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

Checklist:

- Scroll to the globe. Caption reads "…cited across **N** countries" where N is
  the number of rows in `CITED` (the script prints it).
- Hover China, the US and one small country: tooltips show plausible counts.
- No console errors. WebGL layer still draws (if not, the 2D fallback is also
  correct — see `globe.js`).
- No text overflow at 1440 px and 600 px.

Quick numeric check without a browser:

```bash
python3 - <<'PY'
import re, base64
s = open('globe.js', encoding='utf-8').read()
cited = re.findall(r'\["([A-Z]{2})", "([^"]+)", (\d+)\]', s)
cids = base64.b64decode(re.search(r"var CIDS = '([^']+)'", s).group(1))
print('countries', len(cited), 'links', sum(int(c) for _, _, c in cited), 'cids bytes', len(cids))
print('uncited dots', cids.count(0), 'cited dots', len(cids) - cids.count(0))
PY
```

`countries` must equal the caption and `links` must equal the script's total.
`cids bytes` is 9,111 while the mask is unchanged; it only changes if `MASK` or
the thinning rule changes.

### 5.3 Commit

```bash
git add globe.js data/snapshots README.md
git commit -m "Update citation counts (YYYY-MM-DD)"
```

Keep the snapshot in the commit: it is the record of what OpenAlex returned that
day, and it is what makes a later rollback reproducible.

Rollback of a bad update:

```bash
git checkout HEAD~1 -- globe.js README.md
```

---

## 6. Manual refresh (fallback)

Use this if `tools/update_citations.py` cannot run (no Python, API blocked).

1. Resolve each paper:

   ```bash
   curl -s "https://api.openalex.org/works/https://doi.org/10.1007/s10462-025-11471-9?select=id,title"
   ```

   For a paper with no DOI, search by title and use its `W...` id:

   ```bash
   curl -s "https://api.openalex.org/works?filter=title.search:entropy%20gated%20rectification&select=id,title"
   ```

2. Per work id, fetch the country groups:

   ```bash
   curl -s "https://api.openalex.org/works?filter=cites:W7118468219&group_by=authorships.countries"
   ```

   Country code = last path segment of `key`; count = `count`.

3. Sum counts per code across all papers. Sort by count descending, then name.
   Rewrite `CITED` as `["XX", "Name", n],` lines.

4. Regenerate `CIDS` with the algorithm in §7 and replace the base64 string.

5. Continue with §5.

---

## 7. Rebuilding CIDS (the exact algorithm)

`CIDS` has one byte per drawn dot. The byte is the 1-based index of the dot's
country in `CITED`, or `0` for uncited land. Dots are consumed in the same order
as the loop below, which mirrors `globe.js` exactly.

```python
import base64, json, math, re

src = open('globe.js', encoding='utf-8').read()
mask = base64.b64decode(re.search(r"var MASK = '([^']+)'", src).group(1))
grid = json.load(open('data/country_grid.json', encoding='utf-8'))
cited = re.findall(r'\["([A-Z]{2})", "([^"]+)", (\d+)\]', src)
index = {code: i + 1 for i, (code, _, _) in enumerate(cited)}

out = bytearray()
GW, GH = 288, 144
for row in range(GH):
    lat = math.radians(90 - (row + 0.5) * 180 / GH)
    cos_lat = math.cos(lat)
    # Same pole thinning as globe.js: step 6 / 3 / 2 / 1 by latitude.
    step = 6 if cos_lat < 0.15 else 3 if cos_lat < 0.35 else 2 if cos_lat < 0.6 else 1
    for col in range(0, GW, step):
        idx = row * GW + col
        if not ((mask[idx >> 3] >> (7 - (idx & 7))) & 1):
            continue                      # sea
        out.append(index.get(grid[row][col], 0))

print(base64.b64encode(bytes(out)).decode())
```

Validated on 2026-11-21: this reproduces the committed `CIDS` byte-for-byte
(9,111 bytes, 4,916 cited dots, 47 countries). If the output length differs from
the existing string, `MASK` or the thinning rule changed — stop and investigate
before committing.

---

## 8. Edge cases

**A newly cited country has no dot.** Countries smaller than one grid cell at
288 × 144 (Singapore, Hong Kong, Macau, Qatar, Luxembourg, Malta, Bahrain,
Cyprus…) have zero cells in `country_grid.json`. The script warns:

```
! QA has no land cell at 288 x 144; add a bead to MICRO in globe.js
```

Add the country to `MICRO` with an approximate centroid:

```js
var MICRO = [
  ['SG', 1.3521, 103.8198],
  ['HK', 22.3193, 114.1694],
  ['MO', 22.1987, 113.5439],
  ['QA', 25.30, 51.20]        // [ISO2, latitude, longitude]
];
```

The bead is drawn from the `CITED` row of the same code, so `CITED` must already
contain it. Re-run the page and hover the bead.

**A paper is missing from `WORKS`.** Add its DOI. If OpenAlex has not indexed it
yet, use its `W...` id (search by title). Re-run.

**A preprint and its published version both exist.** `WORKS` should list one of
them, otherwise the same citation counts twice. Prefer the published DOI; if the
preprint is the only indexed version, keep the preprint.

**OpenAlex returns 429/5xx.** The script retries with backoff. For heavy use set
a free API key and export it:

```bash
export OPENALEX_API_KEY=...
```

Without a key, requests share a small daily budget per IP address.

**A country is renamed or recoded.** Take the name from `key_display_name` so the
tooltip matches OpenAlex. Codes come from the API and must exist in the mask;
otherwise treat it as a micro-country.

**Numbers went down.** Possible: OpenAlex deduplicates or re-resolves
affiliations. The updater is not monotonic — it mirrors the source. Commit the
snapshot so the change is auditable.

---

## 9. Rebuilding the geometry (rarely needed)

Do **not** rebuild this for a normal citation refresh. Only rebuild if the dot
resolution itself must change, because it invalidates `MASK`, `CIDS` and the
`CIDS` length invariant.

Inputs:

- Natural Earth 110m `ne_110m_land` (land/sea mask) and
  `ne_110m_admin_0_countries` (borders, ISO2 `ISO_A2`), public domain.
- Canvas: 288 columns × 144 rows over lon −180…180, lat 90…−90. Cell centres are
  `lon = -180 + (col + 0.5) * 360 / 288`, `lat = 90 - (row + 0.5) * 180 / 144`.
- Mask bit index `idx = row * 288 + col`, stored row-major, **most significant
  bit first** inside each byte. Base64 the packed bytes.
- `country_grid.json`: same 144 × 288 layout, each cell is the ISO2 of the
  country polygon containing the cell centre, or `""` for sea/unassigned land.
  Use point-in-polygon on the cell centre; do not paint whole polygons.
- Boundary cells inherit the polygon that contains the centre; no interpolation.

After regenerating, re-run `tools/update_citations.py --dry-run` and check that
the reported `CIDS bytes` equals the new mask's land-dot count (§7). Expect the
visual pattern to change slightly; that is the point of a rebuild.

---

## 10. Reference

**Tracked papers** (update in `tools/update_citations.py` → `WORKS` and in the
README table):

| Paper | Identifier |
| --- | --- |
| From language to action (review) | 10.1007/s10462-025-11471-9 |
| Generative AI in Bioinformatics | 10.1007/s11831-026-10743-z |
| MultiHaluDet | 10.18653/v1/2026.mellm-1.6 |
| Physics-informed digital twin | 10.1016/j.compag.2026.112487 |
| Entropy-Gated Rectification (arXiv 2611.04438) | W7225243188 |

**API calls used**

```
GET /works/https://doi.org/<DOI>?select=id,title
GET /works?filter=cites:<W_ID>&group_by=authorships.countries
```

**Snapshot schema** (`data/snapshots/cites-YYYY-MM-DD.json`)

```json
{
  "pulled": "2026-11-21",
  "works": {
    "10.1007/...": {
      "id": "W7118468219",
      "title": "...",
      "citing_works": 138,
      "countries": {"CN": 34, "US": 27}
    }
  },
  "countries": {
    "CN": {"name": "China", "count": 34}
  }
}
```

**Invariants**

- `len(base64.b64decode(CIDS))` = number of land dots after pole thinning
  (9,111 for the current mask).
- `len(CITED)` = number shown in the caption.
- `sum(counts in CITED)` = the "country links" total printed by the updater.
- `CIDS` bytes never exceed `len(CITED) + 1`.
