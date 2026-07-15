# MasterWeb Pro 4.2 — Usuarios desde Google Sheets

## Estructura compatible

La hoja puede tener las columnas en este orden:

| CONTRASEÑA | USUARIO | NOMBRE | ROL |
|---|---|---|---|

El script identifica los encabezados por nombre, por lo que también funcionará si cambia su orden.

## Actualizar Google Apps Script

1. Abre el proyecto de Apps Script conectado a la hoja.
2. Sustituye todo el código por `GoogleAppsScript_Code.gs`.
3. Guarda.
4. Ve a **Implementar → Administrar implementaciones**.
5. Edita la implementación existente.
6. En **Versión**, selecciona **Nueva versión**.
7. Ejecutar como: **Yo**.
8. Quién tiene acceso: **Cualquier persona**.
9. Pulsa **Implementar**.

La URL `/exec` puede permanecer igual.

## Prueba de lista

Abre la URL `/exec?accion=usuarios`. Debe devolver JSON y nunca debe mostrar contraseñas.

## Corrección incluida

La página ahora envía el acceso como JSON (`text/plain`) y Apps Script acepta tanto JSON como formularios. Esto corrige el error:

`Unexpected token 'a', "accion=login..." is not valid JSON`
