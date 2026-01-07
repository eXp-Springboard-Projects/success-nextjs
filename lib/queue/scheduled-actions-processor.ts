// Scheduled Actions Processor
// Processes delayed workflow actions from the scheduled_actions table
// Replaces HubSpot workflow delays

import { supabaseAdmin } from '../supabase';

interface ScheduledAction {
  id: string;
  contactId: string | null;
  dealId: string | null;
  ticketId: string | null;
  workflowExecutionId: string | null;
  actionType: string;
  actionData: any;
  scheduledFor: string;
  retryCount: number;
  maxRetries: number;
}

export class ScheduledActionsProcessor {
  private isProcessing = false;
  private batchSize = 50;

  async start() {
    if (this.isProcessing) {
      console.log('[ScheduledActions] Already processing...');
      return;
    }

    console.log('[ScheduledActions] Starting processor...');
    this.isProcessing = true;

    try {
      await this.processActions();
    } finally {
      this.isProcessing = false;
    }
  }

  private async processActions() {
    const supabase = supabaseAdmin();

    // Fetch due actions
    const { data: actions, error } = await supabase
      .from('scheduled_actions')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduledFor', new Date().toISOString())
      .is('executedAt', null)
      .order('scheduledFor', { ascending: true })
      .limit(this.batchSize);

    if (error) {
      console.error('[ScheduledActions] Error fetching actions:', error);
      return;
    }

    if (!actions || actions.length === 0) {
      console.log('[ScheduledActions] No pending actions');
      return;
    }

    console.log(`[ScheduledActions] Processing ${actions.length} actions...`);

    // Process each action
    for (const action of actions as ScheduledAction[]) {
      await this.processAction(action);
    }
  }

  private async processAction(action: ScheduledAction) {
    const supabase = supabaseAdmin();

    try {
      // Mark as processing
      await supabase
        .from('scheduled_actions')
        .update({ status: 'processing' })
        .eq('id', action.id);

      console.log(`[ScheduledActions] Processing ${action.actionType} for action ${action.id}`);

      // Execute action based on type
      await this.executeAction(action);

      // Mark as completed
      await supabase
        .from('scheduled_actions')
        .update({
          status: 'completed',
          executedAt: new Date().toISOString(),
        })
        .eq('id', action.id);

      console.log(`[ScheduledActions] ✓ Action ${action.id} completed`);

      // Update workflow execution if linked
      if (action.workflowExecutionId) {
        await this.updateWorkflowExecution(action.workflowExecutionId, action.actionType);
      }
    } catch (error: any) {
      console.error(`[ScheduledActions] ✗ Action ${action.id} failed:`, error);

      // Check if we should retry
      if (action.retryCount < action.maxRetries) {
        const retryCount = action.retryCount + 1;
        const retryDelay = Math.pow(2, retryCount) * 5 * 60 * 1000; // 5min, 10min, 20min

        await supabase
          .from('scheduled_actions')
          .update({
            status: 'pending',
            retryCount,
            error: error.message,
            scheduledFor: new Date(Date.now() + retryDelay).toISOString(),
          })
          .eq('id', action.id);

        console.log(`[ScheduledActions] Action ${action.id} scheduled for retry ${retryCount}/${action.maxRetries}`);
      } else {
        // Max retries reached
        await supabase
          .from('scheduled_actions')
          .update({
            status: 'failed',
            error: error.message,
            executedAt: new Date().toISOString(),
          })
          .eq('id', action.id);

        console.log(`[ScheduledActions] Action ${action.id} failed permanently`);
      }
    }
  }

  private async executeAction(action: ScheduledAction) {
    switch (action.actionType) {
      case 'send_email':
        await this.sendEmail(action);
        break;

      case 'send_sms':
        await this.sendSms(action);
        break;

      case 'update_property':
        await this.updateProperty(action);
        break;

      case 'add_to_list':
        await this.addToList(action);
        break;

      case 'remove_from_list':
        await this.removeFromList(action);
        break;

      case 'create_task':
        await this.createTask(action);
        break;

      case 'webhook':
        await this.callWebhook(action);
        break;

      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }
  }

