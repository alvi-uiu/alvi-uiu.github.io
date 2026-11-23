#!/usr/bin/env python3
"""Refresh the citation globe in globe.js from OpenAlex.

Usage
-----
    python3 tools/update_citations.py --dry-run     # show what would change
    python3 tools/update_citations.py               # rewrite globe.js

Environment
-----------
    OPENALEX_API_KEY   optional; without it OpenAlex shares a small free
                       daily budget per IP address.

The script
  1. resolves every entry in WORKS to an OpenAlex work id,
  2. asks OpenAlex how many citing works come from each country,
  3. sums those per ISO-3166-1 alpha-2 code,
  4. rewrites the CITED table and the per-dot CIDS string in globe.js,
  5. writes a dated snapshot under data/snapshots/.
"""

import argparse
import base64
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLOBE = os.path.join(ROOT, 'globe.js')
GRID = os.path.join(ROOT, 'data', 'country_grid.json')
SNAPSHOTS = os.path.join(ROOT, 'data', 'snapshots')

API = 'https://api.openalex.org'

MAILTO = 'ralvi212069@bscse.uiu.ac.bd'
API_KEY = os.environ.get('OPENALEX_API_KEY', '').strip()

# ---------------------------------------------------------------------------
# Every paper whose citations should colour the globe. A DOI or an OpenAlex
# work id (W...) is accepted. Add a line when a new paper is published.
# ---------------------------------------------------------------------------
WORKS = [
    '10.1007/s10462-025-11471-9',      # From language to action (review)
    '10.1007/s11831-026-10743-z',      # Generative AI in Bioinformatics
    '10.18653/v1/2026.mellm-1.6',      # MultiHaluDet
    '10.1016/j.compag.2026.112487',    # Physics-informed digital twin
    'W7225243188',                     # Entropy-Gated Rectification (arXiv)
]

GW, GH = 288, 144


def api_get(path, params, tries=4):
    params = dict(params)
    params['mailto'] = MAILTO
    if API_KEY:
        params['api_key'] = API_KEY
    url = API + path + '?' + urllib.parse.urlencode(params)
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'citation-globe-updater/1.0'})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504) and attempt < tries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if attempt < tries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
    return None


def resolve(work):
    """Return (openalex_id, title) for a DOI or W-id."""
    if re.fullmatch(r'W\d+', work):
        rec = api_get('/works/' + work, {'select': 'id,title'})
    else:
        rec = api_get('/works/https://doi.org/' + work, {'select': 'id,title'})
    if not rec:
        return None, None
    return rec['id'].rsplit('/', 1)[-1], rec.get('title', '')


def cites_by_country(work_id):
    """{'CN': 33, ...} for works citing `work_id`."""
    data = api_get('/works', {
        'filter': 'cites:' + work_id,
        'group_by': 'authorships.countries',
    })
    if not data:
        return {}, 0, {}
    counts = {}
    names = {}
    for g in data.get('group_by', []):
        code = g['key'].rsplit('/', 1)[-1]
        counts[code] = int(g['count'])
        names[code] = g.get('key_display_name', code)
    return counts, int(data.get('meta', {}).get('count', 0)), names


def read_globe():
    with open(GLOBE, encoding='utf-8') as f:
        src = f.read()
    cited = re.search(r'var CITED = \[(.*?)\n  \];', src, re.S)
    mask = re.search(r"var MASK = '([^']+)'", src)
    if not cited or not mask:
        sys.exit('Could not find CITED or MASK in globe.js')
    return src, cited, mask.group(1)


def parse_cited(block):
    rows = []
    for m in re.finditer(r'\["([A-Z]{2})", "((?:[^"\\]|\\.)*)", (\d+)\]', block):
        rows.append([m.group(1), json.loads('"' + m.group(2) + '"'), int(m.group(3))])
    return rows


