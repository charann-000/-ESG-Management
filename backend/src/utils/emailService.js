const { transporter } = require("../config/nodemailer");
const env = require("../config/env");

/**
 * Sends a welcome email containing temporary credentials to a newly created user.
 */
const sendWelcomeEmail = async (email, name, temporaryPassword) => {
  const mailOptions = {
    from: env.email.from,
    to: email,
    subject: "Welcome to EcoSphere ESG Platform - Your Credentials",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4CAF50; text-align: center;">Welcome to EcoSphere</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your administrator has registered you on the EcoSphere ESG Management Platform.</p>
        <p>Below are your temporary login credentials. You will be forced to change your password upon your first login for security reasons.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #eee;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #ccc; border-radius: 4px;">${temporaryPassword}</code></p>
        </div>
        <p style="text-align: center;">
          <a href="${env.frontendUrl}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Login</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #888; text-align: center;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Sends a password reset email containing a secure link.
 */
const sendForgotPasswordEmail = async (email, name, resetUrl) => {
  const mailOptions = {
    from: env.email.from,
    to: email,
    subject: "EcoSphere ESG Platform - Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #2196F3; text-align: center;">Password Reset Request</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password for your EcoSphere account.</p>
        <p>Please click the button below to reset your password. This link is valid for 15 minutes.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="font-size: 0.9em; color: #555;">If you did not request a password reset, please ignore this email or contact security support.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #888; text-align: center;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Sends a password update confirmation email.
 */
const sendPasswordChangedEmail = async (email, name) => {
  const mailOptions = {
    from: env.email.from,
    to: email,
    subject: "EcoSphere ESG Platform - Password Successfully Changed",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4CAF50; text-align: center;">Password Updated</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>This email confirms that the password for your EcoSphere ESG Platform account has been successfully changed.</p>
        <p>If you authorized this change, you can ignore this notice. If you did not perform this action, please contact your systems administrator immediately.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #888; text-align: center;">This is an automated security notification. Please do not reply directly to this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Sends a governance event notification email.
 */
const sendGovernanceEmail = async (email, subject, title, bodyContent) => {
  const mailOptions = {
    from: env.email.from,
    to: email,
    subject: `EcoSphere ESG Governance - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #607d8b; text-align: center;">${title}</h2>
        <p>${bodyContent}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #888; text-align: center;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendForgotPasswordEmail,
  sendPasswordChangedEmail,
  sendGovernanceEmail,
};
