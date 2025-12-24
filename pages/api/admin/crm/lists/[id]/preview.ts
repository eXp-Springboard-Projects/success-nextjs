import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';

function buildSupabaseQuery(supabase: any, filters: any) {
  if (!filters || !filters.conditions || filters.conditions.length === 0) {
    return supabase.from('contacts').select('*', { count: 'exact', head: true });
  }

  let query = supabase.from('contacts').select('*', { count: 'exact', head: true });

  // Build filter conditions
  filters.conditions.forEach((condition: any) => {
    const { field, operator, value } = condition;

    switch (field) {
      case 'status':
        if (operator === 'equals') {
          query = query.eq('status', value);
        } else if (operator === 'not_equals') {
          query = query.neq('status', value);
        }
        break;

      case 'tags':
        if (operator === 'contains') {
          query = query.contains('tags', [value]);
        } else if (operator === 'not_contains') {
          query = query.not('tags', 'cs', `{${value}}`);
        } else if (operator === 'is_empty') {
          query = query.or('tags.is.null,tags.eq.{}');
        } else if (operator === 'is_not_empty') {
          query = query.not('tags', 'is', null).not('tags', 'eq', '{}');
        }
        break;

      case 'source':
        if (operator === 'equals') {
          query = query.eq('source', value);
        } else if (operator === 'not_equals') {
          query = query.neq('source', value);
        } else if (operator === 'contains') {
          query = query.ilike('source', `%${value}%`);
        } else if (operator === 'is_empty') {
          query = query.is('source', null);
        } else if (operator === 'is_not_empty') {
          query = query.not('source', 'is', null);
        }
        break;

      case 'emailEngagementScore':
        const score = parseInt(value, 10);
        if (operator === 'greater_than') {
          query = query.gt('emailEngagementScore', score);
        } else if (operator === 'less_than') {
          query = query.lt('emailEngagementScore', score);
        } else if (operator === 'equals') {
          query = query.eq('emailEngagementScore', score);
        }
        break;

      case 'lastContactedAt':
        if (operator === 'in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          query = query.gte('lastContactedAt', date.toISOString());
        } else if (operator === 'not_in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          query = query.lt('lastContactedAt', date.toISOString());
        } else if (operator === 'is_empty') {
          query = query.is('lastContactedAt', null);
        } else if (operator === 'is_not_empty') {
          query = query.not('lastContactedAt', 'is', null);
        }
        break;

      case 'createdAt':
        if (operator === 'in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          query = query.gte('createdAt', date.toISOString());
        } else if (operator === 'not_in_last_days') {
          const days = parseInt(value, 10);
          const date = new Date();
          date.setDate(date.getDate() - days);
          query = query.lt('createdAt', date.toISOString());
        } else if (operator === 'before_date') {
          query = query.lt('createdAt', new Date(value).toISOString());
        } else if (operator === 'after_date') {
          query = query.gt('createdAt', new Date(value).toISOString());
        }
        break;
    }
  });

  return query;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid list ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data: list, error: listError } = await supabase
        .from('contact_lists')
        .select('type, filters')
        .eq('id', id)
        .single();

      if (listError || !list) {
        return res.status(404).json({ error: 'List not found' });
      }

      if (list.type !== 'DYNAMIC' || !list.filters) {
        return res.status(400).json({ error: 'List is not a dynamic segment' });
      }

      const query = buildSupabaseQuery(supabase, list.filters);
      const { count, error } = await query;

      if (error) throw error;

      return res.status(200).json({ count: count || 0 });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to preview list' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
