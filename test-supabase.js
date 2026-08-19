const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://phdjnvqaqtgnqqjbsksp.supabase.co',
  'sb_publishable_Ca5GSWqYDUZjy1b8rlnhbw_Eixb730j'
);

async function test() {
  const { data: d1, error: e1 } = await supabase.from('results').select('points, students!inner(team)');
  console.log('students join:', d1, e1);

  const { data: d2, error: e2 } = await supabase.from('results').select('points, registrations!inner(team)');
  console.log('registrations join:', d2, e2);
  
  const { data: d3, error: e3 } = await supabase.from('results').select('points, student_id');
  console.log('raw results:', d3, e3);
  
  const { data: d4, error: e4 } = await supabase.from('students').select('id, team').limit(3);
  console.log('sample students:', d4, e4);
}

test();
