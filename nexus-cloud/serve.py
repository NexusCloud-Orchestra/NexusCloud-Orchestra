"""Static server for the landing page plus a same-origin proxy to the NexusCloud API.

The backend's CORS only allows the 5173 tunnel origin, so the browser calls
/api/v1/* on this server and the request is forwarded server-side.

    python3 serve.py                                   # port 5174, default backend tunnel
    NEXUS_API_URL=http://localhost:7575 PORT=5174 python3 serve.py
"""
import os
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BACKEND = os.environ.get("NEXUS_API_URL", "https://190zfn3m-7575.inc1.devtunnels.ms").rstrip("/")
PORT = int(os.environ.get("PORT", "5174"))
ROOT = os.path.dirname(os.path.abspath(__file__))
PROXY_PREFIXES = ("/api/", "/health")
PUBLIC_CACHE_PATHS = ("/api/v1/providers", "/api/v1/plans")
CACHE = {}
FORWARD_REQ = ("accept", "accept-language", "authorization", "content-type", "x-request-id")
DROP_RESP = {"connection", "transfer-encoding", "keep-alive", "set-cookie", "content-encoding",
             "content-length", "access-control-allow-origin", "access-control-expose-headers"}


class Handler(SimpleHTTPRequestHandler):
    def _proxied(self):
        return self.path.startswith(PROXY_PREFIXES)

    def _proxy(self):
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        req = urllib.request.Request(BACKEND + self.path, data=body, method=self.command)
        for k in FORWARD_REQ:
            if self.headers.get(k):
                req.add_header(k, self.headers[k])
        req.add_header("X-Tunnel-Skip-AntiPhishing-Page", "true")
        req.add_header("User-Agent", "nexus-landing-proxy")
        # The dev tunnel occasionally stalls a request; retry idempotent GETs on a short timeout.
        attempts, timeout = (3, 4) if self.command in ("GET", "HEAD") else (1, 25)
        status, headers, data = 502, None, b'{"detail":"Backend unreachable"}'
        for _ in range(attempts):
            try:
                resp = urllib.request.urlopen(req, timeout=timeout)
                status, headers, data = resp.status, resp.headers, resp.read()
                break
            except urllib.error.HTTPError as e:
                status, headers, data = e.code, e.headers, e.read()
                break
            except Exception as e:
                data = ('{"detail":"Backend unreachable: %s"}' % type(e).__name__).encode()
        # Public catalog endpoints: remember the last good copy and serve it if the tunnel is down.
        if self.command == "GET" and self.path in PUBLIC_CACHE_PATHS:
            if status == 200:
                CACHE[self.path] = (headers, data)
            elif status >= 502 and self.path in CACHE:
                status, (headers, data) = 200, CACHE[self.path]
        self.send_response(status)
        if headers:
            for k, v in headers.items():
                if k.lower() not in DROP_RESP:
                    self.send_header(k, v)
        else:
            self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def do_GET(self):
        self._proxy() if self._proxied() else super().do_GET()

    def do_HEAD(self):
        self._proxy() if self._proxied() else super().do_HEAD()

    def do_POST(self):
        self._proxy() if self._proxied() else self.send_error(405)

    do_PUT = do_PATCH = do_DELETE = do_POST

    def end_headers(self):
        if not self._proxied() and self.path.split("?")[0] in ("/", "/index.html", "/config.js", "/main.js", "/styles.css"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    print(f"Serving {ROOT} on http://0.0.0.0:{PORT} -> API {BACKEND}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), partial(Handler, directory=ROOT)).serve_forever()
