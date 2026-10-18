import { prisma } from './lib/db/prisma';
import { DonationStatus } from './lib/enums';

async function testWrite() {
  console.log('--- DB Write Test ---');
  try {
    const user = await prisma.user.findFirst({ where: { role: 'DONOR' } });
    if (!user) {
      console.error('❌ No donor user found to test with.');
      return;
    }
    console.log(`Using user: ${user.email} (id: ${user.id})`);

    const ngo = await prisma.nGO.findFirst();
    if (!ngo) {
      console.error('❌ No NGO found.');
      return;
    }

    const cat = await prisma.clothingCategory.findFirst({ where: { ngoId: ngo.id } });
    if (!cat) {
      console.error('❌ No category found.');
      return;
    }

    console.log('Attempting to create a test donation...');
    const donation = await prisma.donation.create({
      data: {
        donationId: `TEST-${Date.now()}`,
        donorId: user.id,
        ngoId: ngo.id,
        donorName: 'Test Donor',
        donorEmail: 'test@example.com',
        totalItems: 1,
        currentStatus: DonationStatus.SUBMITTED,
        items: {
          create: {
            categoryId: cat.id,
            size: 'M',
            condition: 'GOOD',
            quantity: 1
          }
        },
        statusHistory: {
          create: {
            status: DonationStatus.SUBMITTED,
            changedBy: user.id,
            note: 'Test write'
          }
        }
      }
    });

    console.log('✅ Donation created successfully:', donation.donationId);
    
    // Cleanup
    await prisma.donationItem.deleteMany({ where: { donationId: donation.id } });
    await prisma.donationStatusHistory.deleteMany({ where: { donationId: donation.id } });
    await prisma.donation.delete({ where: { id: donation.id } });
    console.log('✅ Test donation cleaned up.');

  } catch (err: any) {
    console.error('❌ DB WRITE FAILED:', err.message);
    console.error('   Code:', err.code);
  } finally {
    await prisma.$disconnect();
  }
}

testWrite();
