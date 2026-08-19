const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://phdjnvqaqtgnqqjbsksp.supabase.co',
  'sb_publishable_Ca5GSWqYDUZjy1b8rlnhbw_Eixb730j'
);

async function check() {
  const { data, error } = await supabase.from('competitions').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

check();
