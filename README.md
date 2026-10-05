# Complemento multi-fuente LOLTV

Un solo archivo instala **varias fuentes** a la vez:

| ID        | Nombre   | Tipo        |
|-----------|----------|-------------|
| `embed69` | Embed69  | movie/series |
| `cuevana` | Cuevana  | movie/series |

## Archivos

- `loltv_fuentes.js` — módulo JS (todas las fuentes)
- `manifest.json` — metadatos del complemento

## API (lo que lee la app)

```js
const mod = require('./loltv_fuentes.js');

// Todas las fuentes habilitadas (en paralelo, dedupe por URL)
const streams = await mod.getStreams(tmdbId, type, season, episode, title, year);

// Solo una fuente
const only = await mod.getStreamsFrom('cuevana', tmdbId, type, season, episode);

// Listar / activar-desactivar
mod.listSources();
mod.setSourceEnabled('embed69', false);
```

Cada stream trae idiomas legibles:

```js
{
  name: "Embed69 - 1080p",
  title: "Castellano - Filemoon",  // idioma primero
  language: "Castellano",
  lang: "Castellano",
  audio: "Castellano",
  Audio: "Castellano",
  provider: "Filemoon",
  source: "embed69",
  url: "https://...m3u8",
  headers: { ... }
}
```

## Importante sobre la app Magis Live (Flutter del ZIP)

**Magis Live no carga complementos JS.** Solo habla con el portal Magis/Xuper (canales en vivo).

Este complemento es para apps que ejecutan módulos JS (Nuvio / runtime QuickJS / host propio que haga `require` del `.js`).

Si quieres que **Magis Live** también use estas fuentes VOD, hay que añadir en Dart un cargador de fuentes (nativo o bridge JS). Eso no existe hoy en el código del ZIP.

## Canales TV

`getChannels()` / `getChannelStream()` están exportados pero vacíos aquí (VOD only).  
Los canales en vivo siguen siendo responsabilidad de Magis Live / otra fuente TV.
