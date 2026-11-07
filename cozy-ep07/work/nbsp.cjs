const fs=require('fs');
for(const f of fs.readdirSync('work/parts')){const p=JSON.parse(fs.readFileSync('work/parts/'+f));p.forEach(c=>{c.fr=c.fr.replace(/ /g,' ');if(c.board)c.board=JSON.parse(JSON.stringify(c.board).replace(/ /g,' '))});fs.writeFileSync('work/parts/'+f,JSON.stringify(p,null,1));}
