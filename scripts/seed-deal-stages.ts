import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const defaultStages = [
  { name: 'Lead', order: 1, color: '#6b7280', probability: 10 },
  { name: 'Qualified', order: 2, color: '#3b82f6', probability: 25 },
  { name: 'Proposal', order: 3, color: '#eab308', probability: 50 },
  { name: 'Negotiation', order: 4, color: '#f97316', probability: 75 },
  { name: 'Closed Won', order: 5, color: '#22c55e', probability: 100 },
  { name: 'Closed Lost', order: 6, color: '#ef4444', probability: 0 },
];

async function main() {
  console.log('Seeding default deal stages...');

  for (const stage of defaultStages) {
    const stageId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO deal_stages (id, name, "order", color, probability)
      VALUES (${stageId}, ${stage.name}, ${stage.order}, ${stage.color}, ${stage.probability})
      ON CONFLICT (name) DO NOTHING
    `;

    console.log(`✓ Created stage: ${stage.name}`);
  }

  console.log('✅ Deal stages seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding deal stages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
