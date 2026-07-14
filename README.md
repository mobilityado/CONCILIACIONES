# Conciliador Masterweb 2.0

Aplicación web estática para realizar conciliaciones CIA vs ERPCO y generar el formato oficial Masterweb.

## Funciones

- Reconocimiento automático de reportes CIA, ERPCO SUR/TRT, Volksbus, AVA y depósitos.
- Lectura de subtotal e IVA del reporte CIA.
- `Dif. Canje` enviado automáticamente a Otros ingresos.
- Generación del Excel oficial con hoja adicional de diferencias.
- Dashboard con totales CIA, ERPCO, IVA, AVA y depósitos.
- Reporte filtrable por conductor y detección de registros faltantes.
- Reporte ejecutivo en PDF y diferencias en CSV.
- Historial local de las últimas 20 conciliaciones.
- Todo se procesa dentro del navegador; ningún archivo se envía a un servidor.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio.
2. En GitHub abre **Settings → Pages**.
3. Selecciona **Deploy from a branch**.
4. Elige la rama `main` y la carpeta `/ (root)`.
5. Guarda y espera a que GitHub publique el sitio.

La carpeta `assets` y el archivo `plantilla-masterweb.xlsx` son indispensables.

## Archivos principales

- `index.html`: interfaz.
- `styles.css`: diseño adaptable.
- `app.js`: lectura, conciliación y exportación.
- `assets/plantilla-masterweb.xlsx`: formato oficial.
