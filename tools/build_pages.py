#!/usr/bin/env python3
"""Build the site's Codebook and Case 1 Corpus pages from their markdown masters.

The masters are content/codebook.md and content/corpus-book.md. Edit those, then run:
    python3 tools/build_pages.py
which rewrites pages/codebook.html and pages/book-corpus.html. Never edit those pages by hand.
Needs: pip install markdown beautifulsoup4
"""
import pathlib, re
import markdown
from bs4 import BeautifulSoup, NavigableString

ROOT = pathlib.Path(__file__).resolve().parent.parent
CB_IDS = {"Unit of analysis": "cb-unit", "Attributes": "cb-attr", "Codes": "cb-codes", "1. Tetrad": "cb-tetrad",
          "2. Speculative distance": "cb-distance", "3. Construal level": "cb-construal", "Worked example": "cb-example",
          "Reliability": "cb-rel", "References": "cb-refs"}
SITE_SKIP = {"Rationale", "How it was developed", "Recording", "Limitation"}
NOTE = "<!-- Built from {src} by tools/build_pages.py. Do not edit by hand. -->\n"


def html_of(md_path):
    text = (ROOT / md_path).read_text(encoding="utf-8")
    text = re.sub(r"\A---\n.*?\n---\n+", "", text, flags=re.S)  # frontmatter, if any
    return BeautifulSoup(markdown.markdown(text, extensions=["sane_lists"]), "html.parser")


def labelled(li):
    """'<strong>Label.</strong> rest' -> (label, rest nodes), or None."""
    first = next((c for c in li.contents if not (isinstance(c, NavigableString) and not c.strip())), None)
    if getattr(first, "name", None) == "strong" and first.get_text().strip().endswith("."):
        return first
    return None


def lists_to_dl(soup, root, cls="cb-dl"):
    for ul in root.find_all("ul", recursive=True):
        items = ul.find_all("li", recursive=False)
        for li in items:  # loose lists wrap each item's text in <p>
            for p in li.find_all("p", recursive=False):
                p.unwrap()
        if not items or not all(labelled(li) for li in items):
            continue
        dl = soup.new_tag("dl", attrs={"class": cls})
        for li in items:
            s = labelled(li); label = s.get_text().strip().rstrip(".")
            s.extract()
            dt = soup.new_tag("dt"); dt.string = label
            dd = soup.new_tag("dd")
            for c in list(li.contents):
                dd.append(c.extract())
            if dd.contents and isinstance(dd.contents[0], NavigableString):
                dd.contents[0].replace_with(dd.contents[0].lstrip())
            for p in dd.find_all("p", recursive=False):  # loose list items
                p.unwrap()
            for ol in dd.find_all("ol"):
                ol["class"] = "cb-steps"
            dl.append(dt); dl.append(dd)
        ul.replace_with(dl)


def wrap_rules(soup, section):
    """A paragraph opening with <strong>Rule(s).</strong> starts a rule box that runs to the next heading."""
    for p in section.find_all("p", recursive=False):
        s = p.find("strong")
        if not (s and p.contents and p.contents[0] is s and s.get_text().startswith("Rule")):
            continue
        if p.parent.name == "div":
            continue
        box = soup.new_tag("div", attrs={"class": "cb-rule"})
        p.insert_before(box)
        node = p
        while node is not None and getattr(node, "name", None) not in ("h3", "h4", "section", "dl"):
            nxt = node.next_sibling
            box.append(node.extract())
            node = nxt
            while isinstance(node, NavigableString) and not node.strip():
                nxt = node.next_sibling; node.extract(); node = nxt


def sections(soup, levels):
    """Split the flat document into <section>s at the given heading levels."""
    out, cur = [], None
    for node in list(soup.contents):
        if getattr(node, "name", None) in levels:
            cur = soup.new_tag("section"); out.append((node, cur))
        if cur is not None:
            cur.append(node.extract())
    return out


