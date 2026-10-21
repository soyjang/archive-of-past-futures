# An Archive of Past Futures

A prototype for Study 1 of the PhD project *Historicising Speculative Design* (Soyoun Jang, Georgia Tech).

The archive collects claims that a new medium would transform or replace the book in education, from the classroom stereoscope and educational film to today's discourse on VR and AI. Each claim is coded on eight codes:

| Code | Source | Values |
|---|---|---|
| Tetrad law(s) | McLuhan & McLuhan 1988 | enhance, obsolesce, retrieve, reverse |
| Scope of change | specific to obsolescence | supplements, transforms practice, replaces the medium, replaces the institution |
| Temporal distance | construal-level theory | stated horizon: imminent, near, distant, unstated |
| Spatial distance | construal-level theory | this classroom, this country, elsewhere, worldwide |
| Social distance | construal-level theory | our children, other groups, everyone |
| Hypotheticality | construal-level theory | will, should, could |
| Construal level | construal-level theory (outcome) | concrete or abstract language |
| Speaker | | inventor, company, policymaker, educator, researcher, speculative designer |

*Speculative distance* (how far a claim departs from its own present) is coded on five dimensions: the four dimensions of psychological distance in construal-level theory (Trope & Liberman 2010), as marked in the claim's text, plus scope of change, which the theory lacks because it studies everyday events rather than imagined changes to the world. Psychological distance proper is a person's sense of distance and cannot be read from a document, hence the separate term. Construal level is coded as what distance is expected to produce, so the archive can test whether far claims were in fact written abstractly. Scope of change and temporal distance are the primary dimensions for locating gaps; the others are reported descriptively.

Claims of replacement mostly state what a medium enhances and obsolesces, so the archive records only what was predicted. Reading these predictions against what each medium did in practice (television did not replace the book, but it did retrieve the lecture) belongs to the written analysis, drawing on histories of educational technology, not to the archive. The speaker code asks whether a claim's distance follows the interests behind it, and whether speculative design projects sit at different distances from commercial forecasts (Wong & Khovanskaya 2018).

Temporal distance is coded from the horizon a claim *states*, not a year, because most claims (and most speculative design) give none: Edison's "soon", a design fiction's "near future". The signalling phrase is recorded with the code, a year is noted where given, and *unstated* is a value in its own right: in construal-level terms, a vague horizon may itself indicate abstract construal. Placing phrases on the scale is interpretive, so the codebook gives example phrases per level and a second coder checks a sample.

## Pages

- **Archive** — two views of the claims.
  - *Tetrad wheel*: four sectors for the Tetrad laws, rings for scope of change or temporal distance. Dots are filled for concrete language and hollow for abstract. Hatched cells are gaps: combinations no claim imagined. The overview counts claims per Tetrad law.
  - *Timeline*: each claim placed by the year it was made, in a band for the horizon it states (imminent, near, distant, unstated). The overview counts claims per horizon, split by concrete and abstract language.
  - A decade slider ("Play decades") and era filters apply to both views.
- **Sources** — every claim with its speaker, full citation and verification status, linking back to its place on the wheel.
- **Gaps for speculative design** — every gap on scope of change and on temporal distance, each opening a design-fiction prompt with a multiplane animation sketch.

## Status of the data

**Pilot sample of 18 documented claims** (1906–2025), quoted from primary sources or from reputable compilations: Edison (1911, 1913, 1922, 1925), the Keystone teachers' guide (1906), the Ohio School of the Air (1929), FCC Commissioner Frieda Hennock (1955), Skinner (1958), RCA's *Electronic Age* (1959), Senator Muskie (1961), Suppes (1966), Papert (1984), Winn (1993), Thrun (2012), Christensen (2013), Sal Khan (2023) and Bill Gates (2023, 2025).

- Codes are provisional: one coder, no codebook yet.
- Claims marked *to verify* need checking against the original page or venue (Edison 1913 and 1922 wordings, Papert's 1984 venue, Thrun's wording, the edition of the Keystone guide).
- Still missing: a documented 1960s claim that television would replace the book (the anchoring counterfactual), 1990s VR claims of replacement, and speculative design projects.

The data lives in the `CLAIMS`, `CODES`, `WHEN` and `SPEAKER` arrays in `index.html`.

## Running it

Open `index.html` in a browser. It is a single self-contained page; fonts load from Google Fonts.

## References

- Larry Cuban. 1986. *Teachers and Machines: The Classroom Use of Technology Since 1920*. Teachers College Press.
- Marshall McLuhan and Eric McLuhan. 1988. *Laws of Media: The New Science*. University of Toronto Press.
- Audrey Watters. 2021. *Teaching Machines: The History of Personalized Learning*. MIT Press.
- Richmond Y. Wong and Vera Khovanskaya. 2018. Speculative Design in HCI: From Corporate Imaginations to Critical Orientations. In *New Directions in Third Wave Human-Computer Interaction: Volume 2 – Methodologies*. Springer, 175–202.
- Yaacov Trope and Nira Liberman. 2010. Construal-level theory of psychological distance. *Psychological Review* 117, 2, 440–463.
