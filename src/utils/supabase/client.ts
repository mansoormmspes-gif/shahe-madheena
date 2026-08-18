import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = 'https://phdjnvqaqtgnqqjbsksp.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGpudnFhcXRnbnFxamJza3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODIxNjAsImV4cCI6MjEwMjU1ODE2MH0.bQ2UB7f_1VWa3M9bW9Bg0L8Ay-XAz8CDLOiplfQCNMk'
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
