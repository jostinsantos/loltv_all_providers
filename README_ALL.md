# LOLTV All Providers — un solo addon

Archivo principal: **`loltv_all_providers.js`**

## Fuentes incluidas (14)

| ID | Origen Dart |
|----|-------------|
| embed69 | embed69_extractor.dart |
| cuevana | cuevana_extractor.dart |
| unlimplay | unlimplay_extractor.dart |
| cinecalidad | cinecalidad_extractor.dart |
| cinesrc | cinesrc_extractor.dart |
| fuegocine | fuegocine_extractor.dart |
| hackstore | hackstore_extractor.dart |
| pelispedia | pelispedia_extractor.dart |
| pelisplus | pelisplus_extractor.dart |
| poseidon | poseidon_extractor.dart |
| seriesmetro | seriesmetro_extractor.dart |
| smartpelis | smartpelis_extractor.dart |
| tioplus | tioplus_extractor.dart |
| vidsrc | vidsrc_extractor.dart |

## Extracción (misma lógica Embed69 + Cuevana)

1. Cada provider lista embeds + idioma desde la página/API.
2. Resolvers compartidos: **VOE**, **StreamWish**, **VidHide**, **Filemoon**, packer Dean Edwards, genérico (iframe / `var url`).
3. Solo se aceptan **m3u8 / mp4** finales.
4. Idioma en `title` + `language` / `lang` / `audio` / `Audio`.

## API

```js
const m = require('./loltv_all_providers.js');

// Todas las fuentes en paralelo
await m.getStreams(tmdbId, 'movie' | 'tv', season, episode);

// Una fuente
await m.getStreamsFrom('cuevana', tmdbId, 'movie');

m.listSources();
m.setSourceEnabled('vidsrc', false);
```

## Formato de cada stream

```js
{
  name: "Cuevana - 1080p",
  title: "Latino - StreamWish",
  url: "https://...m3u8",
  quality: "1080p",
  language: "Latino",
  lang: "Latino",
  audio: "Latino",
  Audio: "Latino",
  langCode: "es_MX",
  provider: "StreamWish",
  source: "cuevana",
  headers: { "User-Agent": "...", "Referer": "..." }
}
```

Los extractores originales en Dart devolvían embeds o códigos `es_MX`; este addon **resuelve a HLS** y **etiquetas legibles** para que la app no marque todo como Latino.
