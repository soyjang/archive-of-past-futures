#!/usr/bin/env python3
"""Rebuild data/book.json and data/book-repeats.json from the coding sheet.

Download the "Case 1: Book" tab as CSV (File > Download > Comma-separated values)
and run:  python3 tools/sheet_to_json.py path/to/case1.csv

The sheet is the source of truth for the coding; this script only reshapes it.
Header fields of the JSON files (title, note, value lists) are kept as they are.
"""
import csv, datetime, json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BOOK, REPEATS = ROOT / "data/book.json", ROOT / "data/book-repeats.json"
LAWS = [("Enhances", "enhance"), ("Obsolesces", "obsolesce"), ("Retrieves", "retrieve"), ("Reverses into", "reverse")]
# Coding notes and To verify stay in the private sheet: only the quotation, codes and citation are published.
FIELDS = [("year", "Year"), ("who", "Who"), ("text", "Quote"), ("direction", "Direction"),
          ("medium", "Medium"), ("medium_wording", "Medium as worded"), ("medium_status", "Medium status"),
          ("format", "Format"), ("speaker", "Speaker"), ("horizon", "Horizon"),
          ("horizon_phrase", "Horizon phrase"), ("horizon_years", "Horizon (years)"), ("spatial", "Spatial"), ("social", "Social"),
          ("hypotheticality", "Hypotheticality"), ("construal", "Construal"), ("source", "Citation"),
          ("paper", "ACM paper")]

def record(row, values):
    r = {"id": int(row["ID"])}
    for key, col in FIELDS:
        v = row.get(col, "").strip()
        if key == "year": v = int(v)
        if v == "" and key in ("note", "verify", "paper", "horizon_years", "medium_status"): continue
        if key == "horizon_years": v = float(v); v = int(v) if v.is_integer() else v
        r[key] = v
    r["tetrad"] = [law for col, law in LAWS if row.get(col, "").strip()]
    r["tetrad_detail"] = {law: row[col].strip() for col, law in LAWS if row.get(col, "").strip()}
    if row.get("Description, not quote", "").strip().upper() == "TRUE": r["description"] = True
    if row.get("Repeat of", "").strip(): r["repeat_of"] = int(row["Repeat of"])
    na = r.get("medium") == "N/A"  # no medium named: no medium status, no Tetrad, kept off the wheel
    for key in ("medium", "medium_status", "format", "speaker", "direction", "horizon", "spatial", "social", "hypotheticality", "construal"):
        if key == "medium_status" and na: continue
        if r.get(key) not in values[key]:
            sys.exit(f"Row {r['id']}: '{r.get(key)}' is not a codebook value for {key}")
    if not r["tetrad"] and not na: sys.exit(f"Row {r['id']}: no Tetrad law filled in")
    return r

def main(path):
    book, reps = json.loads(BOOK.read_text()), json.loads(REPEATS.read_text())
    # "To check" rows await a decision and stay out of every count, so they are not exported
    rows = [row for row in csv.DictReader(open(path, encoding="utf-8"))
            if row.get("ID", "").strip() and row.get("In archive", "").strip() != "To check"]
    recs = [record(row, book["values"]) for row in rows]
    book["updated"] = datetime.date.today().isoformat()
    book["speculations"] = [r for r in recs if "repeat_of" not in r]
    reps["speculations"] = [r for r in recs if "repeat_of" in r]
    for f, d in ((BOOK, book), (REPEATS, reps)):
        f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(book['speculations'])} coded, {len(reps['speculations'])} repeats")

if __name__ == "__main__":
    main(sys.argv[1])
