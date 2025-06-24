interface UsuarioPayload {
  nombre: string;
  email: string;
  dni: string;
}

const usuarios: any[] = [];

export const crearUsuario = (data: UsuarioPayload) => {
  if (!data.nombre || !data.email || !data.dni) {
    throw new Error('Datos incompletos');
  }

  const yaExiste = usuarios.some(u => u.dni === data.dni);
  if (yaExiste) throw new Error('El usuario ya existe');

  const nuevoUsuario = {
    id: usuarios.length + 1,
    ...data
  };

  usuarios.push(nuevoUsuario);
  return nuevoUsuario;
};

export const listarUsuarios = () => usuarios;