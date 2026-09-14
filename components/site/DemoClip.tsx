"use client";

import { track } from "@vercel/analytics";
import { useEffect, useRef, useState } from "react";
import type { SiteProduct } from "@/lib/products";

/**
 * The key-interaction clip: 15–20 seconds cut from a QA-verified demo master.
 * Plays muted when half visible on Wi-Fi; on cellular or Save-Data it waits
 * for a tap. Captions are HTML, synced to thirds of the clip, so they stay
 * readable and never burn into the evidence. The master is linked for anyone
 * who wants to pause a frame and check.
 */
export default function DemoClip({ product }: { product: SiteProduct }) {
  const demo = product.demo!;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [caption, setCaption] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; type?: string; effectiveType?: string } }).connection;
    const cellular = Boolean(connection?.saveData) || connection?.type === "cellular" || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? "");
    setNeedsTap(cellular);
    if (cellular) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => {
            if (!started.current) {
              started.current = true;
              track("demo_clip_play", { product: product.slug, source: "auto" });
            }
          }).catch(() => setNeedsTap(true));
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [product.slug]);

  const onTime = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const third = Math.min(2, Math.floor((video.currentTime / video.duration) * 3));
    if (third !== caption) setCaption(third);
  };

  const tap = () => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsTap(false);
    video.play().then(() => {
      if (!started.current) {
        started.current = true;
        track("demo_clip_play", { product: product.slug, source: "tap" });
      }
    }).catch(() => setFailed(true));
  };

  return (
    <div className="demo">
      <div className="demo__frame">
        {failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={demo.poster} alt={demo.alt} />
        ) : (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload={needsTap ? "none" : "metadata"}
            poster={demo.poster}
            aria-label={demo.alt}
            onTimeUpdate={onTime}
            onEnded={() => track("demo_clip_complete", { product: product.slug })}
            onError={() => setFailed(true)}
          >
            <source src={demo.srcSmall} type="video/mp4" media="(max-width: 700px)" />
            <source src={demo.src} type="video/mp4" />
          </video>
        )}
        {needsTap && !failed ? (
          <button type="button" onClick={tap} aria-label={`Play the ${product.name} demo, ${demo.seconds} seconds`}>
            <span>Watch it work · {demo.seconds} s</span>
          </button>
        ) : null}
      </div>
      <div className="demo__copy">
        <p className="k">The key interaction · {demo.seconds} seconds · real screen</p>
        <ol className="demo__captions" aria-label="What happens in the clip">
          {demo.captions.map((line, index) => (
            <li key={line} className={index === caption ? "is-on" : undefined}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              {line}
            </li>
          ))}
        </ol>
        <p className="receipt">Cut from {demo.master}. Nothing in the frame is generated.</p>
        <p className="receipt">
          <a href={demo.masterSrc} target="_blank" rel="noreferrer" onClick={() => track("master_link_click", { product: product.slug })}>
            Open the untouched master ↗
          </a>
        </p>
      </div>
    </div>
  );
}
