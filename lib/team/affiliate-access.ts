import { Fault } from './domain';
import type { Partner } from './types';

export const partnerHome = (partner: Pick<Partner, 'role'>) =>
  partner.role === 'affiliate' ? '/team/affiliate' : '/team/leads';

export function requireSalesPartner(partner: Partner) {
  if (!partner.active || !['owner', 'partner'].includes(partner.role))
    throw new Fault('Not found.', 404);
}

// Deny by default. Newly added sales actions never become affiliate privileges.
const affiliateActions = new Set([
  'password', 'password-prompt-dismiss', 'connect-onboard', 'connect-dashboard',
]);
export function requirePartnerAction(partner: Partner, action: string) {
  if (!partner.active || (partner.role === 'affiliate' && !affiliateActions.has(action)))
    throw new Fault('Not found.', 404);
}
