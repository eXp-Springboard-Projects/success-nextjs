import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const defaultAutomations = [
  {
    name: 'Welcome Series',
    description: 'Send a series of welcome emails to new subscribers',
    trigger: {
      type: 'contact_created',
      filters: { source: 'signup' },
    },
    steps: [
      {
        type: 'send_email',
        config: { templateId: 'welcome-email', delay: 0 },
      },
      {
        type: 'wait',
        config: { duration: 3, unit: 'days' },
      },
      {
        type: 'send_email',
        config: { templateId: 'getting-started', delay: 0 },
      },
      {
        type: 'wait',
        config: { duration: 7, unit: 'days' },
      },
      {
        type: 'send_email',
        config: { templateId: 'tips-and-tricks', delay: 0 },
      },
      {
        type: 'add_tag',
        config: { tagName: 'Welcome Series Completed' },
      },
    ],
  },
  {
    name: 'Trial Expiring',
    description: 'Send reminders when trial is about to expire',
    trigger: {
      type: 'trial_expiring',
      filters: { daysRemaining: 3 },
    },
    steps: [
      {
        type: 'send_email',
        config: { templateId: 'trial-expiring', delay: 0 },
      },
      {
        type: 'wait',
        config: { duration: 1, unit: 'days' },
      },
      {
        type: 'if_else',
        config: {
          condition: { field: 'subscription_status', operator: 'equals', value: 'trial' },
          ifTrue: [
            {
              type: 'send_email',
              config: { templateId: 'last-chance', delay: 0 },
            },
          ],
          ifFalse: [],
        },
      },
    ],
  },
  {
    name: 'Re-engagement',
    description: 'Re-engage inactive contacts',
    trigger: {
      type: 'contact_inactive',
      filters: { daysSinceLastOpen: 30 },
    },
    steps: [
      {
        type: 'send_email',
        config: { templateId: 'we-miss-you', delay: 0 },
      },
      {
        type: 'wait',
        config: { duration: 7, unit: 'days' },
      },
      {
        type: 'if_else',
        config: {
          condition: { field: 'last_email_opened', operator: 'within_days', value: 7 },
          ifTrue: [
            {
              type: 'add_tag',
              config: { tagName: 'Re-engaged' },
            },
          ],
          ifFalse: [
            {
              type: 'remove_from_list',
              config: { listName: 'Active Subscribers' },
            },
            {
              type: 'add_to_list',
              config: { listName: 'Inactive' },
            },
          ],
        },
      },
    ],
  },
];

async function main() {
  console.log('Seeding default automations...');

  for (const automation of defaultAutomations) {
    const automationId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO automations (
        id, name, description, trigger, steps, status, created_by
      ) VALUES (
        ${automationId},
        ${automation.name},
        ${automation.description},
        ${JSON.stringify(automation.trigger)}::jsonb,
        ${JSON.stringify(automation.steps)}::jsonb,
        'draft',
        'system'
      )
      ON CONFLICT DO NOTHING
    `;

    console.log(`✓ Created automation: ${automation.name}`);
  }

  console.log('✅ Automations seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding automations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
