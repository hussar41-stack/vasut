const nodemailer = require('nodemailer');

// ─── Email Service ────────────────────────────────────────────────────────────
// Create a reusable transporter strictly based on Environment Variables
// If environment variables are missing, it falls back to Ethereal Testing Mail.
const getTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // App password
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Fallback to testing ethereal mail
  console.log('⚠️ Nincs SMTP környezeti változó (SMTP_USER/SMTP_PASS). Teszt mód aktiválva!');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"TransportHU" <${process.env.SMTP_USER || 'noreply@transporthu.com'}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`📩 Email sikeresen elküldve: [${subject}] -> ${to}`);
    if (!process.env.SMTP_USER) {
      console.log(`Példa email megtekintése: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Hiba az email küldésekor:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail
};
