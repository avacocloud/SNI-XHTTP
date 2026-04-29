export const config = { runtime: "edge" };

(function() {
    var _0x9f8a2c1d = "TARGET_DOMAIN";
    var _0x4b7d9e2f = process.env[_0x9f8a2c1d] || "";
    var _0x3a1b8e6c = _0x4b7d9e2f.replace(/\/$/, "");

    var _0x2d5f7a9b = new Set([
        "\x68\x6f\x73\x74", "\x63\x6f\x6e\x6e\x65\x63\x74\x69\x6f\x6e", "\x6b\x65\x65\x70\x2d\x61\x6c\x69\x76\x65",
        "\x70\x72\x6f\x78\x79\x2d\x61\x75\x74\x68\x65\x6e\x74\x69\x63\x61\x74\x65", "\x70\x72\x6f\x78\x79\x2d\x61\x75\x74\x68\x6f\x72\x69\x7a\x61\x74\x69\x6f\x6e",
        "\x74\x65", "\x74\x72\x61\x69\x6c\x65\x72", "\x74\x72\x61\x6e\x73\x66\x65\x72\x2d\x65\x6e\x63\x6f\x64\x69\x6e\x67",
        "\x75\x70\x67\x72\x61\x64\x65", "\x66\x6f\x72\x77\x61\x72\x64\x65\x64", "\x78\x2d\x66\x6f\x72\x77\x61\x72\x64\x65\x64\x2d\x68\x6f\x73\x74",
        "\x78\x2d\x66\x6f\x72\x77\x61\x72\x64\x65\x64\x2d\x70\x72\x6f\x74\x6f", "\x78\x2d\x66\x6f\x72\x77\x61\x72\x64\x65\x64\x2d\x70\x6f\x72\x74"
    ]);

    function _0x8c4e1d7a(_0x5f9b2e3d) {
        return !_0x5f9b2e3d || _0x5f9b2e3d.length === 0;
    }

    export default async function _0x6b4e9f2a(_0x7c8d1e3f) {
        if (_0x8c4e1d7a(_0x3a1b8e6c)) {
            return new Response("Misconfigured: TARGET_DOMAIN is not set", { status: 500 });
        }

        try {
            var _0x9d2e7f4b = _0x7c8d1e3f.url.indexOf("/", 8);
            var _0x4f1a8c5e = _0x9d2e7f4b === -1 
                ? _0x3a1b8e6c + "/" 
                : _0x3a1b8e6c + _0x7c8d1e3f.url.slice(_0x9d2e7f4b);

            var _0x1b3e6f9a = new Headers();
            var _0x8f4c2d7b = null;

            for (var [_0x2f9a5d8c, _0x6e1b4f9d] of _0x7c8d1e3f.headers) {
                if (_0x2d5f7a9b.has(_0x2f9a5d8c)) continue;
                if (_0x2f9a5d8c.startsWith("x-vercel-")) continue;
                if (_0x2f9a5d8c === "x-real-ip") { 
                    _0x8f4c2d7b = _0x6e1b4f9d; 
                    continue; 
                }
                if (_0x2f9a5d8c === "x-forwarded-for") { 
                    if (!_0x8f4c2d7b) _0x8f4c2d7b = _0x6e1b4f9d; 
                    continue; 
                }
                _0x1b3e6f9a.set(_0x2f9a5d8c, _0x6e1b4f9d);
            }

            if (_0x8f4c2d7b) _0x1b3e6f9a.set("x-forwarded-for", _0x8f4c2d7b);

            var _0x3c7d9a2e = _0x7c8d1e3f.method;
            var _0x5f2b8e9c = _0x3c7d9a2e !== "GET" && _0x3c7d9a2e !== "HEAD";

            return await fetch(_0x4f1a8c5e, {
                method: _0x3c7d9a2e,
                headers: _0x1b3e6f9a,
                body: _0x5f2b8e9c ? _0x7c8d1e3f.body : undefined,
                duplex: "half",
                redirect: "manual"
            });
        } catch (_0x7e3d9f2c) {
            console.error("relay error:", _0x7e3d9f2c);
            return new Response("Bad Gateway: Tunnel Failed", { status: 502 });
        }
    }
})();
