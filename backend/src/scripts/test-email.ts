import dotenv from 'dotenv';
import path from 'path';
import { EmailService } from '../services/email.service';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT || '587';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const fromEmail = process.env.EMAIL_FROM || '"PhimHub" <noreply@phimhub.com>';

  console.log('📋 Email Configuration:');
  console.log(`   Host: ${host || '❌ NOT SET'}`);
  console.log(`   Port: ${port}`);
  console.log(`   User: ${user ? `${user.substring(0, 3)}***` : '❌ NOT SET'}`);
  console.log(`   Password: ${pass ? '✅ SET (hidden)' : '❌ NOT SET'}`);
  console.log(`   From: ${fromEmail}`);
  console.log('');

  // Check if all required variables are set
  if (!host || !user || !pass) {
    console.error('❌ Email configuration is incomplete!');
    console.error('Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file');
    process.exit(1);
  }

  // Test SMTP connection
  console.log('🔌 Testing SMTP Connection...');
  try {
    const isConnected = await EmailService.verifyConnection();
    if (isConnected) {
      console.log('✅ SMTP connection verified successfully!\n');
    } else {
      console.error('❌ SMTP connection verification failed\n');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ SMTP connection error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response:', error.response);
    console.error('\n💡 Tips:');
    console.error('   - For Gmail: Use App Password (not your account password)');
    console.error('   - Make sure 2-Step Verification is enabled');
    console.error('   - Check that EMAIL_HOST, EMAIL_PORT are correct');
    process.exit(1);
  }

  // Test sending email
  const testEmail = process.argv[2] || user; // Use first argument or EMAIL_USER as test recipient
  console.log(`📧 Testing email send to: ${testEmail}`);
  console.log('   (This will send a test email...)');

  try {
    const resetToken = await EmailService.sendPasswordResetEmail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`   Reset token generated: ${resetToken.substring(0, 8)}...`);
    console.log('\n✅ Email service is working correctly!');
  } catch (error: any) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('\n💡 Common issues:');
    console.error('   1. Gmail requires App Password (not account password)');
    console.error('   2. Check EMAIL_USER and EMAIL_PASS are correct');
    console.error('   3. Verify EMAIL_HOST and EMAIL_PORT match your provider');
    process.exit(1);
  }
}

testEmail().catch(console.error);

