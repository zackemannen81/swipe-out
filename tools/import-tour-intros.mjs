import fs from 'node:fs';
const root='public/audio/tourbus';
const source=fs.readFileSync(root+'/voices/README.md','utf8');
const intros={};
for(const match of source.matchAll(/^### (\d\dB?) – (.+)\r?\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)){
 const [,id,title,body]=match;const first=body.indexOf('"'),last=body.lastIndexOf('"');
 if(first<0||last<=first)throw Error('Missing quoted script '+id);
 intros[id]={id,title,text:body.slice(first+1,last).trim(),voice:fs.existsSync(`${root}/voices/${id}.mp3`)?`/audio/tourbus/voices/${id}.mp3`:null};
}
if(Object.keys(intros).length!==18)throw Error('Expected 18 scripts');
fs.writeFileSync('src/tour-intros.json',JSON.stringify(intros,null,2)+'\n');
console.log(Object.values(intros).filter(x=>!x.voice).map(x=>x.id));
