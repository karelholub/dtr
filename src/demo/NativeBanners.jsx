import React, { useEffect } from "react";
import { readConsent } from "../tracking";

let sdkLoaded = false;
// SDK banners own their iframe and children. React only owns the empty anchor.
// Reinitialize on navigation: SDK page conditions are evaluated at initialization.
export function useNativeBanners(route) {
  useEffect(() => {
    const refresh = () => {
      if (!sdkLoaded || !window.mpt) return;
      window.mpt("config", { web_banners: { enabled: false } });
      if (readConsent() === "granted") {
        window.mpt("config", { web_banners: { enabled: true } });
      }
    };
    const onLoaded = (event) => {
      if (event.detail !== "loaded") return;
      sdkLoaded = true;
      refresh();
    };
    window.addEventListener("dtr-sdk-status", onLoaded);
    window.addEventListener("dtr-consent-changed", refresh);
    refresh();
    return () => {
      window.removeEventListener("dtr-sdk-status", onLoaded);
      window.removeEventListener("dtr-consent-changed", refresh);
      if (sdkLoaded)
        window.mpt?.("config", { web_banners: { enabled: false } });
    };
  }, [route]);
}

export function NativeBannerSlot() {
  return <div className="container dtr-native-slot" id="dtr-meiro-inpage" />;
}

export function NativeBannerGuide() {
  return (
    <section className="dtr-card">
      <h3>Creative owned by Meiro</h3>
      <p>
        These two examples are HTML Web Banners served by the real Meiro SDK.
        Edit the copy, layout, targeting and caps in Engage → Channels → Web
        Banners, then reload the website.
      </p>
      <ol>
        <li>
          <strong>In-page inspiration:</strong> open the homepage and accept
          analytics cookies. The Mallorca family card appears below the search
          and lifecycle content.
        </li>
        <li>
          <strong>Price-watch popup:</strong> open a hotel and click “So
          funktioniert der Preisalarm” beside the price-watch control.
        </li>
      </ol>
      <p>
        These examples use page and host targeting. The existing lifecycle cards
        use Meiro profile decisions with website-owned layouts. Native banner
        targeting does not use the lifecycle experiment arm.
      </p>
      <p>
        Popup: one impression per SDK session. In-page: five per session. Use a
        fresh private browser session to repeat a capped demonstration. No
        content is substituted locally if Meiro is unavailable or consent is
        declined.
      </p>
      <div className="dtr-actions">
        <a className="primary" href="/">
          Open in-page example
        </a>
        <a className="primary" href="/hotel/red-sea-garden-resort">
          Open popup example
        </a>
        <a
          className="dtr-link"
          href="https://travel.eu1.pipes.meiro.io/channels/web-banners"
          target="_blank"
          rel="noreferrer"
        >
          Edit in Meiro ↗
        </a>
      </div>
      <p>
        Impressions, clicks and closes appear in the native “DTR | 04 Web
        Banners” dashboard. Demo traffic is not measured business uplift.
      </p>
    </section>
  );
}
