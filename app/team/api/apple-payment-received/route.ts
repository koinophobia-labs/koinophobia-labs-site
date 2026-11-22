import {currentPartner} from '@/lib/team/session';
import {hostedPreview,teamDatabase} from '@/lib/team/db';
import {markApplePaymentReceived} from '@/lib/appstore/monthly';
import {receiptHandler} from '@/lib/appstore/monthly-route';
export const runtime='nodejs';
export const maxDuration=300;
export const POST=receiptHandler({
  actor:currentPartner,
  available:()=>!hostedPreview()&&process.env.APPSTORE_NOTIFICATIONS_ENABLED==='true',
  execute:(actor,input)=>markApplePaymentReceived(teamDatabase(),actor,input),
});
