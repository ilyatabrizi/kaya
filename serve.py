#!/usr/bin/env python3
"""Local preview.

    python3 serve.py            # http://localhost:8111

SimpleHTTPRequestHandler answers every request with 200 and the whole file. For
a page whose hero is a scroll-scrubbed video that is not good enough: without a
206 to a Range request, Chrome reports `seekable` as an empty range and refuses
to seek at all, so the hero sits on frame zero and the bug looks like the
scrubber's. GitHub Pages does serve ranges; this makes the dev server match it.
"""
import functools
import http.server
import os
import pathlib
import re
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8111
ROOT = pathlib.Path(__file__).resolve().parent
RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")


class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.webp': 'image/webp',
        '.woff2': 'font/woff2',
        '.mp4': 'video/mp4',
        '.js': 'text/javascript',
        '.svg': 'image/svg+xml',
    }

    def send_head(self):
        rng = self.headers.get('Range')
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None

        size = os.fstat(f.fileno()).st_size
        m = RANGE_RE.match(rng.strip())
        if not m:
            f.close()
            self.send_error(400, 'Bad Range')
            return None

        start_s, end_s = m.group(1), m.group(2)
        if start_s == '':
            # A suffix range: the last N bytes.
            length = int(end_s or 0)
            start = max(0, size - length)
            end = size - 1
        else:
            start = int(start_s)
            end = int(end_s) if end_s else size - 1
        end = min(end, size - 1)

        if start > end or start >= size:
            f.close()
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None

        self.send_response(206)
        self._sent_ranges_header = True
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        f.seek(start)
        self._remaining = end - start + 1
        return _Slice(f, self._remaining)

    def end_headers(self):
        # No caching in dev, or an edited file never shows up.
        self.send_header('Cache-Control', 'no-store')
        if not getattr(self, '_sent_ranges_header', False):
            self.send_header('Accept-Ranges', 'bytes')
        self._sent_ranges_header = False
        super().end_headers()

    def log_message(self, fmt, *args):
        line = ' '.join(str(a) for a in args)
        if ' 200 ' not in f' {line} ' and '206' not in line:
            super().log_message(fmt, *args)


class _Slice:
    """A file-like window, so copyfile() stops at the end of the range."""

    def __init__(self, fp, length):
        self.fp = fp
        self.left = length

    def read(self, n=-1):
        if self.left <= 0:
            return b''
        if n is None or n < 0:
            n = self.left
        chunk = self.fp.read(min(n, self.left))
        self.left -= len(chunk)
        return chunk

    def close(self):
        self.fp.close()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    handler = functools.partial(H, directory=str(ROOT))
    with Server(('', PORT), handler) as httpd:
        print(f'KAYA  ->  http://localhost:{PORT}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nstopped')
