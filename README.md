# Chinchón App

Aplicación web ligera para llevar el tanteador del juego de cartas **Chinchón**.
Todo corre en el navegador; los datos de las partidas se guardan en
`localStorage` y pueden reanudarse al volver a abrir la página.

## Uso

1. Abre `index.html` en un navegador moderno.
2. Agrega jugadores, carga las rondas y la aplicación calculará los totales
   automáticamente.
3. Los valores se guardan de manera local, por lo que puedes cerrar y volver a
   abrir la página sin perder el progreso.

## Compilación de Tailwind

El archivo `tailwind.config.js` ya apunta a los HTML de la raíz, por lo que
solo se generarán las clases necesarias. Recuerda reinstalar dependencias si es
la primera vez que compilas.

## Benchmark de renderizado

El script `benchmark.js` compara el método antiguo de renderizado de la tabla
con la versión optimizada que actualiza únicamente las celdas afectadas.
Úsalo para medir el rendimiento con grandes cantidades de jugadores y rondas:

```bash
node benchmark.js
```

Puedes ajustar los valores de `players`, `rounds` y `updates` dentro del script
para probar diferentes escenarios.

## Reenganche y deshabilitación de jugadores

La aplicación permite que un jugador se "enganche" nuevamente luego de superar
los 100 puntos. El botón de reenganche se muestra únicamente cuando se cumplen
simultáneamente las siguientes condiciones:

- La partida sigue en curso y quedan al menos tres jugadores activos.
- El jugador superó los 100 puntos y ya disputó al menos una ronda.
- Se encuentra en la ronda siguiente a la última que jugó.
- Todavía no se enganchó manualmente.

Por otro lado, un jugador queda inhabilitado para seguir cargando rondas cuando:

- La partida terminó.
- Se enganchó manualmente y continúa con más de 100 puntos.
- O bien superó los 100 puntos y ya no tiene posibilidad de engancharse.

## Otras características

- **Modo instalable / offline:** gracias a `manifest.json` y `sw.js`, la app se
  comporta como una Progressive Web App. Puedes instalarla en tu dispositivo y
  seguirá funcionando sin conexión utilizando el caché del navegador.
