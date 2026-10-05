/**
 * LOLTV All Providers — addon compatible con LOL App (modal de servidores)
 * Fuentes: Embed69, Cuevana, Unlimplay, Cinecalidad, CineSrc, FuegoCine,
 *          HackStore, Pelispedia, PelisPlus, Poseidon, SeriesMetro,
 *          SmartPelis, TioPlus, VidSrc
 *
 * Contrato app:
 *   getStreams(tmdbId, type, season, episode) → Array<{url,title,quality,provider,lang,headers}>
 *   extract(embedUrl) → {url, quality, headers} | null
 *
 * Instalación: URL de este index.js o del manifest.json, o repo GitHub user/repo
 */
var TMDB_KEY = 'a2d9bbed370d9f678e34006f8750a5a5';
var TMDB = 'https://api.themoviedb.org/3';
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
var DEBUG = false;

function dbg() {
  if (!DEBUG || typeof console === 'undefined') return;
  try { console.log.apply(console, ['[LOLTV]'].concat([].slice.call(arguments))); } catch (e) {}
}

// ─── HTTP ────────────────────────────────────────────────
function fetchT(url, opts, ms) {
  opts = opts || {};
  ms = ms || 10000;
  if (typeof AbortController === 'undefined') return fetch(url, opts);
  var ctrl = new AbortController();
  var timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, ms);
  return fetch(url, Object.assign({}, opts, { signal: ctrl.signal })).then(
    function (r) { clearTimeout(timer); return r; },
    function (e) { clearTimeout(timer); throw e; }
  );
}
async function httpGet(url, headers) {
  try {
    var h = Object.assign({
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8'
    }, headers || {});
    var res = await fetchT(url, { headers: h, redirect: 'follow' });
    if (!res || !res.ok) return null;
    return await res.text();
  } catch (e) { return null; }
}
async function httpGetJson(url, headers) {
  try {
    var res = await fetchT(url, {
      headers: Object.assign({ Accept: 'application/json', 'User-Agent': UA }, headers || {})
    });
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

// ─── URL helpers (Hermes / QuickJS safe) ─────────────────
function originOf(url) {
  var m = /^(https?:\/\/[^\/?#]+)/i.exec(String(url || ''));
  return m ? m[1] : '';
}
function hostOf(url) {
  var m = /^(?:https?:)?\/\/([^\/?#]+)/i.exec(String(url || ''));
  return m ? m[1].toLowerCase() : String(url || '').toLowerCase();
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
function slugify(title) {
  var s = String(title || '').trim().toLowerCase();
  var map = { 'á':'a','à':'a','ä':'a','â':'a','ã':'a','é':'e','è':'e','ë':'e','ê':'e','í':'i','ì':'i','ï':'i','î':'i','ó':'o','ò':'o','ö':'o','ô':'o','õ':'o','ú':'u','ù':'u','ü':'u','û':'u','ñ':'n','ç':'c' };
  Object.keys(map).forEach(function (k) { s = s.split(k).join(map[k]); });
  s = s.replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-');
  return s.replace(/^-+|-+$/g, '');
}

// ─── Language (legible + códigos para el modal) ──────────
function normalizeLanguage(language) {
  var lang = String(language || '').toLowerCase().trim();
  if (!lang) return 'Latino';
  if (lang === 'es_es' || lang === 'es-es' || lang.indexOf('castellano') >= 0 || lang.indexOf('españa') >= 0 || lang === 'spanish' || lang === 'esp' || lang === 'es' || (lang.indexOf('espa') >= 0 && lang.indexOf('latino') < 0))
    return 'Castellano';
  if (lang.indexOf('sub') >= 0 || lang.indexOf('vose') >= 0 || lang.indexOf('subtit') >= 0)
    return 'Subtitulado';
  if (lang.indexOf('ingl') >= 0 || lang.indexOf('english') >= 0 || lang === 'en' || lang === 'en_us' || lang === 'en-us')
    return 'Inglés';
  if (lang.indexOf('japon') >= 0 || lang.indexOf('ja_') >= 0) return 'Japonés';
  return 'Latino';
}
function langCode(language) {
  var n = normalizeLanguage(language);
  if (n === 'Castellano') return 'es_ES';
  if (n === 'Inglés') return 'en_US';
  if (n === 'Japonés') return 'ja_JA';
  if (n === 'Subtitulado') return 'SUB';
  return 'es_MX';
}

// ─── Host map + detect server ────────────────────────────
var HOST_MAP = {
  streamwish: 'vibuxer.com', hglink: 'vibuxer.com', awish: 'vibuxer.com',
  strwish: 'vibuxer.com', wishfast: 'vibuxer.com', embedwish: 'vibuxer.com',
  wishembed: 'vibuxer.com', filelions: 'callistanise.com',
  vidhidepro: 'callistanise.com', vidhide: 'callistanise.com'
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
function detectServer(url) {
  var s = hostOf(url);
  if (s.indexOf('voe') >= 0 || s.indexOf('cloudwindow') >= 0 || s.indexOf('marissashare') >= 0) return 'voe';
  if (s.indexOf('streamwish') >= 0 || s.indexOf('hlswish') >= 0 || s.indexOf('hglink') >= 0 || s.indexOf('vibuxer') >= 0 || s.indexOf('awish') >= 0 || s.indexOf('strwish') >= 0 || s.indexOf('wishfast') >= 0 || s.indexOf('embedwish') >= 0 || s.indexOf('wishembed') >= 0) return 'streamwish';
  if (s.indexOf('vidhide') >= 0 || s.indexOf('filelions') >= 0 || s.indexOf('minochinos') >= 0 || s.indexOf('callistanise') >= 0 || s.indexOf('vadisov') >= 0) return 'vidhide';
  if (s.indexOf('filemoon') >= 0 || s.indexOf('moonembed') >= 0) return 'filemoon';
  if (s.indexOf('dood') >= 0 || s.indexOf('ds2play') >= 0) return 'doodstream';
  if (s.indexOf('fastream') >= 0) return 'fastream';
  return 'unknown';
}
function embedCandidates(url) {
  var s = String(url || '').trim();
  if (s.indexOf('//') === 0) s = 'https:' + s;
  var mapped = mapDomain(s);
  var list = [mapped, s];
  if (detectServer(mapped) === 'streamwish') list.push(withHost(s, 'hlswish.com'));
  return list.filter(function (v, i, a) { return v && a.indexOf(v) === i; });
}

// ─── Packer / HLS extract ────────────────────────────────
var PACKER_ARGS = /\}\s*\(\s*(['"])((?:\\[\s\S]|(?!\1)[^\\])*)\1\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(['"])((?:\\[\s\S]|(?!\5)[^\\])*)\5\s*\.split\(\s*(['"])\|\7\s*\)/g;
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
  var out = [], queue = [String(text || '')], guard = 0;
  while (queue.length && guard++ < 8) {
    var src = queue.shift();
    var re = new RegExp(PACKER_ARGS.source, 'g'), m;
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
function findM3u8(text) {
  if (!text) return null;
  var m = /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i.exec(text) ||
    /(https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*)/i.exec(text) ||
    /file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i.exec(text);
  if (!m) return null;
  return (m[1] || m[0]).replace(/\\/g, '');
}
function extractHlsFromUnpacked(text, origin) {
  if (!text) return null;
  var found = {}, re = /["']?\b(hls[234]?)["']?\s*:\s*["']([^"']+)["']/g, m;
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
function isStreamUrl(u) {
  u = String(u || '').toLowerCase();
  return u.indexOf('.m3u8') >= 0 || u.indexOf('.mp4') >= 0 || u.indexOf('/hls/') >= 0 || u.indexOf('/stream/') >= 0 || u.indexOf('playlist') >= 0;
}
function detectQualityFromUrl(url) {
  if (!url) return 'Unknown';
  var p = url.match(/[_\-\/](\d{3,4})p/i);
  return p ? p[1] + 'p' : 'Unknown';
}
function b64decode(s) {
  try {
    if (typeof atob !== 'undefined') return atob(s);
    if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8');
  } catch (e) {}
  return null;
}

// ─── Resolvers ───────────────────────────────────────────
async function resolvePacked(url) {
  var origin = originOf(url);
  var html = await httpGet(url, { Referer: origin + '/' });
  if (!html) return null;
  var s = findStream(html, origin);
  if (!s) return null;
  return {
    url: s,
    quality: detectQualityFromUrl(s) !== 'Unknown' ? detectQualityFromUrl(s) : 'HD',
    headers: { 'User-Agent': UA, Referer: origin + '/', Origin: origin }
  };
}
function voeDecode(encoded, keysRaw) {
  try {
    var keys = keysRaw.replace(/^\[|\]$/g, '').split("','").map(function (o) {
      return o.replace(/^'+|'+$/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    var s = '';
    for (var i = 0; i < encoded.length; i++) {
      var u = encoded.charCodeAt(i);
      if (u > 64 && u < 91) u = ((u - 52) % 26) + 65;
      else if (u > 96 && u < 123) u = ((u - 84) % 26) + 97;
      s += String.fromCharCode(u);
    }
    for (var j = 0; j < keys.length; j++) s = s.replace(new RegExp(keys[j], 'g'), '_');
    s = s.split('_').join('');
    var r1 = b64decode(s);
    if (!r1) return null;
    var a = '';
    for (var k = 0; k < r1.length; k++) a += String.fromCharCode((r1.charCodeAt(k) - 3 + 256) % 256);
    var r2 = b64decode(a.split('').reverse().join(''));
    return r2 ? JSON.parse(r2) : null;
  } catch (e) { return null; }
}
async function resolveVoe(url) {
  try {
    var res = await fetchT(url, { headers: { 'User-Agent': UA, Referer: url }, redirect: 'follow' });
    if (!res || !res.ok) return null;
    var html = await res.text();
    if (/permanentToken/i.test(html)) {
      var redir = html.match(/window\.location\.href\s*=\s*'([^']+)'/i);
      if (redir) {
        var res2 = await fetchT(redir[1], { headers: { 'User-Agent': UA, Referer: url }, redirect: 'follow' });
        if (res2 && res2.ok) html = await res2.text();
      }
    }
    var jsonMatch = html.match(/json">\s*\[\s*['"]([^'"]+)['"]\s*\]\s*<\/script>\s*<script[^>]*src=['"]([^'"]+)['"]/i);
    if (jsonMatch) {
      var enc = jsonMatch[1];
      var loaderUrl = jsonMatch[2].indexOf('http') === 0 ? jsonMatch[2] : absUrl(jsonMatch[2], url);
      var loaderRes = await fetchT(loaderUrl, { headers: { 'User-Agent': UA, Referer: url }, redirect: 'follow' });
      var loaderText = loaderRes && loaderRes.ok ? await loaderRes.text() : '';
      var keysMatch = loaderText.match(/(\[(?:'[^']{1,10}'[\s,]*){4,12}\])/i);
      if (keysMatch) {
        var decoded = voeDecode(enc, keysMatch[1]);
        if (decoded && (decoded.source || decoded.direct_access_url)) {
          var streamUrl = decoded.source || decoded.direct_access_url;
          return { url: streamUrl, quality: detectQualityFromUrl(streamUrl), headers: { Referer: url, 'User-Agent': UA } };
        }
      }
    }
    var m3u8 = findM3u8(html);
    if (m3u8) return { url: m3u8, quality: detectQualityFromUrl(m3u8), headers: { Referer: url, 'User-Agent': UA } };
  } catch (e) {}
  return null;
}
async function resolveGeneric(url, depth) {
  depth = depth || 0;
  if (depth > 3) return null;
  try {
    var html = await httpGet(url);
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
      return { url: streamUrl, quality: detectQualityFromUrl(streamUrl), headers: { 'User-Agent': UA, Referer: url, Origin: origin } };
    }
    var ifr = /<iframe[^>]+src=["']([^"']+)["']/i.exec(html);
    if (ifr) {
      var ifUrl = absUrl(ifr[1], url);
      if (ifUrl && ifUrl !== url) return await extract(ifUrl, depth + 1);
    }
  } catch (e) {}
  return null;
}
async function extractOne(url, depth) {
  var server = detectServer(url);
  var result = null;
  try {
    if (server === 'voe') result = await resolveVoe(url);
    else if (server === 'streamwish' || server === 'vidhide' || server === 'filemoon' || server === 'fastream')
      result = await resolvePacked(url);
    else result = await resolveGeneric(url, depth);
  } catch (e) { result = null; }
  if ((!result || !result.url) && server !== 'unknown') {
    try { result = await resolveGeneric(url, depth); } catch (e) {}
  }
  return result;
}
async function extract(embedUrl, depth) {
  depth = depth || 0;
  if (!embedUrl || depth > 3) return null;
  var candidates = embedCandidates(embedUrl);
  for (var i = 0; i < candidates.length; i++) {
    var r = await extractOne(candidates[i], depth);
    if (r && r.url && r.url !== candidates[i] && isStreamUrl(r.url)) return r;
  }
  if (isStreamUrl(embedUrl)) {
    return { url: embedUrl, quality: detectQualityFromUrl(embedUrl), headers: { 'User-Agent': UA, Referer: originOf(embedUrl) + '/' } };
  }
  return null;
}

// ─── TMDB helpers ────────────────────────────────────────
async function getTmdbInfo(tmdbId, isMovie) {
  var endpoint = isMovie ? 'movie' : 'tv';
  async function fetchLang(lang) {
    try {
      return await httpGetJson(TMDB + '/' + endpoint + '/' + tmdbId + '?api_key=' + TMDB_KEY + '&language=' + lang);
    } catch (e) { return null; }
  }
  var es = await fetchLang('es-MX');
  var eses = await fetchLang('es-ES');
  var en = await fetchLang('en-US');
  var dateStr = isMovie
    ? (es && es.release_date) || (en && en.release_date)
    : (es && es.first_air_date) || (en && en.first_air_date);
  var year = dateStr && String(dateStr).length >= 4 ? parseInt(String(dateStr).slice(0, 4), 10) : null;
  return {
    id: tmdbId,
    latino: (es && (es.title || es.name)) || '',
    castellano: (eses && (eses.title || eses.name)) || '',
    ingles: (en && (en.title || en.name)) || '',
    year: year
  };
}
async function getImdbId(tmdbId, isMovie) {
  var type = isMovie ? 'movie' : 'tv';
  try {
    var data = await httpGetJson(TMDB + '/' + type + '/' + tmdbId + '/external_ids?api_key=' + TMDB_KEY);
    if (data && data.imdb_id) return data.imdb_id;
  } catch (e) {}
  return null;
}
function extractNextData(html) {
  var m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  try {
    var data = JSON.parse(m[1]);
    return data.props && data.props.pageProps ? data.props.pageProps : null;
  } catch (e) { return null; }
}

// ─── Tag stream para el modal de la app ──────────────────
function tagStream(extracted, langRaw, serverName, sourceId, sourceName) {
  if (!extracted || !extracted.url) return null;
  var lang = normalizeLanguage(langRaw);
  var code = langCode(lang);
  var provider = serverName || detectServer(extracted.url);
  if (provider === 'unknown') provider = 'Servidor';
  provider = provider.charAt(0).toUpperCase() + provider.slice(1);
  var q = extracted.quality && extracted.quality !== 'Unknown' ? extracted.quality : 'HD';
  // Formato que JsAddonRuntime._parseResult + AddonSourceAdapter esperan
  return {
    url: extracted.url,
    title: lang + ' - ' + provider,
    name: sourceName + ' - ' + q,
    quality: q,
    provider: provider,
    language: lang,
    lang: code,
    audio: lang,
    headers: extracted.headers || { 'User-Agent': UA, Referer: originOf(extracted.url) + '/' },
    source: sourceId,
    sourceName: sourceName
  };
}

// ═══════════════════════════════════════════════════════════
// PROVIDERS
// ═══════════════════════════════════════════════════════════

async function providerEmbed69(tmdbId, isMovie, season, episode) {
  var imdb = await getImdbId(tmdbId, isMovie);
  if (!imdb) return [];
  var variants = [];
  if (isMovie) variants.push(imdb);
  else {
    var e2 = String(episode).padStart(2, '0');
    variants.push(imdb + '-' + season + 'x' + e2, imdb + '-' + season + 'x' + episode);
  }
  var bases = ['https://embed69.org/f/', 'https://serieskao.top/vidurl/', 'https://xupalace.org/video/'];
  var embeds = [];
  for (var b = 0; b < bases.length && embeds.length === 0; b++) {
    for (var v = 0; v < variants.length && embeds.length === 0; v++) {
      var pageUrl = bases[b] + variants[v] + (bases[b].indexOf('embed69') >= 0 ? '' : '/');
      var html = await httpGet(pageUrl, { Referer: 'https://sololatino.net/' });
      if (!html) continue;
      var match = html.match(/let\s+dataLink\s*=\s*((\[[\s\S]*?\])|(\{[\s\S]*?\}))\s*;/);
      if (!match) continue;
      try {
        var rawData = JSON.parse(match[1].replace(/\\\//g, '/'));
        var data = Array.isArray(rawData) ? rawData : Object.values(rawData);
        var langMap = { LAT: 'Latino', ESP: 'Castellano', SUB: 'Subtitulado' };
        data.forEach(function (item) {
          var vLang = String(item.video_language || '').toUpperCase();
          if (vLang !== 'LAT' && vLang !== 'ESP' && vLang !== 'SUB') return;
          var currentLang = langMap[vLang] || 'Latino';
          var list = item.sortedEmbeds || item.embeds || [];
          if (!Array.isArray(list)) return;
          list.forEach(function (embed) {
            var link = embed.link || embed.url || '';
            if (!link || !/^https?:\/\//i.test(link)) return;
            var sName = (embed.servername || embed.server || '').toLowerCase();
            if (sName.indexOf('download') >= 0 || sName.indexOf('descarga') >= 0) return;
            embeds.push({ url: link, lang: currentLang, server: embed.servername || embed.server || 'Servidor' });
          });
        });
      } catch (e) {}
    }
  }
  return embeds;
}

async function providerCuevana(tmdbId, isMovie, season, episode) {
  var tmdb = await getTmdbInfo(tmdbId, isMovie);
  var BASE = 'https://wv3.cuevana3.eu';
  var embeds = [];
  if (isMovie) {
    var titles = [tmdb.latino, tmdb.castellano, tmdb.ingles];
    var candidates = [];
    titles.forEach(function (title) {
      if (!title) return;
      var slug = slugify(title);
      if (!slug) return;
      candidates.push(BASE + '/ver-pelicula/' + slug);
      candidates.push(BASE + '/ver-pelicula/' + slug + '-' + tmdbId);
      if (tmdb.year) candidates.push(BASE + '/ver-pelicula/' + slug + '-' + tmdb.year);
    });
    candidates = candidates.filter(function (v, i, a) { return a.indexOf(v) === i; });
    for (var i = 0; i < candidates.length; i++) {
      var html = await httpGet(candidates[i]);
      if (!html || html.indexOf('__NEXT_DATA__') < 0) continue;
      var pageProps = extractNextData(html);
      if (!pageProps || !pageProps.thisMovie || !pageProps.thisMovie.videos) continue;
      embeds = embeds.concat(_cuevanaVideos(pageProps.thisMovie.videos));
      if (embeds.length) break;
    }
  } else {
    var nombres = [tmdb.latino, tmdb.castellano, tmdb.ingles].filter(Boolean);
    for (var n = 0; n < nombres.length && !embeds.length; n++) {
      var slug = slugify(nombres[n]);
      if (!slug) continue;
      var urls = [
        BASE + '/episodio/' + slug + '-temporada-' + season + '-episodio-' + episode,
        BASE + '/episodio/' + slug + '-' + tmdbId + '-temporada-' + season + '-episodio-' + episode
      ];
      for (var u = 0; u < urls.length; u++) {
        var html2 = await httpGet(urls[u]);
        if (!html2 || html2.indexOf('__NEXT_DATA__') < 0) continue;
        var pp = extractNextData(html2);
        if (pp && pp.episode && pp.episode.videos) {
          embeds = embeds.concat(_cuevanaVideos(pp.episode.videos));
          if (embeds.length) break;
        }
      }
    }
  }
  return embeds;
}
function _cuevanaVideos(videos) {
  var langMap = { latino: 'Latino', spanish: 'Castellano', english: 'Inglés', japanese: 'Japonés' };
  var out = [];
  Object.keys(langMap).forEach(function (key) {
    var list = videos[key];
    if (!list || !list.length) return;
    list.forEach(function (v) {
      var url = (v.result || '').toString();
      if (!url) return;
      out.push({ url: url, lang: langMap[key], server: (v.cyberlocker || 'Servidor').toString() });
    });
  });
  return out;
}

async function providerUnlimplay(tmdbId, isMovie, season, episode) {
  var url = isMovie
    ? 'https://unlimplay.com/f/embed/movie/' + tmdbId
    : 'https://unlimplay.com/f/embed/tv/' + tmdbId + '/' + season + '/' + episode;
  var html = await httpGet(url);
  if (!html) return [];
  var embeds = [];
  var jsonMatch = html.match(/servers\s*[:=]\s*(\{[\s\S]*?\})\s*[;<]/) || html.match(/window\.__DATA__\s*=\s*(\{[\s\S]*?\});/);
  if (jsonMatch) {
    try {
      var data = JSON.parse(jsonMatch[1]);
      Object.keys(data).forEach(function (lang) {
        var servers = data[lang];
        if (!servers || typeof servers !== 'object') return;
        Object.keys(servers).forEach(function (name) {
          var u = servers[name];
          if (typeof u === 'string' && /^https?:/i.test(u)) {
            embeds.push({ url: u, lang: normalizeLanguage(lang), server: name });
          }
        });
      });
    } catch (e) {}
  }
  var re = /<iframe[^>]+src=["']([^"']+)["']/gi, m;
  while ((m = re.exec(html)) !== null) {
    embeds.push({ url: m[1], lang: 'Latino', server: 'Unlimplay' });
  }
  return embeds;
}

async function providerFuegoCine(tmdbId, isMovie, season, episode) {
  var q = 'tmdbId=' + tmdbId + '&type=' + (isMovie ? 'movie' : 'tv');
  if (!isMovie) q += '&season=' + season + '&episode=' + episode;
  var data = await httpGetJson('https://www.modlyo.com/api/servidores.php?' + q);
  if (!data || !data.success || !Array.isArray(data.streams)) return [];
  return data.streams.map(function (s) {
    return {
      url: (s.servidor_url || '').toString(),
      lang: normalizeLanguage(s.idioma),
      server: (s.servidor_nombre || 'Modlyo').toString()
    };
  }).filter(function (x) { return x.url; });
}

async function providerCineSrc(tmdbId, isMovie, season, episode) {
  var embeds = [];
  var targets = isMovie
    ? [
        'https://cinesrc.st/embed/movie/' + tmdbId,
        'https://videoapp.mov/e/movie/' + tmdbId,
        'https://vidsrc.sh/embed/movie?tmdb=' + tmdbId + '&ds_lang=es'
      ]
    : [
        'https://cinesrc.st/embed/tv/' + tmdbId + '?s=' + season + '&e=' + episode,
        'https://videoapp.mov/e/tv/' + tmdbId + '/' + season + '/' + episode,
        'https://vidsrc.sh/embed/tv/' + tmdbId + '/' + season + '/' + episode + '&ds_lang=es'
      ];
  targets.forEach(function (t) {
    embeds.push({ url: 'https://modlyo.com/embed.php?url=' + encodeURIComponent(t), lang: 'Latino', server: 'CineSrc' });
    embeds.push({ url: t, lang: 'Latino', server: 'CineSrc' });
  });
  return embeds;
}

async function providerVidSrc(tmdbId, isMovie, season, episode) {
  var embeds = [];
  var urls = isMovie
    ? ['https://vidsrc.me/embed/movie/' + tmdbId, 'https://vidsrc.to/embed/movie/' + tmdbId, 'https://vidsrc.xyz/embed/movie/' + tmdbId]
    : [
        'https://vidsrc.me/embed/tv/' + tmdbId + '/' + season + '-' + episode,
        'https://vidsrc.to/embed/tv/' + tmdbId + '/' + season + '-' + episode,
        'https://vidsrc.xyz/embed/tv/' + tmdbId + '/' + season + '-' + episode
      ];
  urls.forEach(function (u) {
    embeds.push({ url: u, lang: 'Inglés', server: 'VidSrc' });
  });
  return embeds;
}

async function providerCinecalidad(tmdbId, isMovie, season, episode) {
  var tmdb = await getTmdbInfo(tmdbId, isMovie);
  var BASE = 'https://www.cinecalidad.am';
  var titles = [tmdb.latino, tmdb.castellano, tmdb.ingles].filter(Boolean);
  var candidates = [];
  titles.forEach(function (title) {
    var slug = slugify(title);
    if (!slug) return;
    if (isMovie) {
      candidates.push(BASE + '/' + slug + '/');
      candidates.push(BASE + '/' + slug + '-' + tmdbId + '/');
    } else {
      candidates.push(BASE + '/' + slug + '-' + season + 'x' + episode + '/');
      candidates.push(BASE + '/' + slug + '-' + season + 'x' + episode + '-' + tmdbId + '/');
    }
  });
  var embeds = [];
  for (var i = 0; i < candidates.length && !embeds.length; i++) {
    var html = await httpGet(candidates[i]);
    if (!html) continue;
    embeds = embeds.concat(_extractDataUrlLi(html));
  }
  return embeds;
}

function _extractDataUrlLi(html) {
  var out = [], seen = {};
  var re = /<li[^>]*data-url=["']([^"']+)["'][^>]*data-name=["']([^"']*)["'][^>]*>/gi, m;
  while ((m = re.exec(html)) !== null) {
    if (seen[m[1]]) continue;
    seen[m[1]] = true;
    out.push({ url: m[1], lang: _detectLangFromText(m[2] + ' ' + html), server: m[2] || 'Servidor' });
  }
  var opt = /var\s+options\s*=\s*(\{[\s\S]*?\});/i.exec(html);
  if (opt) {
    try {
      var s = opt[1].replace(/'/g, '"').replace(/,\s*}/g, '}');
      var data = JSON.parse(s);
      Object.keys(data).forEach(function (key) {
        var list = data[key];
        if (!Array.isArray(list)) return;
        list.forEach(function (item) {
          if (item && item.url && !seen[item.url]) {
            seen[item.url] = true;
            out.push({ url: item.url, lang: normalizeLanguage(key), server: item.name || key });
          }
        });
      });
    } catch (e) {}
  }
  var ifr = /<iframe[^>]+src=["']([^"']+)["']/gi;
  while ((m = ifr.exec(html)) !== null) {
    if (!seen[m[1]]) {
      seen[m[1]] = true;
      out.push({ url: m[1], lang: _detectLangFromText(html), server: 'Servidor' });
    }
  }
  return out;
}
function _detectLangFromText(text) {
  var t = String(text || '').toLowerCase();
  if (t.indexOf('latino') >= 0 || /\blat\b/.test(t)) return 'Latino';
  if (t.indexOf('castellano') >= 0 || t.indexOf('español') >= 0 || /\besp\b/.test(t)) return 'Castellano';
  if (t.indexOf('sub') >= 0 || t.indexOf('vose') >= 0) return 'Subtitulado';
  if (t.indexOf('english') >= 0 || t.indexOf('inglés') >= 0) return 'Inglés';
  return 'Latino';
}

async function providerSlugSite(base, pathPrefix, tmdbId, isMovie, season, episode) {
  var tmdb = await getTmdbInfo(tmdbId, isMovie);
  var titles = [tmdb.latino, tmdb.castellano, tmdb.ingles].filter(Boolean);
  var candidates = [];
  titles.forEach(function (title) {
    var slug = slugify(title);
    if (!slug) return;
    if (isMovie) {
      candidates.push(base + pathPrefix + slug);
      candidates.push(base + pathPrefix + slug + '-' + tmdbId);
      if (tmdb.year) candidates.push(base + pathPrefix + slug + '-' + tmdb.year);
    } else {
      candidates.push(base + pathPrefix + slug + '/temporada/' + season + '/capitulo/' + episode);
      candidates.push(base + pathPrefix + slug + '-temporada-' + season + '-episodio-' + episode);
      candidates.push(base + pathPrefix + slug + '-' + tmdbId + '/temporada/' + season + '/capitulo/' + episode);
    }
  });
  candidates = candidates.filter(function (v, i, a) { return a.indexOf(v) === i; });
  var embeds = [];
  for (var i = 0; i < candidates.length && embeds.length < 3; i++) {
    var html = await httpGet(candidates[i]);
    if (!html || html.length < 500) continue;
    var found = _extractDataUrlLi(html);
    if (!found.length && html.indexOf('__NEXT_DATA__') >= 0) {
      var pp = extractNextData(html);
      if (pp) {
        var videos = (pp.thisMovie && pp.thisMovie.videos) || (pp.episode && pp.episode.videos) || pp.videos;
        if (videos) found = found.concat(_cuevanaVideos(videos));
      }
    }
    if (found.length) embeds = embeds.concat(found);
  }
  return embeds;
}

async function providerPelisPlus(tmdbId, isMovie, season, episode) {
  return providerSlugSite('https://www.pelisplushd.la', isMovie ? '/pelicula/' : '/serie/', tmdbId, isMovie, season, episode);
}
async function providerHackStore(tmdbId, isMovie, season, episode) {
  return providerSlugSite('https://hackstore.mx', isMovie ? '/pelicula/' : '/serie/', tmdbId, isMovie, season, episode);
}
async function providerPoseidon(tmdbId, isMovie, season, episode) {
  return providerSlugSite('https://www.poseidonhd2.co', isMovie ? '/movies/' : '/series/', tmdbId, isMovie, season, episode);
}
async function providerSmartPelis(tmdbId, isMovie, season, episode) {
  return providerSlugSite('https://smartpelis.tv', isMovie ? '/movie/' : '/series/', tmdbId, isMovie, season, episode);
}
async function providerPelispedia(tmdbId, isMovie, season, episode) {
  return providerSlugSite('https://pelispedia.is', isMovie ? '/pelicula/' : '/serie/', tmdbId, isMovie, season, episode);
}
async function providerSeriesMetro(tmdbId, isMovie, season, episode) {
  return providerSlugSite('https://www3.seriesmetro.net', isMovie ? '/movie/' : '/series/', tmdbId, isMovie, season, episode);
}
async function providerTioPlus(tmdbId, isMovie, season, episode) {
  return providerSlugSite('https://tioplus.app', isMovie ? '/movie/' : '/tv/', tmdbId, isMovie, season, episode);
}

// ─── Registry ────────────────────────────────────────────
var PROVIDERS = {
  embed69: { name: 'Embed69', fn: providerEmbed69 },
  cuevana: { name: 'Cuevana', fn: providerCuevana },
  unlimplay: { name: 'Unlimplay', fn: providerUnlimplay },
  cinecalidad: { name: 'Cinecalidad', fn: providerCinecalidad },
  cinesrc: { name: 'CineSrc', fn: providerCineSrc },
  fuegocine: { name: 'FuegoCine', fn: providerFuegoCine },
  hackstore: { name: 'HackStore', fn: providerHackStore },
  pelispedia: { name: 'Pelispedia', fn: providerPelispedia },
  pelisplus: { name: 'PelisPlus', fn: providerPelisPlus },
  poseidon: { name: 'Poseidon', fn: providerPoseidon },
  seriesmetro: { name: 'SeriesMetro', fn: providerSeriesMetro },
  smartpelis: { name: 'SmartPelis', fn: providerSmartPelis },
  tioplus: { name: 'TioPlus', fn: providerTioPlus },
  vidsrc: { name: 'VidSrc', fn: providerVidSrc }
};
var ENABLED = {};
Object.keys(PROVIDERS).forEach(function (k) { ENABLED[k] = true; });

function listSources() {
  return Object.keys(PROVIDERS).map(function (id) {
    return { id: id, name: PROVIDERS[id].name, types: ['movie', 'series'], enabled: !!ENABLED[id] };
  });
}
function setSourceEnabled(id, on) {
  if (ENABLED.hasOwnProperty(id)) ENABLED[id] = !!on;
}

async function resolveEmbedList(embeds, sourceId, sourceName) {
  if (!embeds || !embeds.length) return [];
  var MAX = 12;
  var slice = embeds.slice(0, MAX);
  var jobs = slice.map(function (e) {
    return extract(e.url).then(function (r) {
      return tagStream(r, e.lang, e.server, sourceId, sourceName);
    }).catch(function () { return null; });
  });
  var results = await Promise.all(jobs);
  return results.filter(Boolean);
}

async function getStreamsFrom(sourceId, tmdbId, type, season, episode) {
  var p = PROVIDERS[sourceId];
  if (!p) return [];
  var id = parseInt(tmdbId, 10);
  if (!id) return [];
  var typeStr = String(type || '').toLowerCase();
  var isMovie = typeStr.indexOf('tv') < 0 && typeStr.indexOf('series') < 0 && typeStr.indexOf('show') < 0;
  try {
    var embeds = await p.fn(id, isMovie, season || 1, episode || 1);
    return await resolveEmbedList(embeds, sourceId, p.name);
  } catch (e) {
    dbg('provider error', sourceId, e && e.message);
    return [];
  }
}

/**
 * API principal que llama la app:
 *   getStreams(tmdbId, type, season, episode)
 */
async function getStreams(tmdbId, type, season, episode) {
  var ids = listSources().filter(function (s) { return s.enabled; }).map(function (s) { return s.id; });
  var jobs = ids.map(function (id) {
    return getStreamsFrom(id, tmdbId, type, season, episode);
  });
  var parts = await Promise.all(jobs);
  var merged = [];
  var seen = {};
  parts.forEach(function (arr) {
    (arr || []).forEach(function (s) {
      if (!s || !s.url || seen[s.url]) return;
      seen[s.url] = true;
      merged.push(s);
    });
  });
  return merged;
}

async function getChannels() { return []; }
async function getChannelStream() { return null; }

// Export compatible con JsAddonRuntime de LOL App
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStreams: getStreams,
    getStreamsFrom: getStreamsFrom,
    listSources: listSources,
    setSourceEnabled: setSourceEnabled,
    getChannels: getChannels,
    getChannelStream: getChannelStream,
    extract: extract
  };
}
if (typeof globalThis !== 'undefined') {
  globalThis.getStreams = getStreams;
  globalThis.LoltvAllProviders = {
    getStreams: getStreams,
    getStreamsFrom: getStreamsFrom,
    listSources: listSources,
    setSourceEnabled: setSourceEnabled,
    extract: extract
  };
}
