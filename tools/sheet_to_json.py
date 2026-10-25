#!/usr/bin/env python3
"""Rebuild data/book.json and data/book-repeats.json from the coding sheet.

Download the "Case 1 - Book" tab as CSV (File > Download > Comma-separated values)
and run:  python3 tools/sheet_to_json.py path/to/case1.csv

The sheet is the source of truth for the coding; this script only reshapes it.
Header fields of the JSON files (title, note, value lists) are kept as they are.
"""
import csv, json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BOOK, REPEATS = ROOT / "data/book.json", ROOT / "data/book-repeats.json"
LAWS = [("Enhances", "enhance"), ("Obsolesces", "obsolesce"), ("Retrieves", "retrieve"), ("Reverses into", "reverse")]
FIELDS = [("year", "Year"), ("who", "Who"), ("text", "Quote"), ("note", "Coding notes"), ("direction", "Direction"),
          ("medium", "Medium"), ("medium_wording", "Medium as worded"), ("medium_status", "Medium status"),
          ("format", "Format"), ("speaker", "Speaker"), ("scope", "Scope"), ("horizon", "Horizon"),
          ("horizon_phrase", "Horizon phrase"), ("spatial", "Spatial"), ("social", "Social"),
          ("hypotheticality", "Hypotheticality"), ("construal", "Construal"), ("source", "Citation"),
          ("verify", "To verify"), ("paper", "ACM paper")]

def record(row, values):
    r = {"id": int(row["ID"])}
    for key, col in FIELDS:
        v = row.get(col, "").strip()
        if key == "year": v = int(v)
        if v == "" and key in ("note", "verify", "paper"): continue
        r[key] = v
    r["tetrad"] = [law for col, law in LAWS if row.get(col, "").strip()]
    r["tetrad_detail"] = {law: row[col].strip() for col, law in LAWS if row.get(col, "").strip()}
    if row.get("Description, not quote", "").strip().upper() == "TRUE": r["description"] = True
    if row.get("Repeat of", "").strip(): r["repeat_of"] = int(row["Repeat of"])
    for key in ("medium", "medium_status", "format", "speaker", "direction", "scope", "horizon", "spatial", "social", "hypotheticality", "construal"):
        if r.get(key) not in values[key]:
            sys.exit(f"Row {r['id']}: '{r.get(key)}' is not a codebook value for {key}")
    if not r["tetrad"]: sys.exit(f"Row {r['id']}: no Tetrad law filled in")
    return r

def main(path):
    book, reps = json.loads(BOOK.read_text()), json.loads(REPEATS.read_text())
    rows = [row for row in csv.DictReader(open(path, encoding="utf-8")) if row.get("ID", "").strip()]
    recs = [record(row, book["values"]) for row in rows]
    book["speculations"] = [r for r in recs if "repeat_of" not in r]
    reps["speculations"] = [r for r in recs if "repeat_of" in r]
    for f, d in ((BOOK, book), (REPEATS, reps)):
        f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(book['speculations'])} coded, {len(reps['speculations'])} repeats")

if __name__ == "__main__":
    main(sys.argv[1])
