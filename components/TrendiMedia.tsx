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
              <Image src="/trendi/trendi-mobile.jpg" alt="Trendi mobile interface showing the creator workflow" width={660} height={1434} sizes="(max-width: 900px) 90vw, 700px" />
              <p>The demo video is unavailable. The product screenshot remains available.</p>
            </div>
          ) : (
            <video ref={videoRef} controls muted preload="none" playsInline poster="/trendi/trendi-mobile.jpg" aria-label="Trendi product demo" onError={() => setFailed(true)}>
              <source src="/trendi/trendi-demo-web.mp4" type="video/mp4" />
              <source src="/trendi/trendi-demo.mp4" type="video/mp4; codecs=hevc" />
            </video>
          )}
          <figcaption><strong>Watch the thought become recordable words</strong><span>Real product flow · press play to load</span></figcaption>
        </figure>
        <figure className="trendiLaunch_phoneShot">
          <Image src="/trendi/trendi-home-clean.png" alt="Trendi home screen before a creator captures a messy idea" width={1320} height={2868} sizes="(max-width: 900px) 90vw, 480px" />
          <figcaption><strong>Start here: one messy idea</strong><span>Real TestFlight starting state</span></figcaption>
        </figure>
      </div>
    </div>
  );
}
