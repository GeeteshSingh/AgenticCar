import { spawn } from 'node:child_process'
import WebSocket from 'ws'
const URL = process.env.URL || 'http://localhost:5173/'
const WAIT = Number(process.env.WAIT || 6000)
const RW = Number(process.env.RW || 1500)
const chrome = spawn('google-chrome', ['--headless=new','--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--remote-debugging-port=9222','--window-size=1280,720','about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
async function targets(){ return (await fetch('http://localhost:9222/json')).json() }
async function main(){
  await sleep(800)
  const page = (await targets()).find(t => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false })
  let id=0
  const send=(m,p={})=>new Promise(res=>{const mid=++id;const h=d=>{const msg=JSON.parse(d.toString());if(msg.id===mid){ws.off('message',h);res(msg.result)}};ws.on('message',h);ws.send(JSON.stringify({id:mid,method:m,params:p}))})
  await new Promise(r=>ws.on('open',r))
  await send('Page.enable'); await send('Runtime.enable')
  const logs=[]
  ws.on('message',d=>{const m=JSON.parse(d.toString());if(m.method==='Runtime.consoleAPICalled')logs.push('LOG '+m.params.args.map(a=>a.value??a.description).join(' '));if(m.method==='Runtime.exceptionThrown')logs.push('EXC '+(m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text||''))})
  await send('Page.navigate',{url:URL}); await sleep(RW+200)
  const clicked = await send('Runtime.evaluate',{expression:`(function(){const b=[...document.querySelectorAll('button')].find(x=>/endless|mission/i.test(x.innerText))||document.querySelector('button');if(b){b.click();return b.innerText}return null})()`,returnByValue:true})
  console.log('CLICKED', JSON.stringify(clicked.result))
  await sleep(WAIT)
  const diag = await send('Runtime.evaluate',{expression:`(function(){const c=document.querySelector('canvas');return {canvas:!!c,w:c?c.width:0,htons:c?c.height:0,text:document.body.innerText.replace(/\\n+/g,' | ').slice(0,260)}}())`,returnByValue:true})
  console.log('DIAG', JSON.stringify(diag.result))
  console.log('--- LOGS ---'); console.log(logs.slice(0,12).join('\n')||'(none)')
  ws.close(); chrome.kill('SIGKILL'); process.exit(0)
}
main().catch(e=>{console.error(e);chrome.kill('SIGKILL');process.exit(1)})
