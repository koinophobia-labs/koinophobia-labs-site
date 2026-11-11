import {reserveCallCheckout} from "../lib/team/call-checkout";
import {quoteDraft} from "../lib/team/domain";
import {isStandardQuote} from "../lib/team/payment-links";
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { Pool } from "pg";
import { seed } from "../lib/team/seed";
import { transaction } from "../lib/team/db";
import {
  activeLead,
  prepareCall,
  switchCallOffer,
  callState,
  publishDeal,
  publicDeal,
} from "../lib/team/call-store";
import { saveQuote, scopedDeal, updateDeal, optOut } from "../lib/team/store";
test("WO-0276 real PostgreSQL call readiness", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "wo0276-postgres-"));
  const net = createServer();
  await new Promise<void>((r) => net.listen(0, "127.0.0.1", r));
  const port = (net.address() as { port: number }).port;
  await new Promise<void>((r) => net.close(() => r()));
  execFileSync(
    "initdb",
    ["-D", dir, "-A", "trust", "--no-locale", "-E", "UTF8"],
    { stdio: "ignore" },
  );
  execFileSync(
    "pg_ctl",
    [
      "-D",
      dir,
      "-l",
      join(dir, "server.log"),
      "-o",
      `-F -p ${port} -h 127.0.0.1 -k ${dir}`,
      "-w",
      "start",
    ],
    { stdio: "ignore" },
  );
  const db = new Pool({ host: "127.0.0.1", port, database: "postgres" });
  const tx = <T>(fn: Parameters<typeof transaction<T>>[0]) =>
    transaction(fn, db);
  const data = seed(true),
    [, a, b] = data.partners;
  const proof = {
    confidence: "confirmed",
    measurement: "FAKE booking button returns a 404 page.",
    proof: {
      image: "data:image/png;base64,YQ==",
      captured_at: new Date().toISOString(),
    },
  };
  try {
    for (const f of [
      "001_crm_leads.sql",
      "002_crm_proposals.sql",
      "006_stripe_payments.sql",
      "010_team_portal.sql",
      "012_team_password.sql",
      "014_team_call.sql",
    ])
      await db.query(readFileSync("db/" + f, "utf8"));
    await db.query(readFileSync("db/014_team_call.sql", "utf8"));
    for (const p of data.partners)
      await db.query(
        "insert into team_partners(id,name,email,role) values($1,$2,$3,$4)",
        [p.id, p.name, p.id + "@example.test", p.role],
      );
    for (const l of data.leads)
      await db.query(
        "insert into team_leads(id,partner_id,business,email,phone,website,data) values($1,$2,$3,$4,$5,$6,$7)",
        [
          l.id,
          l.partner_id,
          l.business,
          l.email,
          "3125550100",
          l.website,
          { ...l, evidence: [proof] },
        ],
      );
    for (const d of data.deals)
      await db.query(
        "insert into team_deals(id,partner_id,lead_id,services,price,monthly,approved,scope) values($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          d.id,
          d.partner_id,
          d.lead_id,
          JSON.stringify(d.services),
          d.price,
          d.monthly,
          d.approved,
          d.scope,
        ],
      );
    const makeLead = async (id: string, extra: object = {}) => {
      await db.query("insert into team_leads(id,partner_id,business,website,data) values($1,$2,$3,$4,$5)", [id, a.id, "FAKE " + id, "https://" + id + ".example.test", {contact:"",notes:"",channel:"Test",evidence:[proof],suggested_offer:{id:"fix",price:29900},...extra}]);
    };
    await t.test("only exact single catalog quotes auto-approve; partner prices and approval fields are ignored", async () => {
      for (const services of [["fix"],["tune"],["care"],["site"],["app"],["ai"],["fix","care"],["fix","check"]]) {
        const saved = await tx(q => saveQuote(q,a,{lead_id:"lead-0",services,price:1,monthly:1,approved:true}));
        const d = await scopedDeal(db,a,saved.id);
        assert.equal(d.approved,services.length === 1 && ["fix","tune","care"].includes(services[0]));
        assert.deepEqual({price:d.price,monthly:d.monthly}, {price:quoteDraft(services).price,monthly:quoteDraft(services).monthly});
        await assert.rejects(tx(q => updateDeal(q,a,d.id,{action:"approve",price:1})));
      }
      assert.equal(isStandardQuote({services:["fix"],price:1,monthly:0}),false);
      assert.equal(isStandardQuote({services:["care"],price:9900,monthly:0}),false);
    });
    await t.test("opening eligible leads uses suggested offer; concurrent opens reuse one deal and page", async () => {
      for (const [id, price] of [["fix",29900],["tune",75000],["care",9900]] as const) {
        const lead = "auto-"+id;
        await makeLead(lead,{suggested_offer:{id,price}});
        await Promise.all([tx(q=>activeLead(q,a,lead)),tx(q=>activeLead(q,a,lead))]);
        const state = await callState(db,a,lead);
        assert.equal(state.deal?.approved,true);
        assert.deepEqual(state.deal?.services,[id]);
        assert.equal(state.deal?.price,price);
        assert.ok(state.page?.code);
        const page = await publicDeal(db,state.page!.code);
        assert.equal(page.proof_image, "");
        assert.equal(page.proof_reviewed_by,null);
        assert.equal((await db.query("select count(*)::int n from team_deals where lead_id=$1",[lead])).rows[0].n,1);
        assert.equal((await db.query("select count(*)::int n from team_deal_pages where deal_id=$1",[state.deal!.id])).rows[0].n,1);
        await tx(q=>prepareCall(q,a,lead));
        assert.equal((await callState(db,a,lead)).page?.code,state.page!.code);
      }
    });
    await t.test("confirmed text-only finding creates a ready page without requiring a screenshot", async () => {
      await makeLead("text-only",{evidence:[{confidence:"confirmed",measurement:"Confirmed missing booking link."}]});
      await tx(q=>activeLead(q,a,"text-only"));
      const state=await callState(db,a,"text-only");
      assert.ok(state.page?.code);
      assert.equal(state.proof_available,false);
      assert.equal(state.problem,"Confirmed missing booking link.");
      assert.doesNotMatch(state.script,/show you the screenshot/);
      assert.equal((await publicDeal(db,state.page!.code)).proof_image,"");
      await assert.rejects(tx(q=>publishDeal(q,a,state.deal!.id,true)));
    });
    await t.test("failed, unconfirmed, custom suggestions, opted-out and closed leads never get auto pages", async () => {
      for (const [id,extra] of Object.entries({failed:{recheck:{status:"re-check failed"}},unconfirmed:{evidence:[]},custom:{suggested_offer:{id:"site",price:250000}},tampered:{suggested_offer:{id:"fix",price:1}},declined:{call_outcome:"Not interested"}})) {
        await makeLead(id,extra);
        await tx(q=>activeLead(q,a,id));
        assert.equal((await callState(db,a,id)).deal,null);
      }
      await makeLead("opted-out");
      await tx(q=>optOut(q,a,"opted-out"));
      await assert.rejects(tx(q=>activeLead(q,a,"opted-out")));
      await tx(q=>prepareCall(q,a,"opted-out"));
      assert.equal((await callState(db,a,"opted-out")).page,null);
      await makeLead("closed");
      const d = await tx(q=>saveQuote(q,a,{lead_id:"closed",services:["fix"]}));
      await db.query("update team_deals set stage='Lost' where id=$1",[d.id]);
      await tx(q=>activeLead(q,a,"closed"));
      assert.equal((await callState(db,a,"closed")).page,null);
      await assert.rejects(tx(q=>prepareCall(q,b,"auto-fix")));
    });
    await t.test("switching uses server prices and stable page; rejects custom, cross-partner and checkout-started edits", async()=>{
      const state = await callState(db,a,"auto-fix"), id=state.deal!.id, code=state.page!.code;
      await tx(q=>switchCallOffer(q,a,id,"care"));
      const after=await callState(db,a,"auto-fix");
      assert.equal(after.deal?.price,9900);
      assert.equal(after.deal?.monthly,9900);
      assert.equal(after.page?.code,code);
      await assert.rejects(tx(q=>switchCallOffer(q,a,id,"site")));
      await assert.rejects(tx(q=>switchCallOffer(q,b,id,"fix")));
      await tx(q=>publishDeal(q,a,id,true));
      assert.equal((await publicDeal(db,code)).proof_image,proof.proof.image);
      await reserveCallCheckout("care",{partner:a.id,deal:id},code,db);
      await assert.rejects(tx(q=>switchCallOffer(q,a,id,"tune")));
      assert.equal((await callState(db,a,"auto-fix")).deal?.price,9900);
    });
  } finally {
    await db.end();
    execFileSync("pg_ctl", ["-D", dir, "-m", "fast", "-w", "stop"], {stdio:"ignore"});
    console.log("Retained WO-0276 synthetic database fixture: " + dir);
  }
});
