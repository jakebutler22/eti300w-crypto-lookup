#!/usr/bin/env python3
"""Serve the frontend locally with a bounded, read-only public API proxy."""

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from package_frontend import runtime_contents


MAX_RESPONSE_BYTES = 1024 * 1024
API_ROUTE = re.compile(r"/api/(?:db/cryptos|live/[A-Z0-9]{1,12})\Z")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--api-origin", default="http://3.145.42.74")
    parser.add_argument("--demo", action="store_true", help="Explicit offline fixture preview")
    args = parser.parse_args()
    origin = urlsplit(args.api_origin)
    if origin.scheme not in ("http", "https") or not origin.hostname or origin.username or origin.password or origin.path not in ("", "/") or origin.query or origin.fragment:
        parser.error("--api-origin must be an HTTP(S) origin without credentials or a path")
    api_origin = args.api_origin.rstrip("/")

    class Preview(BaseHTTPRequestHandler):
        def send_body(self, status, body, content_type, retry_after=None):
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            if retry_after:
                self.send_header("Retry-After", retry_after)
            self.end_headers()
            self.wfile.write(body)

        def api_error(self, status, message):
            self.send_body(status, json.dumps({"error": message}).encode(), "application/json")

        def do_GET(self):
            request = urlsplit(self.path)
            path = request.path
            if path.startswith("/api/"):
                if args.demo or request.query or not API_ROUTE.fullmatch(path):
                    self.api_error(404, "API route unavailable in this preview.")
                    return
                upstream = Request(api_origin + path, headers={"Accept": "application/json"})
                try:
                    try:
                        response = urlopen(upstream, timeout=18)
                    except HTTPError as error:
                        response = error
                    with response:
                        body = response.read(MAX_RESPONSE_BYTES + 1)
                        if len(body) > MAX_RESPONSE_BYTES:
                            self.api_error(502, "The API response exceeded the preview limit.")
                            return
                        # Never forward credentials/cookies or arbitrary response headers.
                        self.send_body(response.code, body, "application/json", response.headers.get("Retry-After"))
                except (URLError, TimeoutError, OSError):
                    self.api_error(502, "The live API could not be reached. Try again shortly.")
                return
            name = "index.html" if path == "/" else path.removeprefix("/")
            files = runtime_contents("demo" if args.demo else "api")
            if name not in files:
                self.api_error(404, "File not found.")
                return
            content_type = "text/javascript" if name.endswith(".js") else mimetypes.guess_type(name)[0] or "application/octet-stream"
            self.send_body(200, files[name], content_type)

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Preview)
    print(f"Explore cryptocurrency: http://127.0.0.1:{args.port}/ ({'offline demo' if args.demo else 'live API'})", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
