"use client";

import { useState } from "react";

export default function ProductVideo() {
  const [failed, setFailed] = useState(false);
  return <figure className="releasedApp__commercial">
    <video controls playsInline preload="metadata" poster="/forget-about-it/commercial-poster.jpg"
      aria-label="Forget About It launch commercial, a dramatized bus scene"
      onError={() => setFailed(true)}>
      <source src="/forget-about-it/commercial.mp4" type="video/mp4" />
    </video>
    <figcaption>Launch commercial · dramatized scene. The app screenshots below show the actual interface.</figcaption>
    {failed ? <p role="status">The commercial could not load. <a href="/forget-about-it/commercial.mp4">Open the video directly</a>, or explore the app screenshots below.</p> : null}
  </figure>;
}
