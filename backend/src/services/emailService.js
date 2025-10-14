const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"My Trade Award" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Email templates
const emailTemplates = {
  // Welcome email template
  welcome: (userName) => ({
    subject: 'Welcome to My Trade Award!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to My Trade Award!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining My Trade Award. We're excited to help you create custom trading awards that celebrate your achievements.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">What's Next?</h3>
          <ul>
            <li>Browse our premium award collection</li>
            <li>Upload your trading certificates</li>
            <li>Customize your awards</li>
            <li>Track your orders</li>
          </ul>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The My Trade Award Team</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent to you because you registered an account at My Trade Award.
        </p>
      </div>
    `
  }),

  // Password reset email template
  passwordReset: (userName, resetUrl) => ({
    subject: 'Reset Your Password - My Trade Award',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You requested a password reset for your My Trade Award account.</p>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Click the button below to reset your password:</strong></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666;">
          This link will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
        </p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p>Best regards,<br>The My Trade Award Team</p>
      </div>
    `
  }),

  // Email verification template
  emailVerification: (userName, verificationUrl) => ({
    subject: 'Verify Your Email - My Trade Award',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with My Trade Award. Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #666;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #28a745;">${verificationUrl}</p>
        <p>Best regards,<br>The My Trade Award Team</p>
      </div>
    `
  }),

  // Order confirmation template
  orderConfirmation: (userName, orderNumber, orderTotal) => ({
    subject: `Order Confirmation #${orderNumber} - My Trade Award`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for your order! We've received your order and will start processing it soon.</p>
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total Amount:</strong> ₹${orderTotal}</p>
        </div>
        <p>You can track your order status by logging into your account.</p>
        <p>We'll send you another email when your order ships.</p>
        <p>Best regards,<br>The My Trade Award Team</p>
      </div>
    `
  }),

  // Shipping notification template
  shippingNotification: (userName, orderNumber, trackingInfo) => ({
    subject: `Your Order #${orderNumber} Has Shipped! - My Trade Award`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🚚 Your Order Has Shipped!</h2>
        <p>Hello ${userName},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0c5460;">📦 Shipping Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>AWB Code:</strong> ${trackingInfo.awbCode}</p>
          <p><strong>Courier Partner:</strong> ${trackingInfo.courierName}</p>
          <p><strong>Estimated Delivery:</strong> ${trackingInfo.estimatedDeliveryDate || 'To be updated'}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingInfo.trackingUrl}" style="background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">🔍 Track Your Package</a>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">📱 Track Your Package:</h4>
          <p>Click the button above or visit: <a href="${trackingInfo.trackingUrl}" style="color: #17a2b8;">${trackingInfo.trackingUrl}</a></p>
          <p><strong>AWB Code:</strong> ${trackingInfo.awbCode}</p>
        </div>

        <div style="border-left: 4px solid #ffc107; padding-left: 15px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">📍 What's Next?</h4>
          <ul style="color: #856404;">
            <li>Your package is in transit and will be delivered soon</li>
            <li>You'll receive updates as your package moves</li>
            <li>Please ensure someone is available to receive the package</li>
            <li>Contact us if you have any questions</li>
          </ul>
        </div>

        <p>Thank you for choosing My Trade Award. We hope you love your custom trading awards!</p>
        <p>Best regards,<br>The My Trade Award Team</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent because your order has been shipped. If you have any questions, please contact our support team.
        </p>
      </div>
    `
  }),

  // Delivery notification template
  deliveryNotification: (userName, orderNumber, deliveredAt) => ({
    subject: `📦 Your Order #${orderNumber} Has Been Delivered! - My Trade Award`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🎉 Your Order Has Been Delivered!</h2>
        <p>Hello ${userName},</p>
        <p>Wonderful news! Your order has been successfully delivered.</p>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #155724;">📦 Delivery Confirmation</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Delivered On:</strong> ${new Date(deliveredAt).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">🏆 Enjoy Your Custom Awards!</h4>
          <p style="margin-bottom: 0; color: #856404;">We hope you love your custom trading awards. If you have any questions or feedback, please don't hesitate to reach out!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/my-orders" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Order Details</a>
        </div>

        <p>Thank you for choosing My Trade Award!</p>
        <p>Best regards,<br>The My Trade Award Team</p>
      </div>
    `
  })
};

// Send welcome email
const sendWelcomeEmail = async (email, userName) => {
  const template = emailTemplates.welcome(userName);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, userName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const template = emailTemplates.passwordReset(userName, resetUrl);

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  });
};

// Send email verification
const sendEmailVerification = async (email, userName, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const template = emailTemplates.emailVerification(userName, verificationUrl);

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, userName, orderNumber, orderTotal) => {
  const template = emailTemplates.orderConfirmation(userName, orderNumber, orderTotal);

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  });
};

// Send shipping notification email
const sendShippingNotificationEmail = async (email, userName, orderNumber, trackingInfo) => {
  const template = emailTemplates.shippingNotification(userName, orderNumber, trackingInfo);

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  });
};

// Send delivery notification email
const sendDeliveryNotificationEmail = async (email, userName, orderNumber, deliveredAt) => {
  const template = emailTemplates.deliveryNotification(userName, orderNumber, deliveredAt);

  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
  sendDeliveryNotificationEmail,
  emailTemplates
};