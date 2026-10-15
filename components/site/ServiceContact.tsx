import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";
export default function ServiceContact({ cancellation = false }: { cancellation?: boolean }) {
  return <p>{cancellation ? <>Email Blake to cancel; it ends at the period&apos;s end. </> : null}{CONTACT_EMAIL ? <><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · </> : null}<Link href="/start?src=services&entry=business">{cancellation ? "Use the contact form to request cancellation" : "Ask Blake a question"}</Link></p>;
}
