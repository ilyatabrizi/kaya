#!/usr/bin/env python3
"""Pull the two faces KAYA uses and subset them to the glyphs the app ships.

Google serves one file per unicode-range; the site is English, so only the
latin slice matters — always the last @font-face in the payload. Each file is
then re-subset to the character set the interface can render.

Inter carries the interface; Playfair Display carries the display sizes — the
closest Google face to the Didone letterforms of the KAYA wordmark itself.
Self-hosted, deliberately: Google Fonts is slow-to-unreachable from Iran and
this has to open on a phone in Tabriz on the first try.

    python3 scripts/fetch_fonts.py
"""
import pathlib
import re
import subprocess
import urllib.request

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "fonts"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
GLYPHS = ("U+0020-007E,U+00A0,U+00B0,U+00B7,U+00D7,U+2013,U+2014,U+2018,U+2019,"
          "U+201C,U+201D,U+2022,U+2026,U+2190,U+2192,U+2212,U+00E9,U+00C9")

FACES = [
    ("inter", "Inter:wght@300..800"),
    ("playfair", "Playfair+Display:wght@400..800"),
]


def latin_url(query):
    req = urllib.request.Request(
        f"https://fonts.googleapis.com/css2?family={query}&display=swap",
        headers={"User-Agent": UA})
    css = urllib.request.urlopen(req, timeout=30).read().decode()
    urls = re.findall(r"url\((https://[^)]+\.woff2)\)", css)
    if not urls:
        raise SystemExit(f"no woff2 in payload for {query}")
    return urls[-1]          # latin is the last range Google emits


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, query in FACES:
        url = latin_url(query)
        raw = OUT / f"{name}.raw.woff2"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        raw.write_bytes(urllib.request.urlopen(req, timeout=30).read())
        dest = OUT / f"{name}.woff2"
        subprocess.run([
            "python3", "-m", "fontTools.subset", str(raw),
            f"--unicodes={GLYPHS}", "--layout-features=kern,liga,calt,tnum",
            "--flavor=woff2", "--desubroutinize", f"--output-file={dest}",
        ], check=True)
        raw.unlink()
        print(f"  {dest.name:16} {dest.stat().st_size / 1024:6.1f} KB")


if __name__ == "__main__":
    main()
