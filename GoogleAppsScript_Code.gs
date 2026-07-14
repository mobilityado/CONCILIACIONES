/**
 * API de usuarios para MasterWeb Pro 4.1
 * Hoja esperada (fila 1): USUARIO | NOMBRE | CONTRASEÑA | ACTIVO | ROL
 * ACTIVO acepta: SI, SÍ, TRUE, 1, ACTIVO. Si la columna no existe, todos quedan activos.
 */
const ID_HOJA_USUARIOS = '1H_iGzONbV-mc0B37_p3XvR62A5wr81mcK8Sn0W4JVDs';
const NOMBRE_PESTANA = 'USUARIOS'; // Cambia este nombre si tu pestaña se llama diferente.

function doGet(e) {
  try {
    const accion = String((e && e.parameter && e.parameter.accion) || '').toLowerCase();
    if (accion === 'usuarios') {
      const usuarios = obtenerUsuarios_()
        .filter(u => u.activo)
        .map(u => ({ usuario: u.usuario, nombre: u.nombre, rol: u.rol })); // Nunca enviar contraseñas.
      return json_({ ok: true, usuarios: usuarios });
    }
    return json_({ ok: true, servicio: 'MasterWeb Pro Usuarios', uso: '?accion=usuarios' });
  } catch (error) {
    return json_({ ok: false, error: true, mensaje: error.message });
  }
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    const accion = String(p.accion || '').toLowerCase();
    if (accion !== 'login') return json_({ ok: false, mensaje: 'Acción inválida.' });

    const usuario = normalizar_(p.usuario);
    const password = String(p.password || '');
    if (!usuario || !password) return json_({ ok: false, mensaje: 'Usuario y contraseña son obligatorios.' });

    const encontrado = obtenerUsuarios_().find(u =>
      u.activo && normalizar_(u.usuario) === usuario && String(u.password) === password
    );
    if (!encontrado) return json_({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });

    return json_({
      ok: true,
      usuario: { usuario: encontrado.usuario, nombre: encontrado.nombre, rol: encontrado.rol }
    });
  } catch (error) {
    return json_({ ok: false, error: true, mensaje: error.message });
  }
}

function obtenerUsuarios_() {
  const libro = SpreadsheetApp.openById(ID_HOJA_USUARIOS);
  const hoja = libro.getSheetByName(NOMBRE_PESTANA) || libro.getSheets()[0];
  const valores = hoja.getDataRange().getDisplayValues();
  if (valores.length < 2) return [];

  const encabezados = valores[0].map(normalizarEncabezado_);
  const col = nombres => {
    for (const nombre of nombres) {
      const i = encabezados.indexOf(normalizarEncabezado_(nombre));
      if (i >= 0) return i;
    }
    return -1;
  };
  const iUsuario = col(['USUARIO', 'USER', 'USERNAME', 'CORREO', 'EMAIL']);
  const iNombre = col(['NOMBRE', 'NAME', 'NOMBRE COMPLETO']);
  const iPassword = col(['CONTRASEÑA', 'CONTRASENA', 'PASSWORD', 'CLAVE']);
  const iActivo = col(['ACTIVO', 'ESTATUS', 'STATUS', 'HABILITADO']);
  const iRol = col(['ROL', 'ROLE', 'PERFIL']);
  if (iUsuario < 0 || iPassword < 0) throw new Error('La hoja necesita columnas USUARIO y CONTRASEÑA.');

  return valores.slice(1).map(fila => ({
    usuario: String(fila[iUsuario] || '').trim(),
    nombre: String(iNombre >= 0 ? fila[iNombre] : fila[iUsuario] || '').trim(),
    password: String(fila[iPassword] || ''),
    activo: iActivo < 0 ? true : esActivo_(fila[iActivo]),
    rol: String(iRol >= 0 ? fila[iRol] : '').trim()
  })).filter(u => u.usuario);
}

function esActivo_(valor) {
  const v = normalizar_(valor);
  return ['SI', 'SÍ', 'TRUE', '1', 'ACTIVO', 'HABILITADO', 'YES'].includes(v);
}
function normalizar_(valor) {
  return String(valor || '').trim().toUpperCase();
}
function normalizarEncabezado_(valor) {
  return normalizar_(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function json_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
