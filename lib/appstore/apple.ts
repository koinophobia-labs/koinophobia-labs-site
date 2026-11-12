import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { AppStoreServerAPIClient, Environment, SignedDataVerifier, GetTransactionHistoryVersion, Order, type JWSTransactionDecodedPayload as Transaction, type ResponseBodyV2DecodedPayload as Notification } from '@apple/app-store-server-library';
import { apps, required, type AppConfig } from './config';

export type VerifiedEvent = { uuid: string; type: string; app: AppConfig; environment: Environment; transaction?: Transaction; attribution?: { offer: string; transactionId: string }; hash: string };
export type AppleServices = { verifier: Pick<SignedDataVerifier, 'verifyAndDecodeNotification' | 'verifyAndDecodeTransaction'>; client: Pick<AppStoreServerAPIClient, 'getTransactionInfo' | 'getTransactionHistory'> };
export class InvalidNotification extends Error {}
const roots = () => ['AppleRootCA-G3.cer','AppleRootCA-G2.cer'].map(f => readFileSync(process.cwd() + '/lib/appstore/certs/' + f));
export function services(app: AppConfig, environment: Environment): AppleServices {
  return {
    verifier: new SignedDataVerifier(roots(), true, environment, app.bundleId, app.appAppleId),
    client: new AppStoreServerAPIClient(required('APPSTORE_PRIVATE_KEY').replace(/\\n/g, '\n'), required('APPSTORE_KEY_ID'), required('APPSTORE_ISSUER_ID'), app.bundleId, environment),
  };
}
export function assertTransaction(t: Transaction, app: AppConfig, env: Environment) {
  if (t.bundleId !== app.bundleId || t.environment !== env || !t.transactionId || !t.originalTransactionId || !t.productId || !Number.isSafeInteger(t.purchaseDate) || t.purchaseDate! <= 0) throw new InvalidNotification('TRANSACTION_SCOPE_INVALID');
}
export function codeProof(t: Transaction, current: Transaction, app: AppConfig) {
  return t.offerType === 3 && !!t.offerIdentifier && app.offerIdentifiers.includes(t.offerIdentifier) && t.originalTransactionId === current.originalTransactionId && t.purchaseDate! <= current.purchaseDate! && t.inAppOwnershipType === 'PURCHASED';
}
export async function verifyEvent(signed: string, configured = apps(), make = services): Promise<VerifiedEvent> {
  // Untrusted hints select a configured verifier only. They never authorize a sale.
  let hint: Notification;
  try { hint = JSON.parse(Buffer.from(signed.split('.')[1], 'base64url').toString()); } catch { throw new InvalidNotification('INVALID_JWS'); }
  const app = configured.find(a => a.bundleId === hint.data?.bundleId && a.appAppleId === hint.data?.appAppleId);
  const env = hint.data?.environment;
  if (!app || (env !== Environment.PRODUCTION && env !== Environment.SANDBOX)) throw new InvalidNotification('UNKNOWN_APP_OR_ENVIRONMENT');
  const { verifier, client } = make(app, env);
  let n: Notification;
  try { n = await verifier.verifyAndDecodeNotification(signed); } catch { throw new InvalidNotification('SIGNATURE_INVALID'); }
  if (!n.notificationUUID || !n.notificationType || n.data?.bundleId !== app.bundleId || n.data.environment !== env) throw new InvalidNotification('INVALID_NOTIFICATION');
  const event: VerifiedEvent = { uuid:n.notificationUUID, type:n.notificationType, app, environment:env, hash:createHash('sha256').update(signed).digest('hex') };
  if (n.notificationType === 'TEST') return event;
  if (!n.data.signedTransactionInfo) return event;
  let embedded: Transaction;
  try { embedded = await verifier.verifyAndDecodeTransaction(n.data.signedTransactionInfo); } catch { throw new InvalidNotification('TRANSACTION_SIGNATURE_INVALID'); }
  assertTransaction(embedded, app, env);
  const response = await client.getTransactionInfo(embedded.transactionId!);
  if (!response.signedTransactionInfo) throw Error('APPLE_TRANSACTION_UNAVAILABLE');
  const t = await verifier.verifyAndDecodeTransaction(response.signedTransactionInfo);
  assertTransaction(t, app, env);
  if (t.transactionId !== embedded.transactionId || t.originalTransactionId !== embedded.originalTransactionId || t.productId !== embedded.productId) throw new InvalidNotification('TRANSACTION_MISMATCH');
  event.transaction = t;
  if (codeProof(t,t,app)) event.attribution = {offer:t.offerIdentifier!,transactionId:t.transactionId!};
  // Out-of-order renewal delivery must work even if the paid redemption webhook
  // never arrived. Only Apple-verified history in this subscription can attribute it.
  if (!event.attribution && t.type === 'Auto-Renewable Subscription' && t.inAppOwnershipType === 'PURCHASED') {
    let revision: string | null = null;
    for (let page=0; page<100; page++) {
      const history = await client.getTransactionHistory(t.transactionId!, revision, { sort:Order.ASCENDING }, GetTransactionHistoryVersion.V2);
      for (const jws of history.signedTransactions || []) {
        const prior = await verifier.verifyAndDecodeTransaction(jws);
        assertTransaction(prior,app,env);
        if (codeProof(prior,t,app)) event.attribution = {offer:prior.offerIdentifier!,transactionId:prior.transactionId!};
      }
      if (event.attribution || !history.hasMore) break;
      if (!history.revision || history.revision === revision || page === 99) throw Error('APPLE_HISTORY_INCOMPLETE');
      revision=history.revision;
    }
  }
  return event;
}
