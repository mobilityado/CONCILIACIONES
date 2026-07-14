# Configuración de usuarios — MasterWeb Pro 4.1

## Estructura de Google Sheets

Crea o utiliza una pestaña llamada `USUARIOS` con estos encabezados en la fila 1:

| USUARIO | NOMBRE | CONTRASEÑA | ACTIVO | ROL |
|---|---|---|---|---|
| jlopez | José Ángel López | 123456 | SI | Administrador |

`USUARIO` y `CONTRASEÑA` son obligatorios. La lista desplegable solamente muestra usuarios activos y nunca descarga las contraseñas.

## Apps Script

1. Abre el proyecto de Apps Script conectado a la hoja.
2. Reemplaza el contenido de `Code.gs` con `GoogleAppsScript_Code.gs` incluido en este proyecto.
3. Verifica el nombre de la pestaña en `NOMBRE_PESTANA`.
4. Implementa como **Aplicación web**:
   - Ejecutar como: tú.
   - Quién tiene acceso: cualquier persona.
5. Al actualizar una implementación existente, crea una versión nueva y confirma que la URL `/exec` siga siendo la misma.

La página ya está configurada para la implementación:
`AKfycbxbpunye5mRfeGk86f2DTdpMf63tYdsYRFbsJqDz7NS7h36c645yNG4zGVs1WOfSKVmcQ`

## Seguridad

La contraseña se valida en Apps Script y no se entrega al navegador. Aun así, Google Sheets guarda las contraseñas como texto. Para un sistema de mayor seguridad conviene usar hashes o autenticación corporativa.
