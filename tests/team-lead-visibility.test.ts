import test from "node:test";
import assert from "node:assert/strict";
import { eligibleToCall, callableNow, callNow, phoneNumber } from "../lib/team/call-domain";
import { partnerLeadVisible } from "../lib/team/lead-visibility";
import { seed } from "../lib/team/seed";
import { STAGES } from "../lib/team/types";
import type { TeamLead } from "../lib/team/store";

const lead: TeamLead = {...seed(true).leads[0], phone:"3125550100", time_zone:"America/Chicago"};
const failed: TeamLead = {...lead,recheck:{status:"re-check failed",checked_at:"2026-11-12",confirmed_count:0}};
test("partner visibility excludes permanent ineligibility, never temporary calling windows", () => {
  for (const l of [failed,{...lead,opted_out:true},{...lead,call_outcome:"Not interested"},{...lead,phone:""},{...lead,time_zone:undefined},{...lead,time_zone:"invalid"}]) {
    assert.equal(eligibleToCall(l),false);
    assert.equal(partnerLeadVisible(l,[],[]),false);
  }
  assert.equal(callableNow(lead,new Date("2026-11-12T05:00:00Z")),false);
  assert.equal(partnerLeadVisible(lead,[],[]),true);
  assert.equal(partnerLeadVisible({...lead,vertical:"restaurant"},[],[]),true);
});
test("open deals, quotes and payment history survive failed rechecks and opt-outs", () => {
  for (const stage of STAGES) {
    const d = {...seed(true).deals[0],stage};
    for (const l of [failed,{...failed,opted_out:true}]) {
      assert.equal(partnerLeadVisible(l,[d],[]),stage!=="Lost");
      assert.equal(partnerLeadVisible(l,[d],[{...seed(true).payments[0],deal_id:d.id}]),true);
      assert.deepEqual(callNow([l],[d],new Date("2026-11-12T16:00:00Z")),[]);
    }
  }
  assert.equal(partnerLeadVisible(lead,[{...seed(true).deals[0],stage:"Lost"}],[]),false);
  assert.equal(partnerLeadVisible(failed,[{...seed(true).deals[0],lead_id:"another"}],[]),false);
});
test("queue behavior matches the production eligibility and terminal-stage rules", () => {
  // Independent copy of cc92d46's predicate: detect accidental queue changes.
  function baseline(l: TeamLead, now: Date) {
    if(l.opted_out || l.recheck?.status==="re-check failed" || l.call_outcome==="Not interested" || !phoneNumber(l.phone) || !l.time_zone)return false;
    try {
      const parts=new Intl.DateTimeFormat("en-US",{timeZone:l.time_zone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
      const minute=Number(parts.find(p=>p.type==="hour")!.value)*60+Number(parts.find(p=>p.type==="minute")!.value);
      return minute>=540 && minute<1020 && !(l.vertical==="restaurant" && minute>=690 && minute<810);
    } catch {return false;}
  }
  const variants=[lead,failed,{...lead,opted_out:true},{...lead,phone:"bad"},{...lead,time_zone:"invalid"},{...lead,call_outcome:"Not interested"},{...lead,vertical:"restaurant"},{...lead,time_zone:"America/Los_Angeles"}];
  for(let minute=0;minute<1440;minute+=15) for(const l of variants) {
    const now=new Date(Date.UTC(2026,10,12,0,minute));
    assert.equal(callableNow(l,now),baseline(l,now));
    for(const stage of STAGES) {
      const d={...seed(true).deals[0],stage};
      assert.equal(callNow([l],[d],now).length,Number(baseline(l,now)&&!["Lost","Client paid","Delivered"].includes(stage)));
    }
  }
});
