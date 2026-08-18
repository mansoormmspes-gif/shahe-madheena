import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (url && !url.startsWith('http')) {
    url = `https://${url}`;
  }
  try {
    new URL(url);
  } catch (e) {
    url = 'https://placeholder.supabase.co';
  }

  return createBrowserClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  )
}
