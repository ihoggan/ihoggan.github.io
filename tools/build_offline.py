#!/usr/bin/env python3
"""build_offline.py — keep the site's offline support up to date.

Run from the repo root after adding, renaming or editing pages:

    python3 tools/build_offline.py          # update files
    python3 tools/build_offline.py --check  # report only, change nothing

It does three things:
  1. Wires every page up for offline use (manifest link, theme colour,
     app icon, the sw-register.js script, and a "Use offline" footer link).
     Pages that already have them are left alone.
  2. Rebuilds the list of files that sw.js saves on a visitor's device.
  3. Sets sw.js VERSION from a hash of those files, so visitors' browsers
     refresh their saved copy only when something has actually changed.

Standard library only: no venv or pip needed.
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / "sw.js"

# Never wired up or saved: search-engine verification files and the like.
SKIP_PAGES = re.compile(r"^google[0-9a-f]+\.html$")

HEAD_TAGS = (
    '<link rel="manifest" href="manifest.webmanifest">\n'
    '<meta name="theme-color" content="#0F181E">\n'
    '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
)
BODY_TAG = '<script src="sw-register.js" defer></script>\n'
FOOTER_LINK = '<a href="offline.html">Use offline</a>\n    '


def pages():
    return sorted(p for p in ROOT.glob("*.html") if not SKIP_PAGES.match(p.name))


def wire_page(path: Path) -> list:
    """Add the offline tags to one page. Returns a list of what changed."""
    html = path.read_text(encoding="utf-8")
    changes = []

    if 'rel="manifest"' not in html:
        i = html.find("</head>")          # first one is the real head
        if i == -1:
            return ["NO </head> FOUND - skipped"]
        html = html[:i] + HEAD_TAGS + html[i:]
        changes.append("head tags")

    if "sw-register.js" not in html and "serviceWorker.register" not in html:
        i = html.rfind("</body>")         # last one: code samples can contain </body>
        if i == -1:
            return changes + ["NO </body> FOUND - script skipped"]
        html = html[:i] + BODY_TAG + html[i:]
        changes.append("register script")

    if path.name != "offline.html" and 'href="offline.html"' not in html:
        # The site footer's inner div; a bare "<footer" can turn up in code samples.
        f = html.rfind('<div class="wrap foot">')
        if f != -1:
            t = html.find('<span class="tag">', f)
            end = html.find("</div>", f)
            if t != -1 and (end == -1 or t < end):
                html = html[:t] + FOOTER_LINK + html[t:]
                changes.append("footer link")

    if changes:
        path.write_text(html, encoding="utf-8")
    return changes


def precache_list():
    files = ["./"]
    files += [p.name for p in pages()]
    files += ["site.css", "manifest.webmanifest", "sw-register.js"]
    files += sorted(f"icons/{p.name}" for p in (ROOT / "icons").glob("*.png"))
    files += sorted(f"images/{p.name}" for p in (ROOT / "images").glob("*.svg"))
    return files


def version_for(files):
    h = hashlib.sha256()
    for name in files:
        if name == "./":
            continue
        h.update(name.encode())
        h.update((ROOT / name).read_bytes())
    return "site-" + h.hexdigest()[:10]


def replace_block(text, tag, body):
    pattern = re.compile(rf"(// {tag}-START\n).*?(// {tag}-END)", re.S)
    if not pattern.search(text):
        sys.exit(f"sw.js is missing its // {tag}-START / END markers")
    return pattern.sub(lambda m: m.group(1) + body + m.group(2), text)


def main():
    check = "--check" in sys.argv

    print("Pages:")
    wired = 0
    for p in pages():
        if check:
            html = p.read_text(encoding="utf-8")
            missing = [n for n, ok in (
                ("head tags", 'rel="manifest"' in html),
                ("register script", "sw-register.js" in html or "serviceWorker.register" in html),
            ) if not ok]
            if missing:
                print(f"  {p.name}: missing {', '.join(missing)}")
                wired += 1
        else:
            changes = wire_page(p)
            if changes:
                print(f"  {p.name}: added {', '.join(changes)}")
                wired += 1
    if not wired:
        print("  all pages already wired up")

    files = precache_list()
    missing = [f for f in files if f != "./" and not (ROOT / f).exists()]
    if missing:
        sys.exit(f"Missing files: {missing}")

    version = version_for(files)
    sw = SW.read_text(encoding="utf-8")
    current = re.search(r"const VERSION = '([^']+)'", sw)
    listing = "const PRECACHE = [\n" + "".join(f"  '{f}',\n" for f in files) + "];\n"
    new_sw = replace_block(sw, "VERSION", f"const VERSION = '{version}';\n")
    new_sw = replace_block(new_sw, "PRECACHE", listing)

    size = sum((ROOT / f).stat().st_size for f in files if f != "./")
    print(f"\nsw.js saves {len(files)} files ({size / 1024:.0f} KB) on each visitor's device.")

    if new_sw == sw:
        print(f"sw.js already up to date ({version}).")
    elif check:
        print(f"sw.js is out of date: would change {current.group(1) if current else '?'} -> {version}")
        sys.exit(1)
    else:
        SW.write_text(new_sw, encoding="utf-8")
        print(f"sw.js updated: VERSION {current.group(1) if current else '?'} -> {version}")


if __name__ == "__main__":
    main()
