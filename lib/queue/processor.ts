// Job Queue Processor
// Processes background jobs from the job_queue table
// Run this as a cron job or scheduled task

import { supabaseAdmin } from '../supabase';

interface Job {
  id: string;
  jobType: string;
  jobData: any;
  priority: number;
  maxRetries: number;
  retryCount: number;
  scheduledFor: string;
}

export class JobQueueProcessor {
  private isProcessing = false;
  private batchSize = 10;

  async start() {
    if (this.isProcessing) {
      console.log('[JobQueue] Already processing...');
      return;
    }

    console.log('[JobQueue] Starting job processor...');
    this.isProcessing = true;

    try {
      await this.processJobs();
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJobs() {
    const supabase = supabaseAdmin();

    // Fetch pending jobs (ordered by priority and scheduled time)
    const { data: jobs, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduledFor', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduledFor', { ascending: true })
      .limit(this.batchSize);

    if (error) {
      console.error('[JobQueue] Error fetching jobs:', error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('[JobQueue] No pending jobs');
      return;
    }

    console.log(`[JobQueue] Processing ${jobs.length} jobs...`);

    // Process each job
    for (const job of jobs as Job[]) {
      await this.processJob(job);
    }
  }

  private async processJob(job: Job) {
    const supabase = supabaseAdmin();
    const startTime = Date.now();

    try {
      // Mark as processing
      await supabase
        .from('job_queue')
        .update({
          status: 'processing',
          startedAt: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log(`[JobQueue] Processing job ${job.id} (${job.jobType})`);

      // Execute job based on type
      await this.executeJob(job);

      // Mark as completed
      const processingTime = Date.now() - startTime;
      await supabase
        .from('job_queue')
        .update({
          status: 'completed',
          completedAt: new Date().toISOString(),
          processingTime,
        })
        .eq('id', job.id);

      console.log(`[JobQueue] ✓ Job ${job.id} completed in ${processingTime}ms`);
    } catch (error: any) {
      console.error(`[JobQueue] ✗ Job ${job.id} failed:`, error);

      // Check if we should retry
      if (job.retryCount < job.maxRetries) {
        const retryCount = job.retryCount + 1;
        const retryDelay = Math.pow(2, retryCount) * 60 * 1000; // Exponential backoff

        await supabase
          .from('job_queue')
          .update({
            status: 'pending',
            retryCount,
            error: error.message,
            scheduledFor: new Date(Date.now() + retryDelay).toISOString(),
          })
          .eq('id', job.id);

        console.log(`[JobQueue] Job ${job.id} scheduled for retry ${retryCount}/${job.maxRetries}`);
      } else {
        // Max retries reached, mark as failed
        await supabase
          .from('job_queue')
          .update({
            status: 'failed',
            error: error.message,
            completedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime,
          })
          .eq('id', job.id);

        console.log(`[JobQueue] Job ${job.id} failed permanently after ${job.maxRetries} retries`);
      }
    }
  }

  private async executeJob(job: Job) {
    switch (job.jobType) {
      case 'wordpress_sync':
        await this.handleWordPressSync(job);
        break;

      case 'email_send':
        await this.handleEmailSend(job);
        break;

      case 'sms_send':
        await this.handleSmsSend(job);
        break;

      case 'webhook_retry':
        await this.handleWebhookRetry(job);
        break;

      case 'data_migration':
        await this.handleDataMigration(job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.jobType}`);
    }
  }

  private async handleWordPressSync(job: Job) {
    const { contactId, action, dealId } = job.jobData;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (action === 'create_or_update_user') {
      // Call our WordPress sync API
      const response = await fetch(`${baseUrl}/api/sync/wordpress/update-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use system auth token for background jobs
          Authorization: `Bearer ${process.env.SYSTEM_API_TOKEN}`,
        },
        body: JSON.stringify({ contactId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`WordPress sync failed: ${error.message}`);
      }
    }
  }

  private async handleEmailSend(job: Job) {
    const { to, template, data } = job.jobData;

    // Call email sending service
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SYSTEM_API_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        template,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  private async handleSmsSend(job: Job) {
    const { to, message, contactId } = job.jobData;

    // Call SMS sending service
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SYSTEM_API_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        message,
        contactId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`SMS send failed: ${error.message}`);
    }
  }

  private async handleWebhookRetry(job: Job) {
    const { url, payload, method = 'POST' } = job.jobData;

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
  }

  private async handleDataMigration(job: Job) {
    // Handle data migration jobs
    const { migrationType, params } = job.jobData;

    switch (migrationType) {
      case 'email_preferences_migration':
        // Migrate old email preferences to new structure
        break;

      case 'contact_properties_migration':
        // Migrate HubSpot contact properties
        break;

      default:
        throw new Error(`Unknown migration type: ${migrationType}`);
    }
  }
}

// Export singleton instance
export const jobQueueProcessor = new JobQueueProcessor();

// If running as a standalone script
if (require.main === module) {
  console.log('[JobQueue] Starting job queue processor...');

  // Process jobs every 30 seconds
  setInterval(async () => {
    try {
      await jobQueueProcessor.start();
    } catch (error) {
      console.error('[JobQueue] Error processing jobs:', error);
    }
  }, 30000);

  // Process immediately on start
  jobQueueProcessor.start();
}