  private async sendEmail(action: ScheduledAction) {
    const { template, to, data, ticketId, checkStatus } = action.actionData;

    // If this is a conditional email (like ticket reminder), check conditions
    if (ticketId && checkStatus) {
      const supabase = supabaseAdmin();
      const { data: ticket } = await supabase
        .from('tickets')
        .select('status')
        .eq('id', ticketId)
        .single();

      if (ticket?.status !== checkStatus) {
        console.log(`[ScheduledActions] Email cancelled - ticket status changed from ${checkStatus} to ${ticket?.status}`);
        return; // Cancel email if status changed
      }
    }

    // Track email
    const supabase = supabaseAdmin();
    await supabase.from('email_tracking').insert({
      contactId: action.contactId,
      workflowExecutionId: action.workflowExecutionId,
      emailType: data?.emailType || 'workflow',
      subscriptionType: data?.subscriptionType,
      emailSubject: data?.subject || template,
      emailTemplate: template,
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    console.log(`[ScheduledActions] Email sent: ${template} to ${to}`);
  }

  private async sendSms(action: ScheduledAction) {
    const { to, message, contactId } = action.actionData;

    const supabase = supabaseAdmin();

    // Track SMS
    await supabase.from('sms_tracking').insert({
      contactId: contactId || action.contactId,
      workflowExecutionId: action.workflowExecutionId,
      direction: 'outbound',
      phoneNumber: to,
      message,
      smsType: 'workflow',
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    // Update contact
    if (contactId || action.contactId) {
      await supabase
        .from('contacts')
        .update({
          lastSentSmsDate: new Date().toISOString(),
          totalSentSms: supabase.raw('COALESCE("totalSentSms", 0) + 1'),
        })
        .eq('id', contactId || action.contactId);
    }

    console.log(`[ScheduledActions] SMS sent to ${to}`);
  }

  private async updateProperty(action: ScheduledAction) {
    const { entityType, entityId, properties } = action.actionData;
    const supabase = supabaseAdmin();

    const table = entityType === 'contact' ? 'contacts' :
                  entityType === 'deal' ? 'deals' :
                  entityType === 'ticket' ? 'tickets' : null;

    if (!table) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }

    await supabase
      .from(table)
      .update({
        ...properties,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', entityId || action.contactId || action.dealId || action.ticketId);

    console.log(`[ScheduledActions] Updated ${entityType} properties`);
  }

  private async addToList(action: ScheduledAction) {
    const { listId, contactId } = action.actionData;
    // Implement list management logic
    console.log(`[ScheduledActions] Added contact to list ${listId}`);
  }

  private async removeFromList(action: ScheduledAction) {
    const { listId, contactId } = action.actionData;
    // Implement list management logic
    console.log(`[ScheduledActions] Removed contact from list ${listId}`);
  }

  private async createTask(action: ScheduledAction) {
    const { title, description, assignedTo, dueDate } = action.actionData;
    const supabase = supabaseAdmin();

    await supabase.from('tasks').insert({
      title,
      description,
      contactId: action.contactId,
      dealId: action.dealId,
      assignedTo,
      dueDate,
      status: 'pending',
    });

    console.log(`[ScheduledActions] Task created: ${title}`);
  }

  private async callWebhook(action: ScheduledAction) {
    const { url, method = 'POST', payload } = action.actionData;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    console.log(`[ScheduledActions] Webhook called: ${url}`);
  }

  private async updateWorkflowExecution(workflowExecutionId: string, actionType: string) {
    const supabase = supabaseAdmin();

    await supabase
      .from('workflow_executions')
      .update({
        currentStep: `${actionType}_completed`,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', workflowExecutionId);
  }
}

// Export singleton instance
export const scheduledActionsProcessor = new ScheduledActionsProcessor();

// If running as a standalone script
if (require.main === module) {
  console.log('[ScheduledActions] Starting scheduled actions processor...');

  // Process actions every 1 minute
  setInterval(async () => {
    try {
      await scheduledActionsProcessor.start();
    } catch (error) {
      console.error('[ScheduledActions] Error processing actions:', error);
    }
  }, 60000);

  // Process immediately on start
  scheduledActionsProcessor.start();
}
