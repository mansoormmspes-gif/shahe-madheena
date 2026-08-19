const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://phdjnvqaqtgnqqjbsksp.supabase.co',
  'sb_publishable_Ca5GSWqYDUZjy1b8rlnhbw_Eixb730j'
);

async function test() {
  const { data: results, error } = await supabase.from('results').select('*');
  console.log('results:', results);
  console.log('error:', error);

  const { data: d1, error: e1 } = await supabase.from('results').select('points, students(team)');
  console.log('join test:', d1, e1);
}

test();
