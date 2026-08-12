const emailInput=document.querySelector('#email');
const checkButton=document.querySelector('#check');
const results=document.querySelector('#results');
const resetButton=document.querySelector('#reset');
const toast=document.querySelector('#toast');
const formatStatus=document.querySelector('#format-status');
const domainStatus=document.querySelector('#domain-status');
const disposableStatus=document.querySelector('#disposable-status');
const riskStatus=document.querySelector('#risk-status');
const resultEmail=document.querySelector('#result-email');
const localPart=document.querySelector('#local-part');
const resultDomain=document.querySelector('#result-domain');
const modules=document.querySelector('#modules');
const serviceList=document.querySelector('#service-list');
const serviceCount=document.querySelector('#service-count');
const copyButton=document.querySelector('#copy-report');
const downloadButton=document.querySelector('#download-report');

const disposableDomains=new Set(['mailinator.com','guerrillamail.com','10minutemail.com','temp-mail.org','tempmail.com','yopmail.com','sharklasers.com','getnada.com','maildrop.cc','emailondeck.com','discard.email']);

const services=[
 ['Instagram','Social','BLOCKED'],['Facebook','Social','BLOCKED'],['X / Twitter','Social','BLOCKED'],['Reddit','Community','BLOCKED'],['Pinterest','Social','BLOCKED'],['TikTok','Social','BLOCKED'],
 ['Spotify','Music','BLOCKED'],['Discord','Community','BLOCKED'],['Twitch','Streaming','BLOCKED'],['GitHub','Developer','BLOCKED'],['GitLab','Developer','BLOCKED'],['LinkedIn','Professional','BLOCKED'],
 ['Microsoft','Account','BLOCKED'],['Google','Account','BLOCKED'],['Apple','Account','BLOCKED'],['Amazon','Shopping','BLOCKED'],['Dropbox','Cloud','BLOCKED'],['Slack','Work','BLOCKED'],
 ['Steam','Gaming','BLOCKED'],['Canva','Design','BLOCKED'],['Notion','Productivity','BLOCKED'],['Zoom','Work','BLOCKED'],['Proton','Email','BLOCKED'],['Yahoo','Email','BLOCKED'],
 ['Local syntax checker','Local','AVAILABLE'],['Disposable-domain checker','Local','AVAILABLE'],['Domain structure checker','Local','AVAILABLE']
];

let latestReport=null;
function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600)}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value)}
function serviceCard([name,category,status]){const detail=status==='AVAILABLE'?'Available locally':'Protected / not executed';return `<article class="service-card"><div class="service-icon">${name.charAt(0)}</div><div class="service-copy"><strong>${name}</strong><small>${category} · ${detail}</small></div><span class="service-status ${status.toLowerCase()}">${status}</span></article>`}
function renderServiceDirectory(){serviceCount.textContent=`${services.length} modules`;serviceList.innerHTML=services.map(serviceCard).join('')}
function makeModule(name,status,detail){return `<article class="module"><div><strong>${name}</strong><small>${detail}</small></div><span class="module-status ${status.toLowerCase()}">${status}</span></article>`}
function analyze(value){
 const [local,domain]=value.split('@');const disposable=disposableDomains.has(domain);const generic=/^(admin|administrator|test|demo|noreply|no-reply)$/i.test(local);
 return {email:value,localPart:local,domain,format:'VALID',disposable:disposable?'LIKELY DISPOSABLE':'NOT ON LOCAL LIST',risk:disposable?'ELEVATED':'LOW',modules:[
  {name:'Email syntax',status:'PASS',detail:'Local browser validation'},
  {name:'Domain structure',status:'PASS',detail:'Hostname format detected'},
  {name:'Disposable-domain list',status:disposable?'FLAG':'PASS',detail:disposable?'Domain matches local disposable list':'No local-list match'},
  {name:'Local-part review',status:generic?'INFO':'PASS',detail:generic?'Generic mailbox name detected':'No generic mailbox flag'},
  {name:'Third-party service directory',status:'INFO',detail:`${services.length-3} protected modules displayed; protected checks are not executed`}
 ]};
}
function renderReport(report){formatStatus.textContent=report.format;domainStatus.textContent='VALID';disposableStatus.textContent=report.disposable;riskStatus.textContent=report.risk;resultEmail.textContent=report.email;localPart.textContent=report.localPart;resultDomain.textContent=report.domain;modules.innerHTML=report.modules.map(m=>makeModule(m.name,m.status,m.detail)).join('');latestReport=report}
function runCheck(){const value=emailInput.value.trim().toLowerCase();if(!validEmail(value)){showToast('Enter a valid email address');emailInput.focus();return}renderReport(analyze(value));results.classList.remove('hidden');results.scrollIntoView({behavior:'smooth',block:'start'});showToast('Analysis completed')}
function reportText(){return JSON.stringify({...latestReport,serviceDirectory:services.map(s=>({service:s[0],category:s[1],status:s[2]}))},null,2)}
checkButton.addEventListener('click',runCheck);emailInput.addEventListener('keydown',e=>{if(e.key==='Enter')runCheck()});resetButton.addEventListener('click',()=>{results.classList.add('hidden');emailInput.value='';latestReport=null;emailInput.focus();window.scrollTo({top:0,behavior:'smooth'})});copyButton.addEventListener('click',async()=>{if(!latestReport)return;try{await navigator.clipboard.writeText(reportText());showToast('JSON report copied')}catch{showToast('Copy unavailable in this browser')}});downloadButton.addEventListener('click',()=>{if(!latestReport)return;const blob=new Blob([reportText()],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='flashzape-report.json';a.click();URL.revokeObjectURL(url);showToast('Report downloaded')});
renderServiceDirectory();
