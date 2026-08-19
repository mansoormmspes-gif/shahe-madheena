const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://phdjnvqaqtgnqqjbsksp.supabase.co',
  'sb_publishable_Ca5GSWqYDUZjy1b8rlnhbw_Eixb730j'
);

async function test() {
  const { data: events } = await supabase.from('competitions').select('id').limit(1);
  if (!events || events.length === 0) {
    console.log("no events");
    return;
  }
  const event_id = events[0].id;
  
  const { data: student } = await supabase.from('students').select('id').limit(1);
  const student_id = student[0].id;

  console.log(`inserting for event ${event_id} and student ${student_id}`);
  
  const { error: insertErr } = await supabase.from('results').insert({ event_id, student_id, position: 1, points: 10 });
  console.log('insert error:', insertErr);

  const { data: d1, error: e1 } = await supabase.from('results').select('points, students!inner(team)');
  console.log('students join:', JSON.stringify(d1), e1);
  
  await supabase.from('results').delete().eq('event_id', event_id);
}

test();
