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

## Versión 5.2 — Validación de Prepago ERPCO
- Corrige la lectura de Prepago en los CSV estándar SUR y TRT usando la columna real y la fila oficial de totales.
- Valida los importes de Prepago antes de habilitar la descarga.
- Integra los importes Volksbus mediante el residual oficial utilizado en el formato manual validado.
- Muestra en pantalla el origen y el importe validado por cada marca.


## Versión 5.3
- Corrige la ubicación de AVA SUR y AVA TRT en el formato oficial.
- Evita duplicar el depósito ERPCO en el campo manual.
- Mantiene vacíos los depósitos manuales para captura del usuario.


## Versión 5.4
- El total de fichas en D69 se calcula con la fórmula `SUM(D62:D68)`.
- La diferencia en L69 se calcula con `D69-L44` y se actualiza al capturar importes.
- Se eliminó la etiqueta DIFERENCIA duplicada.


## Versión 5.5 — Fecha automática del reporte CIA
- La fecha del MasterWeb se toma del campo `Periodo Correspondiente del` del reporte CIA.
- El portal muestra el periodo detectado y bloquea la fecha para evitar cambios accidentales.
- El Excel oficial conserva intacta la plantilla corporativa.
- El archivo se descarga como `MASTERWEB_Villahermosa_DD-MM-AAAA.xlsx`.
