"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const destination = `/danso-app.html${window.location.search}${window.location.hash}`;
    window.location.replace(destination);
  }, []);

  return (
    <main className="handoff" aria-live="polite">
      <span className="handoff-mark" aria-hidden="true">
        簫
      </span>
      <p>단소 운지법 교실을 여는 중입니다.</p>
    </main>
  );
}
