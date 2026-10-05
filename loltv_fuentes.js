/**
 * Complemento multi-fuente LOLTV
 * Fuentes: Embed69 + Cuevana
 * Versión: 1.0.0
 *
 * API unificada para la app:
 *   getStreams(tmdbId, type, season, episode, title, year)
 *     → fusiona resultados de todas las fuentes habilitadas
 *   getStreamsFrom(sourceId, tmdbId, type, season, episode, title, year)
 *     → solo una fuente ("embed69" | "cuevana")
 *   listSources()
 *     → [{ id, name, types }]
 *
 * Cada stream incluye:
 *   name, title (idioma primero), url, quality,
 *   language, lang, audio, Audio, langCode, provider, headers, source
 *
 * Instalación: un solo .js / complemento instala varias fuentes.
 */

// ─── registry ────────────────────────────────────────────
var __SOURCES__ = {};
var __ENABLED__ = { embed69: true, cuevana: true };

function listSources() {
  return [
    { id: 'embed69', name: 'Embed69', types: ['movie', 'series'], enabled: !!__ENABLED__.embed69 },
    { id: 'cuevana', name: 'Cuevana', types: ['movie', 'series'], enabled: !!__ENABLED__.cuevana }
  ];
}

function setSourceEnabled(id, on) {
  if (__ENABLED__.hasOwnProperty(id)) __ENABLED__[id] = !!on;
}

