const nodemailer = require("nodemailer");

const senderEmail = process.env.SENDER_EMAIL;
const sendEmail = async (options) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_TRANSPORT_HOST,
    port: process.env.EMAIL_TRANSPORT_PORT,
    auth: {
      user: process.env.EMAIL_TRANSPORT_HOST_USER,
      pass: process.env.EMAIL_TRANSPORT_HOST_PASS,
    },
  });

  const mailOptions = {
    from: `Freshr support ${senderEmail}`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
