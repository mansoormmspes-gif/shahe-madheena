const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://phdjnvqaqtgnqqjbsksp.supabase.co',
  'sb_publishable_Ca5GSWqYDUZjy1b8rlnhbw_Eixb730j'
);

async function test() {
  const { data: d1 } = await supabase.from('students').select('id').limit(1);
  console.log('student id type:', typeof d1[0].id, d1[0].id);
  
  // let's insert a fake result to test types
  await supabase.from('results').insert({ event_id: 'test-event', student_id: d1[0].id, position: 1, points: 10 });
  const { data: d2 } = await supabase.from('results').select('student_id').eq('event_id', 'test-event');
  console.log('result student_id type:', typeof d2[0].student_id, d2[0].student_id);
  
  await supabase.from('results').delete().eq('event_id', 'test-event');
}

test();
