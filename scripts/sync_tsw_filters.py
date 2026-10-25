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
from concurrent.futures import ThreadPoolExecutor, as_completed
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
SSL_CTX = ssl.create_default_context()
FETCH_TIMEOUT_S = 20.0
FETCH_ATTEMPTS = 2
MAX_WORKERS = 6


def fetch(url: str, timeout: float = FETCH_TIMEOUT_S, attempts: int = FETCH_ATTEMPTS) -> bytes:
    last_err: BaseException | None = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code < 500 or i + 1 >= attempts:
                raise
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = e
            if i + 1 >= attempts:
                raise
        time.sleep(0.5)
    assert last_err is not None
    raise last_err


def parse_listing_meta(html: str) -> dict[int, dict[str, str]]:
    """
    Parse the listing page table (#table-filters): filter id -> title, author, last_update
    (columns Title, Author, Last update on https://tsw.vn.cz/filters/?mode=show).
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
            self._in_last_update_td = False
            self._last_update_buf: list[str] = []

        def _reset_row(self) -> None:
            self._td = 0
            self._in_title_a = False
            self._pending_id = None
            self._title_buf = []
            self._row_id = None
            self._row_title = ""
            self._in_author_td = False
            self._author_buf = []
            self._in_last_update_td = False
            self._last_update_buf = []

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
                elif self._td == 6:
                    self._in_last_update_td = True
                    self._last_update_buf = []
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
            elif tag == "td" and self._in_last_update_td:
                last_update = "".join(self._last_update_buf).strip()
                if self._row_id is not None and self._row_id in self.by_id:
                    self.by_id[self._row_id]["last_update"] = last_update
                self._in_last_update_td = False
                self._last_update_buf = []
            elif tag == "tr" and self._in_tr:
                self._in_tr = False
                self._reset_row()

        def handle_data(self, data: str) -> None:
            if self._in_title_a:
                self._title_buf.append(data)
            elif self._in_author_td:
                self._author_buf.append(data)
            elif self._in_last_update_td:
                self._last_update_buf.append(data)

    parser = ListingTableParser()
    parser.feed(html)
    return parser.by_id


def load_previous_manifest(path: Path) -> dict:
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def previous_by_id(manifest: dict) -> dict[int, dict]:
    out: dict[int, dict] = {}
    for entry in manifest.get("filters") or []:
        if isinstance(entry, dict) and isinstance(entry.get("id"), int):
            out[entry["id"]] = entry
    return out


def apply_listing_meta(rec: dict, lm: dict[str, str] | None) -> None:
    if not lm:
        return
    rec["title"] = lm["title"]
    rec["author"] = lm["author"]
    if lm.get("last_update"):
        rec["last_update"] = lm["last_update"]


def should_refetch(
    fid: int,
    lm: dict[str, str] | None,
    prev: dict | None,
    filters_dir: Path,
    today: str,
) -> bool:
    if not prev or not prev.get("ok"):
        return True
    if not (filters_dir / f"{fid}.json").is_file():
        return True
    last_update = (lm or {}).get("last_update") or ""
    if not last_update:
        return True
    if last_update != (prev.get("last_update") or ""):
        return True
    # Listing date has day resolution; re-check filters updated today.
    return last_update == today


def save_filter_payload(out_path: Path, data: object) -> None:
    if isinstance(data, (dict, list)):
        text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    else:
        text = json.dumps(data, ensure_ascii=False) + "\n"
    if out_path.is_file() and out_path.read_text(encoding="utf-8") == text:
        return
    out_path.write_text(text, encoding="utf-8")


def fetch_one(fid: int) -> tuple[int, bytes]:
    return fid, fetch(API_TMPL.format(id=fid))


def record_from_body(fid: int, body: bytes, lm: dict[str, str] | None) -> dict:
    rec: dict = {"id": fid, "url": API_TMPL.format(id=fid)}
    apply_listing_meta(rec, lm)
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
    save_filter_payload(OUT_DIR / FILTERS_SUB / f"{fid}.json", data)
    rec["ok"] = True
    return rec


def reused_record(fid: int, prev: dict, lm: dict[str, str] | None) -> dict:
    rec = dict(prev)
    rec["id"] = fid
    rec["url"] = API_TMPL.format(id=fid)
    apply_listing_meta(rec, lm)
    rec["ok"] = True
    rec.pop("error", None)
    return rec


def failed_record(fid: int, lm: dict[str, str] | None, error: BaseException) -> dict:
    rec: dict = {"id": fid, "url": API_TMPL.format(id=fid), "ok": False, "error": str(error)}
    apply_listing_meta(rec, lm)
    return rec


def write_json(path: Path, data: object) -> bool:
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.is_file() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


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

    manifest_path = OUT_DIR / "manifest.json"
    prev_manifest = load_previous_manifest(manifest_path)
    prev_map = previous_by_id(prev_manifest)
    today = datetime.now(timezone.utc).date().isoformat()
    synced_at = datetime.now(timezone.utc).isoformat()

    to_fetch: list[int] = []
    entries_by_id: dict[int, dict] = {}
    reused = 0
    for fid in ids:
        lm = listing_meta.get(fid)
        prev = prev_map.get(fid)
        if should_refetch(fid, lm, prev, filters_dir, today):
            to_fetch.append(fid)
        else:
            entries_by_id[fid] = reused_record(fid, prev, lm)
            reused += 1

    workers = max(1, min(MAX_WORKERS, len(to_fetch)))
    if to_fetch:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(fetch_one, fid): fid for fid in to_fetch}
            for fut in as_completed(futures):
                fid = futures[fut]
                lm = listing_meta.get(fid)
                try:
                    _, body = fut.result()
                    entries_by_id[fid] = record_from_body(fid, body, lm)
                except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
                    entries_by_id[fid] = failed_record(fid, lm, e)

    listed = set(ids)
    removed = 0
    for path in filters_dir.glob("*.json"):
        if path.stem.isdigit() and int(path.stem) not in listed:
            path.unlink()
            removed += 1

    entries = [entries_by_id[fid] for fid in ids]
    manifest = {
        "source": "https://tsw.vn.cz/filters/",
        "listing_url": LIST_URL,
        "synced_at": synced_at,
        "filter_count_listed": len(ids),
        "filter_count_saved": sum(1 for e in entries if e.get("ok")),
        "filters": entries,
    }

    previous_filters = prev_manifest.get("filters") if isinstance(prev_manifest.get("filters"), list) else None
    payload_changed = previous_filters != entries or removed > 0
    wrote_manifest = False
    if payload_changed:
        wrote_manifest = write_json(manifest_path, manifest)
    elif not manifest_path.is_file():
        wrote_manifest = write_json(manifest_path, manifest)

    ok = manifest["filter_count_saved"]
    print(
        f"Listed {len(ids)} ids; fetched {len(to_fetch)}; reused {reused}; "
        f"removed {removed}; saved {ok}; manifest_updated={wrote_manifest}"
    )
    if ok < len(ids):
        bad = [e["id"] for e in entries if not e.get("ok")]
        print(f"Failed ids: {bad}")


if __name__ == "__main__":
    main()
