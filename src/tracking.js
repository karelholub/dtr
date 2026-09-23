const ENDPOINT =
  import.meta.env.VITE_MEIRO_ENDPOINT ||
  "https://travel.eu1.pipes.meiro.io/collect/dertour-demo-web";
const SCRIPT =
  import.meta.env.VITE_MEIRO_SDK_URL ||
  "https://travel.eu1.pipes.meiro.io/mpt.js";
let started = false;
export const readConsent = () => localStorage.getItem("dtr-consent");
export function startTracking() {
  if (started || readConsent() !== "granted") return;
  started = true;
  window.mpt =
    window.mpt ||
    function () {
      (window.mpt.q = window.mpt.q || []).push(Array.from(arguments));
    };
  window.mpt("config", {
    collection_endpoint: ENDPOINT,
    link_tracking: { enabled: false },
    tracking_rules: { enabled: false },
  });
  window.mpt("consent", {
    storage_persistence: "granted",
    user_id: "granted",
    session_id: "granted",
  });
  window.mpt("set", { demo: true, demo_site: "dertour" });
  const script = document.createElement("script");
  script.src = SCRIPT;
  script.async = true;
  script.onerror = () =>
    window.dispatchEvent(
      new CustomEvent("dtr-sdk-status", { detail: "unavailable" }),
    );
  script.onload = () =>
    window.dispatchEvent(
      new CustomEvent("dtr-sdk-status", { detail: "loaded" }),
    );
  document.head.appendChild(script);
}
export function setConsent(granted) {
  localStorage.setItem("dtr-consent", granted ? "granted" : "denied");
  if (granted) {
    startTracking();
    window.mpt("consent", {
      storage_persistence: "granted",
      user_id: "granted",
      session_id: "granted",
    });
  } else if (started)
    window.mpt("consent", {
      storage_persistence: "denied",
      user_id: "denied",
      session_id: "denied",
    });
}
export function track(name, payload = {}) {
  if (readConsent() !== "granted") return;
  startTracking();
  let event = {
    demo: true,
    demo_site: "dertour",
    page_location: location.href,
    page_title: document.title,
    ...payload,
  };
  if (name === "page_view")
    event = {
      page_title: document.title,
      url: location.href,
      referrer: document.referrer,
    };
  if (name === "form_submit") event = { form_id: payload.form_id };
  window.mpt("event", name, event);
  // This bounded log lets demo operators inspect what was sent without exposing identifiers.
  window.__dtrEvents = [
    ...(window.__dtrEvents || []).slice(-49),
    { name, payload: event },
  ];
}
export function item(hotel, value = hotel.price) {
  return {
    item_id: hotel.id,
    item_name: hotel.name,
    item_category: "hotel",
    item_category2: hotel.destination,
    price: value,
    quantity: 1,
  };
}
