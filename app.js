const $ = (s) => document.querySelector(s);
const data = JSON.parse(localStorage.getItem('pulse-data') || '{"workouts":[{"name":"Push strength","duration":45,"focus":"Strength","date":"2026-08-26"},{"name":"Easy run","duration":30,"focus":"Cardio","date":"2026-08-24"},{"name":"Lower body","duration":50,"focus":"Strength","date":"2026-08-22"}],"water":5,"mood":8}');
const save = () => localStorage.setItem('pulse-data', JSON.stringify(data));
const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); };
const days = ['M','T','W','T','F','S','S'];
$('#weekDays').innerHTML = days.map((d, i) => `<div class="day ${i < 3 ? 'done' : i === 3 ? 'today' : ''}"><span>${d}</span><i>${i < 3 ? '✓' : ''}</i></div>`).join('');
function dateParts(value) { const d = new Date(value + 'T12:00:00'); return { day: d.getDate(), month: d.toLocaleString('en', { month: 'short' }).toUpperCase() }; }
function renderWorkouts() { const list = $('#workoutList'); list.innerHTML = data.workouts.sort((a,b) => b.date.localeCompare(a.date)).map(w => { const d=dateParts(w.date); return `<article class="workout-item"><div class="workout-date"><b>${d.day}</b><span>${d.month}</span></div><div><h3>${w.name}</h3><p>${w.focus} · ${w.duration} min</p></div><span>✓ Done</span></article>`; }).join(''); const count = data.workouts.length; $('#workoutCount').textContent = Math.min(count, 5); $('#goalText').textContent = `${count} / 5 workouts`; $('#goalBar').style.width = `${Math.min(count/5*100,100)}%`; $('#totalWorkouts').textContent = count; }
function renderWater(){ $('#waterLabel').textContent = `${data.water} / 8 glasses`; $('#waterDots').innerHTML = Array.from({length:8},(_,i)=>`<i class="${i < data.water ? 'full':''}"></i>`).join(''); }
renderWorkouts(); renderWater();
document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => { const screen = button.dataset.screen; document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active',s.id===screen)); document.querySelectorAll('.bottom-nav [data-screen]').forEach(n => n.classList.toggle('active',n.dataset.screen===screen)); window.scrollTo({top:0,behavior:'smooth'}); }));
const dialog = $('#workoutDialog'); const openDialog = () => dialog.showModal(); $('#addWorkout').onclick = openDialog; $('#quickAdd').onclick = openDialog; $('#startWorkout').onclick = openDialog;
$('#saveWorkout').onclick = (event) => { const name=$('#workoutName'); if(!name.value.trim()) { event.preventDefault(); name.focus(); return; } data.workouts.push({name:name.value.trim(),duration:$('#workoutDuration').value,focus:$('#workoutFocus').value,date:new Date().toISOString().slice(0,10)}); save(); renderWorkouts(); toast('Workout saved — great work!'); name.value=''; };
document.querySelectorAll('#moodSelector button').forEach(b => b.onclick=()=>{data.mood=+b.dataset.value; document.querySelectorAll('#moodSelector button').forEach(x=>x.classList.toggle('selected',x===b)); $('#energyValue').firstChild.textContent=data.mood;});
$('#waterDown').onclick=()=>{data.water=Math.max(0,data.water-1);renderWater();}; $('#waterUp').onclick=()=>{data.water=Math.min(8,data.water+1);renderWater();}; $('#saveCheckin').onclick=()=>{save();toast('Today’s check-in saved');};
$('#exportData').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pulse-gym-data.json';a.click();URL.revokeObjectURL(url);toast('Your data export has downloaded');};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');

// Reusable workout presets
data.programs ||= [
  {id:'upper',name:'Upper body',description:'A balanced push and pull session for strength and muscle.',exercises:[['Bench press',4,'8–10'],['Lat pulldown',3,'10–12'],['Shoulder press',3,'10'],['Cable row',3,'12'],['Tricep pressdown',3,'12']]},
  {id:'lower',name:'Lower body',description:'Build strong legs, glutes and a solid foundation.',exercises:[['Barbell squat',4,'6–8'],['Romanian deadlift',3,'10'],['Leg press',3,'12'],['Leg curl',3,'12'],['Calf raise',3,'15']]}
];
function renderPrograms(){
  $('#programGrid').innerHTML=data.programs.map(p=>`<button class="program-card ${p.media?'has-media':''}" data-program="${p.id}" ${p.media&&/\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(p.media)?`style="background-image:url('${p.media}')"`:''}><span>PRESET · ${p.exercises.length} MOVES</span><strong>${p.name}</strong><em>${p.exercises.reduce((sum,e)=>sum+Number(e[1]),0)} total sets</em></button>`).join('');
  document.querySelectorAll('[data-program]').forEach(b=>b.onclick=()=>openProgram(b.dataset.program));
}
function openProgram(id){
  const program=data.programs.find(p=>p.id===id); if(!program)return;
  $('#programDialog').dataset.program=id; $('#programTitle').textContent=program.name; $('#programDescription').textContent=program.description||'Your saved training routine.';
  const media=$('#programMedia'),reference=$('#programReference'); media.innerHTML='';reference.style.display='none';
  if(program.media){reference.href=program.media;reference.style.display='inline-block';if(/\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(program.media))media.innerHTML=`<img src="${program.media}" alt="Reference for ${program.name}">`;else if(/\.(mp4|webm)(\?|$)/i.test(program.media))media.innerHTML=`<video controls src="${program.media}"></video>`;}
  $('#exerciseList').innerHTML=program.exercises.map((e,i)=>`<div class="exercise-row"><p>${e[0]}</p><label>SETS<input data-field="sets" data-index="${i}" type="number" min="1" value="${e[1]}"></label><label>REPS<input data-field="reps" data-index="${i}" value="${e[2]}"></label></div>`).join('');
  $('#programDialog').showModal();
}
renderPrograms();
$('#newProgram').onclick=()=>$('#createProgramDialog').showModal();
$('#saveProgram').onclick=event=>{const name=$('#programName'),exercise=$('#firstExercise');if(!name.value.trim()||!exercise.value.trim()){event.preventDefault();(name.value.trim()?exercise:name).focus();return;}data.programs.push({id:`program-${Date.now()}`,name:name.value.trim(),description:'A custom routine you created.',media:$('#programMediaUrl').value.trim(),exercises:[[exercise.value.trim(),Number($('#firstSets').value),$('#firstReps').value]]});save();renderPrograms();toast('Preset saved');};
$('#finishProgram').onclick=()=>{const id=$('#programDialog').dataset.program,program=data.programs.find(p=>p.id===id);document.querySelectorAll('#exerciseList input').forEach(input=>{const exercise=program.exercises[Number(input.dataset.index)];exercise[input.dataset.field==='sets'?1:2]=input.dataset.field==='sets'?Number(input.value):input.value;});data.workouts.push({name:program.name,duration:program.exercises.length*9,focus:'Strength',date:new Date().toISOString().slice(0,10)});save();renderWorkouts();renderPrograms();toast(`${program.name} logged — nice work!`);};

// Close buttons must bypass form validation so a partially filled form can be dismissed.
document.querySelectorAll('dialog .close').forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  button.closest('dialog').close();
}));
