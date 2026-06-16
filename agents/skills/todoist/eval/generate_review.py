#!/usr/bin/env python3
"""Generate a self-contained HTML review file for one stage of one round.

Usage:
    python generate_review.py <stage-output.json> [-o review.html]

Input JSON shape:
{
  "round": 1, "stage": "plan", "generatedAt": "2026-06-15",
  "cases": [
    {
      "task": {"id","content","project","due","url","description","cluster",
               "comments": [{"author","content"}]},
      "output": { "<Label>": "<text or list>", ... },   # rendered top-to-bottom
      "withheld_guidance": "oracle comment text (shown collapsed, was hidden from agent)"
    }
  ]
}

Output: a single HTML file. Per task: the task + its context + what the agent produced for this
stage + a 1-100 score slider, a verdict (correct/partial/wrong), and a comment box. An
"Export" button downloads corrections-<round>-<stage>.json and copies it to the clipboard.
Reviews autosave to localStorage so reloading never loses work. No PII lives in this script.
"""
import argparse, json, os, sys

TEMPLATE = r"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<style>
:root{--bg:#0f1117;--card:#1a1d27;--card2:#222633;--ink:#e6e8ef;--mut:#9aa3b2;--acc:#7c9cff;--ok:#4ec98b;--warn:#e0b34a;--bad:#e06a6a;--bd:#2c3140}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto}
a{color:var(--acc)}
.bar{position:sticky;top:0;z-index:10;background:#0b0d13ee;backdrop-filter:blur(6px);border-bottom:1px solid var(--bd);padding:10px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.bar h1{font-size:15px;margin:0;font-weight:650}.bar .meta{color:var(--mut)}
.bar .sp{flex:1}
button{background:var(--card2);color:var(--ink);border:1px solid var(--bd);border-radius:7px;padding:7px 12px;cursor:pointer;font:inherit}
button.primary{background:var(--acc);color:#0b0d13;border-color:var(--acc);font-weight:650}
button:hover{filter:brightness(1.12)}
.wrap{max-width:1000px;margin:0 auto;padding:18px}
.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;margin:0 0 18px;overflow:hidden}
.hd{padding:14px 16px;border-bottom:1px solid var(--bd)}
.hd .title{font-size:15px;font-weight:650}
.hd .sub{color:var(--mut);font-size:12.5px;margin-top:3px}
.chip{display:inline-block;background:var(--card2);border:1px solid var(--bd);border-radius:20px;padding:1px 9px;font-size:11.5px;color:var(--mut);margin-right:6px}
.sec{padding:12px 16px;border-bottom:1px solid var(--bd)}
.sec h3{margin:0 0 7px;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);font-weight:650}
pre{white-space:pre-wrap;word-break:break-word;margin:0;font:12.8px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--card2);border:1px solid var(--bd);border-radius:7px;padding:9px 11px}
.kv{margin:0 0 9px}.kv:last-child{margin:0}.kv .k{font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);font-weight:650;margin-bottom:3px}
details{background:var(--card2);border:1px dashed var(--warn);border-radius:7px;padding:8px 11px}
details summary{cursor:pointer;color:var(--warn);font-size:12.5px}
.ctx{font-size:13px}
.rev{padding:14px 16px;background:#13161f}
.row{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.score{display:flex;gap:10px;align-items:center;flex:1;min-width:260px}
.score input[type=range]{flex:1}
.score .num{width:54px;text-align:center;font-weight:700;font-size:16px;background:var(--card2);border:1px solid var(--bd);border-radius:6px;padding:3px}
.verd button{opacity:.5}.verd button.on{opacity:1;font-weight:700}
.verd .ok.on{background:var(--ok);color:#08130c;border-color:var(--ok)}
.verd .pa.on{background:var(--warn);color:#1a1402;border-color:var(--warn)}
.verd .no.on{background:var(--bad);color:#1a0606;border-color:var(--bad)}
textarea{width:100%;margin-top:10px;background:var(--card2);color:var(--ink);border:1px solid var(--bd);border-radius:7px;padding:9px;font:inherit;min-height:54px;resize:vertical}
.done{outline:2px solid var(--ok);outline-offset:-2px}
.entities td{border:1px solid var(--bd);padding:5px 8px;font-size:12.5px;vertical-align:top}.entities{border-collapse:collapse;width:100%}
.entities th{text-align:left;font-size:11px;color:var(--mut);padding:4px 8px;text-transform:uppercase;letter-spacing:.05em}
</style></head><body>
<div class="bar"><h1>__TITLE__</h1><span class="meta" id="prog"></span><span class="sp"></span>
<button onclick="resetAll()">Reset</button>
<button class="primary" onclick="exportAll()">Export my comments</button></div>
<div class="wrap" id="root"></div>
<script>
const DATA = __DATA__;
const KEY = (t)=>`tdeval-r${DATA.round}-${DATA.stage}-${t}`;
function load(id){try{return JSON.parse(localStorage.getItem(KEY(id)))||{}}catch(e){return {}}}
function save(id,v){localStorage.setItem(KEY(id),JSON.stringify(v))}
function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
function fieldHTML(label,val){
  let body;
  if(Array.isArray(val)){body='<pre>'+val.map(x=>typeof x==='object'?JSON.stringify(x,null,1):esc(x)).join('\n')+'</pre>'}
  else if(val&&typeof val==='object'){body='<pre>'+esc(JSON.stringify(val,null,2))+'</pre>'}
  else{body='<pre>'+esc(val)+'</pre>'}
  return `<div class="kv"><div class="k">${esc(label)}</div>${body}</div>`;
}
function render(){
  const root=document.getElementById('root');
  const legend=(DATA.legend&&DATA.legend.length)?`<div class="card" style="border-color:var(--acc)"><div class="sec" style="border:0"><h3>How to read this</h3>${DATA.legend.map(l=>`<div class="kv" style="margin-bottom:5px">${esc(l)}</div>`).join('')}</div></div>`:'';
  root.innerHTML=legend+DATA.cases.map((c,i)=>{
    const t=c.task, o=c.output||{}, st=load(t.id);
    const comments=(t.comments||[]).map(cm=>`<pre>${esc(cm.author||'comment')}: ${esc(cm.content)}</pre>`).join('');
    const ctx=[t.description?`<pre>${esc(t.description)}</pre>`:'', comments].filter(Boolean).join('')||'<span class="ctx" style="color:var(--mut)">— no description / comments —</span>';
    const guid=c.withheld_guidance?`<div class="sec"><details><summary>Your guidance (withheld from agent — oracle)</summary><pre style="margin-top:8px">${esc(c.withheld_guidance)}</pre></details></div>`:'';
    const out=Object.entries(o).map(([k,v])=>fieldHTML(k,v)).join('');
    const sc=st.score==null?50:st.score;
    return `<div class="card" id="card-${i}">
      <div class="hd"><div class="title">${esc(t.content)}</div>
        <div class="sub"><span class="chip">${esc(t.cluster||'?')}</span><span class="chip">${esc(t.project||'')}</span>${t.due?`<span class="chip">due ${esc(t.due)}</span>`:''} ${t.url?`<a href="${esc(t.url)}" target="_blank">open in todoist ↗</a>`:''}</div></div>
      <div class="sec"><h3>Task context (seen by agent)</h3>${ctx}</div>
      ${guid}
      <div class="sec"><h3>What the agent produced — stage: ${esc(DATA.stage)}</h3>${out||'<span style="color:var(--mut)">(no output)</span>'}</div>
      <div class="rev">
        <div class="row">
          <div class="score"><b>Score</b><input type="range" min="1" max="100" value="${sc}" oninput="setScore('${t.id}',${i},this.value)"><span class="num" id="num-${i}">${sc}</span></div>
          <div class="verd" id="verd-${i}">
            <button class="ok ${st.verdict==='correct'?'on':''}" onclick="setVerd('${t.id}',${i},'correct')">✓ correct</button>
            <button class="pa ${st.verdict==='partial'?'on':''}" onclick="setVerd('${t.id}',${i},'partial')">~ partial</button>
            <button class="no ${st.verdict==='wrong'?'on':''}" onclick="setVerd('${t.id}',${i},'wrong')">✗ wrong</button>
          </div>
        </div>
        <textarea id="cmt-${i}" placeholder="What's right / wrong / what you'd want instead…" oninput="setCmt('${t.id}',${i},this.value)">${esc(st.comment||'')}</textarea>
      </div></div>`;
  }).join('');
  updateProg();
}
function setScore(id,i,v){const s=load(id);s.score=+v;save(id,s);document.getElementById('num-'+i).textContent=v;mark(i,s)}
function setVerd(id,i,v){const s=load(id);s.verdict=v;save(id,s);document.querySelectorAll('#verd-'+i+' button').forEach(b=>b.classList.remove('on'));event.target.classList.add('on');mark(i,s);updateProg()}
function setCmt(id,i,v){const s=load(id);s.comment=v;save(id,s);mark(i,s);updateProg()}
function mark(i,s){const card=document.getElementById('card-'+i);card.classList.toggle('done',!!(s.verdict||s.comment))}
function updateProg(){let done=0;DATA.cases.forEach(c=>{const s=load(c.task.id);if(s.verdict||s.comment)done++});document.getElementById('prog').textContent=`${done}/${DATA.cases.length} reviewed`}
function resetAll(){if(!confirm('Clear all your reviews for this stage?'))return;DATA.cases.forEach(c=>localStorage.removeItem(KEY(c.task.id)));render()}
function exportAll(){
  const out={round:DATA.round,stage:DATA.stage,exportedAt:new Date().toISOString(),reviews:DATA.cases.map(c=>{const s=load(c.task.id);return {taskId:c.task.id,content:c.task.content,score:s.score==null?null:s.score,verdict:s.verdict||null,comment:s.comment||''}})};
  const txt=JSON.stringify(out,null,2);
  const blob=new Blob([txt],{type:'application/json'});const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`corrections-round${DATA.round}-${DATA.stage}.json`;a.click();
  navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>alert('Exported + copied to clipboard. Paste it back to Claude.'),()=>alert('Exported (clipboard blocked — use the downloaded file).'));
}
render();
</script></body></html>"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("-o", "--output")
    a = ap.parse_args()
    with open(a.input) as f:
        data = json.load(f)
    data.setdefault("round", 0); data.setdefault("stage", "?"); data.setdefault("cases", [])
    title = f"Todoist Eval · Round {data['round']} · {data['stage']} stage · {len(data['cases'])} tasks"
    html = TEMPLATE.replace("__TITLE__", title).replace("__DATA__", json.dumps(data))
    out = a.output or os.path.join(os.path.dirname(a.input), f"review-{data['stage']}.html")
    with open(out, "w") as f:
        f.write(html)
    print(f"wrote {out} ({len(data['cases'])} cards)")

if __name__ == "__main__":
    main()
