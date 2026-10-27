// Browser-only instrumentation; no test hooks are included in the shipped app.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FOUNDRY_SECTORS } from '../src/track-foundry.js';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const output=join(tmpdir(),'swipe-out-tt001');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1100,height:700},serviceWorkers:'block'});
context.setDefaultTimeout(45000);
const errors=[],requests=[];
context.on('page',page=>{
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)requests.push(`${r.status()} ${r.url()}`);});
});
await context.route('**/src/game.js*',async route=>{
  const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
window.__tt={
  snapshot(){return {state:race.state,solo:practice.active,paused:isPaused,combat:combat.enabled,catchUp:shipPhysics.catchUpBonus,
    rivals:opponents.map(o=>({visible:o.group.visible,distance:o.physics.distance})),
    elapsed:race.elapsed,distance:shipPhysics.distance,landings:shipPhysics.landings,recoveries:shipPhysics.recoveries,
    completed:practice.session?.completed,best:practice.session?.best?.duration,key:practice.session?.key,
    samples:practice.session?.best?.samples.length,ghostVisible:practice.ghost.group.visible,
    ghost:practice.ghost.group.position.toArray(),position:craft.position.toArray(),
    guide:scene.children.find(o=>o.material?.vertexColors&&o.material?.opacity===.68)?.visible,up:camera.up.toArray()};},
  draw(){practice.update(race.state,race.elapsed,shipPhysics,.2);cameraSystem.mode='external';classicCamera.reset();
    cameraSystem.update(craft.position,craft.quaternion,new THREE.Vector3(),0,race.poseFrame);panoramaBackdrop.position.copy(camera.position);composer.render();},
  driveUntil(laps){isPaused=true;race.state='racing';setScreen(pauseScreen,false);
    for(let i=0;i<120*450&&practice.session.completed.length<laps;i++){
      const f=race.poseFrame,ahead=getTrackFrame(curve,(shipPhysics.distance+6)/curve.getLength());
      const branch=shipPhysics.route&&curve.track.branches.find(b=>b.id===shipPhysics.route.id);
      const af=branch?branch.frame((shipPhysics.distance+6-shipPhysics.route.lap*curve.getLength()-branch.start*curve.getLength())/branch.span):ahead;
      const curvature=Math.atan2(af.tangent.dot(f.right),af.tangent.dot(f.tangent))/6;
      const fork=nextBranch(curve,shipPhysics.distance),lane=fork&&fork.distance-shipPhysics.distance<200&&!shipPhysics.route?5:0;
      const targetYaw=Math.atan2((lane-shipPhysics.lateralOffset)*2-shipPhysics.lateralVelocity*1.8,shipPhysics.speed);
      race.steering=-THREE.MathUtils.clamp((curvature*shipPhysics.speed+(targetYaw-shipPhysics.yaw)*8)/1.1,-1,1);
      const brake=shipPhysics.speed>Math.max(55,Math.min(143,.85/Math.max(.001,Math.abs(curvature))))+8;
      race.throttleTarget=brake?-1:1;race.elapsed+=1/120;updateCraftPose(1/120);
      practice.advance(practice.point(race.elapsed,shipPhysics));
    }
    if(practice.session.done)finishRace();this.draw();return this.snapshot();
  },
  inspect(u,branch=false){isPaused=true;setScreen(pauseScreen,false);
    shipPhysics.distance=(practice.session?.lapIndex??0)*curve.getLength()+u*curve.getLength();
    shipPhysics.route=branch?{id:curve.track.branches[0].id,lap:practice.session?.lapIndex??0}:null;
    shipPhysics.flight=null;shipPhysics.lateralOffset=0;shipPhysics.yaw=0;shipPhysics.speed=143;
    updateCraftPose(0);this.draw();},
  resume(){isPaused=false;clock.getDelta();},
  freeze(){isPaused=true;},
  hideGhost(){practice.ghost.group.visible=false;}
};`});
});
try{
  const page=await context.newPage();await page.goto('http://127.0.0.1:5173/?track=track15');
  await page.waitForFunction(()=>window.__tt&&!document.querySelector('#start-button').disabled);
  console.log('PASS: game initialized');
  await page.locator('#combat-enabled').check();
  await page.locator('#race-mode-select').selectOption('time-attack');
  await page.locator('#handling-select').selectOption('wipeout');
  assert.ok(await page.locator('#combat-enabled').isDisabled());
  assert.match(await page.locator('#practice-preview').innerText(),/PB —/);
  await page.screenshot({path:join(output,'menu.png')});
  await page.locator('#start-button').click();
  await page.waitForFunction(()=>window.__tt.snapshot().state==='racing',null,{timeout:90000});
  if(process.env.TEST_LIFECYCLE_ONLY==='1'){
    await page.locator('#btn-pause-toggle').click();await page.locator('#end-session-button').click();
    assert.equal((await page.evaluate(()=>window.__tt.snapshot())).state,'finished');
    assert.equal(await page.locator('#btn-pause-toggle').getAttribute('aria-pressed'),'false');
    assert.match(await page.locator('#btn-pause-toggle').innerText(),/PAUSE/);
    await page.locator('#retry-button').click();
    const restart=await page.evaluate(()=>window.__tt.snapshot());
    assert.equal(restart.state,'countdown');assert.equal(restart.paused,false);assert.equal(restart.elapsed,0);
    assert.deepEqual(restart.completed,[]);assert.equal(restart.ghostVisible,false);
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
    console.log('PASS: early end restores pause button and music lifecycle; retry starts a clean solo session.');
  }else{
  let s=await page.evaluate(()=>window.__tt.snapshot());
  assert.equal(s.solo,true);assert.equal(s.combat,false);assert.equal(s.catchUp,0);assert.ok(s.rivals.every(o=>!o.visible));
  const rivals=s.rivals.map(o=>o.distance);
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(350);await page.keyboard.up('ArrowLeft');
  await page.locator('#btn-pause-toggle').click();
  const paused=await page.evaluate(()=>window.__tt.snapshot());await page.waitForTimeout(150);
  assert.equal((await page.evaluate(()=>window.__tt.snapshot())).elapsed,paused.elapsed);
  await page.locator('#resume-button').click();
  assert.deepEqual((await page.evaluate(()=>window.__tt.snapshot())).rivals.map(o=>o.distance),rivals);
  console.log('PASS: actual solo render loop, no combat/catch-up/CPU movement; keyboard and pause');
  s=await page.evaluate(()=>window.__tt.driveUntil(1));
  assert.equal(s.completed.length,1);assert.ok(s.completed[0].valid);assert.ok(s.best);assert.ok(s.samples>500);
  assert.equal(s.ghostVisible,true);
  await page.evaluate(()=>window.__tt.resume());await page.waitForTimeout(150);await page.evaluate(()=>window.__tt.freeze());
  await page.screenshot({path:join(output,'personal-best.png')});
  console.log('PASS: accelerated input-driven physics finishes out lap and valid lap, saves real ghost',s.best);
  s=await page.evaluate(()=>window.__tt.driveUntil(3));
  assert.equal(s.state,'finished');assert.ok(s.completed.every(l=>l.valid));assert.equal(s.landings,8);
  assert.ok(await page.locator('#practice-results').isVisible());
  assert.equal(await page.locator('#results-heading').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.screenshot({path:join(output,'results.png')});
  const best=s.best;await page.locator('#menu-button').click();await page.reload();
  await page.waitForFunction(()=>window.__tt&&!document.querySelector('#start-button').disabled);
  assert.equal(await page.locator('#race-mode-select').inputValue(),'time-attack');
  assert.doesNotMatch(await page.locator('#practice-preview').innerText(),/PB —/);
  await page.locator('#handling-select').selectOption('swipeout');assert.match(await page.locator('#practice-preview').innerText(),/PB —/);
  await page.locator('#handling-select').selectOption('wipeout');
  await page.locator('#start-button').click();
  assert.equal((await page.evaluate(()=>window.__tt.snapshot())).best,best);
  await page.waitForFunction(()=>window.__tt.snapshot().state==='racing',null,{timeout:90000});
  // Controlled viewing poses verify the guide's bank/loop/branch placement, not timing.
  for(const [name,u,branch] of [['bank',FOUNDRY_SECTORS.bank,false],['gap',FOUNDRY_SECTORS.jump1-.012,false],
    ['shortcut',(FOUNDRY_SECTORS.fork+FOUNDRY_SECTORS.merge)/2,true],['inverted',FOUNDRY_SECTORS.inverted,false]]){
    await page.evaluate(({u,branch})=>window.__tt.inspect(u,branch),{u,branch});
    await page.screenshot({path:join(output,`guide-${name}.png`)});
  }
  await page.setViewportSize({width:800,height:390});
  await page.evaluate(u=>window.__tt.inspect(u),FOUNDRY_SECTORS.technical);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:join(output,'landscape.png')});
  // End through the actual pause UI. The unfinished lap must not become a result.
  await page.evaluate(()=>window.__tt.resume());await page.locator('#btn-pause-toggle').click();
  await page.locator('#end-session-button').click();
  assert.equal((await page.evaluate(()=>window.__tt.snapshot())).completed.length,0);
  await page.locator('#menu-button').click();
  for(const name of ['ghost','line','warnings'])await page.locator('#practice-'+name).uncheck();
  await page.reload();await page.waitForFunction(()=>window.__tt&&!document.querySelector('#start-button').disabled);
  for(const name of ['ghost','line','warnings'])assert.equal(await page.locator('#practice-'+name).isChecked(),false);
  await page.locator('#start-button').click();
  await page.evaluate(u=>window.__tt.inspect(u),FOUNDRY_SECTORS.bank);
  assert.equal((await page.evaluate(()=>window.__tt.snapshot())).guide,false);
  assert.equal(await page.locator('#corner-warning').isVisible(),false);
  // Controlled countdown exit keeps this preference check independent of timing.
  await page.evaluate(()=>{document.querySelector('#end-session-button').click();});
  await page.locator('#menu-button').click();await page.locator('#race-mode-select').selectOption('race');
  assert.ok(await page.locator('#combat-enabled').isEnabled());
  await page.locator('#start-button').click();s=await page.evaluate(()=>window.__tt.snapshot());
  assert.equal(s.solo,false);assert.ok(s.rivals.every(o=>o.visible));assert.equal(s.ghostVisible,false);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('PASS: three laps/results, persisted PB + mode isolation, guide views/landscape, early end and return to Race');
  console.log(JSON.stringify({output,errors,requests}));
  }
}catch(error){for(const page of context.pages()){
  console.error(await page.evaluate(()=>window.__tt?.snapshot()).catch(()=>null));
  await page.screenshot({path:join(output,'failure.png'),timeout:5000}).catch(()=>{});
}console.error({errors,requests});throw error;}finally{await browser.close();}
