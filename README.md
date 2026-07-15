# CONCIL.IA 6.0

**Conciliación Inteligente Automatizada** para Recaudación Villahermosa.

## Funciones

- Inicio de sesión con usuarios y contraseñas validados por Google Sheets / Apps Script.
- Carga de reportes sueltos o ZIP: CIA, ERPCO, Volksbus, AVA y depósitos.
- Conciliación automática y análisis por conductor.
- Dashboard, gráficas, búsqueda, historial local y modo oscuro.
- Pantalla personalizada de bienvenida y resumen visual al terminar el proceso.
- Generación del archivo oficial `MASTERWEB_Villahermosa_DD-MM-AAAA.xlsx`.
- Conserva logotipo, colores, bordes, estructura, firmas, fórmulas y formato oficial de la empresa.
- Fecha automática: día anterior según horario de Ciudad de México.
- Los archivos se procesan localmente en el navegador.

## Publicar en GitHub Pages

1. Sube a la raíz del repositorio todos los archivos de esta carpeta, incluida `assets`.
2. En GitHub abre **Settings → Pages**.
3. Selecciona **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. Guarda y espera la publicación.
5. Abre la página y usa `Ctrl + F5` después de reemplazar una versión anterior.

## Google Apps Script

El archivo `GoogleAppsScript_Code.gs` contiene la API de usuarios. La URL de implementación ya está configurada en `app.js`. Si creas otra implementación, actualiza la constante `USERS_API_URL`.

## Nota

MasterWeb es el documento oficial generado por el sistema; **CONCIL.IA** es el nombre del portal.

## Versión 6.1
- Corrige la duplicación visual de “Total de efectivo a depositar”.
- El total se conserva únicamente en la celda oficial combinada L44:M44.
- La celda mantiene la fórmula `=G34+G42+M42` y la diferencia sigue calculándose con `=D69-L44`.
