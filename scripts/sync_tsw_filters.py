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


def main() -> None:
    raw = fetch(LIST_URL)
    text = raw.decode("utf-8", errors="replace")
    ids = sorted({int(m.group(1)) for m in ID_RE.finditer(text)})
    if not ids:
        raise SystemExit("No filter ids found on listing page; HTML layout may have changed.")

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