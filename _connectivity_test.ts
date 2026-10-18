import { prisma } from './lib/db/prisma';
import { getEmailProvider, isEmailConfigured } from './lib/core/email';

async function testConnectivity() {
  console.log('--- Connectivity Check ---');
  
  // 1. Database Check
  try {
    console.log('1. Testing DB connection (prisma)...');
    const start = Date.now();
    const count = await prisma.donation.count();
    const end = Date.now();
    console.log(`✅ DB Connected. Total donations: ${count} (took ${end - start}ms)`);
  } catch (err: any) {
    console.error('❌ DB CONNECTION FAILED:', err.message);
    if (err.code) console.error('   Code:', err.code);
  }

  // 2. Email Check
  try {
    console.log('2. Testing Email configuration...');
    const configured = isEmailConfigured();
    console.log(`   Configured: ${configured}`);
    
    if (configured) {
      const provider = getEmailProvider();
      console.log(`   Provider: ${provider.name}`);
      console.log('   Attempting to send a test email to manager...');
      
      const managerEmail = process.env.MANAGER_EMAIL || 'tanishqgames203@gmail.com';
      await provider.send({
        to: managerEmail,
        subject: 'REWEAR Connectivity Test',
        html: '<p>If you see this, your email configuration is working correctly.</p>'
      });
      console.log(`✅ Test email sent successfully to ${managerEmail}`);
    } else {
      console.log('   ℹ️ Email not configured, running in LOG mode.');
    }
  } catch (err: any) {
    console.error('❌ EMAIL SENDING FAILED:', err.message);
  }

  await prisma.$disconnect();
  console.log('--- Check Finished ---');
}

testConnectivity();
