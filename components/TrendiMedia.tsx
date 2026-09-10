"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function TrendiMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !video.paused) video.pause();
    }, { threshold: 0.15 });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div id="trendi-demo">
      <div className="trendiPage_screens" aria-label="Current App Store screenshots">
        {[
          ["01-say-it-messy", "Capture a rough thought by text or speech"],
          ["03-pick-your-hook", "Choose a hook from your Coach Pack"],
          ["04-own-the-script", "Edit your script in your own words"],
          ["05-press-record", "Record with the on-screen teleprompter"],
        ].map(([name, alt]) => <figure key={name}>
          <Image src={`/trendi/store/${name}.jpg`} alt={alt} width={600} height={1300} sizes="(max-width: 600px) 75vw, (max-width: 900px) 42vw, 24vw" />
          <figcaption>{alt}</figcaption>
        </figure>)}
      </div>
      <details className="trendiPage_archiveDemo">
        <summary>Earlier product walkthrough · July 2026</summary>
        <p>This recording documents an earlier build. The current App Store screenshots above show the released experience; Free and Pro allowances are explained below.</p>
      <div className="trendiLaunch_stage">
      <div className="trendiLaunch_stageBar" aria-hidden="true"><span>EARLIER PRODUCT CAPTURE</span><i /><span>01:1 DEMO</span></div>
      <div className="trendiLaunch_mediaGrid">
        <figure className="trendiLaunch_videoFrame">
          {failed ? (
            <div className="trendiLaunch_videoFallback" role="status">
              <Image src="/trendi/trendi-final-start.jpg" alt="Trendi home screen ready to capture a messy thought" width={886} height={1802} sizes="(max-width: 900px) 90vw, 700px" />
              <p>The demo video is unavailable. The product screenshot remains available.</p>
            </div>
          ) : (
            <video ref={videoRef} controls muted preload="none" playsInline poster="/trendi/trendi-final-start.jpg" aria-label="Trendi product demo showing a messy thought become a recordable creator plan" onError={() => setFailed(true)}>
              <source src="/trendi/trendi-final-demo.mp4" type="video/mp4" />
            </video>
          )}
          <figcaption><strong>From messy thought to a full coach pack</strong><span>July 2026 recording · press play to load</span></figcaption>
        </figure>
        <figure className="trendiLaunch_phoneShot">
          <Image src="/trendi/trendi-final-output.jpg" alt="Trendi coach pack showing an angle, hooks, and a recordable script generated from a messy thought" width={886} height={1802} sizes="(max-width: 900px) 90vw, 480px" />
          <figcaption><strong>A finishable draft, ready to say on camera</strong><span>July 2026 example</span></figcaption>
        </figure>
      </div>
      </div>
      </details>
    </div>
  );
}
