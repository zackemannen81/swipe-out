import {chromium} from 'file:///C:/Users/zakri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11']});try{const p=await b.newPage();await p.goto('http://127.0.0.1:5174/?track=track17');await p.locator('[data-go=garage]').click({timeout:90000});console.log(await p.evaluate(()=>({url:location.href,profile:localStorage.getItem('swipe-out:career:v1'),scripts:[...document.scripts].map(s=>s.src)})));console.log(await p.locator('#garage-ships').innerHTML());assert.equal(await p.getByRole('button',{name:/Necron Crimson Citadel/}).isDisabled(),true);await p.locator('#menu-back').click();await p.locator('[data-go=settings]').click();assert.equal(await p.locator('#menu-soundtrack option[value="/audio/tracks/vi-lever-inte.mp3"]').evaluate(o=>o.disabled),true);console.log('Production fresh profile: both rewards locked; no automatic dev grant.');}finally{await b.close();}



