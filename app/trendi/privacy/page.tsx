import type { Metadata } from "next";
import Link from "next/link";

const privacyEmail = "koinophobia999@gmail.com";

export const metadata: Metadata = {
  title: "Trendi Privacy Policy",
  description:
    "How Trendi asks before using AI coaching, and how it processes creator content, account information, recordings, and service data.",
  alternates: { canonical: "/trendi/privacy" },
};

export default function TrendiPrivacyPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/trendi">
        ← Trendi
      </Link>
      <p className="kicker kicker-orange">Trendi</p>
      <h1>Privacy Policy</h1>
      <p className="legal-note">Last updated: October 14, 2026</p>

      <section>
        <h2>Scope</h2>
        <p>
          Trendi is a creator-coaching app from Koinophobia Labs. This policy
          explains how the Trendi iPhone app, its Coach service and the Trendi web
          pages handle information.
        </p>
      </section>

      <section>
        <h2>The short version</h2>
        <ul>
          <li>
            Your ideas, drafts, recordings and takes stay on your iPhone unless you
            ask Trendi for AI coaching.
          </li>
          <li>
            <strong>Trendi asks before it sends anything to AI.</strong> Before
            your first Coach Pack, Trendi explains what will be shared, and you
            choose <strong>Allow AI coaching</strong> or <strong>Not now</strong>.
            Nothing is sent for AI coaching unless you allow it. You can turn AI
            coaching off at any time in <strong>Profile › AI coaching</strong>.
          </li>
          <li>
            When you allow it, the text you ask about is sent to our Coach service
            and to <strong>Anthropic</strong>, our only AI provider, to write your
            coaching.
          </li>
          <li>
            Take Two reviews your recordings on your iPhone. Recordings are never
            uploaded.
          </li>
          <li>
            We don&apos;t sell your data, show ads or track you across other
            companies&apos; apps and websites.
          </li>
        </ul>
      </section>

      <section>
        <h2>AI coaching and your consent</h2>
        <p>
          <strong>What&apos;s shared, and only after you allow AI coaching.</strong>{" "}
          When you ask for a Coach Pack, regenerate a section, or Trendi repairs a
          result that failed its checks, the app sends the following to the Coach
          service:
        </p>
        <ul>
          <li>the idea or draft you selected, or the text of a spoken idea;</li>
          <li>
            the creator-profile answers you chose to add, such as your goal,
            audience, niche, perspective, tone, words to use or avoid, and any
            typed voice sample;
          </li>
          <li>
            your production preferences, such as platform, format, length,
            delivery style and what you&apos;re comfortable filming;
          </li>
          <li>
            for regeneration or repair, the previous result and your instruction.
          </li>
        </ul>
        <p>
          The Coach service assembles that text into a request and sends it to
          Anthropic (Claude), which writes the response. Your account or guest
          identifier, session token, purchase records and IP address are not added
          to the request sent to Anthropic. Anything you type yourself can still
          identify you, so avoid including information you don&apos;t want
          processed.
        </p>
        <p>
          <strong>Your choices.</strong>
        </p>
        <ul>
          <li>
            <strong>Not now</strong> keeps AI coaching off. Trendi asks again only
            when you tap &ldquo;Make a Coach Pack&rdquo;.
          </li>
          <li>
            <strong>Off.</strong> You can turn AI coaching off, and review
            what&apos;s shared, in <strong>Profile › AI coaching</strong>. Turning
            it off stops new AI requests straight away. It does not delete your
            content, and requests already sent can&apos;t be recalled.
          </li>
          <li>
            <strong>When the disclosure changes,</strong> for example a new
            provider, Trendi asks for your permission again.
          </li>
          <li>
            <strong>Everything else still works</strong> without AI coaching: your
            ideas, drafts, recording, Take Two, your Pro subscription and Restore
            Purchases.
          </li>
        </ul>
        <p>
          Our Coach service refuses any AI request that doesn&apos;t carry a
          current consent. Versions of Trendi released before this consent step
          can&apos;t ask for consent, so AI coaching is unavailable in them; update
          Trendi to use it.
        </p>
      </section>

      <section>
        <h2>Information Trendi processes</h2>
        <ul>
          <li>
            <strong>Account information.</strong> Trendi supports Sign in with Apple
            and guest access. For a signed-in workspace, it verifies your Apple
            credentials and links Coach requests to a pseudonymous workspace.
            Trendi does not request your Apple email address. A name you provide
            during sign-in stays on your device. A guest workspace uses a random
            identifier created for that installation.
          </li>
          <li>
            <strong>Creator content sent for AI coaching.</strong> As described
            above, only after you allow AI coaching.
          </li>
          <li>
            <strong>Service records.</strong> These are needed to deliver Coach
            Packs reliably and protect the service, and they are designed not to
            contain your creative text: request digests, delivery and
            acknowledgement status, allowance and rate-limit state, and
            timestamps; the app version and whether a request carried a current
            consent.
          </li>
          <li>
            <strong>Usage totals.</strong> Daily and monthly totals of AI requests
            and estimated cost, which contain no account information or content.
          </li>
          <li>
            <strong>Subscription records.</strong> If you use Trendi Pro, the app
            sends Apple-signed StoreKit transaction and renewal information to the
            Coach service. Trendi verifies the app, product, transaction,
            expiration, revocation and grace period, and uses purchase transaction
            identifiers to run one monthly allowance that belongs to the purchase,
            not to a changeable workspace. Apple processes payment; Trendi never
            receives your payment-card details.
          </li>
          <li>
            <strong>Support messages.</strong> If you contact support, Koinophobia
            Labs processes your email address and whatever you include, in order to
            respond.
          </li>
          <li>
            <strong>Technical data.</strong> Hosting and network providers process
            information such as IP address, request time, device or browser type,
            and diagnostics. The Trendi web pages use Vercel Analytics to
            understand page visits and performance. The iPhone app has no
            third-party analytics or crash-reporting SDK. Its interaction events
            stay on the device and are not sent to an analytics service.
            Koinophobia Labs receives app crash reports only through Apple, if
            you choose to share them with developers.
          </li>
        </ul>
      </section>

      <section>
        <h2>Speech, camera, and recordings</h2>
        <ul>
          <li>
            <strong>Spoken ideas.</strong> Spoken-idea capture uses Apple&apos;s
            Speech framework with on-device recognition, so your audio is
            transcribed on your iPhone. If on-device recognition isn&apos;t
            available for your language, Trendi tells you and doesn&apos;t fall
            back to a server. Trendi sends only the resulting text, never the
            audio, to the Coach service, and only if you&apos;ve allowed AI
            coaching.
          </li>
          <li>
            <strong>Take Two.</strong> Take Two reviews each recording on your
            iPhone: time to the point, pace, filler words and length. Its
            transcription runs on-device only, and nothing from Take Two is
            uploaded.
          </li>
          <li>
            <strong>Recordings.</strong> Video and audio recorded in Trendi stay on
            your device unless you choose to save them to Photos or share them
            through iOS. The Coach service never receives recordings.
          </li>
        </ul>
      </section>

      <section>
        <h2>How Trendi uses information</h2>
        <ul>
          <li>to authenticate you and keep workspaces separate;</li>
          <li>to generate, deliver, replay and recover the Coach Pack you request;</li>
          <li>to personalize coaching from context you chose to provide;</li>
          <li>
            to run free and subscription allowances, retries, spending limits and
            delivery controls;
          </li>
          <li>to confirm that AI requests carry your consent;</li>
          <li>
            to verify subscription status and prevent one purchase from being
            duplicated across workspaces;
          </li>
          <li>to secure, maintain and troubleshoot the service;</li>
          <li>to respond to support, privacy and deletion requests.</li>
        </ul>
      </section>

      <section>
        <h2>Service providers</h2>
        <ul>
          <li>
            <strong>Anthropic</strong> processes the text sent for AI coaching and
            generates the response. It is Trendi&apos;s only AI provider. Anthropic
            says standard commercial API inputs and outputs are deleted
            automatically within 30 days, except where a different arrangement
            applies, the law requires longer retention, or content is kept for
            safety or usage-policy enforcement. Anthropic says flagged inputs and
            outputs may be kept for up to two years, and related trust-and-safety
            classification scores for up to seven years. See Anthropic&apos;s{" "}
            <a href="https://www.anthropic.com/legal/privacy">privacy policy</a>{" "}
            and its{" "}
            <a href="https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data">
              commercial data-retention notice
            </a>
            .
          </li>
          <li>
            <strong>Apple</strong> provides Sign in with Apple, StoreKit purchases
            and subscription management, speech recognition, Photos export and
            system sharing.
          </li>
          <li>
            <strong>Vercel</strong> hosts the Coach service and the web pages.{" "}
            <strong>Vercel Blob</strong> stores private generated Coach results.
          </li>
          <li>
            <strong>Upstash</strong> provides the control store for delivery,
            allowance, rate-limit, spending and related service state.
          </li>
          <li>
            <strong>Google</strong> provides Gmail, which processes support and
            inquiry messages.
          </li>
        </ul>
        <p>
          Koinophobia Labs confirms that every third party Trendi shares user data
          with provides the same or equal protection of user data as described in
          this policy and as required by Apple&apos;s App Review Guidelines. Each
          provider is used only for the purposes described above.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <ul>
          <li>
            <strong>On your device.</strong> Creator profiles, ideas, drafts, plans,
            progress, preferences, recordings and takes stay there until you delete
            them, delete your Trendi account data on that device, or remove the
            app. Copies in device backups are controlled by you and Apple.
          </li>
          <li>
            <strong>Request text.</strong> Trendi does not store the raw request
            text as a separate server record.
          </li>
          <li>
            <strong>Generated Coach results.</strong> A result can reflect your
            text. An unacknowledged result is scheduled for deletion 24 hours after
            delivery. After you first open it, it&apos;s scheduled for deletion at
            the end of a seven-day recovery window. Scheduled cleanup removes due
            results; a service interruption can delay physical deletion.
          </li>
          <li>
            <strong>Service records.</strong> Content-free delivery, allowance,
            idempotency and similar control records can remain for up to 90 days.
            Daily usage and cost totals are kept for up to 90 days. A running
            monthly cost total, which holds no account or content data, is kept to
            enforce the spending limit. Shorter-lived operational records expire
            sooner.
          </li>
          <li>
            <strong>Subscription records.</strong> A subscription-month allowance
            and its purchase transaction identifiers can remain through the
            verified subscription or grace period, plus up to seven days for late
            delivery and refund handling.
          </li>
          <li>
            <strong>Logs.</strong> Limited hosting and security logs are kept
            according to the provider&apos;s settings and legal requirements.
          </li>
          <li>
            <strong>Support messages</strong> are kept as long as reasonably needed
            to respond, keep a record of the request, and meet legal or security
            obligations. You can ask us to delete a message unless it must be kept
            for one of those reasons.
          </li>
        </ul>
      </section>

      <section>
        <h2>Delete your account and data</h2>
        <p>
          <strong>Signed-in accounts.</strong> In Trendi, open{" "}
          <strong>Profile › Account &amp; Workspace</strong>, tap{" "}
          <strong>Delete Account</strong>, and confirm with Apple. Trendi asks you
          to sign in with Apple again for this step. Trendi then:
        </p>
        <ul>
          <li>revokes its Sign in with Apple authorization with Apple;</li>
          <li>
            permanently deletes the account&apos;s Coach results and ordinary
            service records, which overrides the normal retention periods above;
          </li>
          <li>
            deletes the local workspace from the device, clears the session and
            signs you out.
          </li>
        </ul>
        <p>
          If revocation or deletion can&apos;t finish, Trendi tells you and keeps
          your local data so you can try again. It never reports success early.
        </p>
        <p>
          You can also remove Trendi yourself in iPhone{" "}
          <strong>Settings › [your name] › Sign in with Apple</strong> (shown in
          some versions of iOS as Apps Using Apple ID): choose Trendi or
          Koinophobia Labs, then <strong>Stop Using</strong>.
        </p>
        <p>
          <strong>Guest workspaces.</strong> You can use Trendi without an
          account. Your guest workspace stays on this device, including when you
          sign in to a separate Apple-linked workspace and later sign out.
          The in-app Delete Account action is only available for Apple-linked
          accounts; it does not delete your guest workspace. Deleting Trendi from
          your iPhone removes the guest workspace&apos;s local files. It does not
          request deletion of guest Coach results from the service; those expire
          on the schedule above. To ask for earlier deletion,
          email <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
        </p>
        <p>
          <strong>What deletion doesn&apos;t cover.</strong>
        </p>
        <ul>
          <li>
            After deletion, Trendi may keep content-free safeguards for up to 24
            hours, only to stop existing sessions from restoring the deleted
            account. A new Sign in with Apple can create a new Trendi account.
          </li>
          <li>
            Deleting a Trendi account does not cancel an App Store subscription,
            and it can&apos;t erase Apple&apos;s purchase record. Manage or cancel
            Trendi Pro in Apple&apos;s subscription settings. The purchase&apos;s
            limited allowance record can remain as described in Retention.
          </li>
          <li>
            It can&apos;t delete copies you saved to Photos or shared with another
            app. Data a provider has already processed can remain for that
            provider&apos;s stated retention period, or as required for safety or
            law.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>You can:</p>
        <ul>
          <li>
            turn AI coaching on or off, and review what&apos;s shared, in{" "}
            <strong>Profile › AI coaching</strong>;
          </li>
          <li>edit or remove your content in Trendi;</li>
          <li>
            change camera, microphone, speech recognition and Photos permissions in
            iOS Settings;
          </li>
          <li>delete your Trendi account in the app;</li>
          <li>
            restore purchases in Trendi, and manage or cancel Trendi Pro in
            Apple&apos;s subscription settings.
          </li>
        </ul>
        <p>
          For an access, correction, privacy or deletion request, email{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
        </p>
      </section>

      <section>
        <h2>Sale, advertising, and tracking</h2>
        <p>
          Koinophobia Labs does not sell Trendi personal data. Trendi does not use
          app data for advertising, and it doesn&apos;t track you across apps and
          websites owned by other companies.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Trendi uses HTTPS, Apple authentication, device Keychain storage for
          session credentials, private server storage and account-separated access
          controls. No service can guarantee absolute security. Don&apos;t put
          passwords, payment-card details or other secrets in a Coach request.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Trendi is a general creator tool and is not directed to children. If you
          believe a child provided personal information to Trendi, contact us so we
          can investigate and delete it where required.
        </p>
      </section>

      <section>
        <h2>International processing</h2>
        <p>
          Trendi&apos;s service providers may process information in countries
          other than the one you live in. Their privacy and security protections
          apply to that processing, together with applicable law.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          Koinophobia Labs may update this policy when Trendi or its providers
          change. If a change affects what is shared for AI coaching, Trendi asks
          for your permission again in the app. The date at the top identifies the
          current version.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Privacy questions and requests:{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
        </p>
        <p>Trendi · A Koinophobia Labs product</p>
      </section>
    </main>
  );
}
