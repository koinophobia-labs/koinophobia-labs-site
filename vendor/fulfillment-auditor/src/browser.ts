import {chromium, type Browser, type Page} from 'playwright-core';
import {createHash} from 'node:crypto';
import {UA,proxy,safeUrl,robotsPolicy,CERT_ERRORS} from './network.js';
import type {Rendered,Proof,Note} from './model.js';
import {snapshotLeverage} from './leverage.js';
export interface BrowserOptions { executablePath?:string; args?:string[]; navigationPolicy?:(url:string)=>Promise<unknown>; respectRobots?:boolean }
export async function openBrowser(options:BrowserOptions={}) {
  const gateway=await proxy();let browser:Browser|undefined;
  const launch=()=>chromium.launch({headless:true,channel:options.executablePath?undefined:'chromium',executablePath:options.executablePath,args:[...(options.args??[]).filter(a=>!/^--(?:ignore-certificate-errors|allow-running-insecure-content|disable-web-security)/.test(a)),'--disable-quic','--proxy-bypass-list=<-loopback>'],proxy:{server:gateway.url}});
  try{browser=await launch();}catch(e){await gateway.close();throw e;}
  const policy=options.navigationPolicy??(options.respectRobots===false?async()=>{}:robotsPolicy());
  return {
    async render(raw:string,mobile:boolean):Promise<Rendered> {
      const u=safeUrl(raw);
      const viewport=mobile?{width:390,height:844}:{width:1440,height:900};
      const active=browser??await launch();browser=active;
      const context=await active.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,userAgent:mobile?UA.replace('Macintosh; Intel Mac OS X 10_15_7','Linux; Android 13; Pixel 7').replace('Safari/537.36','Mobile Safari/537.36'):UA,serviceWorkers:'block',ignoreHTTPSErrors:false,acceptDownloads:false});
      let requestCount=0,documents=0,incomplete=false,policyDelay=0;let policyError=false,restrictedTraffic=false;const mixed=new Set<string>();
      await context.route('**/*',async route=>{
        const req=route.request();
        if(req.method()!=='GET'){restrictedTraffic=true;return route.abort('blockedbyclient');}
        if(++requestCount>240){incomplete=true;return route.abort('blockedbyclient');}
        try {
          const target=safeUrl(req.url());
          if(req.resourceType()==='document'){
            if(++documents>8)throw Error('document_limit');
            const policyStart=performance.now();
            try {await policy(target.href);} catch (e) {
              const code=(e as NodeJS.ErrnoException).code;
              if(!code||(!CERT_ERRORS.has(code)&&code!=='ENOTFOUND'))throw e;
            } finally {if(req.frame()===page.mainFrame())policyDelay+=performance.now()-policyStart;}
          }
          if(req.resourceType()==='media'){restrictedTraffic=true;return route.abort('blockedbyclient');}
          await route.continue();
        }catch{restrictedTraffic=true;if(req.isNavigationRequest()&&req.frame()===page.mainFrame())policyError=true;return route.abort('blockedbyclient');}
      });
      await context.routeWebSocket('**/*',ws=>{restrictedTraffic=true;ws.close();});
      const page=await context.newPage();
      const cdp=await context.newCDPSession(page);await cdp.send('Audits.enable');
      cdp.on('Audits.issueAdded',event=>{const detail=event.issue.details.mixedContentIssueDetails;if(detail?.resolutionStatus==='MixedContentBlocked')mixed.add(detail.insecureURL);});
      await page.addInitScript(()=>{
        (window as unknown as {__auditLcp:number|null}).__auditLcp=null;
        new PerformanceObserver(list=>{for(const e of list.getEntries())(window as unknown as {__auditLcp:number|null}).__auditLcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
      });
      let status=0,error:string|undefined,proxyFailure=false;
      const assetStatuses=new Map<string,number>();
      const scriptErrors:{message:string;url:string}[]=[];
      page.on('response',response=>{if(response.request().resourceType()==='image')assetStatuses.set(response.url(),response.status());});
      page.on('pageerror',e=>{scriptErrors.push({message:e.message,url:e.stack??''});});
      page.on('response',response=>{if(response.request().isNavigationRequest()&&response.frame()===page.mainFrame()){status=response.status();proxyFailure=response.headers()['x-koi-proxy-error']==='1';}});
      try {
        const response=await page.goto(u.href,{waitUntil:'load',timeout:20_000});status=response?.status()??0;
        await page.waitForTimeout(1500);
      }catch(e){
        const message=String(e);
        await page.waitForTimeout(1200);
        error=/ERR_HTTP_RESPONSE_CODE_FAILURE/.test(message)&&([404,410].includes(status)||status>=500&&status<=599)?undefined:/ERR_CERT_/.test(message)?'certificate':policyError?'policy':gateway.errors.get(u.hostname)??(/ERR_NAME_NOT_RESOLVED/.test(message)?'dns':/Timeout/.test(message)?'timeout':'navigation');
      }
      try {
        const rendered=await page.evaluate(snapshotDOM).catch(() => ({url:raw,title:'',heading:'',text:'',html:'',viewportMeta:'',width:0,screen:0,scale:1,overflow:0,overlaps:0,lcp:null,load:null,actionLabels:{} as Record<string,string>,links:[] as string[],notes:[] as Note[],mixedBroken:0,brokenImages:[] as string[]}));
        if(proxyFailure)error='proxy_failure';
        if(error&&rendered.title==='Privacy error'&&/your connection is not private|NET::ERR_CERT_/i.test(rendered.text))error='certificate';
        if(!error && status===200 && rendered.text.trim().length<80)incomplete=true;
        if(rendered.lcp!==null)rendered.lcp=Math.max(0,rendered.lcp-policyDelay);
        if(rendered.load!==null)rendered.load=Math.max(0,rendered.load-policyDelay);
        const captured_at=new Date().toISOString();
        const proof=error&&!rendered.text.trim()?undefined:await capture(page,rendered.url.startsWith('http')?rendered.url:raw,captured_at,viewport);
        const signals=error||incomplete||status!==200?[]:await page.evaluate(snapshotLeverage).catch(()=>[]);
        const approved=[];
        for(const s of signals){
          if(s.check==='Wrong key link'){
            // Delegated handlers can replace native navigation. Inspect the live
            // listener chain without clicking, submitting, or mutating the page.
            const listeners=await cdp.send('Runtime.evaluate',{expression:`(()=>{let e=document.querySelectorAll('*')[${Number(s.elementIndex)}];const nodes=[window,document];while(e){nodes.push(e);e=e.parentElement;}return nodes.some(n=>['click','mousedown','pointerdown','touchstart'].some(t=>(getEventListeners(n)[t]||[]).length));})()`,includeCommandLineAPI:true,returnByValue:true}).catch(()=>null);
            if(!listeners||listeners.exceptionDetails||listeners.result.value!==false)continue;
          }
          if(s.check==='Insecure form'){
            rendered.notes.push({name:'HTTP form action — unverified',detail:'A visible form declares an HTTP POST destination. Submission was not tested; JavaScript, HSTS or browser upgrade rules may change transport. Not a confirmed finding or lead qualifier.'});
            continue;
          }
          if(s.check==='Broken image'&&![404,410].includes(assetStatuses.get(s.asset??'')??0))continue;
          // Scroll only to observed content, without clicking or changing the DOM.
          if(s.elementIndex!==undefined){
            const el=page.locator('*').nth(s.elementIndex);
            try{
              await el.scrollIntoViewIfNeeded({timeout:1500});
              const exposed=await el.evaluate(e=>{const r=e.getBoundingClientRect(),left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);if(right-left<3||bottom-top<3)return false;const hit=document.elementFromPoint((left+right)/2,(top+bottom)/2);return !!hit&&e.contains(hit);});
              if(!exposed)continue;
            }catch{continue;}
          }else await page.evaluate(()=>scrollTo({top:0,left:0,behavior:'instant'}));
          s.proof=await capture(page,page.url(),new Date().toISOString(),viewport);
          if(s.proof)approved.push(s);
        }
        // Generic console noise never qualifies. Widget failure requires a visible
        // explicit error inside a vendor-labelled widget and a matching JS stack.
        if(!error&&!incomplete&&!restrictedTraffic&&status===200&&scriptErrors.length){
          const widget=await page.evaluate(()=>{
            for(const e of document.querySelectorAll('[class*="calendly"],[id*="calendly"],[class*="acuity"],[id*="acuity"],[data-booking-widget]')){
              const r=e.getBoundingClientRect(),t=e.textContent?.trim()??'';
              if(r.width<100||r.height<30||!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||! /^(?:unable to load|failed to load|something went wrong|booking (?:is )?unavailable)/i.test(t)||t.length>250)continue;
              const source=e.getAttribute('data-url')??e.getAttribute('data-booking-widget')??'';
              try{return {index:[...document.querySelectorAll('*')].indexOf(e),host:new URL(source).hostname};}catch{/* no attributable source */}
            }
            return null;
          }).catch(()=>null);
          if(widget&&scriptErrors.some(e=>e.url.includes('https://'+widget.host+'/'))){
            const el=page.locator('*').nth(widget.index);await el.scrollIntoViewIfNeeded({timeout:1500}).catch(()=>{});
            const widgetProof=await capture(page,page.url(),new Date().toISOString(),viewport);
            if(widgetProof)approved.push({check:'Booking widget failure' as const,key:'widget-'+widget.host,measurement:'A visible booking widget shows an explicit load error, and a JavaScript exception originates from that widget provider.',impact:'The embedded booking interface did not load in either browser observation.',verify_url:raw,proof:widgetProof});
          }
        }
        await page.evaluate(() => scrollTo({top:0,left:0,behavior:'instant'}));
        const resolution = !error && !incomplete && !restrictedTraffic && status === 200
          ? await page.evaluate(snapshotResolution).catch(() => undefined) : undefined;
        if (resolution) {
          const native = await cdp.send('Runtime.evaluate', {expression: `(()=>{const elements=[...document.querySelectorAll('*')];if(elements.length>10000)return false;return ![window,document,...elements].some(n=>['click','mousedown','pointerdown','touchstart','submit'].some(t=>(getEventListeners(n)[t]||[]).length));})()`,includeCommandLineAPI:true,returnByValue:true}).catch(()=>null);
          if(!native || native.exceptionDetails || native.result.value!==true){resolution.socialLinks=[];resolution.contactAboveFold=false;}
        }
        return {resolution, ...rendered,url:rendered.url.startsWith('http')?rendered.url:raw,status,error,incomplete,proof,signals:approved,mixedBroken:rendered.brokenImages.filter(src=>mixed.has(src)).length};
      } finally {await context.close().catch(()=>{});if(options.args?.includes('--single-process')){await active.close().catch(()=>{});browser=undefined;}}
    },
    close:async()=>{await browser?.close();await gateway.close();},
  };
}
async function capture(page:Page,url:string,captured_at:string,viewport:{width:number;height:number}):Promise<Proof|undefined> {
  try {
    // Keep the actual page pixels. URL/time travel in the signed-by-hash manifest,
    // not a fabricated browser warning or a modified page screenshot.
    const bytes=await page.screenshot({type:'jpeg',quality:65,timeout:8000});
    if(bytes.length<1000||bytes.length>400_000)return undefined;
    return {url,captured_at,viewport,sha256:createHash('sha256').update(bytes).digest('hex'),image:'data:image/jpeg;base64,'+bytes.toString('base64')};
  }catch{return undefined;}
}

