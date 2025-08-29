import { MailerService } from './src/mailer/mailer.service';

async function testEmail() {
  console.log('🧪 Testing SendGrid email functionality...');

  const mailer = new MailerService();

  // Wait a moment for Secret Manager initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    await mailer.sendMail({
      to: 'tahaelouali2016@gmail.com', // Replace with your test email
      subject: 'SendGrid Test - GeoDashboard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🚀 SendGrid Integration Test</h1>
          <p>If you received this email, your SendGrid setup is working perfectly!</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Test Details:</strong><br>
            • Time: ${new Date().toISOString()}<br>
            • Environment: ${process.env.NODE_ENV || 'development'}<br>
            • From: GeoDashboard System
          </div>
          <p style="color: #059669; font-weight: bold;">
            ✅ Email delivery confirmed!
          </p>
        </div>
      `
    });
    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your inbox at tahaelouali2016@gmail.com');
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    console.log('🔧 Make sure:');
    console.log('   • SENDGRID_API_KEY is set in Secret Manager');
    console.log('   • Domain geodashboard.online is authenticated in SendGrid');
    console.log('   • App Engine has proper permissions to access Secret Manager');
  }
}

testEmail();
