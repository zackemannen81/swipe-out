const pages = await (await fetch('http://127.0.0.1:9223/json')).json();
const page = pages.find(p=>p.type==='page' && p.url.includes('5188'));
if(!page) { console.log(pages); process.exit(1); }
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true});});
let next=1;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')console.log('EXCEPTION',JSON.stringify(m.params.exceptionDetails).slice(0,1200));};
const cmd=(method,params={})=>new Promise(resolve=>{const id=next++;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));});
await cmd('Runtime.enable');
const evaluate=async expression=>{let r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});console.log('EVAL',r.result?.result?.value,r.result?.exceptionDetails?.text);};
await new Promise(r=>setTimeout(r,3500));
await evaluate("JSON.stringify({ready:document.readyState,disabled:document.querySelector('#start-button')?.disabled,text:document.querySelector('#start-button')?.textContent,menu:document.body.className,loading:!!document.querySelector('#front-loading')})");
await evaluate("document.querySelector('[data-event=race]')?.click();'race menu opened'");
await evaluate("JSON.stringify({view:document.querySelector('#start-screen')?.dataset.page,disabled:document.querySelector('#start-button')?.disabled})");
await evaluate("document.querySelector('#start-button')?.click();'clicked start'");
await new Promise(r=>setTimeout(r,1800));
await evaluate("JSON.stringify({menu:document.body.className,intro:document.querySelector('#race-intro')?.hidden,results:document.querySelector('#results-screen')?.hidden,loading:!!document.querySelector('#front-loading')})");
ws.close();
