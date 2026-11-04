import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('tools/verify-vitrum.mjs','utf8').split('try {')[0];
s=s.replace("import {VITRUM,VITRUM_SECTORS}","import {VITRUM,VITRUM_SECTORS,VITRUM_STUNTS}");
s+=`try {
 const page=await context.newPage();await page.goto('http://127.0.0.1:5173/?track=track18&editor=1');
 await page.waitForFunction(()=>window.__vitrum?.snapshot().loaded>200,null,{timeout:90000});
 for(const [name,u] of [['gap',VITRUM.gaps[0].start-.002],['roll',(VITRUM_STUNTS.rollStart+VITRUM_STUNTS.rollEnd)/2]]){
 await page.evaluate(u=>window.__vitrum.overview(u),u);await page.screenshot({path:output+'/stunt-'+name+'.png'});
 }
 console.log(await page.evaluate(()=>window.__vitrum.snapshot()));assert.deepEqual(errors,[]);
}finally{await context.unrouteAll({behavior:'ignoreErrors'});await browser.close();}`;
writeFileSync('tools/verify-vitrum-stunts.mjs',s);
