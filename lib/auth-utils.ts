import { supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a secure invite code
 * Format: SUCCESS-XXXX-XXXX-XXXX
 */
export function generateInviteCode(): string {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `SUCCESS-${segments.join('-')}`;
}

/**
 * Create an invite code for staff registration
 */
export async function createInviteCode({
  email,
  role = 'EDITOR',
  createdBy,
  expiresInDays = 7,
  maxUses = 1,
}: {
  email?: string;
  role?: 'EDITOR' | 'AUTHOR' | 'ADMIN' | 'SUPER_ADMIN';
  createdBy: string;
  expiresInDays?: number;
  maxUses?: number;
}) {
  const code = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const supabase = supabaseAdmin();

  const { data: invite, error } = await supabase.from('invite_codes').insert({
    id: uuidv4(),
    code,
    email,
    role,
    createdBy,
    expiresAt: expiresAt.toISOString(),
    maxUses,
    uses: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  }).select().single();

  if (error) throw error;
  return invite;
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(code: string, email?: string) {
  const supabase = supabaseAdmin();

  const { data: invite, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !invite) {
    return { valid: false, error: 'Invalid invite code' };
  }

  if (!invite.isActive) {
    return { valid: false, error: 'This invite code has been deactivated' };
  }

  if (invite.uses >= invite.maxUses) {
    return { valid: false, error: 'This invite code has already been used' };
  }

  if (new Date() > new Date(invite.expiresAt)) {
    return { valid: false, error: 'This invite code has expired' };
  }

  // If invite is email-specific, verify email matches
  if (invite.email && email && invite.email !== email) {
    return { valid: false, error: 'This invite code is for a different email address' };
  }

  return { valid: true, invite };
}

/**
 * Mark invite code as used
 */
export async function markInviteCodeAsUsed(code: string, userId: string) {
  const supabase = supabaseAdmin();

  const { data: invite, error } = await supabase
    .from('invite_codes')
    .select('uses, maxUses')
    .eq('code', code)
    .single();

  if (error || !invite) {
    throw new Error('Invite code not found');
  }

  await supabase
    .from('invite_codes')
    .update({
      uses: invite.uses + 1,
      usedBy: userId,
      usedAt: new Date().toISOString(),
      isActive: invite.uses + 1 >= invite.maxUses ? false : true,
    })
    .eq('code', code);
}

/**
 * Generate password reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create password reset token for user
 */
export async function createPasswordResetToken(email: string) {
  const supabase = supabaseAdmin();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  const resetToken = generateResetToken();
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

  await supabase
    .from('users')
    .update({
      resetToken,
      resetTokenExpiry: resetTokenExpiry.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('email', email);

  return { resetToken, user };
}

/**
 * Validate password reset token
 */
export async function validateResetToken(token: string) {
  const supabase = supabaseAdmin();

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('resetToken', token)
    .gt('resetTokenExpiry', new Date().toISOString())
    .limit(1);

  if (error || !users || users.length === 0) {
    return { valid: false, error: 'Invalid or expired reset token' };
  }

  return { valid: true, user: users[0] };
}

/**
 * Check if password reset is required (first login)
 */
export async function requiresPasswordChange(userId: string): Promise<boolean> {
  const supabase = supabaseAdmin();

  const { data: user, error } = await supabase
    .from('users')
    .select('hasChangedDefaultPassword')
    .eq('id', userId)
    .single();

  return user && !error ? !user.hasChangedDefaultPassword : false;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string) {
  const supabase = supabaseAdmin();

  await supabase
    .from('users')
    .update({
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId);
}
