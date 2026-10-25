const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('outputs/soap-oracle/dist/app.js','utf8');
let now=0,timer;const noop=()=>{};
const context2d={clearRect:noop,save:noop,restore:noop,scale:noop,translate:noop,beginPath:noop,moveTo:noop,arc:noop,fill:noop};
const elements={};
function element(){return {clientWidth:600,clientHeight:640,width:336,height:222,style:{values:{},setProperty(k,v){this.values[k]=v}},classList:{add:noop,remove:noop,toggle:noop},attributes:{},setAttribute(k,v){this.attributes[k]=v},setPointerCapture(id){this.capturedPointer=id},addEventListener:noop,focus:noop,getContext:()=>context2d,textContent:'',open:false,close(){this.open=false},showModal(){this.open=true}}}
for(const id of ['scene','world','hand','soap','fortune','dispenser','guideDialog','guideOpen','guideClose','shapeGrid','resultDialog','resultClose','resultShape'])elements[id]=element();
const cards=Array.from({length:9},element),canvases=Array.from({length:9},element);
const sandbox=vm.createContext({document:{getElementById:id=>elements[id],querySelectorAll:s=>s==='dialog'?[elements.guideDialog,elements.resultDialog]:s==='.shape-card'?cards:canvases},ResizeObserver:class{observe(){}},performance:{now:()=>now},setTimeout:(fn,delay)=>{timer={fn,delay};return 1},clearTimeout:noop,requestAnimationFrame:noop});
vm.runInContext(source,sandbox);const run=code=>vm.runInContext(code,sandbox);
run('move({clientX:300,clientY:600})');assert.equal(run('targetX'),0);assert.equal(run('targetY'),0);
run('hx=40;hy=-25;targetX=40;targetY=-25;begin({clientX:100,clientY:120})');
assert.equal(run('hx'),0);assert.equal(run('hy'),0);assert.equal(run('points[0].x'),187);assert.equal(run('points[0].y'),290);
run('move({clientX:100,clientY:120});move({clientX:101,clientY:121})');assert.equal(run('targetX'),0);assert.equal(run('targetY'),0);
run('move({clientX:120,clientY:130})');assert.equal(run('targetX'),run('13/scale'));assert.equal(run('targetY'),run('5/scale'));run('targetX=targetY=0');
assert.equal(elements.hand.style.width,'285px');assert.equal(elements.hand.style.height,'360px');
assert.equal(timer.delay,1500);assert.equal(run('state'),'pouring');
now=750;run('frame(750)');assert.equal(elements.world.style.values['--level'],.5);assert.equal(elements.fortune.textContent,'');assert.equal(elements.resultDialog.open,false);
run('begin()');assert.equal(run('startTime'),0);
now=1499;run('frame(1499)');assert.equal(run('state'),'pouring');
const before=run('JSON.stringify(points)');now=1500;run('frame(1500)');assert.equal(run('state'),'finished');assert.equal(elements.world.style.values['--level'],0);assert.equal(elements.resultDialog.open,true);assert.match(elements.fortune.textContent,/^[A-Za-z]+$/);assert.equal(run('JSON.stringify(points)'),before,'The result must preserve the actual shape');
assert.equal(run('JSON.stringify(dictionaryShapes)'),run('JSON.stringify(fortunes.map(f=>f.shape))'),'Dictionary examples must stay fixed after a result');
console.log('Centered first drop, no pump-position jump, relative pointer movement, 5% smaller hand, and fixed dictionary examples: OK');
now=3000;run('begin()');assert.equal(elements.world.style.values['--level'],1);assert.equal(elements.fortune.textContent,'');assert.equal(elements.resultDialog.open,false);timer.fn();assert.equal(run('state'),'finished');
console.log('1.5-second timing, blue reservoir full → half → empty, modal with unchanged soap shape, one-word fortune and refill: OK');
now=6000;run('begin(); scale=.6');
const touch=(pointerId,x,y)=>({pointerId,clientX:x,clientY:y,pointerType:'touch',preventDefault:noop});
sandbox.contact=touch(21,140,80);run('startTouchDrag(contact);endTouchDrag(contact)');
sandbox.contact=touch(22,70,420);run('startTouchDrag(contact);move(contact)');
assert.equal(run('targetX'),0);assert.equal(run('targetY'),0,'Retouching the hand must discard the pump coordinates');
sandbox.captureEvent={...touch(22,70,420),target:elements.world};run('lostTouchCapture(captureEvent)');assert.equal(run('touchDrag.id'),22,'Transferring implicit capture from a child to the scene must preserve the drag');
sandbox.contact=touch(22,94,438);run('move(contact)');assert.equal(run('hx'),40);assert.equal(run('hy'),30,'Touch should follow the finger one-to-one at a scaled viewport');
sandbox.contact=touch(23,400,700);run('startTouchDrag(contact);move(contact);endTouchDrag(contact)');assert.equal(run('hx'),40);assert.equal(run('hy'),30,'A second finger must not steal the active drag');
sandbox.contact=touch(22,94,438);run('endTouchDrag(contact)');assert.equal(run('touchDrag'),null);run('frame(6016)');assert.equal(run('hx'),40);assert.equal(run('hy'),30,'Releasing must not attract the hand back to the center');
sandbox.contact=touch(24,310,300);run('startTouchDrag(contact);move(contact)');assert.equal(run('hx'),40);assert.equal(run('hy'),30,'Regrabbing anywhere must not jump');
sandbox.contact=touch(24,280,330);run('move(contact)');assert.equal(run('hx'),-10);assert.equal(run('hy'),80,'Vertical dragging must not stick at the old centered limit');
sandbox.captureEvent={...touch(24,280,330),target:elements.scene};run('lostTouchCapture(captureEvent)');assert.equal(run('touchDrag'),null,'Losing scene capture must release the drag');sandbox.contact=touch(24,500,600);run('move(contact)');assert.equal(run('hx'),-10);assert.equal(run('hy'),80,'Cancelled or ended pointers must not keep moving the hand');
console.log('Mobile pump → lift → hand touch, 1:1 scaled drag, regrabbing, no recentering, secondary finger and pointer cancellation: OK');
for(let i=0;i<9;i++){
  const canonical=run(`fortunes[${i}].shape`);const shape=canonical.length<8?canonical.flatMap(p=>Array.from({length:4},()=>({...p}))):canonical;
  sandbox.fixture=shape;assert.equal(run('analyze(fixture)'),i,`Dictionary example ${i} must match its own fortune`);
  const theta=Math.PI/3,c=Math.cos(theta),s=Math.sin(theta);sandbox.fixture=shape.map(p=>({...p,x:2*(p.x*c-p.y*s)+130,y:2*(p.x*s+p.y*c)+200,r:p.r*2}));
  assert.equal(run('analyze(fixture)'),i,`Rotated/resized dictionary example ${i}`);
}
console.log('All nine dictionary silhouettes match their fortune, including resized and rotated forms: OK');
const html=fs.readFileSync('outputs/soap-oracle/dist/index.html','utf8');assert.ok(!/[\uac00-\ud7af]/.test(source+html));assert.ok(!/linearGradient/.test(html));assert.ok(html.includes('fill="#b9dff3"'));console.log('English only, flat SVG graphics and pale blue liquid: OK');