def build_codebook():
    soup = html_of("content/codebook.md")
    h1 = soup.find("h1"); title = h1.get_text(); h1.extract()
    intro = []
    while soup.contents and getattr(soup.contents[0], "name", None) not in ("h2",):
        intro.append(soup.contents[0].extract())
    secs = sections(soup, ("h2", "h3"))
    body = BeautifulSoup("", "html.parser")
    toc = []
    for head, sec in secs:
        name = head.get_text().strip()
        key = re.sub(r"\s*\(.*\)$", "", name)
        sec_id = CB_IDS.get(key)
        if head.name == "h3" and key in ("Attributes", "Codes"):  # inside the worked example
            continue
        if sec_id: sec["id"] = sec_id
        if head.name == "h3":
            sec["class"] = "cb-sub"
        head.name = "h3"
        cite = re.search(r"\((.*)\)$", name)
        if cite:
            head.string = key
            span = soup.new_tag("span", attrs={"class": "cb-src"}); span.string = cite.group(1)
            head.append(span)
        if key == "Codes": sec["class"] = "cb-part"
        if sec_id:
            toc.append(f'<a{" class=\"sub\"" if sec.get("class") == "cb-sub" else ""} href="#{sec_id}">{key}</a>')
        body.append(sec)
    # The worked example: its sub-headings become group rows of one definition list
    ex = body.find("section", id="cb-example")
    for h, s in secs:
        if s.get("id") is None and h.get_text() in ("Attributes", "Codes"):
            ex.append(s); s.unwrap()
    bq = ex.find("blockquote")
    if bq:
        ps = bq.find_all("p")
        ps[0]["class"] = "quote"
        if len(ps) > 1: ps[1]["class"] = "small"
        bq.unwrap()
    for sec in body.find_all("section"):
        lists_to_dl(soup, sec)
        wrap_rules(soup, sec)
    exdl = soup.new_tag("dl", attrs={"class": "cb-dl cb-ex"})
    first = None
    for node in list(ex.contents):
        n = getattr(node, "name", None)
        if n in ("h3", "h4") and node.get_text() not in ("Worked example",):
            dt = soup.new_tag("dt", attrs={"class": "grp" if n == "h3" else "grp sub"})
            sp = soup.new_tag("span"); sp.string = node.get_text(); dt.append(sp)
            exdl.append(dt); node.extract(); first = first or exdl
        elif n == "dl" and first is not None:
            for c in list(node.contents):
                if getattr(c, "name", None) == "dd" and c.contents and getattr(c.contents[0], "name", None) is None:
                    pass
                exdl.append(c.extract())
            node.extract()
    ex.append(exdl)
    refs = body.find("section", id="cb-refs")
    if refs and refs.find("ul"): refs.find("ul")["class"] = "cb-refs"
    intro_text = BeautifulSoup("".join(str(n) for n in intro), "html.parser").get_text().strip()
    # sentences about where the master lives are for the repo, not the site
    intro_text = " ".join(x for x in re.split(r"(?<=\.) ", intro_text) if "master copy" not in x and "coding sheet" not in x)
    html = (NOTE.format(src="content/codebook.md") +
            '<section id="pg-codebook" class="page" hidden>\n'
            f'  <div class="pagehead"><h2>Codebook</h2></div>\n  <div class="cb">\n'
            f'    <nav class="cb-toc" aria-label="Codebook contents">{"".join(toc)}</nav>\n'
            f'    <div class="cb-body">\n'
            f'      {body}\n    </div>\n  </div>\n</section>\n')
    (ROOT / "pages/codebook.html").write_text(html, encoding="utf-8")


def build_corpus():
    soup = html_of("content/corpus-book.md")
    h1 = soup.find("h1"); h1.extract()
    # "How it was developed" stays in the repo (content/corpus-book.md) but is not shown on the site
    for h in soup.find_all("h2"):
        if h.get_text().strip() in SITE_SKIP:
            node = h
            while node is not None:
                nxt = node.next_sibling
                node.extract()
                node = nxt
                if getattr(node, "name", None) == "h2": break
    # drop the references if nothing left on the page cites them
    refs = next((h for h in soup.find_all("h2") if h.get_text().strip() == "References"), None)
    if refs and not re.search(r"\[\d+\]", "".join(str(x) for x in refs.find_all_previous(string=True))):
        node = refs
        while node is not None:
            nxt = node.next_sibling; node.extract(); node = nxt
    for h in soup.find_all("h2"): h.name = "h4"
    for p in soup.find_all("p"):
        if re.match(r"\[\d+\]", p.get_text()): p["class"] = "small"
    page = (ROOT / "pages/book-corpus.html").read_text(encoding="utf-8")
    page = re.sub(r"\A<!--.*?-->\n", "", page, flags=re.S)
    page = re.sub(r'\s*<section class="rd" id="corpus-about">.*?</section><!-- /corpus-about -->', "", page, flags=re.S)
    block = f'\n  <section class="rd" id="corpus-about"><h3>Corpus</h3>\n    <div class="corpus-text">{soup}</div>\n  </section><!-- /corpus-about -->'
    page = page.replace('<section id="pg-bookcorpus" class="page">', '<section id="pg-bookcorpus" class="page">' + block, 1)
    (ROOT / "pages/book-corpus.html").write_text(NOTE.format(src="content/corpus-book.md") + page, encoding="utf-8")


if __name__ == "__main__":
    build_codebook(); build_corpus()
    print("Built pages/codebook.html and pages/book-corpus.html")
