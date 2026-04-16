"""
Fetch Median XL filter list from tsw.vn.cz and save each filter API payload to public/tsw_filters/.
Run locally: python scripts/sync_tsw_filters.py
"""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://tsw.vn.cz/filters/"
LIST_URL = f"{BASE}?mode=show"
API_TMPL = f"{BASE}?mode=api&id={{id}}"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "tsw_filters"
FILTERS_SUB = "filters"

ID_RE = re.compile(r"mode=view&id=(\d+)", re.IGNORECASE)
USER_AGENT = "medianxl-db-filter-sync/1.0"


def fetch(url: str, timeout: float = 60.0) -> bytes:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return resp.read()


def parse_listing_meta(html: str) -> dict[int, dict[str, str]]:
    """
    Parse the listing page table (#table-filters): filter id -> title and author
    (columns Title and Author on https://tsw.vn.cz/filters/?mode=show).
    """

    class ListingTableParser(HTMLParser):
        def __init__(self) -> None:
            super().__init__(convert_charrefs=True)
            self.by_id: dict[int, dict[str, str]] = {}
            self._in_tbody = False
            self._in_tr = False
            self._td = 0
            self._in_title_a = False
            self._pending_id: int | None = None
            self._title_buf: list[str] = []
            self._row_id: int | None = None
            self._row_title = ""
            self._in_author_td = False
            self._author_buf: list[str] = []

        def _reset_row(self) -> None:
            self._td = 0
            self._in_title_a = False
            self._pending_id = None
            self._title_buf = []
            self._row_id = None
            self._row_title = ""
            self._in_author_td = False
            self._author_buf = []

        def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
            attrs_d = {k: v or "" for k, v in attrs}
            if tag == "tbody":
                self._in_tbody = True
            if not self._in_tbody:
                return
            if tag == "tr":
                self._reset_row()
                self._in_tr = True
            elif tag == "td" and self._in_tr:
                self._td += 1
                if self._td == 5:
                    self._in_author_td = True
                    self._author_buf = []
            elif tag == "a" and self._in_tr and self._td == 1:
                href = attrs_d.get("href", "")
                m = re.search(r"mode=view&id=(\d+)", href, re.I)
                if m:
                    self._pending_id = int(m.group(1))
                    self._in_title_a = True
                    self._title_buf = []

        def handle_endtag(self, tag: str) -> None:
            if tag == "tbody":
                self._in_tbody = False
            if not self._in_tr and tag != "tbody":
                return
            if tag == "a" and self._in_title_a:
                self._in_title_a = False
                self._row_id = self._pending_id
                self._row_title = "".join(self._title_buf).strip()
                self._title_buf = []
            elif tag == "td" and self._in_author_td:
                author = "".join(self._author_buf).strip()
                if self._row_id is not None:
                    self.by_id[self._row_id] = {
                        "title": self._row_title,
                        "author": author,
                    }
                self._in_author_td = False
                self._author_buf = []
            elif tag == "tr" and self._in_tr:
                self._in_tr = False
                self._reset_row()

        def handle_data(self, data: str) -> None:
            if self._in_title_a:
                self._title_buf.append(data)
            elif self._in_author_td:
                self._author_buf.append(data)

    parser = ListingTableParser()
    parser.feed(html)
    return parser.by_id


def main() -> None:
    raw = fetch(LIST_URL)
    text = raw.decode("utf-8", errors="replace")
    ids = sorted({int(m.group(1)) for m in ID_RE.finditer(text)})
    if not ids:
        raise SystemExit("No filter ids found on listing page; HTML layout may have changed.")

    listing_meta = parse_listing_meta(text)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    filters_dir = OUT_DIR / FILTERS_SUB
    filters_dir.mkdir(parents=True, exist_ok=True)

    synced_at = datetime.now(timezone.utc).isoformat()
    entries: list[dict] = []
    delay_s = 0.35

    for i, fid in enumerate(ids):
        if i:
            time.sleep(delay_s)
        url = API_TMPL.format(id=fid)
        rec: dict = {"id": fid, "url": url}
        lm = listing_meta.get(fid)
        if lm:
            rec["title"] = lm["title"]
            rec["author"] = lm["author"]
        try:
            body = fetch(url)
            rec["bytes"] = len(body)
            try:
                data = json.loads(body.decode("utf-8"))
            except json.JSONDecodeError:
                data = {"_raw_text": body.decode("utf-8", errors="replace")}
                rec["format"] = "text"
            else:
                rec["format"] = "json"
            if isinstance(data, dict) and isinstance(data.get("name"), str):
                rec["name"] = data["name"]
            out_path = filters_dir / f"{fid}.json"
            if isinstance(data, (dict, list)):
                out_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
            else:
                out_path.write_text(json.dumps(data, ensure_ascii=False) + "\n", encoding="utf-8")
            rec["ok"] = True
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
            rec["ok"] = False
            rec["error"] = str(e)
        entries.append(rec)

    manifest = {
        "source": "https://tsw.vn.cz/filters/",
        "listing_url": LIST_URL,
        "synced_at": synced_at,
        "filter_count_listed": len(ids),
        "filter_count_saved": sum(1 for e in entries if e.get("ok")),
        "filters": entries,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    ok = manifest["filter_count_saved"]
    print(f"Listed {len(ids)} ids; saved {ok} filter file(s) under {filters_dir}")
    if ok < len(ids):
        bad = [e["id"] for e in entries if not e.get("ok")]
        print(f"Failed ids: {bad}")


if __name__ == "__main__":
    main()