const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://phdjnvqaqtgnqqjbsksp.supabase.co',
  'sb_publishable_Ca5GSWqYDUZjy1b8rlnhbw_Eixb730j'
);

async function test() {
  const { data: d1, error: e1 } = await supabase.from('results').select('points, students!inner(team)');
  console.log('students join:', d1, e1);
}

test();
