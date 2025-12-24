import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const { data: configs, error } = await supabase
        .from('paywall_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let config = configs;

      // Create default config if none exists
      if (!config) {
        const { data: newConfig, error: createError } = await supabase
          .from('paywall_config')
          .insert({
            id: randomUUID(),
            freeArticleLimit: 3,
            resetPeriodDays: 30,
            enablePaywall: true,
            bypassedCategories: [],
            bypassedArticles: [],
            popupTitle: "You've reached your free article limit",
            popupMessage: "Subscribe to SUCCESS+ to get unlimited access to our premium content, exclusive interviews, and member-only benefits.",
            ctaButtonText: "Subscribe Now",
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        config = newConfig;
      }

      return res.status(200).json(config);
    } catch (error) {
      console.error('Paywall config GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update config (admin only - add auth check)
  if (req.method === 'PUT') {
    try {
      const {
        freeArticleLimit,
        resetPeriodDays,
        enablePaywall,
        bypassedCategories,
        bypassedArticles,
        popupTitle,
        popupMessage,
        ctaButtonText
      } = req.body;

      const { data: existingConfig, error: fetchError } = await supabase
        .from('paywall_config')
        .select('*')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingConfig) {
        const { data: updated, error: updateError } = await supabase
          .from('paywall_config')
          .update({
            freeArticleLimit,
            resetPeriodDays,
            enablePaywall,
            bypassedCategories,
            bypassedArticles,
            popupTitle,
            popupMessage,
            ctaButtonText,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.status(200).json(updated);
      } else {
        const { data: created, error: createError } = await supabase
          .from('paywall_config')
          .insert({
            id: randomUUID(),
            freeArticleLimit,
            resetPeriodDays,
            enablePaywall,
            bypassedCategories,
            bypassedArticles,
            popupTitle,
            popupMessage,
            ctaButtonText,
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        return res.status(201).json(created);
      }
    } catch (error) {
      console.error('Paywall config PUT error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