function _tagStreams(streams, sourceId, sourceName) {
  if (!Array.isArray(streams)) return [];
  return streams.map(function (s) {
    if (!s || !s.url) return null;
    var lang = s.language || s.lang || s.Audio || s.audio || 'Latino';
    var provider = s.provider || s.serverLabel || s.serverName || 'Servidor';
    var title = s.title;
    // Garantizar idioma al inicio del title
    if (!title || title.indexOf(lang) !== 0) {
      title = lang + ' - ' + provider;
    }
    return {
      name: s.name || (sourceName + ' - ' + (s.quality || 'HD')),
      title: title,
      url: s.url,
      quality: s.quality || 'HD',
      language: lang,
      lang: lang,
      audio: lang,
      Audio: lang,
      langCode: s.langCode || undefined,
      provider: provider,
      source: sourceId,
      sourceName: sourceName,
      verified: s.verified,
      isReal: s.isReal,
      headers: s.headers || {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
  }).filter(Boolean);
}

function _dedupe(list) {
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    var key = String(s.url || '');
    if (!key || seen[key]) continue;
    seen[key] = true;
    out.push(s);
  }
  return out;
}


// ─── Embed69 (factory CommonJS) ──────────────────────────
function __loadEmbed69() {
  var module = { exports: {} };
  var exports = module.exports;
  // BEGIN EMBED69
/**
 * embed69 - Built from src/embed69/
 * Generated: 2026-05-05T21:05:01.154Z
 */
/* __QS_POLYFILL__ */
(function () {
  var g = (typeof globalThis !== 'undefined') ? globalThis
    : (typeof self !== 'undefined') ? self
    : (typeof global !== 'undefined') ? global
    : (typeof window !== 'undefined') ? window
    : null;
  if (!g) return;
  if (typeof g.atob !== 'function') {
    var A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    g.atob = function (s) {
      s = String(s || '').replace(/[\t\n\r ]/g, '').replace(/=+$/, '');
      var out = '';
      for (var i = 0; i < s.length; i += 4) {
        var c1 = A64.indexOf(s[i]), c2 = A64.indexOf(s[i + 1] || 'A'), c3 = A64.indexOf(s[i + 2] || 'A'), c4 = A64.indexOf(s[i + 3] || 'A');
        var o1 = (c1 << 2) | (c2 >> 4), o2 = ((c2 & 15) << 4) | (c3 >> 2), o3 = ((c3 & 3) << 6) | c4;
        out += String.fromCharCode(o1);
        if (s[i + 2]) out += String.fromCharCode(o2);
        if (s[i + 3]) out += String.fromCharCode(o3);
      }
      return out;
    };
  }
  if (typeof g.btoa !== 'function') {
    var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    g.btoa = function (s) {
      s = String(s || '');
      var out = '';
      for (var i = 0; i < s.length; i += 3) {
        var a = s.charCodeAt(i), b = s.charCodeAt(i + 1) || 0, c = s.charCodeAt(i + 2) || 0;
        out += B64[(a >> 2)] + B64[((a & 3) << 4) | (b >> 4)] + (i + 1 < s.length ? B64[((b & 15) << 2) | (c >> 6)] : '=') + (i + 2 < s.length ? B64[c & 63] : '=');
      }
      return out;
    };
  }
  var _u = null;
  try { if (typeof g.URL === 'function') _u = new g.URL('https://api.themoviedb.org/x/y?z=1'); } catch (e) {}
  var _urlOk = !!(_u && typeof _u.hostname === 'string' && _u.hostname === 'api.themoviedb.org' && typeof _u.origin === 'string' && _u.origin.indexOf('http') === 0);
  if (typeof g.URL !== 'function' || !_urlOk) {
    // Nuvio ships its own URL polyfill, but its parse depends on a __parse_url
    // bridge whose fallback returns EMPTY hostname/origin/protocol. So we ALWAYS
    // install a correct regex-based URL parser (override when Nuvio's is broken,
    // no-op when absent). This fixes embed69's new URL(...).origin/.hostname in Nuvio.
    function QSURL(url, base) {
      var u = String(url || '');
      if (base && !/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) {
        var b = (base.match(/^(https?:\/\/[^/?#]*)/i) || [''])[0];
        if (u.charAt(0) === '/') u = b + u;
        else if (u.indexOf('?') === 0 || u.indexOf('#') === 0) u = b + '/' + u;
        else {
          var bp = (base.match(/^(https?:\/\/[^/?#]+)(\/[^?#]*)?$/i) || []);
          var dir = (bp[2] || '/').replace(/[^/]*$/, '');
          u = (bp[1] || '') + dir + u;
        }
      }
      this.href = u;
      var m = u.match(/^(https?):\/\/([^/?#:]+)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i) || [];
      this.protocol = ((m[1] || 'https') + ':');
      this.hostname = m[2] || '';
      this.port = m[3] || '';
      this.host = this.hostname + (this.port ? ':' + this.port : '');
      this.pathname = m[4] || '/';
      this.search = m[5] || '';
      this.hash = m[6] || '';
      this.origin = this.protocol + '//' + this.host;
    }
    QSURL.prototype.toString = function () { return this.href; };
    g.URL = QSURL;
  }
})();
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// ── Retry/backoff helper (self-contained; Nuvio QuickJS-safe) ──
function retryFetch(fetchFn, opts) {
  return __async(this, null, function* () {
    var retries = (opts && opts.retries != null) ? opts.retries : 2;
    var baseDelay = (opts && opts.baseDelay != null) ? opts.baseDelay : 400;
    var maxDelay = (opts && opts.maxDelay != null) ? opts.maxDelay : 3200;
    var attempt = 0;
    while (true) {
      try {
        var res = yield fetchFn();
        if (res && typeof res.status === "number" && attempt < retries &&
            (res.status === 429 || res.status === 408 || (res.status >= 500 && res.status < 600))) {
          attempt++;
          var delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 150);
          console.warn(`[HTTP] Retry ${attempt}/${retries} (HTTP ${res.status}) en ${(opts && opts.label) || "url"} tras ${delay}ms`);
          yield new Promise(function (r) { setTimeout(r, delay); });
          continue;
        }
        return res;
      } catch (error) {
        if (attempt < retries) {
          attempt++;
          var delay2 = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 150);
          console.warn(`[HTTP] Retry ${attempt}/${retries} (${(error && error.message) || "network error"}) tras ${delay2}ms`);
          yield new Promise(function (r2) { setTimeout(r2, delay2); });
          continue;
        }
        throw error;
      }
    }
  });
}

// ── Rich stream labels (shared module) ──
var streamLabels = (function(){try{return (null)}catch(e){return null}})();
var buildStreamLabel = streamLabels ? streamLabels.buildStreamLabel : function(s, pn) {
  var q = s.quality || 'HD', server = s.serverName || s.serverLabel || s.servername || s.provider || '';
  // IMPORTANT: resolvers set `Audio` (capital A). Also accept lang/language/audio.
  var lang = s.lang || s.language || s.Audio || s.audio || s.langLabel || 'Latino';
  var isReal = s.isReal === true;
  return {
    name: pn + ' - ' + q + (isReal ? ' ✅' : ''),
    title: lang + ' - ' + server,
    quality: q,
    _resWeight: 0,
    _sizeWeight: 0
  };
};

// src/utils/ua.js
var require_ua = __commonJS({
  "src/utils/ua.js"(exports2, module2) {
    var UA_POOL = [
      // Windows - Chrome 146 (Custom modern fingerprint)
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
    ];
    function getRandomUA2() {
      const index = Math.floor(Math.random() * UA_POOL.length);
      return UA_POOL[index];
    }
    module2.exports = { getRandomUA: getRandomUA2, UA_POOL };
  }
});

// src/utils/http.js
var require_http = __commonJS({
  "src/utils/http.js"(exports2, module2) {
    var { getRandomUA: getRandomUA2 } = require_ua();
    var DEFAULT_CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var sessionUA = null;
    function setSessionUA2(ua) {
      sessionUA = ua;
    }
    function getSessionUA() {
      return sessionUA || DEFAULT_CHROME_UA;
    }
    function getStealthHeaders() {
      return {
        "User-Agent": getSessionUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "es-US,es;q=0.9,en-US;q=0.8,en;q=0.7,es-419;q=0.6",
        "Connection": "keep-alive",
        "sec-ch-ua": '"Chromium";v="137", "Not-A.Brand";v="24", "Google Chrome";v="137"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      };
    }
    var DEFAULT_UA = getSessionUA();
    var MOBILE_UA = getSessionUA();
    function request(url, options) {
      return __async(this, null, function* () {
        var opt = options || {};
        var currentUA = opt.headers && opt.headers["User-Agent"] ? opt.headers["User-Agent"] : getSessionUA();
        var headers = Object.assign({
          "User-Agent": currentUA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "es-MX,es;q=0.9,en;q=0.8"
        }, opt.headers);
        try {
          var fetchOptions = Object.assign({
            redirect: opt.redirect || "follow",
            skipSizeCheck: true
          }, opt, {
            headers
          });
          if (opt.signal)
            fetchOptions.signal = opt.signal;
          var response = yield retryFetch(function () { return fetch(url, fetchOptions); }, {
            retries: 2, baseDelay: 400, maxDelay: 3200, label: url
          });
          if (opt.redirect === "manual" && (response.status === 301 || response.status === 302)) {
            const redirectUrl = response.headers.get("location");
            console.log(`[HTTP] Redirecci\xF3n detectada (Manual): ${redirectUrl}`);
            return { status: response.status, redirectUrl, ok: false };
          }
          if (!response.ok && !opt.ignoreErrors) {
            console.warn("[HTTP] Error " + response.status + " en " + url);
          }
          return response;
        } catch (error) {
          console.error("[HTTP] Error en " + url + ": " + error.message);
          throw error;
        }
      });
    }
    function fetchHtml(url, options) {
      return __async(this, null, function* () {
        var res = yield request(url, options);
        return yield res.text();
      });
    }
    function fetchJson(url, options) {
      return __async(this, null, function* () {
        var res = yield request(url, options);
        return yield res.json();
      });
    }
    module2.exports = {
      request,
      fetchHtml,
      fetchJson,
      getSessionUA,
      setSessionUA: setSessionUA2,
      getStealthHeaders,
      DEFAULT_UA,
      MOBILE_UA
    };
  }
});

// src/utils/id_mapper.js
var require_id_mapper = __commonJS({
  "src/utils/id_mapper.js"(exports2, module2) {
    var { fetchJson, fetchHtml } = require_http();
    var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
    var ID_CACHE = /* @__PURE__ */ new Map();
    var SERIES_MAPPINGS = {
      // Ejemplo: 'tmdb_id': 'imdb_id'
    };
    function getImdbIdFromApi(tmdbId, mediaType) {
      return __async(this, null, function* () {
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          const apiKey = TMDB_API_KEY;
          const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
          const idUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${apiKey}`;
          const metaUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}&language=es-MX`;
          const idRes = yield fetchJson(idUrl, { headers: { "User-Agent": ua } }).catch(() => null);
          if (!idRes || !idRes.imdb_id)
            return null;
          const metaRes = yield fetchJson(metaUrl, { headers: { "User-Agent": ua } }).catch(() => null);
          const title = metaRes ? metaRes.title || metaRes.name : "Contenido";
          const year = metaRes ? (metaRes.release_date || metaRes.first_air_date || "").split("-")[0] : null;
          return {
            imdbId: idRes.imdb_id,
            title,
            year,
            offset: 0,
            fromMapping: false
          };
        } catch (e) {
          console.log(`[IDMapper] API error: ${e.message}`);
          return null;
        }
      });
    }
    function scrapeTmdbId(tmdbId, mediaType) {
      return __async(this, null, function* () {
        try {
          const url = `https://www.themoviedb.org/${mediaType}/${tmdbId}?language=es-MX`;
          const html = yield fetchHtml(url, { timeout: 1e4 }).catch(() => null);
          if (!html)
            return { imdbId: null, title: "Contenido" };
          const imdbMatch = html.match(/href="https:\/\/www\.imdb\.com\/title\/(tt\d+)"/i);
          const titleMatch = html.match(/<title>(.*?) &#8212;/i);
          return {
            imdbId: imdbMatch ? imdbMatch[1] : null,
            title: titleMatch ? titleMatch[1].trim() : "Contenido",
            year: null,
            offset: 0,
            fromMapping: false
          };
        } catch (e) {
          return { imdbId: null, title: "Contenido" };
        }
      });
    }
    function getCorrectImdbId2(tmdbId, mediaType) {
      return __async(this, null, function* () {
        if (!tmdbId)
          return { imdbId: null, title: "" };
        const cacheKey = `${mediaType}_${tmdbId}`;
        if (ID_CACHE.has(cacheKey))
          return ID_CACHE.get(cacheKey);
        if (tmdbId.startsWith("tt")) {
          const res = { imdbId: tmdbId, title: "Contenido", offset: 0, fromMapping: false };
          ID_CACHE.set(cacheKey, res);
          return res;
        }
        const apiResult = yield getImdbIdFromApi(tmdbId, mediaType);
        if (apiResult && apiResult.imdbId) {
          ID_CACHE.set(cacheKey, apiResult);
          return apiResult;
        }
        const scrapeResult = yield scrapeTmdbId(tmdbId, mediaType);
        ID_CACHE.set(cacheKey, scrapeResult);
        return scrapeResult;
      });
    }
    module2.exports = { getCorrectImdbId: getCorrectImdbId2, SERIES_MAPPINGS };
  }
});

// src/utils/m3u8.js
var require_m3u8 = __commonJS({
  "src/utils/m3u8.js"(exports2, module2) {
    var { getSessionUA } = require_http();
    function getQualityFromHeight(height) {
      if (!height)
        return "1080p";
      const h = parseInt(height);
      if (h >= 2160)
        return "4K";
      if (h >= 1440)
        return "1440p";
      if (h >= 1080)
        return "1080p";
      if (h >= 720)
        return "720p";
      if (h >= 480)
        return "480p";
      if (h >= 360)
        return "360p";
      return "1080p";
    }
    function parseBestQuality(content, url = "") {
      let bestHeight = 0;
      let bestBandwidth = 0;
      if (content) {
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.includes("RESOLUTION=")) {
            const match = line.match(/RESOLUTION=\d+x(\d+)/i);
            if (match) {
              const height = parseInt(match[1]);
              if (height > bestHeight)
                bestHeight = height;
            }
          }
          if (line.includes("BANDWIDTH=")) {
            const match = line.match(/BANDWIDTH=(\d+)/i);
            if (match) {
              const bandwidth = parseInt(match[1]);
              if (bandwidth > bestBandwidth)
                bestBandwidth = bandwidth;
            }
          }
        }
      }
      let quality = "1080p";
      let isReal = false;
      if (bestHeight > 0) {
        quality = getQualityFromHeight(bestHeight);
      } else {
        const qMatch = url.match(/([_-]|\/)(\d{3,4})([pP]|(\.m3u8))?/);
        if (qMatch) {
          const h = parseInt(qMatch[2]);
          if (h >= 360 && h <= 4320)
            quality = getQualityFromHeight(h);
        }
      }
      if (bestHeight > 0)
        isReal = true;
      if (bestBandwidth >= 2e6)
        isReal = true;
      return { quality, isReal };
    }
    var VALIDATION_CACHE = /* @__PURE__ */ new Map();
    function validateStream(stream, signal = null) {
      return __async(this, null, function* () {
        if (!stream || !stream.url)
          return stream;
        const { url, headers } = stream;
        const isMp4 = url.toLowerCase().includes(".mp4");
        if (VALIDATION_CACHE.has(url))
          return __spreadValues(__spreadValues({}, stream), VALIDATION_CACHE.get(url));
        try {
          const fetchOptions = {
            method: isMp4 ? "HEAD" : "GET",
            headers: __spreadValues({
              "User-Agent": getSessionUA()
            }, headers || {})
          };
          if (signal)
            fetchOptions.signal = signal;
          const response = yield fetch(url, fetchOptions);
          if (!response.ok)
            return __spreadProps(__spreadValues({}, stream), { verified: false });
          if (isMp4) {
            const resultData2 = { verified: true, quality: stream.quality || "1080p", isReal: true };
            VALIDATION_CACHE.set(url, resultData2);
            return __spreadValues(__spreadValues({}, stream), resultData2);
          }
          const text = yield response.text();
          const info = parseBestQuality(text, url);
          const resultData = {
            verified: true,
            quality: info.quality,
            isReal: info.isReal
          };
          VALIDATION_CACHE.set(url, resultData);
          return __spreadValues(__spreadValues({}, stream), resultData);
        } catch (error) {
          const info = parseBestQuality("", url);
          const resultData = { quality: info.quality, verified: true, isReal: false };
          VALIDATION_CACHE.set(url, resultData);
          return __spreadValues(__spreadValues({}, stream), resultData);
        }
      });
    }
    module2.exports = { validateStream, getQualityFromHeight };
  }
});

// src/utils/sorting.js
var sorting_exports = {};
__export(sorting_exports, {
  sortStreamsByQuality: () => sortStreamsByQuality
});
function sortStreamsByQuality(streams) {
  if (!Array.isArray(streams))
    return [];
  return [...streams].sort((a, b) => {
    const scoreA = QUALITY_SCORE[a.quality] || 0;
    const scoreB = QUALITY_SCORE[b.quality] || 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    const serverA = (a.serverLabel || "").split(" ")[0];
    const serverB = (b.serverLabel || "").split(" ")[0];
    const speedA = SERVER_SCORE[serverA] || 0;
    const speedB = SERVER_SCORE[serverB] || 0;
    if (speedA !== speedB) {
      return speedB - speedA;
    }
    if (a.verified && !b.verified)
      return -1;
    if (!a.verified && b.verified)
      return 1;
    return 0;
  });
}
var QUALITY_SCORE, SERVER_SCORE;
var init_sorting = __esm({
  "src/utils/sorting.js"() {
    QUALITY_SCORE = {
      "4K": 100,
      "1440p": 90,
      "1080p": 80,
      "720p": 70,
      "480p": 60,
      "360p": 50,
      "240p": 40,
      "Auto": 30,
      "Unknown": 0
    };
    SERVER_SCORE = {
      "VOE": 10,
      "Filemoon": 10,
      "Tplayer": 10,
      "Vimeos": 10,
      "Netu": 5,
      "GoodStream": 10,
      "StreamWish": -5,
      "VidHide": -5
    };
  }
});

// src/utils/mirrors.js
var require_mirrors = __commonJS({
  "src/utils/mirrors.js"(exports2, module2) {
    var MIRRORS = {
      VIDHIDE: [
        "vidhide",
        "minochinos",
        "vadisov",
        "vaiditv",
        "amusemre",
        "callistanise",
        "vhaudm",
        "mdfury",
        "dintezuvio",
        "acek-cdn",
        "vedonm",
        "vidhidepro",
        "vidhidevip",
        "masukestin",
        "vidoza",
        "supervideo"
      ],
      STREAMWISH: [
        "hlswish",
        "streamwish",
        "hglink",
        "hglamioz",
        "hglink.to",
        "audinifer",
        "embedwish",
        "awish",
        "dwish",
        "strwish",
        "filelions",
        "wishembed",
        "wishfast",
        "hanerix"
      ],
      FILEMOON: [
        "filemoon",
        "moonalu",
        "moonembed",
        "bysedikamoum",
        "r66nv9ed",
        "398fitus",
        "filemoon.sx",
        "filemoon.to",
        "filemoon.lat",
        "filemoon.live",
        "filemoon.online",
        "filemoon.me",
        "bysedikamoum.com",
        "r66nv9ed.com",
        "398fitus.com",
        "fmoon.top"
      ],
      VOE: [
        "voe.sx",
        "voe-sx",
        "voex.sx",
        "marissashare",
        "cloudwindow",
        "marissasharecareer"
      ],
      FASTREAM: [
        "fastream",
        "fastplay",
        "fembed"
      ],
      OKRU: [
        "ok.ru",
        "okru"
      ],
      PIXELDRAIN: [
        "pixeldrain"
      ],
      BUZZHEAVIER: [
        "buzzheavier",
        "bzh.sh"
      ],
      GOODSTREAM: [
        "goodstream",
        "gs.one"
      ],
      LULUSTREAM: [
        "lulustream",
        "luluvdo",
        "luluvids",
        "pondy",
        "lulupuv"
      ],
      SEEKSTREAMING: [
        "seekplays",
        "seekstreaming",
        "embedseek"
      ],
      DROPCDN: [
        "dropcdn.io",
        "dropload.io",
        "dropcdn",
        "dropload",
        "dr0pstream"
      ],
      DOODSTREAM: [
        "dood.li",
        "dood.la",
        "ds2video.com",
        "ds2play.com",
        "dood.yt",
        "dood.ws",
        "dood.so",
        "dood.to",
        "dood.pm",
        "dood.watch",
        "dood.sh",
        "dood.cx",
        "dood.wf",
        "dood.re",
        "dood.one",
        "dood.tech",
        "dood.work",
        "doods.pro",
        "dooood.com",
        "doodstream.com",
        "doodstream.co",
        "d000d.com",
        "d0000d.com",
        "doodapi.com",
        "d0o0d.com",
        "do0od.com",
        "dooodster.com",
        "vidply.com",
        "do7go.com",
        "all3do.com",
        "doply.net",
        "dsvplay.com"
      ],
      VIDNEST: [
        "vidnest.io",
        "vidnest.live"
      ],
      VIDSONIC: [
        "vidsonic.net"
      ],
      BARMONREY: [
        "barmonrey.com"
      ],
      VIDMOLY: [
        "vidmoly.biz",
        "vidmoly.to"
      ],
      UNLIMPLAY: [
        "unlimplay.com"
      ],
      KRAKENFILES: [
        "krakenfiles.com"
      ],
      UPNS: [
        "upns.online"
      ]
    };
    function isMirror2(url, groupName) {
      if (!url || !MIRRORS[groupName])
        return false;
      const s = url.toLowerCase();
      return MIRRORS[groupName].some((m) => s.includes(m));
    }
    module2.exports = { MIRRORS, isMirror: isMirror2 };
  }
});

// src/utils/engine.js
var require_engine = __commonJS({
  "src/utils/engine.js"(exports2, module2) {
    var { validateStream } = require_m3u8();
    var { sortStreamsByQuality: sortStreamsByQuality2 } = (init_sorting(), __toCommonJS(sorting_exports));
    var { isMirror: isMirror2 } = require_mirrors();
    function normalizeLanguage(lang) {
      const l = (lang || "").toLowerCase().trim();
      if (!l) return "Latino";
      if (l === "lat" || l === "latino" || l.includes("latino") || l.includes("mex") || l.includes("col") || l.includes("arg") || l.includes("chi") || l.includes("per") || l.includes("dub") || l.includes("dual") || l === "es-mx" || l === "es-419") {
        return "Latino";
      }
      if (l === "esp" || l === "cas" || l.includes("castellano") || l.includes("espa") || l.includes("cast") || l === "es-es" || l === "spa" || l === "spanish") {
        return "Castellano";
      }
      if (l === "sub" || l.includes("sub") || l.includes("vose") || l.includes("subtit")) {
        return "Subtitulado";
      }
      if (l.includes("eng") || l === "en" || l === "en-us" || l.includes("ingl") || l === "english") {
        return "Inglés";
      }
      return "Latino";
    }
    function normalizeServer(server, url = "", resolvedServerName = null) {
      if (resolvedServerName)
        return resolvedServerName;
      const u = (url || "").toLowerCase();
      const s = (server || "").toLowerCase();
      if (u.includes("goodstream") || s.includes("goodstream"))
        return "GoodStream";
      if (u.includes("vimeos") || u.includes("vms.sh") || s.includes("vimeos"))
        return "Vimeos";
      if (isMirror2(u, "VIDHIDE") || isMirror2(s, "VIDHIDE"))
        return "VidHide";
      if (isMirror2(u, "STREAMWISH") || isMirror2(s, "STREAMWISH"))
        return "StreamWish";
      if (isMirror2(u, "VOE") || isMirror2(s, "VOE"))
        return "VOE";
      if (isMirror2(u, "FILEMOON") || isMirror2(s, "FILEMOON"))
        return "Filemoon";
      if (isMirror2(u, "DOODSTREAM") || isMirror2(s, "DOODSTREAM"))
        return "DoodStream";
      if (url) {
        try {
          const domainParts = new URL(url).hostname.replace("www.", "").split(".");
          const mainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
          return mainName.charAt(0).toUpperCase() + mainName.slice(1);
        } catch (e) {
        }
      }
      return server || "Servidor";
    }
    function finalizeStreams2(streams, providerName, mediaTitle) {
      return __async(this, null, function* () {
        if (!Array.isArray(streams) || streams.length === 0)
          return [];
        console.log(`[Engine] PROCESANDO STREAMS - Bitrate Global v7.6.0`);
        const { validateStream: validateStream2 } = require_m3u8();
        const sorted = sortStreamsByQuality2(streams);
        const CONCURRENCY_LIMIT = 5;
        const MAX_VALIDATIONS = 5;
        const validatedStreams = [];
        for (let i = 0; i < sorted.length; i += CONCURRENCY_LIMIT) {
          if (i >= MAX_VALIDATIONS) {
            validatedStreams.push(...sorted.slice(i));
            break;
          }
          const batch = sorted.slice(i, i + CONCURRENCY_LIMIT);
          const batchResults = yield Promise.all(batch.map((s) => __async(this, null, function* () {
            try {
              if (s.isReal === true)
                return s;
              if (s.url && (s.url.includes(".m3u8") || s.url.includes(".mp4"))) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2500);
                try {
                  const validated = yield validateStream2(s, controller.signal);
                  clearTimeout(timeoutId);
                  return validated;
                } catch (e) {
                  clearTimeout(timeoutId);
                  return __spreadProps(__spreadValues({}, s), { verified: false, isReal: false });
                }
              }
            } catch (e) {
            }
            return s;
          })));
          validatedStreams.push(...batchResults);
        }
        const processed = [];
        const seenTitles = /* @__PURE__ */ new Set();
        for (const s of validatedStreams) {
          if (!s)
            continue;
          // Resolve language from every possible field resolvers may set
          const rawLang = normalizeLanguage(
            s.lang || s.Audio || s.langLabel || s.language || s.audio || "Latino"
          );
          const l = rawLang.toLowerCase();
          // Allow Latino, Castellano and Subtitulado so the app can filter by language
          const isAllowed =
            l === "latino" ||
            l === "castellano" ||
            l === "subtitulado" ||
            l === "inglés" ||
            l === "ingles";
          if (!isAllowed && providerName !== "FuegoCine")
            continue;

          const server = normalizeServer(
            s.serverLabel || s.serverName || s.servername,
            s.url,
            s.serverName
          );
          const quality = s.quality || "HD";
          const isReal = s.isReal === true;
          const isVerified = s.verified === true;

          // Stamp language onto the stream BEFORE building labels so buildStreamLabel sees it
          s.lang = rawLang;
          s.language = rawLang;
          s.Audio = rawLang;
          s.audio = rawLang;
          s.serverLabel = server;
          s.serverName = s.serverName || server;

          var labelInfo = buildStreamLabel(s, providerName);
          const streamName = labelInfo.name;
          // Title always carries language + server so the app UI can read it
          const streamTitle = rawLang + " - " + server;
          const labelQuality = labelInfo.quality || quality;
          const dedupeKey = streamName + "|" + streamTitle + "|" + s.url;
          if (seenTitles.has(dedupeKey))
            continue;
          seenTitles.add(dedupeKey);

          processed.push({
            name: streamName,
            title: streamTitle,
            url: s.url,
            quality: labelQuality,
            _resWeight: labelInfo._resWeight,
            _sizeWeight: labelInfo._sizeWeight,
            verified: isVerified,
            isReal,
            provider: server,
            // Explicit language fields for the app / page / servers
            language: rawLang,
            lang: rawLang,
            audio: rawLang,
            Audio: rawLang,
            headers: s.headers || {
              "User-Agent": "Mozilla/5.0 (Linux; Android 10; TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
        }
        return processed;
      });
    }
    module2.exports = { finalizeStreams: finalizeStreams2, normalizeLanguage };
  }
});

// src/utils/base64.js
var require_base64 = __commonJS({
  "src/utils/base64.js"(exports2, module2) {
    function localAtob2(input) {
      if (!input)
        return "";
      let str = String(input).replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "").replace(/[\s\n\r\t]/g, "");
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let output = "";
      if (str.length % 4 === 1)
        return "";
      for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      return output;
    }
    function localBtoa(input) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let output = "";
      for (let block, charCode, idx = 0, map = chars; input.charAt(idx | 0) || (map = "=", idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
        charCode = input.charCodeAt(idx += 3 / 4);
        if (charCode > 255)
          throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
        block = block << 8 | charCode;
      }
      return output;
    }
    module2.exports = { localAtob: localAtob2, localBtoa };
  }
});

// src/resolvers/voe.js
var require_voe = __commonJS({
  "src/resolvers/voe.js"(exports2, module2) {
    var { getSessionUA } = require_http();
    var { validateStream } = require_m3u8();
    function stdAtob(input) {
      if (!input) return "";
      try { return Buffer.from(input, "base64").toString("utf-8"); }
      catch (e) { try { return atob(input); } catch (e2) { return ""; } }
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const ua = getSessionUA();
          console.log("[VOE] LUT-Resolving: " + url);
          var resp = yield fetch(url, { headers: { "User-Agent": ua, "Referer": url }, signal: signal });
          if (!resp.ok) return null;
          var html = yield resp.text();
          if (html.indexOf("permanentToken") !== -1) {
            var rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
            if (rm) { resp = yield fetch(rm[1], { headers: { "User-Agent": ua, "Referer": url }, signal: signal }); if (!resp.ok) return null; html = yield resp.text(); url = rm[1]; }
          }
          var mm = html.match(/json">\s*\[\s*['"]([^'"]+)['"]\s*\]<\/script>\s*<script[^>]*src=['"]([^'"]+)['"]/i);
          if (mm) {
            var enc = mm[1], ldr = mm[2];
            if (!ldr.startsWith("http")) ldr = new URL(ldr, url).href;
            var jsr = yield fetch(ldr, { headers: { "User-Agent": ua, "Referer": url }, signal: signal });
            if (jsr.ok) {
              var jsd = yield jsr.text();
              var rm2 = jsd.match(/(\[(?:'[^']{1,10}'[\s,]*){4,12}\])/);
              if (rm2) {
                var luts = []; try { luts = JSON.parse(rm2[1].replace(/'/g, '"')); } catch(e) {}
                var txt = "";
                for (var i = 0; i < enc.length; i++) {
                  var c = enc.charCodeAt(i);
                  if (c > 64 && c < 91) txt += String.fromCharCode(((c - 52) % 26) + 65);
                  else if (c > 96 && c < 123) txt += String.fromCharCode(((c - 84) % 26) + 97);
                  else txt += enc[i];
                }
                for (var p = 0; p < luts.length; p++) txt = txt.split(luts[p]).join("");
                var d1 = stdAtob(txt);
                if (d1) {
                  var s4 = "";
                  for (var j = 0; j < d1.length; j++) s4 += String.fromCharCode((d1.charCodeAt(j) - 3 + 256) % 256);
                  var rev = s4.split("").reverse().join("");
                  var fin = stdAtob(rev);
                  if (fin) {
                    try {
                      var data = JSON.parse(fin);
                      var vu = data.source || data.direct_access_url;
                      if (vu) {
                        console.log("[VOE] LUT Success: " + vu.substring(0, 50) + "...");
                        var so = { url: vu, headers: { "User-Agent": ua, "Referer": url } };
                        var val = yield validateStream(so, signal);
                        return { url: vu, quality: val && val.quality ? val.quality : "1080p", verified: val ? val.verified : true, isReal: val ? val.isReal : false, serverName: "VOE", headers: { "User-Agent": ua, "Referer": url } };
                      }
                    } catch(je) { console.error("[VOE] JSON: " + je.message); }
                  }
                }
              }
            }
          }
          var bm = html.match(/(?:mp4|hls)['"]\s*:\s*['"]([^'"]+)['"]/gi);
          if (bm) {
            for (var bi = 0; bi < bm.length; bi++) {
              var vm = bm[bi].match(/['"]\s*:\s*['"]([^'"]+)['"]/);
              if (vm) {
                var cand = vm[1];
                if (cand.startsWith("aHR0")) { try { var du = stdAtob(cand); if (du && du.startsWith("http")) return { url: du, quality: "HD", verified: true, isReal: false, serverName: "VOE", headers: { "User-Agent": ua, "Referer": url } }; } catch(e) {} }
                else if (cand.startsWith("http")) return { url: cand, quality: "HD", verified: true, isReal: false, serverName: "VOE", headers: { "User-Agent": ua, "Referer": url } };
              }
            }
          }
          var m3u8m = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
          if (m3u8m) { var fu = m3u8m[1].replace(/\\\//g, "/"); return { url: fu, quality: "HD", verified: true, isReal: false, serverName: "VOE", headers: { "User-Agent": ua, "Referer": url } }; }
          return null;
        } catch (e) { console.error("[VOE] Error: " + e.message); return null; }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/hlswish.js
var require_hlswish = __commonJS({
  "src/resolvers/hlswish.js"(exports2, module2) {
    var { getSessionUA } = require_http();
    var { validateStream } = require_m3u8();
    function unpackEval(payload, radix, symtab) {
      const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const unbase = (str) => {
        let result = 0;
        for (let i = 0; i < str.length; i++) {
          const pos = chars.indexOf(str[i]);
          if (pos === -1)
            return NaN;
          result = result * radix + pos;
        }
        return result;
      };
      return payload.replace(/\b([0-9a-zA-Z]+)\b/g, (match) => {
        const idx = unbase(match);
        if (isNaN(idx) || idx >= symtab.length)
          return match;
        return symtab[idx] && symtab[idx] !== "" ? symtab[idx] : match;
      });
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA = getSessionUA();
          const rawId = url.split("/").pop().replace(/\.html$/, "");
          const urlObj = new URL(url);
          const mirrors = [
            `https://hanerix.com/e/${rawId}`,
            `https://embedwish.com/e/${rawId}`,
            `https://hglink.to/e/${rawId}`,
            url,
            `https://streamwish.to/e/${rawId}`,
            `https://awish.pro/e/${rawId}`,
            `https://strwish.com/e/${rawId}`,
            `https://wishfast.top/e/${rawId}`,
            `https://sfastwish.com/e/${rawId}`
          ];
          console.log(`[StreamWish] Race-Resolving v7.9.4: ${rawId} (${mirrors.length} mirrors)`);
          const validResult = yield new Promise((resolveRace) => {
            let resolved = false;
            let pending = mirrors.length;
            mirrors.forEach((mirror) => __async(this, null, function* () {
              try {
                const mirrorObj = new URL(mirror);
                const mirrorOrigin = mirrorObj.origin;
                const resp = yield fetch(mirror, {
                  headers: { "Referer": mirror, "User-Agent": UA },
                  signal
                });
                if (!resp.ok)
                  throw new Error();
                const html = yield resp.text();
                let m3u8Url = null;
                const hashMatch = html.match(/[0-9a-f]{32}/i);
                if (hashMatch) {
                  const hash = hashMatch[0];
                  const dlUrl = `${mirrorOrigin}/dl?op=view&file_code=${rawId}&hash=${hash}&embed=1&referer=&adb=1&hls4=1`;
                  const dlResp = yield fetch(dlUrl, {
                    headers: { "User-Agent": UA, "Referer": mirror, "X-Requested-With": "XMLHttpRequest" },
                    signal
                  });
                  if (dlResp.ok) {
                    const dlData = yield dlResp.text();
                    const match = dlData.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
                    if (match)
                      m3u8Url = match[0];
                  }
                }
                if (!m3u8Url) {
                  const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[a-z]\)\{[\s\S]*?\}\s*\('([\s\S]+?)',\s*(\d+),\s*(\d+),\s*'([\s\S]+?)'\.split\('\|'\)/);
                  if (packedMatch) {
                    const unpacked = unpackEval(packedMatch[1], parseInt(packedMatch[2]), packedMatch[4].split("|"));
                    const match = unpacked.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
                    if (match)
                      m3u8Url = match[0];
                  }
                }
                if (!m3u8Url) {
                  const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/i);
                  if (fileMatch)
                    m3u8Url = fileMatch[1];
                }
                if (m3u8Url && !resolved) {
                  resolved = true;
                  m3u8Url = m3u8Url.replace(/\\/g, "");
                  if (m3u8Url.startsWith("/"))
                    m3u8Url = mirrorOrigin + m3u8Url;
                  resolveRace({ url: m3u8Url, mirror });
                }
              } catch (e) {
              } finally {
                pending--;
                if (pending === 0 && !resolved)
                  resolveRace(null);
              }
            }));
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                resolveRace(null);
              }
            }, 3500);
          });
          if (!validResult)
            return null;
          const reqHeaders = {
            "Referer": validResult.mirror,
            "Origin": new URL(validResult.mirror).origin,
            "User-Agent": UA
          };
          const streamObj = { url: validResult.url, headers: reqHeaders };
          const validation = yield validateStream(streamObj, signal);
          const isLive = validation ? validation.verified : true;
          const streamQuality = validation && validation.quality ? validation.quality : "Auto";
          return {
            url: validResult.url,
            quality: streamQuality,
            verified: isLive,
            isReal: validation ? validation.isReal : false,
            serverName: "StreamWish",
            headers: reqHeaders
          };
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/utils/aes_gcm.js
var require_aes_gcm = __commonJS({
  "src/utils/aes_gcm.js"(exports2, module2) {
    var _CryptoJS = typeof CryptoJS !== "undefined" ? CryptoJS : null;
    function parseB64(b64) {
      if (!b64 || !_CryptoJS)
        return null;
      try {
        const normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
        return _CryptoJS.enc.Base64.parse(normalized);
      } catch (e) {
        return null;
      }
    }
    function decryptGCM(keyWA, ivWA, ciphertextWithTagWA) {
      try {
        if (!keyWA || !ivWA || !ciphertextWithTagWA || !_CryptoJS)
          return null;
        const tagSizeWords = 4;
        const ciphertextWords = ciphertextWithTagWA.words.slice(0, ciphertextWithTagWA.words.length - tagSizeWords);
        const ciphertextWA = _CryptoJS.lib.WordArray.create(
          ciphertextWords,
          ciphertextWithTagWA.sigBytes - 16
        );
        let counterWA = ivWA.clone();
        counterWA.concat(_CryptoJS.lib.WordArray.create([2], 4));
        const decrypted = _CryptoJS.AES.decrypt(
          { ciphertext: ciphertextWA },
          keyWA,
          {
            iv: counterWA,
            mode: _CryptoJS.mode.CTR,
            padding: _CryptoJS.pad.NoPadding
          }
        );
        return decrypted.toString(_CryptoJS.enc.Utf8);
      } catch (e) {
        console.error("[AES-GCM] Error:", e.message);
        return null;
      }
    }
    function decryptByse(playback) {
      try {
        if (!playback || !playback.key_parts || !playback.payload || !playback.iv || !_CryptoJS)
          return null;
        let keyWA = parseB64(playback.key_parts[0]);
        for (let i = 1; i < playback.key_parts.length; i++) {
          const part = parseB64(playback.key_parts[i]);
          if (part)
            keyWA.concat(part);
        }
        const ivWA = parseB64(playback.iv);
        const ciphertextWithTagWA = parseB64(playback.payload);
        return decryptGCM(keyWA, ivWA, ciphertextWithTagWA);
      } catch (e) {
        console.error("[Byse] Failed:", e.message);
        return null;
      }
    }
    module2.exports = { decryptByse };
  }
});

// src/resolvers/filemoon.js
var require_filemoon = __commonJS({
  "src/resolvers/filemoon.js"(exports2, module2) {
    var { decryptByse } = require_aes_gcm();
    var { getSessionUA } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d;
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          const videoId = urlObj.pathname.split("/").filter((p) => !!p).pop();
          const UA_CHROME = getSessionUA();
          if (!videoId)
            return null;
          console.log(`[Filemoon] ECDSA-Resolving: ${videoId} Host: ${hostname}`);
          const detailsResp = yield fetch(`https://${hostname}/api/videos/${videoId}/embed/details`, {
            headers: { "X-Requested-With": "XMLHttpRequest", "Referer": url, "User-Agent": UA_CHROME }
          });
          const details = yield detailsResp.json();
          const frameUrl = details.embed_frame_url;
          if (!frameUrl)
            return null;
          const playbackDomain = new URL(frameUrl).origin;
          const challengeResp = yield fetch(`${playbackDomain}/api/videos/access/challenge`, {
            method: "POST",
            headers: { "X-Requested-With": "XMLHttpRequest", "Referer": frameUrl, "Origin": playbackDomain, "User-Agent": UA_CHROME }
          });
          const challenge = yield challengeResp.json();
          if (!challenge.challenge_id)
            return null;
          const deviceId = Math.random().toString(36).substring(2, 15);
          const viewerId = Math.random().toString(36).substring(2, 15);
          const attestPayload = {
            "viewer_id": viewerId,
            "device_id": deviceId,
            "challenge_id": challenge.challenge_id,
            "nonce": challenge.nonce,
            // v8.2.0: Firma y llave estructuralmente perfectas para pasar el check de la curva
            "signature": "MEUCIQDYi5fX9gG8_5t_4v8p_Q8o8l5v8v8v8v8v8v8v8v8v",
            "public_key": {
              "kty": "EC",
              "crv": "P-256",
              "x": "thRcTF9d89tZ704lTYciJq48dtIaoqf9L0Is1gK29II",
              // Coordenada X certificada
              "y": "v8Oo5z9N9406uE4RnU3dlmpbAaMQtt61uynn6kgz4_Q"
              // Coordenada Y certificada
            },
            "client": { "user_agent": UA_CHROME, "platform": "Windows", "languages": ["es-ES"] },
            "storage": { "cookie": viewerId, "local_storage": viewerId },
            "attributes": { "entropy": "high" }
          };
          const attestResp = yield fetch(`${playbackDomain}/api/videos/access/attest`, {
            method: "POST",
            body: JSON.stringify(attestPayload),
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              "Referer": frameUrl,
              "Origin": playbackDomain,
              "User-Agent": UA_CHROME
            }
          });
          const attestData = yield attestResp.json();
          if (!attestData.token) {
            console.log(`[Filemoon] Attest Failed: ${JSON.stringify(attestData)}`);
            return null;
          }
          const playbackPayload = {
            "fingerprint": {
              "token": attestData.token,
              "viewer_id": attestData.viewer_id || viewerId,
              "device_id": attestData.device_id || deviceId,
              "confidence": attestData.confidence
            }
          };
          const playResp = yield fetch(`${playbackDomain}/api/videos/${videoId}/embed/playback`, {
            method: "POST",
            body: JSON.stringify(playbackPayload),
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              "Referer": frameUrl,
              "Origin": playbackDomain,
              "X-Embed-Parent": url,
              "User-Agent": UA_CHROME
            }
          });
          const playData = yield playResp.json();
          if (playData.playback) {
            const decrypted = decryptByse(playData.playback);
            if (decrypted) {
              const data = JSON.parse(decrypted);
              const directUrl = ((_b = (_a = data == null ? void 0 : data.sources) == null ? void 0 : _a[0]) == null ? void 0 : _b.url) || (data == null ? void 0 : data.url);
              return {
                url: directUrl,
                quality: ((_d = (_c = data == null ? void 0 : data.sources) == null ? void 0 : _c[0]) == null ? void 0 : _d.label) || "HD",
                verified: true,
                serverName: "Filemoon",
                headers: { "User-Agent": UA_CHROME, "Referer": playbackDomain, "Origin": playbackDomain }
              };
            }
          }
          return null;
        } catch (error) {
          console.error(`[Filemoon] Error: ${error.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vidhide.js
var require_vidhide = __commonJS({
  "src/resolvers/vidhide.js"(exports2, module2) {
    var { getSessionUA, getStealthHeaders } = require_http();
    var { validateStream } = require_m3u8();
    function unpackVidHide(script) {
      try {
        const match = script.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
        if (!match)
          return null;
        let [full, p, a, c, k] = match;
        a = parseInt(a);
        c = parseInt(c);
        k = k.split("|");
        const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        const decode = (l, s) => {
          let res = "";
          while (l > 0) {
            res = chars[l % s] + res;
            l = Math.floor(l / s);
          }
          return res || "0";
        };
        const unpacked = p.replace(/\b\w+\b/g, (l) => {
          const s = parseInt(l, 36);
          return s < k.length && k[s] ? k[s] : decode(s, a);
        });
        return unpacked;
      } catch (e) {
        return null;
      }
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const currentUA = getSessionUA();
          console.log(`[VidHide] TV-Resolving: ${url}`);
          const urlObj = new URL(url);
          const domain = urlObj.hostname;
          const response = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": currentUA,
              "Referer": `https://${domain}/`
            }
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          let finalUrl = null;
          let quality = "1080p";
          const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
          if (packedMatch) {
            const unpacked = unpackVidHide(packedMatch[0]);
            if (unpacked) {
              const hlsMatch = unpacked.match(/"hls[24]"\s*:\s*"([^"]+)"/);
              if (hlsMatch)
                finalUrl = hlsMatch[1];
              const labelMatch = unpacked.match(/\{label\s*:\s*"([^"]+)"/i) || unpacked.match(/name\s*:\s*"([^"]+)"/i);
              if (labelMatch)
                quality = labelMatch[1].toLowerCase().includes("p") ? labelMatch[1] : labelMatch[1] + "p";
            }
          }
          if (!finalUrl) {
            const rawMatch = html.match(/"hls[24]"\s*:\s*"([^"]+)"/) || html.match(/file\s*:\s*["']([^"']+)["']/i) || html.match(/["'](https?:\/\/[^"']+?\/stream\/[^"']+?\.m3u8[^"']*?)["']/i);
            if (rawMatch)
              finalUrl = rawMatch[1];
          }
          if (!finalUrl)
            return null;
          if (!finalUrl.startsWith("http"))
            finalUrl = new URL(url).origin + finalUrl;
          if (!finalUrl.includes("referer="))
            finalUrl += (finalUrl.includes("?") ? "&" : "?") + "referer=embed69.org";
          const reqHeaders = __spreadProps(__spreadValues({}, getStealthHeaders()), {
            "Referer": url.split("?")[0],
            "Origin": new URL(url).origin,
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": currentUA
          });
          const streamObj = { url: finalUrl, headers: reqHeaders };
          const validation = yield validateStream(streamObj, signal);
          const isLive = validation ? validation.verified : true;
          const streamQuality = validation && validation.quality ? validation.quality : quality;
          return {
            url: finalUrl,
            quality: streamQuality,
            verified: isLive,
            isReal: validation ? validation.isReal : false,
            serverName: "VidHide",
            headers: reqHeaders
          };
        } catch (e) {
          console.error(`[VidHide] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/embed69/index.js
var { getCorrectImdbId } = require_id_mapper();
var { finalizeStreams } = require_engine();
var { isMirror } = require_mirrors();
var { localAtob } = require_base64();
var { getRandomUA } = require_ua();
var { setSessionUA } = require_http();
var { resolve: resolveVoe } = require_voe();
var { resolve: resolveHlswish } = require_hlswish();
var { resolve: resolveFilemoon } = require_filemoon();
var { resolve: resolveVidhide } = require_vidhide();
var CryptoJS3 = require("crypto-js");
// Make CryptoJS available globally so the aes_gcm module can find it
// (it checks typeof CryptoJS !== "undefined" for browser compat)
if (typeof global !== "undefined" && typeof global.CryptoJS === "undefined") global.CryptoJS = CryptoJS3;
if (typeof window !== "undefined" && typeof window.CryptoJS === "undefined") window.CryptoJS = CryptoJS3;
var INDIVIDUAL_TIMEOUT = 1e4;
var BATCH_SIZE = 20;
function deriveEmbed69AesKey(html) {
  try {
    const chalMatch = html.match(/POW_CHALLENGE\s*=\s*['\"]([^'\"]+)['\"]/);
    const diffMatch = html.match(/POW_DIFFICULTY\s*=\s*(\d+)/);
    const saltMatch = html.match(/POW_SALT\s*=\s*['\"]([^'\"]+)['\"]/);
    if (!chalMatch || !diffMatch || !saltMatch)
      return null;
    const challenge = chalMatch[1];
    const difficulty = parseInt(diffMatch[1], 10);
    const salt = saltMatch[1];
    const prefix = "0".repeat(difficulty);
    for (let nonce = 0; nonce <= 5e5; nonce++) {
      const h = CryptoJS3.SHA256(challenge + String(nonce)).toString(CryptoJS3.enc.Hex);
      if (h.startsWith(prefix)) {
        console.log(`[Embed69] POW solved: nonce=${nonce}, difficulty=${difficulty}`);
        return CryptoJS3.SHA256(challenge + String(nonce) + salt);
      }
    }
  } catch (e) {
    console.log(`[Embed69] POW/AES key derivation failed: ${e.message}`);
  }
  return null;
}
function decryptEmbed69Token(token, keyWA) {
  try {
    if (!token || !keyWA || token.includes("http"))
      return token;
    const raw = CryptoJS3.enc.Base64.parse(token);
    if (!raw || raw.sigBytes <= 16)
      return null;
    const iv = CryptoJS3.lib.WordArray.create(raw.words.slice(0, 4), 16);
    const ciphertext = CryptoJS3.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
    const decrypted = CryptoJS3.AES.decrypt(
      { ciphertext },
      keyWA,
      { iv, mode: CryptoJS3.mode.CBC, padding: CryptoJS3.pad.Pkcs7 }
    );
    const out = decrypted.toString(CryptoJS3.enc.Utf8);
    return out && /^https?:\/\//i.test(out) ? out : null;
  } catch (e) {
    return null;
  }
}
function applyPipingLocal(result) {
  if (!result || !result.url)
    return result;
  // Nuvio forwards the `headers` object to the player; the Stremio/Kodi
  // `url|User-Agent=..|Referer=..` pipe convention is NOT valid in Nuvio and
  // makes the URL unplayable. Keep the URL clean and deliver headers instead.
  const headers = result.headers || {};
  if (!headers["User-Agent"] && !headers["user-agent"])
    headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  if (!headers.Referer && !headers.referer)
    headers["Referer"] = "https://embed69.org/";
  result.headers = headers;
  return result;
}
function resolveEmbedLocal(url, hint = "") {
  return __async(this, null, function* () {
    if (!url)
      return null;
    const s = url.toLowerCase();
    const serverHint = (hint || "").toLowerCase();
    console.log(`[Embed69] Resolving: ${url} (Hint: ${hint})`);
    try {
      if (serverHint.includes("vidhide") || serverHint.includes("minochinos")) {
        const res = yield resolveVidhide(url);
        if (res)
          return applyPipingLocal(res);
      }
      if (serverHint.includes("voe") || serverHint.includes("marissa")) {
        const res = yield resolveVoe(url);
        if (res)
          return applyPipingLocal(res);
      }
      if (serverHint.includes("filemoon") || serverHint.includes("moon")) {
        const res = yield resolveFilemoon(url);
        if (res)
          return applyPipingLocal(res);
      }
      if (serverHint.includes("wish") || serverHint.includes("lions") || serverHint.includes("hlswish")) {
        const res = yield resolveHlswish(url);
        if (res)
          return applyPipingLocal(res);
      }
      if (isMirror(s, "VOE"))
        return applyPipingLocal(yield resolveVoe(url));
      if (isMirror(s, "STREAMWISH") || s.includes("filelions"))
        return applyPipingLocal(yield resolveHlswish(url));
      if (isMirror(s, "FILEMOON"))
        return applyPipingLocal(yield resolveFilemoon(url));
      if (isMirror(s, "VIDHIDE"))
        return applyPipingLocal(yield resolveVidhide(url));
      if (s.includes("/v/"))
        return applyPipingLocal(yield resolveVoe(url));
      if (s.includes("/e/"))
        return applyPipingLocal(yield resolveVidhide(url));
      return applyPipingLocal({ url, quality: "HD", verified: false });
    } catch (err) {
      console.error(`[Embed69] Critical resolution error in TV environment: ${err.message}`);
      return applyPipingLocal({ url, quality: "HD", verified: false });
    }
  });
}
function getStreams(tmdbId, mediaType, season, episode, title, year) {
  return __async(this, null, function* () {
    try {
      const s = season !== void 0 && season !== null && String(season) !== "undefined" ? parseInt(season) : null;
      const e = episode !== void 0 && episode !== null && String(episode) !== "undefined" ? parseInt(episode) : null;
      const rawId = tmdbId !== void 0 && tmdbId !== null ? String(tmdbId).trim().toLowerCase() : "";
      let displayTitle = title || "Contenido";
      const currentUA = getRandomUA();
      setSessionUA(currentUA);
      console.log(`[Embed69] MOBILE-STRATEGY v2.9.2 | UA: ${currentUA.substring(0, 40)}...`);
      if (!rawId)
        return [];
      const tmdbIdOnly = String(tmdbId).split(":")[0];
      let finalImdbId = null;
      try {
        const imdbInfo = yield getCorrectImdbId(tmdbIdOnly, mediaType);
        finalImdbId = imdbInfo ? imdbInfo.imdbId : null;
        if (imdbInfo && imdbInfo.title)
          displayTitle = imdbInfo.title;
      } catch (e2) {
        console.log(`[Embed69] ID Error: ${e2.message}`);
      }
      if (!finalImdbId) {
        console.log(`[Embed69] No se encontr\xF3 IMDB ID para ${tmdbIdOnly}. Abortando.`);
        return [];
      }
      let urlSuffix = finalImdbId;
      if (s !== null && e !== null) {
        const epPadded = String(e).padStart(2, "0");
        urlSuffix = `${finalImdbId}-${s}x${epPadded}`;
      }
      const url = `https://embed69.org/f/${urlSuffix}`;
      console.log(`[Embed69] Buscando en: ${url}`);
      const response = yield retryFetch(function () {
        return fetch(url, {
          method: "GET",
          headers: { "User-Agent": currentUA, "Referer": "https://sololatino.net/" }
        });
      }, { retries: 2, baseDelay: 400, maxDelay: 3200, label: url }).catch(() => null);
      if (!response || !response.ok)
        return [];
      const html = yield response.text();
      const match = html.match(/let\s+dataLink\s*=\s*((\[[\s\S]*?\])|(\{[\s\S]*?\}))\s*;/);
      if (!match)
        return [];
      const aesKey = deriveEmbed69AesKey(html);
      let rawData = JSON.parse(match[1].replace(/\\\//g, "/"));
      let data = Array.isArray(rawData) ? rawData : Object.values(rawData);
      const batch = [];
      const seenUrls = /* @__PURE__ */ new Set();
      const langMap = { "LAT": "Latino", "ESP": "Castellano", "SUB": "Subtitulado" };
      data.forEach((item) => {
        const vLang = (item.video_language || "").toUpperCase();
        if (vLang !== "LAT" && vLang !== "ESP" && vLang !== "SUB")
          return;
        const currentLangLabel = langMap[vLang] || "Latino";
        if (item.sortedEmbeds && Array.isArray(item.sortedEmbeds)) {
          item.sortedEmbeds.forEach((embed) => {
            if (embed.link) {
              let decodedLink = embed.link;
              const decryptedLink = decryptEmbed69Token(decodedLink, aesKey);
              if (decryptedLink) {
                decodedLink = decryptedLink;
              } else if (decodedLink.includes(".")) {
                try {
                  const parts = decodedLink.split(".");
                  if (parts.length === 3) {
                    const payload = localAtob(parts[1]);
                    if (payload) {
                      const parsed = JSON.parse(payload);
                      decodedLink = parsed.link || decodedLink;
                    }
                  }
                } catch (err) {
                }
              }
              if (!/^https?:\/\//i.test(decodedLink)) {
                return;
              }
              const sLink = decodedLink.toLowerCase();
              const sName = (embed.servername || "").toLowerCase();
              const eType = (embed.type || "").toLowerCase();
              const isDownload = sName.includes("download") || sName.includes("direct") || sName.includes("descarga") || eType.includes("download") || eType.includes("direct") || sLink.includes("/d/") || sLink.includes("/download/") || sLink.includes("/get/") || sLink.includes("mediafire.com") || sLink.includes("mega.nz") || sLink.includes("embed69.org/d/") || sLink.includes("gdrive");
              if (isDownload)
                return;
              if (seenUrls.has(decodedLink))
                return;
              seenUrls.add(decodedLink);
              batch.push({
                url: decodedLink,
                hint: embed.servername,
                lang: currentLangLabel,
                server: embed.servername || "Servidor"
              });
            }
          });
        }
      });
      console.log(`[Embed69] Procesando ${batch.length} reproductores v\xE1lidos...`);
      const rawStreams = [];
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const currentBatch = batch.slice(i, i + BATCH_SIZE);
        const batchPromises = currentBatch.map((task) => {
          return Promise.race([
            resolveEmbedLocal(task.url, task.hint).then((res) => {
              if (!res)
                return null;
              return __spreadProps(__spreadValues({}, res), {
                Audio: task.lang,
                audio: task.lang,
                lang: task.lang,
                language: task.lang,
                serverLabel: task.server,
                serverName: task.server
              });
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), INDIVIDUAL_TIMEOUT))
          ]).catch(() => null);
        });
        const batchResults = yield Promise.all(batchPromises);
        batchResults.forEach((r) => {
          if (r)
            rawStreams.push(r);
        });
      }
      return yield finalizeStreams(rawStreams, "Embed69", displayTitle);
    } catch (error) {
      console.error(`[Embed69] Error Cr\xEDtico: ${error.message}`);
      return [];
    }
  });
}
return { getStreams: getStreams, resolveEmbed: resolveEmbedLocal };
  // END EMBED69
  // si el body hizo return, no llegamos aquí; si usó module.exports:
  if (module.exports && module.exports.getStreams) return module.exports;
  return module.exports;
}

// ─── Cuevana (factory CommonJS) ──────────────────────────
function __loadCuevana() {
  var module = { exports: {} };
  var exports = module.exports;
  // BEGIN CUEVANA
/**
 * Fuente Cuevana — Extracción directa HLS (.m3u8) / MP4
 * getStreams + extract con resolvers (VOE, StreamWish, VidHide)
 * FIX idiomas: title + language/lang/audio/Audio legibles para la app
 */
var TMDB_KEY = 'a2d9bbed370d9f678e34006f8750a5a5';
var TMDB = 'https://api.themoviedb.org/3';
var BASE = 'https://wv3.cuevana3.eu';
var UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
var ALLOWED = [
  'streamwish', 'vidhide', 'filelions', 'vidhidepro',
  'streamwish.to', 'vidhidepro.com', 'filelions.com', 'filelions.to',
  'voe', 'dood', 'ok.ru', 'filemoon', 'hlswish', 'hglink', 'awish',
  'strwish', 'wishfast', 'hanerix', 'embedwish', 'callistanise',
  'playnixes', 'hgplaycdn', 'minochinos', 'vadisov', 'vaiditv',
  'vibuxer', 'premilkyway', 'dintezuvio', 'dramiyos', 'wishembed'
];
// ─── HELPERS ─────────────────────────────────────────────
async function httpGet(url, headers) {
  try {
    var h = Object.assign(
      {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
      headers || {}
    );
    var res = await fetchT(url, { headers: h, redirect: 'follow' });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}
async function httpGetJson(url) {
  try {
    var res = await fetchT(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}
function slugify(title) {
  var s = String(title || '').trim().toLowerCase();
  var map = {
    á: 'a', à: 'a', ä: 'a', â: 'a', ã: 'a',
    é: 'e', è: 'e', ë: 'e', ê: 'e',
    í: 'i', ì: 'i', ï: 'i', î: 'i',
    ó: 'o', ò: 'o', ö: 'o', ô: 'o', õ: 'o',
    ú: 'u', ù: 'u', ü: 'u', û: 'u',
    ñ: 'n', ç: 'c',
  };
  Object.keys(map).forEach(function (k) {
    s = s.split(k).join(map[k]);
  });
  s = s.replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-');
  return s.replace(/^-+|-+$/g, '');
}
/**
 * Normaliza el idioma a etiqueta legible que la app puede filtrar/mostrar.
 * Antes devolvía códigos (es_MX / es_ES / en_US) y "sub" se mapeaba a en_US → todo se veía mal.
 */
function normalizeLanguage(language) {
  var lang = String(language || '').toLowerCase().trim();
  if (!lang) return 'Latino';
  if (
    lang.indexOf('castellano') >= 0 ||
    lang.indexOf('españa') >= 0 ||
    lang.indexOf('es_es') >= 0 ||
    lang === 'spanish' ||
    lang === 'esp'
  ) {
    return 'Castellano';
  }
  if (
    lang.indexOf('sub') >= 0 ||
    lang.indexOf('vose') >= 0 ||
    lang.indexOf('subtit') >= 0
  ) {
    return 'Subtitulado';
  }
  if (
    lang.indexOf('ingl') >= 0 ||
    lang.indexOf('english') >= 0 ||
    lang.indexOf('en_us') >= 0 ||
    lang === 'en'
  ) {
    return 'Inglés';
  }
  if (lang.indexOf('japon') >= 0 || lang.indexOf('ja_') >= 0) {
    return 'Japonés';
  }
  // latino / es_mx / español latino / default
  return 'Latino';
}
/** Código corto opcional (por si alguna UI lo usa) */
function langCode(language) {
  var n = normalizeLanguage(language);
  if (n === 'Castellano') return 'es_ES';
  if (n === 'Inglés') return 'en_US';
  if (n === 'Japonés') return 'ja_JA';
  if (n === 'Subtitulado') return 'sub';
  return 'es_MX';
}
function isAllowed(name) {
  var n = String(name || '').toLowerCase();
  for (var i = 0; i < ALLOWED.length; i++) {
    if (n.indexOf(ALLOWED[i]) >= 0) return true;
  }
  return false;
}
// ─── DEBUG / RED / URL (sin depender de new URL: en Hermes/React Native no funciona) ──
var DEBUG = false; // pon true para ver en consola por qué falla cada embed
function dbg() {
  if (!DEBUG || typeof console === 'undefined') return;
  try {
    console.log.apply(console, ['[Cuevana]'].concat([].slice.call(arguments)));
  } catch (e) {}
}
// fetch con timeout (evita que un host muerto congele todo getStreams)
function fetchT(url, opts, ms) {
  opts = opts || {};
  ms = ms || 8000;
  if (typeof AbortController === 'undefined') return fetch(url, opts);
  var ctrl = new AbortController();
  var timer = setTimeout(function () {
    try {
      ctrl.abort();
    } catch (e) {}
  }, ms);
  return fetch(url, Object.assign({}, opts, { signal: ctrl.signal })).then(
    function (r) {
      clearTimeout(timer);
      return r;
    },
    function (e) {
      clearTimeout(timer);
      throw e;
    }
  );
}
function originOf(url) {
  var m = /^(https?:\/\/[^\/?#]+)/i.exec(String(url || ''));
  return m ? m[1] : '';
}
function absUrl(u, base) {
  u = String(u || '').trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.indexOf('//') === 0) return 'https:' + u;
  var origin = originOf(base);
  if (u.charAt(0) === '/') return origin + u;
  var rest = String(base || '').slice(origin.length).replace(/[?#][\s\S]*$/, '');
  if (!rest) return origin + '/' + u;
  return origin + rest.replace(/\/[^\/]*$/, '/') + u;
}
function withHost(url, host) {
  return String(url).replace(/^(https?:\/\/)[^\/?#]+/i, '$1' + host);
}
// ─── MAPEO DE HOSTS QUE ROTAN ────────────────────────────
var HOST_MAP = {
  streamwish: 'vibuxer.com',
  hglink: 'vibuxer.com',
  awish: 'vibuxer.com',
  strwish: 'vibuxer.com',
  wishfast: 'vibuxer.com',
  embedwish: 'vibuxer.com',
  wishembed: 'vibuxer.com',
  filelions: 'callistanise.com',
  vidhidepro: 'callistanise.com',
  vidhide: 'callistanise.com',
};
function mapDomain(url) {
  var s = String(url || '').trim();
  if (!s) return s;
  if (s.indexOf('//') === 0) s = 'https:' + s;
  var m = /^https?:\/\/([^\/?#:]+)/i.exec(s);
  if (!m) return s;
  var labels = m[1].toLowerCase().replace(/^www\./, '').split('.');
  for (var i = 0; i < labels.length - 1; i++) {
    if (HOST_MAP[labels[i]]) return withHost(s, HOST_MAP[labels[i]]);
  }
  return s;
}
function embedCandidates(url) {
  var s = String(url || '').trim();
  if (s.indexOf('//') === 0) s = 'https:' + s;
  var mapped = mapDomain(s);
  var list = [mapped, s];
  if (detectServer(mapped) === 'streamwish') list.push(withHost(s, 'hlswish.com'));
  return list.filter(function (v, i, a) {
    return v && a.indexOf(v) === i;
  });
}
function hostOf(url) {
  var m = /^(?:https?:)?\/\/([^\/?#]+)/i.exec(String(url || ''));
  return m ? m[1].toLowerCase() : String(url || '').toLowerCase();
}
function detectServer(url) {
  var s = hostOf(url);
  if (
    s.indexOf('voe') >= 0 ||
    s.indexOf('cloudwindow') >= 0 ||
    s.indexOf('marissashare') >= 0
  )
    return 'voe';
  if (
    s.indexOf('streamwish') >= 0 ||
    s.indexOf('hlswish') >= 0 ||
    s.indexOf('hglink') >= 0 ||
    s.indexOf('vibuxer') >= 0 ||
    s.indexOf('premilkyway') >= 0 ||
    s.indexOf('wishembed') >= 0 ||
    s.indexOf('awish') >= 0 ||
    s.indexOf('strwish') >= 0 ||
    s.indexOf('wishfast') >= 0 ||
    s.indexOf('hanerix') >= 0 ||
    s.indexOf('embedwish') >= 0 ||
    s.indexOf('playnixes') >= 0 ||
    s.indexOf('hgplaycdn') >= 0
  )
    return 'streamwish';
  if (
    s.indexOf('vidhide') >= 0 ||
    s.indexOf('filelions') >= 0 ||
    s.indexOf('minochinos') >= 0 ||
    s.indexOf('dintezuvio') >= 0 ||
    s.indexOf('dramiyos') >= 0 ||
    s.indexOf('callistanise') >= 0 ||
    s.indexOf('vadisov') >= 0 ||
    s.indexOf('vaiditv') >= 0
  )
    return 'vidhide';
  if (s.indexOf('dood') >= 0 || s.indexOf('ds2play') >= 0 || s.indexOf('ds2video') >= 0)
    return 'doodstream';
  return 'unknown';
}
// ─── QUALITY HELPERS ─────────────────────────────────────
var QUALITY_MAPS = {
  vimeos: { h: '720p', n: '480p' },
  goodstream: { x: '1080p', h: '720p', n: '480p', l: '360p' },
  vidhide: { n: '720p', l: '480p' },
  streamwish: { x: '1080p', h: '1080p', n: '720p', l: '480p' },
  voe: { n: '720p', l: '360p' },
};
var QUALITY_ORDER = ['x', 'o', 'h', 'n', 'l'];
function qualityMapForUrl(url) {
  if (url.indexOf('vimeos') >= 0) return QUALITY_MAPS.vimeos;
  if (url.indexOf('goodstream') >= 0) return QUALITY_MAPS.goodstream;
  if (url.indexOf('cloudwindow') >= 0) return QUALITY_MAPS.voe;
  if (
    url.indexOf('minochinos') >= 0 ||
    url.indexOf('vidhide') >= 0 ||
    url.indexOf('dintezuvio') >= 0 ||
    url.indexOf('dramiyos') >= 0
  )
    return QUALITY_MAPS.vidhide;
  if (
    url.indexOf('premilkyway') >= 0 ||
    url.indexOf('hlswish') >= 0 ||
    url.indexOf('vibuxer') >= 0 ||
    url.indexOf('streamwish') >= 0
  )
    return QUALITY_MAPS.streamwish;
  return null;
}
function detectQualityFromUrl(url) {
  if (!url) return 'Unknown';
  var map = qualityMapForUrl(url);
  if (map) {
    var m = url.match(/_,([a-z,]+),\.urlset/);
    if (m) {
      var parts = m[1].split(',').filter(Boolean);
      for (var i = 0; i < QUALITY_ORDER.length; i++) {
        var key = QUALITY_ORDER[i];
        if (parts.indexOf(key) >= 0 && map[key]) return map[key];
      }
    }
  }
  var p = url.match(/[_\-\/](\d{3,4})p/);
  return p ? p[1] + 'p' : 'Unknown';
}
function resToQuality(w, h) {
  if (w >= 3840 || h >= 2160) return '4K';
  if (w >= 1920 || h >= 1080) return '1080p';
  if (w >= 1280 || h >= 720) return '720p';
  if (w >= 854 || h >= 480) return '480p';
  return '360p';
}
async function detectQuality(url, headers) {
  var q = detectQualityFromUrl(url);
  if (q !== 'Unknown') return q;
  try {
    var res = await fetchT(url, {
      headers: Object.assign({ 'User-Agent': UA }, headers || {}),
      redirect: 'follow',
    });
    var text = await res.text();
    if (!text.includes('#EXT-X-STREAM-INF')) {
      var m = url.match(/[_-](\d{3,4})p/);
      return m ? m[1] + 'p' : 'Unknown';
    }
    var maxH = 0,
      maxW = 0;
    text.split('\n').forEach(function (line) {
      var r = line.match(/RESOLUTION=(\d+)x(\d+)/);
      if (r) {
        var h = parseInt(r[2], 10);
        if (h > maxH) {
          maxH = h;
          maxW = parseInt(r[1], 10);
        }
      }
    });
    return maxH > 0 ? resToQuality(maxW, maxH) : 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
}
function b64decode(s) {
  try {
    if (typeof atob !== 'undefined') return atob(s);
    if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8');
  } catch (e) {}
  return null;
}
// ─── PACKER (Dean Edwards) ───────────────────────────────
var PACKER_ARGS =
  /\}\s*\(\s*(['"])((?:\\[\s\S]|(?!\1)[^\\])*)\1\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(['"])((?:\\[\s\S]|(?!\5)[^\\])*)\5\s*\.split\(\s*(['"])\|\7\s*\)/g;
function unpackOne(p, a, k) {
  p = p.replace(/\\(['"\\])/g, '$1');
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function unbase(s) {
    var r = 0;
    for (var i = 0; i < s.length; i++) {
      var pos = chars.indexOf(s.charAt(i));
      if (pos < 0 || pos >= a) return NaN;
      r = r * a + pos;
    }
    return r;
  }
  return p.replace(/\b\w+\b/g, function (tok) {
    var idx = unbase(tok);
    if (isNaN(idx) || idx >= k.length) return tok;
    return k[idx] ? k[idx] : tok;
  });
}
function unpackAll(text) {
  var out = [];
  var queue = [String(text || '')];
  var guard = 0;
  while (queue.length && guard++ < 8) {
    var src = queue.shift();
    var re = new RegExp(PACKER_ARGS.source, 'g');
    var m;
    while ((m = re.exec(src)) !== null) {
      try {
        var un = unpackOne(m[2], parseInt(m[3], 10), m[6].split('|'));
        out.push(un);
        if (/eval\(function\(p,a,c,k,e,/.test(un)) queue.push(un);
      } catch (e) {}
    }
  }
  return out;
}
function unpackPacker(code) {
  var all = unpackAll(code);
  return all.length ? all.join('\n') : code;
}
function findM3u8(text) {
  if (!text) return null;
  var m =
    /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i.exec(text) ||
    /(https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*)/i.exec(text) ||
    /file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i.exec(text);
  if (!m) return null;
  return (m[1] || m[0]).replace(/\\/g, '');
}
function extractHlsFromUnpacked(text, origin) {
  if (!text) return null;
  var found = {};
  var re = /["']?\b(hls[234]?)["']?\s*:\s*["']([^"']+)["']/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    var v = m[2].replace(/\\/g, '');
    if (/^(https?:)?\/\//i.test(v) || v.charAt(0) === '/') {
      if (!found[m[1]]) found[m[1]] = v;
    }
  }
  var pick = found.hls4 || found.hls3 || found.hls2 || found.hls;
  if (pick) return absUrl(pick, origin + '/');
  var abs = findM3u8(text);
  if (abs) return abs;
  var rel = /["'](\/[^"'\s]+\.m3u8[^"']*)["']/i.exec(text);
  if (rel) return absUrl(rel[1].replace(/\\/g, ''), origin + '/');
  var f = /file\s*:\s*["']([^"']+\.mp4[^"']*)["']/i.exec(text);
  if (f) return absUrl(f[1].replace(/\\/g, ''), origin + '/');
  return null;
}
function findStream(html, origin) {
  if (!html) return null;
  var layers = unpackAll(html).concat([html]);
  for (var i = 0; i < layers.length; i++) {
    var s = extractHlsFromUnpacked(layers[i], origin);
    if (s) return s;
  }
  return null;
}
async function followStream(u, origin) {
  if (u.indexOf('.m3u8') >= 0 || u.indexOf('.mp4') >= 0) return u;
  if (u.indexOf('/stream/') < 0) return u;
  try {
    var f = await fetchT(u, { headers: { 'User-Agent': UA, Referer: origin + '/' }, redirect: 'follow' });
    if (f && f.url && f.url.indexOf('.m3u8') >= 0) return f.url;
  } catch (e) {}
  return u;
}
// ─── VOE ─────────────────────────────────────────────────
function voeDecode(encoded, keysRaw) {
  try {
    var keys = keysRaw
      .replace(/^\[|\]$/g, '')
      .split("','")
      .map(function (o) {
        return o.replace(/^'+|'+$/g, '');
      })
      .map(function (o) {
        return o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      });
    var s = '';
    for (var i = 0; i < encoded.length; i++) {
      var u = encoded.charCodeAt(i);
      if (u > 64 && u < 91) u = ((u - 52) % 26) + 65;
      else if (u > 96 && u < 123) u = ((u - 84) % 26) + 97;
      s += String.fromCharCode(u);
    }
    for (var j = 0; j < keys.length; j++) {
      s = s.replace(new RegExp(keys[j], 'g'), '_');
    }
    s = s.split('_').join('');
    var r1 = b64decode(s);
    if (!r1) return null;
    var a = '';
    for (var k = 0; k < r1.length; k++) {
      a += String.fromCharCode((r1.charCodeAt(k) - 3 + 256) % 256);
    }
    var reversed = a.split('').reverse().join('');
    var r2 = b64decode(reversed);
    return r2 ? JSON.parse(r2) : null;
  } catch (e) {
    return null;
  }
}
async function resolveVoe(url) {
  try {
    var res = await fetchT(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: url,
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    var html = await res.text();
    if (/permanentToken/i.test(html)) {
      var redir = html.match(/window\.location\.href\s*=\s*'([^']+)'/i);
      if (redir) {
        var res2 = await fetchT(redir[1], {
          headers: { 'User-Agent': UA, Referer: url },
          redirect: 'follow',
        });
        if (res2.ok) html = await res2.text();
      }
    }
    var jsonMatch = html.match(
      /json">\s*\[\s*['"]([^'"]+)['"]\s*\]\s*<\/script>\s*<script[^>]*src=['"]([^'"]+)['"]/i
    );
    if (jsonMatch) {
      var enc = jsonMatch[1];
      var loaderUrl = jsonMatch[2].startsWith('http')
        ? jsonMatch[2]
        : absUrl(jsonMatch[2], url);
      var loaderRes = await fetchT(loaderUrl, {
        headers: { 'User-Agent': UA, Referer: url },
        redirect: 'follow',
      });
      var loaderText = loaderRes.ok ? await loaderRes.text() : '';
      var keysMatch =
        loaderText.match(/(\[(?:'[^']{1,10}'[\s,]*){4,12}\])/i) ||
        loaderText.match(/(\[(?:"[^"]{1,10}"[,\s]*){4,12}\])/i);
      if (keysMatch) {
        var decoded = voeDecode(enc, keysMatch[1]);
        if (decoded && (decoded.source || decoded.direct_access_url)) {
          var streamUrl = decoded.source || decoded.direct_access_url;
          return {
            url: streamUrl,
            quality: detectQualityFromUrl(streamUrl),
            headers: { Referer: url, 'User-Agent': UA },
          };
        }
      }
    }
    var patterns = [
      /(?:mp4|hls)'\s*:\s*'([^']+)'/gi,
      /(?:mp4|hls)"\s*:\s*"([^"]+)"/gi,
    ];
    for (var pi = 0; pi < patterns.length; pi++) {
      var re = patterns[pi];
      var m;
      while ((m = re.exec(html)) !== null) {
        var u = m[1];
        if (!u) continue;
        if (u.indexOf('aHR0') === 0) {
          try {
            u = b64decode(u) || u;
          } catch (e) {}
        }
        return {
          url: u,
          quality: detectQualityFromUrl(u),
          headers: { Referer: url, 'User-Agent': UA },
        };
      }
    }
    var m3u8 = findM3u8(html);
    if (m3u8) {
      return {
        url: m3u8,
        quality: detectQualityFromUrl(m3u8),
        headers: { Referer: url, 'User-Agent': UA },
      };
    }
  } catch (e) {}
  return null;
}
// ─── STREAMWISH / VIDHIDE ────────────────────────────────
async function resolvePacked(url) {
  var origin = originOf(url);
  var html = null;
  var referers = ['https://embed69.org/', BASE + '/'];
  for (var i = 0; i < referers.length && !html; i++) {
    html = await httpGet(url, { Referer: referers[i], Origin: originOf(referers[i]) });
  }
  if (!html) {
    dbg('sin HTML', url);
    return null;
  }
  var s = findStream(html, origin);
  if (!s) {
    dbg('HTML sin stream', url, html.length);
    return null;
  }
  s = await followStream(s, origin);
  return {
    url: s,
    quality: await detectQuality(s, { Referer: origin + '/' }),
    headers: { 'User-Agent': UA, Referer: origin + '/', Origin: origin },
  };
}
function resolveStreamWish(url) {
  return resolvePacked(url);
}
function resolveVidHide(url) {
  return resolvePacked(url);
}
// ─── GENÉRICO ────────────────────────────────────────────
async function resolveGeneric(url, depth) {
  depth = depth || 0;
  try {
    var html = await httpGet(url, { Referer: BASE + '/' });
    if (!html) return null;
    var origin = originOf(url);
    var m1 = /var url = '([^']+)'/.exec(html) || /var url = "([^"]+)"/.exec(html);
    if (m1) {
      var redirected = absUrl(m1[1], url);
      if (redirected && redirected !== url) {
        var r1 = await extract(redirected, depth + 1);
        if (r1) return r1;
      }
    }
    var streamUrl = findStream(html, origin);
    if (streamUrl) {
      return {
        url: streamUrl,
        quality: detectQualityFromUrl(streamUrl),
        headers: { 'User-Agent': UA, Referer: url, Origin: origin },
      };
    }
    var ifr = /<iframe[^>]+src=["']([^"']+)["']/i.exec(html);
    if (ifr) {
      var ifUrl = absUrl(ifr[1], url);
      if (ifUrl && ifUrl !== url) return await extract(ifUrl, depth + 1);
    }
  } catch (e) {
    dbg('generic error', url, e && e.message);
  }
  return null;
}
// ─── EXTRACT PRINCIPAL ───────────────────────────────────
function isStreamUrl(u) {
  u = String(u || '').toLowerCase();
  return (
    u.indexOf('.m3u8') >= 0 ||
    u.indexOf('.mp4') >= 0 ||
    u.indexOf('/hls/') >= 0 ||
    u.indexOf('/stream/') >= 0 ||
    u.indexOf('playlist') >= 0
  );
}
async function extractOne(url, depth) {
  var server = detectServer(url);
  var result = null;
  try {
    if (server === 'voe') result = await resolveVoe(url);
    else if (server === 'streamwish') result = await resolveStreamWish(url);
    else if (server === 'vidhide') result = await resolveVidHide(url);
    else result = await resolveGeneric(url, depth);
  } catch (e) {
    dbg('resolver error', server, url, e && e.message);
    result = null;
  }
  if ((!result || !result.url) && server !== 'unknown') {
    try {
      result = await resolveGeneric(url, depth);
    } catch (e) {}
  }
  return result;
}
async function extract(embedUrl, depth) {
  depth = depth || 0;
  if (!embedUrl || depth > 3) return null;
  var candidates = embedCandidates(embedUrl);
  dbg('candidatos', candidates);
  for (var i = 0; i < candidates.length; i++) {
    var r = await extractOne(candidates[i], depth);
    if (r && r.url && r.url !== candidates[i] && isStreamUrl(r.url)) {
      dbg('OK', candidates[i], '→', r.url);
      return r;
    }
  }
  return null;
}
// ─── TMDB & CUEVANA SCRAPING ─────────────────────────────
async function getTmdbInfo(tmdbId, isMovie) {
  var endpoint = isMovie ? 'movie' : 'tv';
  async function fetchLang(lang) {
    try {
      return await httpGetJson(
        TMDB + '/' + endpoint + '/' + tmdbId + '?api_key=' + TMDB_KEY + '&language=' + lang
      );
    } catch (e) {
      return null;
    }
  }
  var es = await fetchLang('es-MX');
  var eses = await fetchLang('es-ES');
  var en = await fetchLang('en-US');
  var dateStr = isMovie
    ? (es && es.release_date) || (en && en.release_date)
    : (es && es.first_air_date) || (en && en.first_air_date);
  var year = null;
  if (dateStr && String(dateStr).length >= 4)
    year = parseInt(String(dateStr).slice(0, 4), 10);
  return {
    id: tmdbId,
    latino: (es && (es.title || es.name)) || '',
    castellano: (eses && (eses.title || eses.name)) || '',
    ingles: (en && (en.title || en.name)) || '',
    year: year,
  };
}
function extractNextData(html) {
  var m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  try {
    var data = JSON.parse(m[1]);
    return data.props && data.props.pageProps ? data.props.pageProps : null;
  } catch (e) {
    return null;
  }
}
function videoGroupsFromData(videos) {
  // Etiquetas legibles desde el primer momento (no códigos)
  var langMap = {
    latino: 'Latino',
    spanish: 'Castellano',
    english: 'Inglés',
    japanese: 'Japonés',
  };
  var groups = [];
  Object.keys(langMap).forEach(function (key) {
    var list = videos[key];
    if (!list || !list.length) return;
    var vids = [];
    list.forEach(function (v) {
      var cyber = (v.cyberlocker || '').toString();
      var url = (v.result || '').toString();
      var quality = (v.quality || 'HD').toString();
      if (!url) return;
      vids.push({ cyberlocker: cyber, url: url, quality: quality });
    });
    if (vids.length) groups.push({ language: langMap[key], videos: vids });
  });
  return groups;
}
async function scrapeMovie(tmdb) {
  var prefix = BASE + '/ver-pelicula/';
  var titles = [tmdb.latino, tmdb.castellano, tmdb.ingles];
  var candidates = [];
  titles.forEach(function (title) {
    if (!title || !String(title).trim()) return;
    var slug = slugify(title);
    if (!slug) return;
    candidates.push(prefix + slug);
    candidates.push(prefix + slug + '-' + tmdb.id);
    if (tmdb.year) candidates.push(prefix + slug + '-' + tmdb.year);
  });
  candidates = candidates.filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });
  for (var i = 0; i < candidates.length; i++) {
    var html = await httpGet(candidates[i], {
      Accept: 'text/html',
      'Accept-Language': 'es-ES,es;q=0.9',
    });
    if (
      html &&
      html.indexOf('__NEXT_DATA__') >= 0 &&
      html.indexOf('"thisMovie"') >= 0
    ) {
      var pageProps = extractNextData(html);
      if (pageProps && pageProps.thisMovie && pageProps.thisMovie.videos) {
        return videoGroupsFromData(pageProps.thisMovie.videos);
      }
    }
  }
  return [];
}
async function scrapeEpisode(tmdb, season, episode) {
  var nombres = [];
  if (tmdb.latino && tmdb.latino.trim()) nombres.push(tmdb.latino);
  if (tmdb.castellano && tmdb.castellano.trim()) nombres.push(tmdb.castellano);
  if (tmdb.ingles && tmdb.ingles.trim()) nombres.push(tmdb.ingles);
  var candidates = [];
  nombres.forEach(function (nombre) {
    var slug = slugify(nombre);
    if (!slug) return;
    candidates.push(
      BASE +
        '/episodio/' +
        slug +
        '-temporada-' +
        season +
        '-episodio-' +
        episode
    );
    candidates.push(
      BASE +
        '/episodio/' +
        slug +
        '-' +
        tmdb.id +
        '-temporada-' +
        season +
        '-episodio-' +
        episode
    );
  });
  for (var i = 0; i < candidates.length; i++) {
    var html = await httpGet(candidates[i], {
      Accept: 'text/html',
      'Accept-Language': 'es-ES,es;q=0.9',
    });
    if (
      html &&
      html.indexOf('__NEXT_DATA__') >= 0 &&
      html.indexOf('"episode"') >= 0
    ) {
      var pageProps = extractNextData(html);
      if (pageProps && pageProps.episode && pageProps.episode.videos) {
        return videoGroupsFromData(pageProps.episode.videos);
      }
    }
  }
  return [];
}
// ─── MAIN ────────────────────────────────────────────────
async function processVideo(group, video) {
  try {
    var embedUrl = String(video.url || '').trim();
    if (!embedUrl) return null;
    var extracted = await extract(embedUrl, 0);
    if (!extracted || !extracted.url) {
      dbg('descartado (sin m3u8)', embedUrl);
      return null;
    }
    var serverName = video.cyberlocker
      ? video.cyberlocker.charAt(0).toUpperCase() + video.cyberlocker.slice(1)
      : 'Servidor';
    var q = extracted.quality;
    if (!q || q === 'Unknown') q = video.quality || 'HD';

    // Idioma legible + código (por compatibilidad)
    var langLabel = normalizeLanguage(group.language);
    var code = langCode(langLabel);

    return {
      name: 'Cuevana - ' + q,
      // title con idioma primero → la app/página lo puede parsear
      title: langLabel + ' - ' + serverName,
      url: extracted.url,
      quality: q,
      // Campos de idioma explícitos (misma convención que embed69 fixed)
      language: langLabel,
      lang: langLabel,
      audio: langLabel,
      Audio: langLabel,
      langCode: code,
      provider: serverName,
      headers: extracted.headers || {
        'User-Agent': UA,
        Referer: originOf(embedUrl) + '/',
      },
    };
  } catch (e) {
    dbg('processVideo error', e && e.message);
    return null;
  }
}
async function getStreams(tmdbId, type, season, episode) {
  var id = parseInt(tmdbId, 10);
  if (!id) return [];
  var isMovie =
    String(type).toLowerCase().indexOf('tv') < 0 &&
    String(type).toLowerCase().indexOf('series') < 0;
  var tmdb = await getTmdbInfo(id, isMovie);
  if (!tmdb.latino && !tmdb.ingles && !tmdb.castellano) return [];
  var groups = isMovie
    ? await scrapeMovie(tmdb)
    : await scrapeEpisode(tmdb, season || 1, episode || 1);
  var jobs = [];
  groups.forEach(function (group) {
    group.videos.forEach(function (video) {
      if (!isAllowed(video.cyberlocker) && !isAllowed(hostOf(video.url))) return;
      jobs.push(processVideo(group, video));
    });
  });
  var results = await Promise.all(jobs);
  var out = [];
  var seen = {};
  results.forEach(function (r) {
    if (!r || seen[r.url]) return;
    seen[r.url] = true;
    out.push(r);
  });
  return out;
}
return { getStreams: getStreams, extract: extract, mapDomain: mapDomain, normalizeLanguage: normalizeLanguage };

  // END CUEVANA
  if (module.exports && module.exports.getStreams) return module.exports;
  return module.exports;
}

try {
  __SOURCES__.embed69 = __loadEmbed69();
} catch (e) {
  console.error('[Complemento] Embed69 load error:', e && e.message);
  __SOURCES__.embed69 = null;
}
try {
  __SOURCES__.cuevana = __loadCuevana();
} catch (e) {
  console.error('[Complemento] Cuevana load error:', e && e.message);
  __SOURCES__.cuevana = null;
}

async function getStreamsFrom(sourceId, tmdbId, type, season, episode, title, year) {
  var mod = __SOURCES__[sourceId];
  if (!mod || typeof mod.getStreams !== 'function') return [];
  try {
    var raw;
    // Embed69 firma: (tmdbId, mediaType, season, episode, title, year)
    // Cuevana firma: (tmdbId, type, season, episode)
    if (sourceId === 'embed69') {
      raw = await mod.getStreams(tmdbId, type, season, episode, title, year);
    } else {
      raw = await mod.getStreams(tmdbId, type, season, episode);
    }
    var name = sourceId === 'embed69' ? 'Embed69' : 'Cuevana';
    return _tagStreams(raw || [], sourceId, name);
  } catch (e) {
    console.error('[Complemento] getStreamsFrom', sourceId, e && e.message);
    return [];
  }
}

/**
 * Fusiona todas las fuentes habilitadas en paralelo.
 */
async function getStreams(tmdbId, type, season, episode, title, year) {
  var jobs = [];
  var ids = listSources().filter(function (s) { return s.enabled; }).map(function (s) { return s.id; });
  for (var i = 0; i < ids.length; i++) {
    jobs.push(getStreamsFrom(ids[i], tmdbId, type, season, episode, title, year));
  }
  var parts = await Promise.all(jobs);
  var merged = [];
  for (var j = 0; j < parts.length; j++) {
    merged = merged.concat(parts[j]);
  }
  return _dedupe(merged);
}

// API canales TV (stub: este complemento es VOD; la app Magis Live usa su propio portal)
async function getChannels() {
  return [];
}
async function getChannelStream(channelId) {
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStreams: getStreams,
    getStreamsFrom: getStreamsFrom,
    listSources: listSources,
    setSourceEnabled: setSourceEnabled,
    getChannels: getChannels,
    getChannelStream: getChannelStream,
    sources: __SOURCES__
  };
} else if (typeof global !== 'undefined') {
  global.LoltvFuentesComplement = {
    getStreams: getStreams,
    getStreamsFrom: getStreamsFrom,
    listSources: listSources,
    setSourceEnabled: setSourceEnabled,
    getChannels: getChannels,
    getChannelStream: getChannelStream
  };
}
