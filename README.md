# MasterWeb Pro 5.0

Sistema de conciliación CIA–ERPCO listo para GitHub Pages.

## Novedad principal

La carga ahora admite dos flujos sin cambiar la conciliación existente:

- **Archivos sueltos:** XLS, XLSX, CSV y PDF.
- **Archivo ZIP:** se descomprime localmente en el navegador y se extraen automáticamente los reportes compatibles.
- También se pueden combinar archivos sueltos y ZIP en una misma conciliación.

Los documentos nunca se envían a un servidor. El ZIP se procesa con JSZip directamente en el navegador.

## Publicación en GitHub Pages

1. Descomprime este proyecto.
2. Sube el contenido de `conciliador-masterweb` a la raíz del repositorio.
3. En GitHub abre **Settings → Pages**.
4. Selecciona **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
5. Guarda y actualiza con `Ctrl + F5` cuando termine la publicación.

## Usuarios

La lista y las contraseñas continúan validándose mediante el Google Apps Script configurado en `app.js`. El archivo `GoogleAppsScript_Code.gs` conserva la versión compatible con la hoja:

`CONTRASEÑA | USUARIO | NOMBRE | ROL`

## Nota

La aplicación requiere conexión a internet para cargar las librerías externas (SheetJS, PDF.js, jsPDF y JSZip), aunque los archivos se procesan localmente.
