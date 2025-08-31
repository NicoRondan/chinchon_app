# Chinchón App

Este proyecto usa [Tailwind CSS](https://tailwindcss.com) precompilado.

## Compilación de Tailwind

Para actualizar `styles.css` con las clases usadas en `chinchon.html`:

1. Asegúrate de tener Node.js instalado.
2. Ejecuta en la raíz del proyecto:
   ```bash
   npx tailwindcss -i tailwind.css -o styles.css --minify
   ```

El archivo `tailwind.config.js` ya apunta a `chinchon.html`, por lo que solo se generarán las clases necesarias. Recuerda reinstalar dependencias si es la primera vez que compilas.
