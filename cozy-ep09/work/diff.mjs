import fs from 'node:fs';
const S=JSON.parse(fs.readFileSync('assets/words.json','utf8')), W=JSON.parse(fs.readFileSync('assets/words.whisper.json','utf8'));
const norm=t=>t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’]/g,"'").replace(/[^a-z0-9']/g,'');
const WV=W.filter(w=>norm(w.t)); const a=S.map(x=>norm(x.t)), b=WV.map(w=>norm(w.t));
const n=a.length,m=b.length,D=Array.from({length:n+1},()=>new Float32Array(m+1)),P=Array.from({length:n+1},()=>new Uint8Array(m+1));
for(let i=1;i<=n;i++){D[i][0]=i;P[i][0]=1}for(let j=1;j<=m;j++){D[0][j]=j;P[0][j]=2}
for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){const d=D[i-1][j-1]+(a[i-1]===b[j-1]?0:1.2),u=D[i-1][j]+1,l=D[i][j-1]+1;if(d<=u&&d<=l){D[i][j]=d;P[i][j]=0}else if(u<=l){D[i][j]=u;P[i][j]=1}else{D[i][j]=l;P[i][j]=2}}
const pr=[];for(let i=n,j=m;i||j;){const p=P[i][j];if(p===0){pr.push([i-1,j-1]);i--;j--}else if(p===1){pr.push([i-1,-1]);i--}else{pr.push([-1,j-1]);j--}}pr.reverse();
for(let k=0;k<pr.length;k++){const[si,wi]=pr[k];if(si>=0&&wi>=0&&a[si]===b[wi])continue;
 let k2=k,ss=[],ww=[];while(k2<pr.length&&!(pr[k2][0]>=0&&pr[k2][1]>=0&&a[pr[k2][0]]===b[pr[k2][1]])){if(pr[k2][0]>=0)ss.push(S[pr[k2][0]].t);if(pr[k2][1]>=0)ww.push(WV[pr[k2][1]]);k2++}
 const t=ww.length?ww[0].s:S[pr[k][0]].s; const ctx=S.slice(Math.max(0,(pr[k][0]>=0?pr[k][0]:0)-3),(pr[k][0]>=0?pr[k][0]:0)).map(x=>x.t).join(' ');
 console.log(`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}  …${ctx} | script: «${ss.join(' ')}»  audio: «${ww.map(w=>w.t).join(' ')}»`);k=k2-1}
