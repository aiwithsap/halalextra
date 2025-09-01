import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Configure the email transporter
const transporter = nodemailer.createTransport({
  // For development, we'll use a fake SMTP service
  // In production, replace with actual email service credentials
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
    pass: process.env.EMAIL_PASSWORD || 'ethereal_pass'
  }
});

// In a real application, we would use a proper email service like:
// - Amazon SES
// - Mailgun
// - SendGrid
// - etc.

/**
 * Send an email using the configured transporter
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const emailOptions = {
      from: process.env.EMAIL_FROM || 'Halal Certification <info@halalcert.org>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    // In development, log the email instead of actually sending it
    if (process.env.NODE_ENV === 'development') {
      console.log('Email would be sent:', emailOptions);
      return;
    }
    
    await transporter.sendMail(emailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
