# Conciliador CIA · ERPCO / Masterweb

Aplicación web estática para GitHub Pages. Procesa localmente los reportes CIA, ERPCO, AVA y depósitos en camino, llena el formato oficial de Integración Masterweb y agrega una hoja de diferencias por conductor.

## Publicación en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube **todo el contenido** de esta carpeta, conservando `assets/plantilla-masterweb.xlsx`.
3. Abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main`, carpeta `/ (root)` y guarda.
6. Abre la dirección que GitHub muestre al terminar la publicación.

## Archivos esperados

- Cierre CIA `.xls` (tabla HTML exportada por CIA).
- ERPCO SUR y TRT `.csv`.
- ERPCO SUR Volksbus y TRT Volksbus `.csv`.
- Recuperación AVA SUR/TRT `.xlsx`.
- Depósitos en camino CIA `.xls`.
- Depósitos en camino ERPCO `.pdf`.

## Importante

- Los archivos se procesan dentro del navegador y no se suben a un servidor.
- La aplicación usa SheetJS y PDF.js mediante CDN, por lo que necesita conexión a Internet al abrirla.
- El formato oficial está en `assets/plantilla-masterweb.xlsx`. Puede sustituirse por una nueva versión, siempre que conserve la misma ubicación de celdas.
- Antes de usarla de forma oficial, valida al menos 2 o 3 conciliaciones conocidas. Los sistemas de origen pueden cambiar encabezados o estructuras.
