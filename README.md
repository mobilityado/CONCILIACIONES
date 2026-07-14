# MasterWeb Pro 4.0

Sistema web local para conciliar reportes CIA y ERPCO, llenar la plantilla oficial de Integración Masterweb y generar reportes de diferencias.

## Acceso inicial

- Usuario: `admin`
- Contraseña: `485218`

> El inicio de sesión es local y sirve como control operativo básico. GitHub Pages es alojamiento estático; para seguridad corporativa real se requiere autenticación en servidor o Microsoft Entra ID.

## Publicar en GitHub Pages

1. Descomprime el proyecto.
2. Sube **el contenido interno** de la carpeta `conciliador-masterweb` a la raíz de tu repositorio.
3. En GitHub abre **Settings → Pages**.
4. Selecciona **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
5. Guarda y espera la publicación.

## Funciones

- Tema corporativo púrpura y diseño adaptable.
- Sesión local y bitácora de conciliaciones.
- Carga inteligente CIA, ERPCO, Volksbus, AVA y depósitos.
- Lectura automática de IVA CIA y Dif. Canje.
- Generación del Excel oficial con segunda hoja de diferencias.
- PDF ejecutivo, CSV, dashboard, análisis inteligente y consulta por conductor.
- Historial guardado en el navegador.

## Privacidad

Los documentos se procesan en el navegador y no se envían a un servidor. El historial se guarda mediante `localStorage` y la sesión mediante `sessionStorage`.
