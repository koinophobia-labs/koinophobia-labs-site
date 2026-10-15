import ServicePayButton from "./ServicePayButton";
import { AUDIT_CHECKOUT_PATH } from "@/lib/acquisition/audit-config";
export default function AuditPayButton({ source }: { source: string }) {
  return <ServicePayButton source={source} path={AUDIT_CHECKOUT_PATH} label="Pay $250 and book"/>;
}
