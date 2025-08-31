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

Para actualizar `styles.css` con las clases usadas en los archivos HTML:

1. Asegúrate de tener Node.js instalado.
2. Ejecuta en la raíz del proyecto:
   ```bash
   npx tailwindcss -i tailwind.css -o styles.css --minify
   ```

El archivo `tailwind.config.js` ya apunta a los HTML de la raíz, por lo que
solo se generarán las clases necesarias. Recuerda reinstalar dependencias si es
la primera vez que compilas.

## Publicación en hosting gratuito

La aplicación es estática, por lo que puede alojarse fácilmente en servicios
gratuitos como **GitHub Pages** o **Netlify**.

### GitHub Pages

1. Sube este repositorio a tu cuenta de GitHub.
2. En la configuración del repositorio, ve a **Pages**.
3. En "Build and deployment" selecciona la rama principal (`main`) y la carpeta
   raíz (`/`). Guarda los cambios.
4. Tras unos minutos, GitHub generará una URL pública donde quedará disponible
   `index.html`.

### Netlify

1. Crea una cuenta en [Netlify](https://www.netlify.com/).
2. Importa el repositorio y selecciona la rama principal.
3. En la configuración de deploy, establece como directorio de publicación `.`
   (punto).
4. Netlify generará un dominio gratuito desde el cual podrás acceder a la app.

## Benchmark de renderizado

El script `benchmark.js` compara el método antiguo de renderizado de la tabla
con la versión optimizada que actualiza únicamente las celdas afectadas.
Úsalo para medir el rendimiento con grandes cantidades de jugadores y rondas:

```bash
node benchmark.js
```

Puedes ajustar los valores de `players`, `rounds` y `updates` dentro del script
para probar diferentes escenarios.
