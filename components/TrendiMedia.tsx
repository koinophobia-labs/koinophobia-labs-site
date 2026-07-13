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
    <div className="trendiLaunch_stage" id="trendi-demo">
      <div className="trendiLaunch_stageBar" aria-hidden="true"><span>LIVE PRODUCT CAPTURE</span><i /><span>01:1 DEMO</span></div>
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
          <figcaption><strong>From messy thought to a full coach pack</strong><span>Real product flow · press play to load</span></figcaption>
        </figure>
        <figure className="trendiLaunch_phoneShot">
          <Image src="/trendi/trendi-final-output.jpg" alt="Trendi coach pack showing an angle, hooks, and a recordable script generated from a messy thought" width={886} height={1802} sizes="(max-width: 900px) 90vw, 480px" />
          <figcaption><strong>A finishable draft, ready to say on camera</strong><span>Real generated output</span></figcaption>
        </figure>
      </div>
    </div>
  );
}