export function snapshotDOM(){
          const visible=(el:Element)=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&r.width>2&&r.height>2&&s.visibility==='visible'&&s.display!=='none'&&Number(s.opacity)>0&&!el.closest('[hidden],[aria-hidden="true"],[inert]');};
          const heading=[...document.querySelectorAll('h1,[role="heading"][aria-level="1"]')].find(visible)?.textContent?.trim()??'';
          const targets=[...document.querySelectorAll('a[href],button,input:not([type="hidden"]),[role="button"]')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}).slice(0,100);
          let overlaps=0;
          for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){
            const a=targets[i],b=targets[j];if(a.parentElement!==b.parentElement)continue;
            const name=(e:Element)=>(e.getAttribute('aria-label')??e.textContent??'').trim();
            if(!name(a)||!name(b)||name(a)===name(b))continue;
            const hittable=(e:Element)=>{const r=e.getBoundingClientRect();return [[r.left+2,r.top+2],[r.right-2,r.top+2],[r.left+2,r.bottom-2],[r.right-2,r.bottom-2],[r.left+r.width/2,r.top+r.height/2]].some(([x,y])=>{const top=document.elementFromPoint(x,y);return !!top&&e.contains(top);});};
            if(!hittable(a)||!hittable(b))continue;
            if(a.contains(b)||b.contains(a)||a.getAttribute('href')&&a.getAttribute('href')===b.getAttribute('href'))continue;
            const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();const w=Math.min(x.right,y.right)-Math.max(x.left,y.left),h=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);
            if(w>10&&h>10&&w*h>Math.min(x.width*x.height,y.width*y.height)*0.6){
              const top=document.elementFromPoint(Math.max(x.left,y.left)+w/2,Math.max(x.top,y.top)+h/2);
              if(top&&(a.contains(top)||b.contains(top)))overlaps++;
            }
          }
          const links:string[]=[];const actionLabels:Record<string,string>={};
          for(const el of document.querySelectorAll('a[href],iframe[src]')){
            if(!visible(el))continue;const raw=el.getAttribute('href')??el.getAttribute('src')??'';
            if(!raw||/^(#|tel:|mailto:|javascript:)/i.test(raw)||!/contact|book|appoint|schedule|reserv|order|quote|inquiry|enquiry|forms\.gle|docs\.google\.com\/forms/i.test(`${raw} ${el.textContent}`))continue;
            try{const u=new URL(raw,location.href);u.hash='';if(['http:','https:'].includes(u.protocol)&&u.href!==location.href){links.push(u.href);const label=(el.textContent??el.getAttribute('title')??'').replace(/\s+/g,' ').trim();if(label&&label.length<=80)actionLabels[u.href]=label;}}catch{}
          }
          const text=document.body?.innerText??'';const notes:{name:string;detail:string}[]=[];
          if(!document.querySelector('meta[name="description" i]')?.getAttribute('content')?.trim())notes.push({name:'Meta description',detail:'No description detected. Note only; this does not establish a broken site.'});
          const phones=text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g)??[];
          const tel=[...document.querySelectorAll('a[href^="tel:"]')].map(a=>(a.getAttribute('href')??'').replace(/\D/g,'').slice(-10));
          if(phones.some(p=>!tel.includes(p.replace(/\D/g,'').slice(-10))))notes.push({name:'Tappable phone',detail:'A visible US-format number lacks a matching tel: link. Note only; intent is unverified.'});
          const nav=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
          const width=Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth??0);
          const visibleWidth=visualViewport?.width||document.documentElement.clientWidth;
          const overflow=getComputedStyle(document.documentElement).overflowX==='hidden'||(document.body&&getComputedStyle(document.body).overflowX==='hidden')?0:Math.max(0,width-visibleWidth);
          return {url:location.href,title:document.title,heading,text:text.slice(0,25000),html:document.documentElement.outerHTML.slice(0,2_000_000),viewportMeta:document.querySelector('meta[name="viewport" i]')?.getAttribute('content')??'',width,screen:screen.width,scale:visualViewport?.scale??1,overflow,overlaps,lcp:(window as unknown as {__auditLcp:number|null}).__auditLcp,load:nav?.loadEventEnd||null,actionLabels,links:[...new Set(links)],notes,mixedBroken:0,brokenImages:[...document.images].filter(i=>visible(i)&&i.complete&&i.naturalWidth===0).map(i=>i.src)};

}

