import { NextApiRequest } from 'next';
import { prisma } from './prisma';

export interface AuditLogData {
  userId?: string;
  userEmail: string;
  userName?: string;
  action: string; // "user.created", "transaction.refunded", "content.published"
  entityType: string; // "User", "Transaction", "Member", "Post"
  entityId?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
}

/**
 * Audit Logger - Track every action for compliance
 *
 * @example
 * await auditLog({
 *   userId: session.user.id,
 *   userEmail: session.user.email,
 *   action: 'user.updated',
 *   entityType: 'User',
 *   entityId: userId,
 *   changes: { before: oldUser, after: newUser }
 * }, req);
 */
export async function auditLog(
  data: AuditLogData,
  req?: NextApiRequest
): Promise<void> {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        (req.headers['x-real-ip'] as string) ||
        (req.socket.remoteAddress as string)
      : undefined;

    const userAgent = req?.headers['user-agent'];
    const requestUrl = req?.url;
    const method = req?.method;

    await prisma.audit_logs.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : undefined,
        ipAddress,
        userAgent,
        requestUrl,
        method,
        metadata: data.metadata,
      },
    });

    // Also create system alert for critical actions
    if (isCriticalAction(data.action)) {
      await createSystemAlert({
        type: 'Info',
        category: getAlertCategory(data.action),
        title: `Critical Action: ${data.action}`,
        message: `${data.userName || data.userEmail} performed ${data.action} on ${data.entityType} ${data.entityId || ''}`,
        severity: 3,
        metadata: {
          auditLog: data,
        },
      });
    }
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
  }
}

/**
 * Create a system alert
 */
export async function createSystemAlert(data: {
  type: 'Error' | 'Warning' | 'Info' | 'Critical' | 'Success';
  category: 'Security' | 'Payment' | 'System' | 'Content' | 'CustomerService' | 'Integration' | 'Performance' | 'Compliance';
  title: string;
  message: string;
  severity: number; // 1-5
  assignedTo?: string;
  assignedToEmail?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.system_alerts.create({
      data: {
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        severity: data.severity,
        assignedTo: data.assignedTo,
        assignedToEmail: data.assignedToEmail,
        stackTrace: data.stackTrace,
        metadata: data.metadata,
        errorCount: 1,
      },
    });
  } catch (error) {
  }
}

/**
 * Create a user notification
 */
export async function createNotification(data: {
  userId: string;
  type: 'TASK_ASSIGNED' | 'MENTION' | 'PAYMENT_FAILED' | 'SLA_BREACH' | 'SYSTEM_ERROR' | 'APPROVAL_NEEDED' | 'COMMENT_REPLY' | 'REPORT_READY';
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: Record<string, any>;
  expiresAt?: Date;
}): Promise<void> {
  try {
    await prisma.notifications.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        icon: data.icon,
        priority: data.priority || 'NORMAL',
        metadata: data.metadata,
        expiresAt: data.expiresAt,
      },
    });
  } catch (error) {
  }
}

/**
 * Log webhook delivery
 */
export async function logWebhook(data: {
  provider: string;
  eventType: string;
  eventId?: string;
  payload: any;
  headers?: any;
  status: 'Success' | 'Failed' | 'Pending' | 'Retrying';
  attempts?: number;
  errorMessage?: string;
  responseCode?: number;
  responseBody?: string;
}): Promise<string> {
  try {
    const log = await prisma.webhook_logs.create({
      data: {
        provider: data.provider,
        eventType: data.eventType,
        eventId: data.eventId,
        payload: data.payload,
        headers: data.headers,
        status: data.status,
        attempts: data.attempts || 0,
        errorMessage: data.errorMessage,
        responseCode: data.responseCode,
        responseBody: data.responseBody,
        processedAt: data.status === 'Success' ? new Date() : undefined,
      },
    });

    return log.id;
  } catch (error) {
    throw error;
  }
}

/**
 * Log an error for tracking
 */
export async function logError(data: {
  errorType: string;
  message: string;
  stackTrace?: string;
  userId?: string;
  userEmail?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    // Check if this error already exists
    const existingError = await prisma.error_logs.findFirst({
      where: {
        errorType: data.errorType,
        message: data.message,
        isResolved: false,
      },
    });

    if (existingError) {
      // Increment occurrence count
      await prisma.error_logs.update({
        where: { id: existingError.id },
        data: {
          occurrences: { increment: 1 },
          lastSeen: new Date(),
        },
      });
    } else {
      // Create new error log
      await prisma.error_logs.create({
        data: {
          errorType: data.errorType,
          message: data.message,
          stackTrace: data.stackTrace,
          userId: data.userId,
          userEmail: data.userEmail,
          url: data.url,
          method: data.method,
          statusCode: data.statusCode,
          severity: data.severity,
          metadata: data.metadata,
          occurrences: 1,
        },
      });

      // Create system alert for critical errors
      if (data.severity === 'critical' || data.severity === 'high') {
        await createSystemAlert({
          type: data.severity === 'critical' ? 'Critical' : 'Error',
          category: 'System',
          title: `${data.errorType}: ${data.message}`,
          message: data.message,
          severity: data.severity === 'critical' ? 5 : 4,
          stackTrace: data.stackTrace,
          metadata: data.metadata,
        });
      }
    }
  } catch (error) {
  }
}

/**
 * Record system metrics
 */
export async function recordMetric(
  metricType: string,
  value: number,
  unit: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.system_metrics.create({
      data: {
        metricType,
        value,
        unit,
        metadata,
      },
    });
  } catch (error) {
  }
}

// Helper functions
function isCriticalAction(action: string): boolean {
  const criticalActions = [
    'user.deleted',
    'member.deleted',
    'transaction.refunded',
    'subscription.cancelled',
    'gdpr.data_deleted',
    'security.password_reset',
    'security.2fa_disabled',
    'api_key.created',
    'api_key.revoked',
    'backup.restored',
  ];
  return criticalActions.includes(action);
}

function getAlertCategory(action: string): any {
  if (action.startsWith('security.')) return 'Security';
  if (action.startsWith('payment.') || action.startsWith('transaction.')) return 'Payment';
  if (action.startsWith('content.')) return 'Content';
  if (action.startsWith('gdpr.')) return 'Compliance';
  return 'System';
}

/**
 * Middleware wrapper for automatic audit logging
 *
 * @example
 * export default withAudit(async (req, res) => {
 *   // Your handler
 * }, 'user.updated', 'User');
 */
export function withAudit(
  handler: (req: NextApiRequest, res: any) => Promise<any>,
  action: string,
  entityType: string
) {
  return async (req: NextApiRequest, res: any) => {
    const startTime = Date.now();
    let statusCode = 200;
    let entityId: string | undefined;

    try {
      const result = await handler(req, res);

      // Try to extract entity ID from response or request
      entityId = req.query.id as string || result?.id;

      return result;
    } catch (error: any) {
      statusCode = error.statusCode || 500;
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Get session info if available
      const session = (req as any).session;
      if (session?.user) {
        await auditLog(
          {
            userId: session.user.id,
            userEmail: session.user.email,
            userName: session.user.name,
            action,
            entityType,
            entityId,
            metadata: {
              duration,
              statusCode,
            },
          },
          req
        );
      }
    }
  };
}
