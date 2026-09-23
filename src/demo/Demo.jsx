import React, { useState, useEffect, useRef } from "react";
import { track } from "../tracking";
import { hotels, asset } from "../data";
import { textFor, emailHTML } from "./content";
import {
  newQuote,
  resumeURL,
  emailEligibility,
  priceFor,
  offerKey,
  watchURL,
} from "./model";
import "./demo.css";
const money = (n) =>
  Number(n || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
export function Personalization({ demo, go, search }) {
  const { state: s, decision: d, live } = demo;
  const seen = useRef(new Set());
  useEffect(() => {
    const key = s.run_id + ":" + d.key;
    if (
      live &&
      !["generic", "control", "waiting"].includes(d.key) &&
      !seen.current.has(key)
    ) {
      seen.current.add(key);
      touchpoint(s, d, "web", "impression");
    }
  }, [live, d.key, s.run_id]);
  if (!live || ["generic", "control", "waiting"].includes(d.key)) return null;
  const h =
      hotels.find((h) => h.id === (s.booking || s.quote)?.hotel_id) ||
      hotels.find((h) => h.destination === s.destination) ||
      hotels[0],
    c = textFor(d.key, s.destination);
  return (
    <section className="dtr-personal container" aria-label="Deine Reiseideen">
      <img src={asset(h.image)} alt={s.destination} />
      <div>
        <p className="dtr-eyebrow">{c.eyebrow}</p>
        <h2>{c.title}</h2>
        <p>{c.body}</p>
        <button
          className="primary"
          onClick={() => {
            touchpoint(s, d, "web", "click");
            d.key === "recovery"
              ? location.assign(resumeURL(s.quote))
              : d.key === "price" && s.watch
                ? location.assign(watchURL(s.watch))
                : [
                      "service",
                      "pretrip",
                      "feedback",
                      "care",
                      "cancelled",
                    ].includes(d.key)
                  ? go("/meine-reise")
                  : search(s.destination);
          }}
        >
          {c.cta}
        </button>
      </div>
    </section>
  );
}
export function PriceWatch({ demo, hotel, total, trip }) {
  const [open, setOpen] = useState(false),
    [threshold, setThreshold] = useState(Math.floor(total * 0.95)),
    [permission, setPermission] = useState(false);
  const s = demo.state;
  return (
    <section className="dtr-watch">
      <button className="dtr-link" onClick={() => setOpen(!open)}>
        ♡ Preis beobachten
      </button>
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            demo.act("watch", {
              watch: {
                id: crypto.randomUUID(),
                hotel_id: hotel.id,
                trip,
                offer_key: offerKey(hotel, trip),
                active: true,
                permission,
                threshold: Number(threshold),
                current_price: total,
                expires_at: new Date(
                  new Date(s.clock).getTime() + 30 * 86400000,
                ).toISOString(),
              },
            });
            setOpen(false);
          }}
        >
          <label>
            Dein Preislimit für die gesamte Reise (€)
            <input
              type="number"
              min="1"
              required
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
          <label className="dtr-checkbox">
            <input
              type="checkbox"
              required
              checked={permission}
              onChange={(e) => setPermission(e.target.checked)}
            />
            Ich möchte Preisalarme für dieses Demo-Angebot erhalten. Es erfolgt
            kein Versand.
          </label>
          <button className="primary">Preisalarm speichern</button>
        </form>
      )}
      {s.watch?.active && s.watch.hotel_id === hotel.id && (
        <p role="status">
          Preisalarm bis {money(s.watch.threshold)} gespeichert.{" "}
          <button
            className="dtr-link"
            onClick={() =>
              demo.act("watch", { watch: { ...s.watch, active: false } })
            }
          >
            Beenden
          </button>
        </p>
      )}
    </section>
  );
}
export function TripHub({ demo, search }) {
  const s = demo.state,
    b = s.booking;
  const [rating, setRating] = useState("5");
  return (
    <section className="container dtr-hub">
      <p className="dtr-eyebrow">DEIN URLAUB. DEINE WELT.</p>
      <h1>Meine Reise</h1>
      <p className="dtr-muted">
        Synthetische Demo · keine Buchung oder Zahlung
      </p>
      {b ? (
        <>
          <div className="dtr-trip-grid">
            <article className="dtr-card">
              <img
                className="dtr-trip-photo"
                src={asset(
                  (hotels.find((h) => h.id === b.hotel_id) || hotels[0]).image,
                )}
                alt={b.destination}
              />
              <h2>{b.hotel}</h2>
              <p>
                {new Date(b.start).toLocaleDateString("de-DE")} –{" "}
                {new Date(b.end).toLocaleDateString("de-DE")}
              </p>
              <p>
                {b.room} · {b.board}
              </p>
              <p>
                {b.adults} Erwachsene · {b.children} Kinder
              </p>
              <strong>{money(b.total)}</strong>
              <p>
                Status:{" "}
                {{
                  booked: "Bestätigt",
                  cancelled: "Storniert",
                  completed: "Abgeschlossen",
                }[s.stage] || s.stage}
              </p>
            </article>
            <article className="dtr-card">
              <h2>Gut vorbereitet</h2>
              <p>Deine Checkliste für die Reise.</p>
              {[
                "Reisedokumente prüfen",
                "Einreisebestimmungen prüfen",
                "Gepäck und Anreise planen",
              ].map((t) => (
                <label className="dtr-checkbox" key={t}>
                  <input type="checkbox" />
                  {t}
                </label>
              ))}
              {s.complaint && (
                <div role="status" className="dtr-notice">
                  <strong>Dein Anliegen wird bearbeitet.</strong>
                  <p>Werbliche Reiseangebote sind pausiert.</p>
                  <button
                    className="dtr-link"
                    onClick={() =>
                      demo.act("case_closed", { complaint: false })
                    }
                  >
                    Demo-Anliegen schließen
                  </button>
                </div>
              )}
              {!s.complaint && s.stage === "booked" && (
                <button
                  className="dtr-link"
                  onClick={() => demo.act("case_opened", { complaint: true })}
                >
                  Demo-Anliegen eröffnen
                </button>
              )}
            </article>
          </div>
          {s.stage === "booked" &&
            !s.complaint &&
            new Date(s.clock) < new Date(b.start) && (
              <article className="dtr-card dtr-extra">
                <div>
                  <p className="dtr-eyebrow">PASSEND ZU DEINER REISE</p>
                  <h2>Entspannt vom Flughafen zum Hotel</h2>
                  <p>
                    {s.extras.includes("transfer")
                      ? "Dein Transfer ist bereits enthalten."
                      : "Ein Flughafentransfer ist in deiner Demo-Buchung noch nicht enthalten."}
                  </p>
                </div>
                {!s.extras.includes("transfer") && (
                  <button
                    className="primary"
                    onClick={() =>
                      demo.act("extra", { extra: "transfer", value: 79 })
                    }
                  >
                    Transfer ergänzen · 79 € (Demo)
                  </button>
                )}
              </article>
            )}
          {s.stage === "completed" && !s.feedback && (
            <form
              className="dtr-card"
              onSubmit={(e) => {
                e.preventDefault();
                demo.act("feedback", { rating: Number(rating) });
              }}
            >
              <h2>Wie war dein Urlaub?</h2>
              <label>
                Deine Bewertung
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} von 5
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary">Feedback speichern</button>
            </form>
          )}
          {s.feedback && <p role="status">Danke für dein Feedback.</p>}
        </>
      ) : (
        <div className="dtr-card">
          <h2>Deine nächste Reise beginnt hier</h2>
          <p>Nach deiner Demo-Buchung findest du hier alle Details.</p>
          <button className="primary" onClick={() => search(s.destination)}>
            Urlaub finden
          </button>
        </div>
      )}
      <article className="dtr-card">
        <h2>Deine Kommunikationswünsche</h2>
        <label className="dtr-checkbox">
          <input
            type="checkbox"
            checked={s.email_permission}
            onChange={(e) =>
              demo.act("permission", { email_permission: e.target.checked })
            }
          />
          Personalisierte Reiseideen und E-Mail-Vorschauen erlauben
        </label>
        <label className="dtr-checkbox">
          <input
            type="checkbox"
            checked={s.ads_permission}
            onChange={(e) =>
              demo.act("permission", { ads_permission: e.target.checked })
            }
          />
          Demo-Zielgruppen für passende Werbung erlauben (kein Export)
        </label>
      </article>
    </section>
  );
}
export function Presenter({ demo, go }) {
  const { state: s, act, reset, decision: d, live, status } = demo;
  const [open, setOpen] = useState(location.pathname === "/demo"),
    [tab, setTab] = useState("story"),
    [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", close);
    };
  }, [open]);
  const h =
    hotels.find((h) => h.id === (s.booking || s.quote)?.hotel_id) ||
    hotels.find((h) => h.destination === s.destination) ||
    hotels[0];
  const trip = {
    destination: s.destination,
    start: new Date(new Date(s.clock).getTime() + 10 * 86400000)
      .toISOString()
      .slice(0, 10),
    end: new Date(new Date(s.clock).getTime() + 17 * 86400000)
      .toISOString()
      .slice(0, 10),
    adults: 2,
    children: 0,
    room: "Doppelzimmer Standard",
    board: "All Inclusive",
    travelType: "Flug und Hotel",
    departure: "Frankfurt",
  };
  const localEligibility = emailEligibility(s, d);
  const eligibility = live
    ? demo.emailEligibility
      ? { ...localEligibility, ...demo.emailEligibility }
      : { allowed: false, reason: "Waiting for Meiro message eligibility" }
    : localEligibility;
  function seedBooking() {
    const q = s.quote || newQuote(h, trip, s);
    act("purchase", {
      booking: { ...q, id: "DTR-" + crypto.randomUUID(), quote_id: q.id },
      value: q.total,
    });
  }
  return (
    <>
      <button
        className="dtr-demo-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Meiro · Demo Studio
      </button>
      {open && (
        <aside className="dtr-studio" aria-label="Meiro Demo Studio">
          <div className="dtr-studio-head">
            <div>
              <p className="dtr-eyebrow">DERTOUR × MEIRO</p>
              <h2>From inspiration to the next trip</h2>
            </div>
            <button
              className="dtr-close"
              aria-label="Close demo studio"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <p className="dtr-notice">
            Synthetic demo · accelerated time · website and email previews only
          </p>
          <div className="dtr-tabs">
            {[
              ["story", "Journey"],
              ["email", "Email previews"],
              ["value", "Value & reporting"],
            ].map(([key, title]) => (
              <button
                key={key}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                {title}
              </button>
            ))}
          </div>
          {tab === "story" && (
            <>
              <div className="dtr-columns">
                <section>
                  <label>
                    Start a new synthetic scenario
                    <select
                      aria-label="Start a new synthetic scenario"
                      value={s.persona}
                      onChange={(e) => reset(e.target.value)}
                    >
                      <option value="researcher">Researcher</option>
                      <option value="vip">Frequent traveler</option>
                      <option value="lapsed">Lapsed traveler</option>
                    </select>
                  </label>
                  <button className="dtr-link" onClick={() => reset(s.persona)}>
                    Reset this scenario
                  </button>
                  <p className="dtr-muted">
                    Reset creates a new run, preserving previous run outcomes
                    for reporting.
                  </p>
                  <label>
                    Experiment arm
                    <select
                      aria-label="Experiment arm"
                      value={s.experiment}
                      onChange={(e) =>
                        act("assignment", { experiment: e.target.value })
                      }
                    >
                      <option value="treatment">Treatment</option>
                      <option value="control">Control</option>
                    </select>
                  </label>
                  <p className="dtr-muted">
                    Assignment is persistent within a run. Manual override is
                    for demonstrations, not an experiment result.
                  </p>
                  <label>
                    Destination
                    <select
                      aria-label="Destination"
                      value={s.destination}
                      onChange={(e) =>
                        act("search", { destination: e.target.value })
                      }
                    >
                      {[...new Set(hotels.map((h) => h.destination))].map(
                        (t) => (
                          <option key={t}>{t}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="dtr-checkbox">
                    <input
                      type="checkbox"
                      checked={s.email_permission}
                      onChange={(e) =>
                        act("permission", {
                          email_permission: e.target.checked,
                        })
                      }
                    />
                    Synthetic marketing permission
                  </label>
                  <label className="dtr-checkbox">
                    <input
                      type="checkbox"
                      checked={s.ads_permission}
                      onChange={(e) =>
                        act("permission", { ads_permission: e.target.checked })
                      }
                    />
                    Synthetic paid-media permission
                  </label>
                </section>
                <section>
                  <p className="dtr-eyebrow">DECISION EXPLAINER</p>
                  <h3>{d.key}</h3>
                  <p>{d.reason}</p>
                  <span className={"dtr-status " + (live ? "live" : "")}>
                    {live
                      ? "Live Meiro decision"
                      : "Local rule preview · not live Meiro"}
                  </span>
                  <p className="dtr-muted">{status}</p>
                  <dl>
                    <dt>Lifecycle</dt>
                    <dd>{s.stage}</dd>
                    <dt>Media eligibility</dt>
                    <dd>
                      {!s.ads_permission
                        ? "Suppressed: no permission"
                        : s.booking
                          ? "Exclude from acquisition / recovery"
                          : "Eligible research audience (simulation)"}
                    </dd>
                    <dt>Email preview</dt>
                    <dd>
                      {eligibility.allowed ? "Eligible" : eligibility.reason}
                    </dd>
                    <dt>Run</dt>
                    <dd className="dtr-id">{s.run_id}</dd>
                  </dl>
                </section>
              </div>
              <section className="dtr-actions">
                <h3>Walk through the lifecycle</h3>
                <button
                  onClick={() => {
                    act("search", { destination: s.destination });
                    go("/");
                  }}
                >
                  1 · Research destination
                </button>
                <button
                  onClick={() =>
                    act("checkout", { quote: newQuote(h, trip, s) })
                  }
                >
                  2 · Start a saved quote
                </button>
                <button onClick={() => act("advance", { hours: 0.5 })}>
                  3 · Leave for 30 minutes
                </button>
                <button
                  onClick={() => {
                    seedBooking();
                    go("/meine-reise");
                  }}
                >
                  4 · Confirm demo booking
                </button>
                <button disabled={!s.booking} onClick={() => act("complete")}>
                  5 · Complete trip
                </button>
                <button disabled={!s.booking} onClick={() => act("cancel")}>
                  Cancel trip
                </button>
                <button
                  onClick={() =>
                    act("case_opened", { complaint: !s.complaint })
                  }
                >
                  {s.complaint ? "Close service case" : "Open service case"}
                </button>
              </section>
              <section className="dtr-actions">
                <h3>Demo clock</h3>
                <p>{new Date(s.clock).toLocaleString("en-GB")}</p>
                {[2, 24, 48].map((hours) => (
                  <button key={hours} onClick={() => act("advance", { hours })}>
                    +{hours} hours
                  </button>
                ))}
                <h3>Price watch scene</h3>
                <button
                  onClick={() =>
                    act("watch", {
                      watch: {
                        id: crypto.randomUUID(),
                        hotel_id: h.id,
                        trip,
                        offer_key: offerKey(h, trip),
                        active: true,
                        permission: true,
                        threshold: 1000,
                        current_price: 1200,
                        expires_at: new Date(
                          new Date(s.clock).getTime() + 30 * 86400000,
                        ).toISOString(),
                      },
                    })
                  }
                >
                  Seed explicit price watch
                </button>
                <button
                  disabled={!s.watch?.active}
                  onClick={() =>
                    act("price_changed", {
                      watch: { ...s.watch, current_price: 950 },
                    })
                  }
                >
                  Simulate price drop to €950
                </button>
              </section>
            </>
          )}
          {tab === "email" && (
            <>
              <h3>Decision-based email preview</h3>
              <p>
                Previewing records the step and respects the shared demo
                frequency cap. Nothing is sent.
              </p>
              <button
                className="primary"
                disabled={!eligibility.allowed}
                onClick={() => {
                  setPreview({ key: d.key, state: s });
                  touchpoint(s, d, "email", "preview");
                  act("contact", {
                    key:
                      eligibility.key ||
                      `${d.key}:${s.booking?.id || s.quote?.id || s.watch?.id || s.run_id}`,
                    marketing: d.marketing,
                  });
                }}
              >
                Preview eligible email
              </button>
              {!eligibility.allowed && <p>{eligibility.reason}</p>}
              <details>
                <summary>
                  Template gallery (design preview only; bypasses eligibility)
                </summary>
                <div className="dtr-actions">
                  {[
                    "research",
                    "recovery",
                    "price",
                    "pretrip",
                    "service",
                    "feedback",
                    "rebook",
                    "vip",
                    "winback",
                    "care",
                    "cancelled",
                  ].map((key) => (
                    <button
                      key={key}
                      onClick={() => setPreview({ key, state: s })}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </details>
              {preview && (
                <>
                  <p className="dtr-muted">
                    {preview.key} · content snapshot at preview time
                  </p>
                  <iframe
                    title="DERTOUR email preview"
                    className="dtr-email"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    srcDoc={emailHTML(
                      preview.key,
                      preview.state,
                      h,
                      location.origin,
                    )}
                  />
                </>
              )}
            </>
          )}
          {tab === "value" && (
            <>
              <p>
                Meiro dashboards show synthetic demo activity. They do not
                establish DERTOUR performance or causal lift.
              </p>
              <div className="dtr-actions">
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://travel.eu1.pipes.meiro.io/reporting"
                >
                  Open Meiro reporting ↗
                </a>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://travel.eu1.pipes.meiro.io/goals"
                >
                  Open Meiro goals ↗
                </a>
              </div>
              <div className="dtr-metrics">
                <div>
                  <small>Current run net booking value</small>
                  <strong>
                    {money(s.stage === "cancelled" ? 0 : s.booking?.total)}
                  </strong>
                </div>
                <div>
                  <small>Ancillary contribution (demo)</small>
                  <strong>
                    {money(s.stage === "cancelled" ? 0 : s.extras.length * 24)}
                  </strong>
                </div>
                <div>
                  <small>Actual media spend</small>
                  <strong>Not connected</strong>
                </div>
              </div>
              <ROI />
              <h3>Measurement contract</h3>
              <p>
                Persistent profile holdouts, deduplicated booking IDs,
                cancellation-adjusted value and separate service and marketing
                outcomes. An attributed booking is not automatically an
                incremental booking.
              </p>
              <p>
                Paid audiences are eligibility previews. No ad platform export
                or spend saving is claimed. Predictive timing and dynamic
                packaging remain outside the validated core demo.
              </p>
            </>
          )}
        </aside>
      )}
    </>
  );
}
function touchpoint(s, d, channel, action) {
  track("dtr_touchpoint", {
    synthetic: true,
    demo_site: "dertour",
    event_id: crypto.randomUUID(),
    run_id: s.run_id,
    decision: d.key,
    channel,
    action,
    experiment: s.experiment,
    destination: s.destination,
  });
}
function ROI() {
  const [t, setT] = useState(4000),
    [tb, setTb] = useState(160),
    [c, setC] = useState(1000),
    [cb, setCb] = useState(30),
    [aov, setAov] = useState(2000),
    [margin, setMargin] = useState(12),
    [cost, setCost] = useState(4000);
  const inc = t > 0 && c > 0 ? t * (tb / t - cb / c) : null,
    contribution = inc === null ? null : (inc * aov * margin) / 100;
  return (
    <section className="dtr-card">
      <p className="dtr-eyebrow">
        ILLUSTRATIVE BUSINESS CASE · NOT MEASURED RESULTS
      </p>
      <h3>What would incremental value look like?</h3>
      <div className="dtr-roi-inputs">
        {[
          ["Treatment travelers", t, setT],
          ["Treatment bookings", tb, setTb],
          ["Control travelers", c, setC],
          ["Control bookings", cb, setCb],
          ["Net booking value (€)", aov, setAov],
          ["Contribution margin (%)", margin, setMargin],
          ["Total intervention cost (€)", cost, setCost],
        ].map(([label, value, set]) => (
          <label key={label}>
            {label}
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => set(Number(e.target.value))}
            />
          </label>
        ))}
      </div>
      <div className="dtr-metrics">
        <div>
          <small>Incremental bookings</small>
          <strong>{inc?.toFixed(1) ?? "—"}</strong>
        </div>
        <div>
          <small>Incremental contribution</small>
          <strong>{contribution === null ? "—" : money(contribution)}</strong>
        </div>
        <div>
          <small>Illustrative ROI</small>
          <strong>
            {cost > 0 && contribution !== null
              ? `${(((contribution - cost) / cost) * 100).toFixed(0)}%`
              : "—"}
          </strong>
        </div>
      </div>
      <p className="dtr-muted">
        Hypothetical inputs, no statistical significance claimed. ROI =
        (incremental contribution − intervention cost) / cost. ROAS requires
        actual ad spend and attributed net revenue.
      </p>
    </section>
  );
}