def build_cids(cited, mask_b64):
    """One byte per land dot, in the order globe.js draws them."""
    mask = base64.b64decode(mask_b64)
    grid = json.load(open(GRID, encoding='utf-8'))
    index = {row[0]: i + 1 for i, row in enumerate(cited)}
    out = bytearray()
    for row in range(GH):
        lat = math.radians(90 - (row + 0.5) * 180 / GH)
        cos_lat = math.cos(lat)
        step = 6 if cos_lat < 0.15 else 3 if cos_lat < 0.35 else 2 if cos_lat < 0.6 else 1
        for col in range(0, GW, step):
            idx = row * GW + col
            if not ((mask[idx >> 3] >> (7 - (idx & 7))) & 1):
                continue
            out.append(index.get(grid[row][col], 0))
    return bytes(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='report only, do not write')
    args = ap.parse_args()

    src, cited_match, mask_b64 = read_globe()
    old = parse_cited(cited_match.group(1))

    total_by_country = defaultdict(int)
    name_by_country = {}
    per_work = {}

    print('Querying OpenAlex ...')
    for work in WORKS:
        wid, title = resolve(work)
        if not wid:
            print('  ! %-32s not found, skipped' % work)
            continue
        counts, citing_works, names = cites_by_country(wid)
        per_work[work] = {'id': wid, 'title': title, 'citing_works': citing_works, 'countries': counts}
        for code, n in counts.items():
            total_by_country[code] += n
            name_by_country.setdefault(code, names.get(code, code))
        print('  %-32s %-12s %4d citing works  %3d countries'
              % (work, wid, citing_works, len(counts)))

    if not total_by_country:
        sys.exit('No citation data returned; nothing written.')

    # Keep the display name already used on the page; only new countries take
    # OpenAlex's label (which sometimes abbreviates, e.g. "Dominican Rep.").
    old_names = {r[0]: r[1] for r in old}
    for code in total_by_country:
        if code in old_names:
            name_by_country[code] = old_names[code]

    new = sorted(total_by_country.items(), key=lambda kv: (-kv[1], name_by_country[kv[0]]))
    new_rows = [[code, name_by_country[code], n] for code, n in new]
    new_cids = build_cids(new_rows, mask_b64)

    # A country with no cell in the 288 x 144 grid is invisible on the globe
    # unless it gets a bead in MICRO. Singapore, Hong Kong and Macau are the
    # three that are already handled that way.
    grid = json.load(open(GRID, encoding='utf-8'))
    cells = defaultdict(int)
    for row in grid:
        for code in row:
            if code:
                cells[code] += 1
    known_micro = {'SG', 'HK', 'MO'}

    old_by = {r[0]: r[2] for r in old}
    new_by = {r[0]: r[2] for r in new_rows}
    beadless = [code for code in new_by if cells.get(code, 0) == 0]
    delta = defaultdict(int)
    for code in set(old_by) | set(new_by):
        delta[code] = new_by.get(code, 0) - old_by.get(code, 0)
    changed = [(c, d) for c, d in delta.items() if d]
    changed.sort(key=lambda kv: (-abs(kv[1]), kv[0]))

    print()
    print('Countries: %d -> %d' % (len(old), len(new_rows)))
    print('Country links: %d -> %d' % (sum(old_by.values()), sum(new_by.values())))
    print('CIDS bytes: %d -> %d' % (len(base64.b64decode(re.search(r"var CIDS = '([^']+)'", src).group(1))), len(new_cids)))
    if changed:
        print('Changes:')
        for code, d in changed:
            name = name_by_country.get(code, dict((r[0], r[1]) for r in old).get(code, code))
            print('  %-2s %-24s %+d' % (code, name, d))
    else:
        print('No per-country change.')

    for code in beadless:
        if code not in known_micro:
            print('  ! %s has no land cell at 288 x 144; add a bead to MICRO in globe.js' % code)

    if args.dry_run:
        print('\nDry run: globe.js not modified.')
        return

    cited_block = 'var CITED = [\n' + ',\n'.join(
        '    ' + json.dumps(r, ensure_ascii=False) for r in new_rows) + '\n  ];'
    src = re.sub(r'var CITED = \[.*?\n  \];', cited_block, src, count=1, flags=re.S)
    cids_b64 = base64.b64encode(new_cids).decode('ascii')
    src = re.sub(r"var CIDS = '[^']+';", "var CIDS = '%s';" % cids_b64, src, count=1)

    # Sanity check: the regenerated string must round-trip.
    check = re.search(r"var CIDS = '([^']+)'", src).group(1)
    assert base64.b64decode(check) == new_cids

    with open(GLOBE, 'w', encoding='utf-8') as f:
        f.write(src)

    os.makedirs(SNAPSHOTS, exist_ok=True)
    snap = {
        'pulled': str(date.today()),
        'works': per_work,
        'countries': {r[0]: {'name': r[1], 'count': r[2]} for r in new_rows},
    }
    path = os.path.join(SNAPSHOTS, 'cites-%s.json' % date.today())
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(snap, f, indent=1, ensure_ascii=False)
        f.write('\n')

    print('\nWrote globe.js and %s' % os.path.relpath(path, ROOT))
    print('Next: update the counts in README.md, reload the page, then commit.')


if __name__ == '__main__':
    main()