// Positive, passive measurements for fulfillment. This never creates lead findings.
export function snapshotResolution() {
  const visible = (e: Element) => {
    const r=e.getBoundingClientRect();
    return e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}) && r.width>2 && r.height>2 && !e.closest('[hidden],[aria-hidden="true"],[inert]');
  };
  const reachable = (e: Element) => {
    if (!visible(e)) return false;
    const r=e.getBoundingClientRect();
    if(r.top<0 || r.bottom>innerHeight || r.left<0 || r.right>innerWidth)return false;
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return !!hit && e.contains(hit);
  };
  const label=(e: Element)=>(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||'').trim();
  const anchors=[...document.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(visible);
  const controls=[...document.querySelectorAll('a[href],button,[role="button"],input[type="submit"]')].filter(visible);
  const primary=/\b(?:book|appointment|schedule|reserve|reservation|order|contact|call|quote|message|inquiry|enquiry|get in touch)\b/i;
  const text=document.body?.innerText || '';
  const mainText=[...document.querySelectorAll<HTMLElement>('main p,main li,[role="main"] p')].filter(e=>reachable(e)&&label(e).length>=80);
  return {
    finishedContent: text.trim().length>=80 && !![...document.querySelectorAll('h1')].find(e=>visible(e)&&label(e)) && !/lorem ipsum|sample text|your business name(?: here)?|click here to add your own text|click edit button to change this text|coming soon|under construction/i.test(text),
    loadedImages:[...document.images].filter(e=>reachable(e)&&e.complete&&e.naturalWidth>0&&e.naturalHeight>0).map(e=>e.currentSrc||e.src),
    socialLinks:anchors.filter(e=>reachable(e)).filter(e=>/^(?:follow (?:us )?on )?(?:our )?(instagram|facebook|tiktok|youtube|linkedin)(?: page)?$/i.test(label(e))&&!e.hasAttribute('onclick')&&!e.hasAttribute('role')).map(e=>({label:label(e),href:e.href})),
    contactAboveFold: innerWidth===390 && anchors.some(e=>reachable(e)&&(primary.test(label(e))||/^(tel:|mailto:)/i.test(e.href))&&/^(https?:|tel:|mailto:)/i.test(e.href)&&!e.hasAttribute('onclick')),
    primaryTargetsComfortable:innerWidth===390 && controls.some(e=>reachable(e)&&primary.test(label(e))) && controls.filter(e=>reachable(e)&&primary.test(label(e))).every(e=>{const r=e.getBoundingClientRect();return r.width>=24&&r.height>=24;}),
    primaryTextReadable:innerWidth===390 && mainText.length>0 && mainText.every(e=>parseFloat(getComputedStyle(e).fontSize)*(visualViewport?.scale||1)>=10),
  };
}
