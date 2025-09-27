import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wngpksvxxmanrmilhcgs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZ3Brc3Z4eG1hbnJtaWxoY2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDMzMDksImV4cCI6MjA3NDU3OTMwOX0.9tkm9Jvm5X4jo5OpV6hBskhW7cGS885kQUWwkJf55DY'

export const supabase = createClient(supabaseUrl, supabaseKey)