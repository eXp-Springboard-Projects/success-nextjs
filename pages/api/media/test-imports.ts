import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const results: any = {};

  try {
    // Test sharp import
    const sharp = await import('sharp');
    results.sharp = {
      success: true,
      version: sharp.default.versions?.sharp || 'unknown'
    };
  } catch (error) {
    results.sharp = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
  }

  try {
    // Test formidable import
    const formidable = await import('formidable');
    results.formidable = {
      success: true,
      hasFormidable: typeof formidable.default === 'function'
    };
  } catch (error) {
    results.formidable = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
  }

  try {
    // Test mediaSupabase import
    const mediaSupabase = await import('../../../lib/mediaSupabase');
    results.mediaSupabase = {
      success: true,
      hasFunction: typeof mediaSupabase.uploadImageToSupabase === 'function'
    };
  } catch (error) {
    results.mediaSupabase = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
  }

  return res.status(200).json(results);
}
