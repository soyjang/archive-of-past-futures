# An Archive of Past Futures

A prototype view for Study 1 of the PhD project *Historicising Speculative Design* (Soyoun Jang, Georgia Tech).

The archive collects claims that a new medium would transform or replace the book in education, from the classroom stereoscope and educational film to today's discourse on VR and AI. Each claim is coded on seven codes:

| Code | Source | Values |
|---|---|---|
| Tetrad law(s) | McLuhan & McLuhan 1988 | enhance, obsolesce, retrieve, reverse |
| Scope of change | specific to obsolescence | supplements, transforms practice, replaces the medium, replaces the institution |
| Temporal distance | construal-level theory | stated horizon: imminent, near, distant, unstated |
| Spatial distance | construal-level theory | this classroom, this country, elsewhere, worldwide |
| Social distance | construal-level theory | our children, other groups, everyone |
| Hypotheticality | construal-level theory | will, should, could |
| Construal level | construal-level theory (outcome) | concrete or abstract language |

The four distance dimensions follow Trope & Liberman (2010). Construal level is coded as what distance is expected to produce, so the archive can test whether far claims were in fact written abstractly. Scope of change is my own addition, specific to claims of replacement.

Temporal distance is coded from the horizon a claim *states*, not a year, because most claims (and most speculative design) give none: Edison's "soon", a design fiction's "near future". The signalling phrase is recorded with the code, a year is noted where given, and *unstated* is a value in its own right: in construal-level terms, a vague horizon may itself indicate abstract construal. Placing phrases on the scale is interpretive, so the codebook gives example phrases per level and a second coder checks a sample.

## Views

- **Tetrad wheel** — four sectors for the Tetrad laws, rings for one distance dimension at a time (choose scope, temporal, spatial, social or hypotheticality). Hatched cells are *gaps*: combinations no claim imagined. Opening a gap shows the design fiction it calls for, with a multiplane animation sketch.
- **Timeline** — each claim drawn from the year it was made to the year it predicted, ending by outcome (absorbed, not realised, still open).
- A decade slider ("Play decades") and era filters.

## Status of the data

**Mock-up.** All entries are illustrative paraphrases, except Edison's 1913 statement ("Books will soon be obsolete in the public schools"), which is a documented claim still to be verified against its source (commonly cited via Cuban 1986). Distance codes (`CODES`, `WHEN`) are likewise illustrative, and each claim's end year is a coder's estimate used only to draw the timeline. Replace the `CLAIMS`, `CODES` and `WHEN` arrays in `index.html` with sourced entries as the archive is collected.

## Running it

Open `index.html` in a browser. It is a single self-contained page; fonts load from Google Fonts.

## References

- Larry Cuban. 1986. *Teachers and Machines: The Classroom Use of Technology Since 1920*. Teachers College Press.
- Marshall McLuhan and Eric McLuhan. 1988. *Laws of Media: The New Science*. University of Toronto Press.
- Yaacov Trope and Nira Liberman. 2010. Construal-level theory of psychological distance. *Psychological Review* 117, 2, 440–463.
