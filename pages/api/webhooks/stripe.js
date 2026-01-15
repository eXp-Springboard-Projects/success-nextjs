import { buffer } from 'micro';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';

const log = createLogger('StripeWebhook');

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!stripe) {
    log.error('Stripe is not configured');
    return res.status(500).json({ message: 'Stripe not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    log.error('Webhook signature verification failed', err);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        log.debug('Unhandled event type', { eventType: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    log.error('Error handling webhook', error);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;

  // Get customer details from Stripe
  const customer = await stripe.customers.retrieve(customerId);

  // Check if Member exists by Stripe customer ID or email
  const supabase = supabaseAdmin();
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .or(`stripe_customer_id.eq.${customerId},email.eq.${customer.email}`)
    .limit(1);

  let member = members?.[0] || null;

  if (!member) {
    // Create new Member (this is a new customer)

    const name = customer.name || customer.email.split('@')[0];
    const nameParts = name.split(' ');

    const { data: newMember } = await supabase
      .from('members')
      .insert({
        first_name: nameParts[0] || name,
        last_name: nameParts.slice(1).join(' ') || '',
        email: customer.email,
        phone: customer.phone || null,
        stripe_customer_id: customerId,
        membership_tier: 'SUCCESSPlus',
        membership_status: 'Active',
      })
      .select()
      .single();

    member = newMember;
  } else {
    // Update existing member
    const { data: updatedMember } = await supabase
      .from('members')
      .update({
        stripe_customer_id: customerId,
        membership_tier: 'SUCCESSPlus',
        membership_status: 'Active',
      })
      .eq('id', member.id)
      .select()
      .single();

    member = updatedMember;
  }

  // Create or update subscription record
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!existingSubscription) {
    await supabase
      .from('subscriptions')
      .insert({
        member_id: member.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status.toUpperCase(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        provider: 'stripe',
      });
  } else {
    await supabase
      .from('subscriptions')
      .update({
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status.toUpperCase(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  // Check if this member is also a platform user
  const { data: platformUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', member.email)
    .single();

  if (platformUser && !platformUser.member_id) {
    // Link platform user to member
    await supabase
      .from('users')
      .update({ member_id: member.id })
      .eq('id', platformUser.id);
    log.info('Linked platform user to member', { email: platformUser.email });
  }

  log.info('Subscription created for member', { memberId: member.id });
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  const supabase = supabaseAdmin();

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  const member = members?.[0];

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status.toUpperCase(),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update member tier based on subscription status
  const newTier = subscription.status === 'active' ? 'SUCCESSPlus' : 'Customer';
  await supabase
    .from('members')
    .update({
      membership_tier: newTier,
      membership_status: subscription.status === 'active' ? 'Active' : 'Inactive',
    })
    .eq('id', member.id);

  log.info('Subscription updated', { memberId: member.id });
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  const supabase = supabaseAdmin();

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  const member = members?.[0];

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  await supabase
    .from('subscriptions')
    .update({
      status: 'CANCELED',
      cancel_at_period_end: false,
    })
    .eq('stripe_subscription_id', subscription.id);

  // Downgrade member tier
  await supabase
    .from('members')
    .update({
      membership_tier: 'Customer',
      membership_status: 'Cancelled',
    })
    .eq('id', member.id);

  log.info('Subscription deleted', { memberId: member.id });
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const supabase = supabaseAdmin();

  const { data: members } = await supabase
    .from('members')
    .select('*, subscriptions(*)')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  const member = members?.[0];

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  // Create transaction record
  const amount = invoice.amount_paid / 100;
  await supabase
    .from('transactions')
    .insert({
      member_id: member.id,
      amount: amount,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      type: 'subscription',
      description: invoice.description || 'SUCCESS+ Subscription Payment',
      payment_method: invoice.payment_method_types?.[0] || 'card',
      provider: 'stripe',
      provider_txn_id: invoice.id,
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
      },
    });

  // Update member's total spent and lifetime value
  await supabase
    .from('members')
    .update({
      total_spent: (member.total_spent || 0) + amount,
      lifetime_value: (member.lifetime_value || 0) + amount,
    })
    .eq('id', member.id);

  // Send confirmation email
  const { sendEmail, getSubscriptionConfirmationHTML } = require('../../../lib/email');
  const fullName = `${member.first_name} ${member.last_name}`.trim();
  const plan = member.subscriptions?.[0]?.stripe_price_id || 'SUCCESS+';

  await sendEmail({
    to: member.email,
    subject: 'Payment Successful - SUCCESS+ Subscription',
    html: getSubscriptionConfirmationHTML(fullName || 'Subscriber', plan, amount.toFixed(2)),
  });

  log.info('Payment succeeded', { memberId: member.id });
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const supabase = supabaseAdmin();

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  const member = members?.[0];

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  await supabase
    .from('subscriptions')
    .update({
      status: 'PAST_DUE',
    })
    .eq('stripe_subscription_id', invoice.subscription);

  // Update member status
  await supabase
    .from('members')
    .update({
      membership_status: 'Inactive',
    })
    .eq('id', member.id);

  // Create failed transaction record
  const amount = invoice.amount_due / 100;
  await supabase
    .from('transactions')
    .insert({
      member_id: member.id,
      amount: amount,
      currency: invoice.currency.toUpperCase(),
      status: 'failed',
      type: 'subscription',
      description: 'Failed subscription payment',
      provider: 'stripe',
      provider_txn_id: invoice.id,
    });

  // Send payment failed email
  const { sendEmail, getPaymentFailedHTML } = require('../../../lib/email');
  const fullName = `${member.first_name} ${member.last_name}`.trim();

  await sendEmail({
    to: member.email,
    subject: 'Payment Failed - Action Required',
    html: getPaymentFailedHTML(fullName || 'Subscriber'),
  });

  log.info('Payment failed', { memberId: member.id });
}

// Handle checkout session completed (for product purchases)
async function handleCheckoutCompleted(session) {
  const supabase = supabaseAdmin();

  // Check if this is a product purchase (not subscription)
  if (session.mode === 'payment' && session.metadata?.orderType === 'store_purchase') {
    try {
      // Update order status in database
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'PAID',
          stripe_payment_intent: session.payment_intent,
          payment_status: session.payment_status,
          customer_email: session.customer_details?.email || session.customer_email,
          customer_name: session.customer_details?.name,
          shipping_address: session.shipping_details?.address || session.shipping || null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id)
        .select()
        .single();

      if (error) {
        log.error('Error updating order', { error, sessionId: session.id });
        return;
      }

      if (!order) {
        log.error('Order not found for session', { sessionId: session.id });
        return;
      }

      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      // Create transaction record
      const amount = session.amount_total / 100;
      await supabase.from('transactions').insert({
        member_id: order.user_id,
        amount: amount,
        currency: session.currency.toUpperCase(),
        status: 'succeeded',
        type: 'product_purchase',
        description: `Store purchase - Order #${order.id}`,
        payment_method: session.payment_method_types?.[0] || 'card',
        provider: 'stripe',
        provider_txn_id: session.payment_intent,
        metadata: {
          orderId: order.id,
          sessionId: session.id,
          itemCount: orderItems?.length || 0,
        },
      });

      // Update user's total spent if they have an account
      if (order.user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('id', order.user_id)
          .single();

        if (user) {
          await supabase.rpc('increment_user_spent', {
            user_id: order.user_id,
            amount: amount,
          }).catch(() => {
            // If RPC doesn't exist, update directly
            supabase
              .from('users')
              .select('total_spent')
              .eq('id', order.user_id)
              .single()
              .then(({ data }) => {
                const currentSpent = data?.total_spent || 0;
                return supabase
                  .from('users')
                  .update({ total_spent: currentSpent + amount })
                  .eq('id', order.user_id);
              });
          });
        }
      }

      // Send confirmation email
      const { sendEmail, getOrderConfirmationHTML } = require('../../../lib/email');
      const customerName = session.customer_details?.name || order.customer_name || 'Valued Customer';
      const customerEmail = session.customer_details?.email || order.customer_email;

      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmation - SUCCESS Store #${order.id}`,
          html: getOrderConfirmationHTML(customerName, order, orderItems),
        }).catch((err) => {
          log.error('Failed to send order confirmation email', { error: err, orderId: order.id });
        });
      }

      log.info('Product purchase completed', { orderId: order.id, amount });
    } catch (error) {
      log.error('Error handling checkout completion', { error, sessionId: session.id });
    }
  }
}
