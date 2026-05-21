export function requireAdminPassword(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const received = request.headers.get('x-admin-password') || '';
  if (!expected) throw new Error('ADMIN_PASSWORD no está configurada.');
  if (received !== expected) throw new Error('Contraseña de administrador inválida.');
}
