'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {monthlyStatus} from '@/lib/appstore/monthly-status';
export default function ReceiptForm(){
  const [month,setMonth]=useState(''),[received,setReceived]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const router=useRouter();
  return <form style={{display:'grid',gap:12,maxWidth:650,margin:'24px 0'}} onSubmit={async e=>{
    e.preventDefault();if(busy)return;setBusy(true);setMessage('');
    try{
      const response=await fetch('/team/api/apple-payment-received',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({month,received})});
      const body=await response.json();if(!response.ok)throw Error(body.error||'Unable to confirm payment.');
      const r=body.result;setMessage(monthlyStatus(r.status,Number(r.usd_cents),Number(r.withheld_cents),r.error_code));router.refresh();
    }catch(e){setMessage(e instanceof Error?e.message:'Unable to confirm payment.');}finally{setBusy(false);}
  }}>
    <label>Apple fiscal month <input aria-label="Apple fiscal month" placeholder="YYYY-MM" pattern="[0-9]{4}-(0[1-9]|1[0-2])" required value={month} onChange={e=>setMonth(e.target.value)} disabled={busy}/></label>
    <p>Use the month label in Apple’s financial report, which can differ from the calendar month. This action refreshes that report, applies true-ups and releases the payable balance through Connect. A report or payment-issued notice alone is not bank receipt.</p>
    <label style={{display:'flex',gap:12,alignItems:'flex-start'}}><input style={{width:18,height:18,flexShrink:0,marginTop:2}} type="checkbox" checked={received} onChange={e=>setReceived(e.target.checked)} required disabled={busy}/> Apple’s full payment covering this fiscal month and any positive corrections in its latest report has reached Blake’s bank account.</label>
    <button type="submit" disabled={busy||!received||!month}>{busy?'Checking and reconciling…':`Mark Apple payment received for ${month||'fiscal month'}`}</button>
    <p>Repeating this action cannot pay the month twice. Reconfirm a paid month only after receiving any additional Apple payment for its corrections; those amounts settle in a later monthly run. If funds or account setup are unavailable, the balance stays unpaid.</p>
    {message&&<p role="status">{message}</p>}
  </form>;
}
