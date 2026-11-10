// Temporary operator interface on the isolated E2E branch. Never enable in production.
import { NextRequest, NextResponse } from "next/server";
import { sandboxPreview, sandboxAccount, sandboxEndpoint, sandboxBranch } from "@/lib/sandbox-runtime";
import { currentPartner } from "@/lib/team/session";
import { teamDatabase } from "@/lib/team/db";
import { connectStripe } from "@/lib/team/connect-client";
import { connectSnapshot } from "@/lib/team/connect";
import { isTrustedMutationRequest } from "@/lib/security/origin";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
async function context() {
 if (!sandboxPreview()) throw Error("SANDBOX_ONLY");
 const actor = await currentPartner();
 if (actor?.id !== "e2e-owner" || actor.role !== "owner") throw Error("TEST_OWNER_REQUIRED");
 const client = connectStripe();
 const account = await client.accounts.retrieve();
 if (account.id !== sandboxAccount) throw Error("WRONG_SANDBOX_ACCOUNT");
 return { actor, client, db: teamDatabase() };
}
export async function GET() {
 try {
  const { actor, client, db } = await context();
  const payments = (await db.query("select id,amount,currency,status,stripe_checkout_session_id,stripe_payment_intent_id,paid_at,refunded_at from crm_payments order by created_at")).rows;
  const connect = await connectSnapshot(db, actor);
  const transfers = [];
  for (const p of connect.payments) if (p.transfer_id) {
    const t = await client.transfers.retrieve(p.transfer_id);
    if (t.livemode) throw Error("LIVE_OBJECT_REFUSED");
    transfers.push({ id:t.id,amount:t.amount,amount_reversed:t.amount_reversed,currency:t.currency,source_transaction:t.source_transaction,destination:t.destination,livemode:t.livemode,reversals:t.reversals.data.map(r=>({id:r.id,amount:r.amount,transfer:r.transfer})) });
  }
  const events = (await db.query("select event_id,event_type,processed_at,processing_error from stripe_webhook_events order by received_at")).rows;
  return NextResponse.json({ sandboxAccount, sandboxEndpoint, sandboxBranch, payments, connect, transfers, events }, {headers});
 } catch(e) {return NextResponse.json({error:e instanceof Error ? e.message.replace(/(?:sk|rk|whsec)_[A-Za-z0-9_]+/g,"REDACTED") : "FAILED"},{status:403,headers});}
}
export async function POST(request: NextRequest) {
 try {
  if (!isTrustedMutationRequest(request)) throw Error("ORIGIN_REQUIRED");
  const {client,db} = await context();
  const body = await request.json();
  if (body.action === "webhooks") {
    const url = new URL(String(body.url));
    if (url.protocol !== "https:" || ![process.env.VERCEL_BRANCH_URL,process.env.VERCEL_URL].includes(url.host) || url.pathname !== "/api/stripe/webhook") throw Error("PREVIEW_WEBHOOK_URL_REQUIRED");
    if ([...url.searchParams.keys()].some(k=>k!=="x-vercel-protection-bypass")) throw Error("UNEXPECTED_QUERY");
    const own = await client.webhookEndpoints.create({url:url.href,description:"WO-0258 isolated Sandbox platform events",enabled_events:["checkout.session.completed","checkout.session.async_payment_succeeded","checkout.session.async_payment_failed","checkout.session.expired","invoice.paid","customer.subscription.deleted","charge.refunded","charge.dispute.created"]},{idempotencyKey:"wo0258-e2e-own-"+url.host});
    const connected = await client.webhookEndpoints.create({url:url.href,connect:true,description:"WO-0258 isolated Sandbox connected-account updates",enabled_events:["account.updated"]},{idempotencyKey:"wo0258-e2e-connect-"+url.host});
    // One-time secrets go only to the authenticated operator, who pipes them
    // directly into branch-scoped Vercel Secrets; never log or retain this body.
    return NextResponse.json({own:{id:own.id,secret:own.secret},connected:{id:connected.id,secret:connected.secret}},{headers});
  }
  if(body.action === "clock") {
    let id=(await db.query("select value from team_settings where key='sandbox_clock'")).rows[0]?.value;
    if(!id){const clock=await client.testHelpers.testClocks.create({frozen_time:Math.floor(Date.now()/1000),name:"WO-0258 Care E2E"},{idempotencyKey:"wo0258-clock"});const customer=await client.customers.create({name:"Fictional Care Buyer",test_clock:clock.id},{idempotencyKey:"wo0258-clock-customer"});await db.query("insert into team_settings(key,value) values('sandbox_clock',$1),('sandbox_clock_customer',$2) on conflict(key) do nothing",[clock.id,customer.id]);id=clock.id;}
    const clock=await client.testHelpers.testClocks.retrieve(id);return NextResponse.json({id:clock.id,frozen_time:clock.frozen_time,status:clock.status},{headers});
  }
  if(body.action === "advance-clock") {
    const id=(await db.query("select value from team_settings where key='sandbox_clock'")).rows[0]?.value;
    const clock=await client.testHelpers.testClocks.retrieve(id);
    const advanced=await client.testHelpers.testClocks.advance(id,{frozen_time:clock.frozen_time+Number(body.seconds||32*86400)});
    return NextResponse.json({id:advanced.id,status:advanced.status,frozen_time:advanced.frozen_time},{headers});
  }
  if(body.action === "refund") {
    const p=(await db.query("select * from team_connect_payments where payment_id=$1 and partner_id='e2e-jayvon'",[body.payment_id])).rows[0];
    if(!p?.charge_id)throw Error("TEST_PAYMENT_REQUIRED");const charge=await client.charges.retrieve(p.charge_id);
    if(charge.livemode)throw Error("LIVE_OBJECT_REFUSED");
    const refund=await client.refunds.create({charge:charge.id,...(body.amount ? {amount:Number(body.amount)}:{})},{idempotencyKey:"wo0258-refund-"+p.payment_id+"-"+(body.amount||"full")});
    return NextResponse.json({id:refund.id,amount:refund.amount,charge:refund.charge,status:refund.status},{headers});
  }
  throw Error("UNKNOWN_TEST_ACTION");
 } catch(e) {return NextResponse.json({error:e instanceof Error ? e.message.replace(/(?:sk|rk|whsec)_[A-Za-z0-9_]+/g,"REDACTED") : "FAILED"},{status:400,headers});}
}
