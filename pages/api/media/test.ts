import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    // Test Supabase connection
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase error',
        message: error.message,
        details: error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase connected successfully',
      bucketsCount: buckets?.length || 0,
      buckets: buckets?.map(b => b.name),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Exception caught',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
