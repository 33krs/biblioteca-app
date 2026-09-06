// Punto único para "enviar" el email de recuperación de contraseña. Hoy no
// hay ningún proveedor de email configurado, así que simplemente logueamos el
// link en la consola del servidor (útil en desarrollo). El día que se quiera
// enviar un email de verdad, solo hay que reemplazar el cuerpo de esta
// función por una llamada a Resend/SendGrid/nodemailer+SMTP, sin tocar las
// rutas que la usan.
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  console.log(`[mailer] Reseteo de contraseña para ${email}: ${resetUrl}`);
}
