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
    <div className="trendi-media-grid">
      <figure className="trendi-video-frame">
        {failed ? (
          <div className="trendi-video-fallback" role="status">
            <Image src="/trendi/trendi-mobile.jpg" alt="Trendi mobile interface showing the creator workflow" width={660} height={1434} sizes="(max-width: 900px) 90vw, 700px" />
            <p>The demo video is unavailable. The product screenshot remains available.</p>
          </div>
        ) : (
          <video ref={videoRef} controls muted preload="none" playsInline poster="/trendi/trendi-mobile.jpg" aria-label="Trendi product demo" onError={() => setFailed(true)}>
            <source src="/trendi/trendi-demo-web.mp4" type="video/mp4" />
            <source src="/trendi/trendi-demo.mp4" type="video/mp4; codecs=hevc" />
          </video>
        )}
        <figcaption>Product demo · loads only when you press play · pauses offscreen</figcaption>
      </figure>
      <figure className="trendi-shot">
        <Image src="/trendi/trendi-mobile.jpg" alt="Trendi mobile interface showing the creator workflow" width={660} height={1434} sizes="(max-width: 900px) 65vw, 300px" />
        <figcaption>Mobile workflow</figcaption>
      </figure>
    </div>
  );
}
