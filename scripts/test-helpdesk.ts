/**
 * Test Help Desk / Ticketing System
 */


import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function testHelpDesk() {
  console.log('🎫 Testing Help Desk / Ticketing System\n');

  try {
    // Test 1: Create a test ticket
    console.log('📝 Test 1: Creating test ticket...');

    // Get or create a test contact
    const testContact = await prisma.contacts.upsert({
      where: { email: 'rachel.nead@exprealty.net' },
      update: {},
      create: {
        id: nanoid(),
        email: 'rachel.nead@exprealty.net',
        firstName: 'Rachel',
        lastName: 'Nead',
        status: 'ACTIVE',
        source: 'HELPDESK_TEST',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const ticket = await prisma.tickets.create({
      data: {
        id: nanoid(),
        contactId: testContact.id,
        subject: 'Test Support Ticket - CRM System',
        description: 'This is a test ticket to verify the help desk system is working properly.',
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'TECHNICAL',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Ticket created successfully:');
    console.log(`   ID: ${ticket.id}`);
    console.log(`   Subject: ${ticket.subject}`);
    console.log(`   Status: ${ticket.status}`);
    console.log(`   Priority: ${ticket.priority}\n`);

    // Test 2: Add a message to the ticket
    console.log('💬 Test 2: Adding message to ticket...');

    const message = await prisma.ticket_messages.create({
      data: {
        id: nanoid(),
        ticketId: ticket.id,
        message: 'Thank you for contacting support. We are reviewing your request.',
        isStaffReply: true,
        createdAt: new Date(),
      },
    });

    console.log('✅ Message added successfully:');
    console.log(`   Message ID: ${message.id}`);
    console.log(`   Content: ${message.message}\n`);

    // Test 3: Query tickets
    console.log('🔍 Test 3: Querying tickets...');

    const openTickets = await prisma.tickets.findMany({
      where: {
        status: 'OPEN',
      },
      include: {
        contacts: true,
        ticket_messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      take: 5,
    });

    console.log(`✅ Found ${openTickets.length} open ticket(s)\n`);

    // Test 4: Update ticket status
    console.log('🔄 Test 4: Updating ticket status...');

    const updatedTicket = await prisma.tickets.update({
      where: { id: ticket.id },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Ticket status updated:');
    console.log(`   Status: ${updatedTicket.status}\n`);

    // Test 5: Get ticket stats
    console.log('📊 Test 5: Getting ticket statistics...');

    const ticketStats = await prisma.tickets.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log('✅ Ticket Statistics:');
    ticketStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id} ticket(s)`);
    });
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Help Desk System Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Create ticket: PASSED');
    console.log('✓ Add message: PASSED');
    console.log('✓ Query tickets: PASSED');
    console.log('✓ Update status: PASSED');
    console.log('✓ Get statistics: PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎫 Help Desk System: ✅ FULLY FUNCTIONAL\n');

  } catch (error) {
    console.error('❌ Error testing help desk:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testHelpDesk();
