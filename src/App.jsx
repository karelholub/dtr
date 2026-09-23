import React, { useState, useEffect, useRef } from "react";
import { asset, destinations, hotels, collections, brands } from "./data";
import {
  track,
  item,
  readConsent,
  setConsent,
  startTracking,
} from "./tracking";
const euro = (n) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
const date = (s) =>
  new Date(s + "T12:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
function Icon({ name, size = 22, ...props }) {
  const paths = {
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="17" rx="2" />
        <path d="M7 2v6m10-6v6M3 11h18" />
      </>
    ),
    plane: <path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l11-11" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    check: <path d="m4 12 5 5L20 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 5 10 8L22 5" />
      </>
    ),
    menu: <path d="M3 5h18M3 12h18M3 19h18" />,
    search: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m15 15 7 7" />
      </>
    ),
    filter: (
      <>
        <path d="M3 6h18M3 12h18M3 18h18" />
        <path d="M8 3v6m8 0v6M7 15v6" />
      </>
    ),
    tag: (
      <>
        <path d="M3 3h8l11 11-8 8L3 11Z" />
        <circle cx="7" cy="7" r="1" />
      </>
    ),
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
      </>
    ),
    edit: (
      <>
        <path d="m4 15 12-12 5 5L9 20l-6 1Z" />
        <path d="m14 5 5 5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.sun}
    </svg>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current.querySelectorAll(
          'button,input,select,a[href],[tabindex="0"]',
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = old;
      before?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            aria-label="Schließen"
            className="icon-button"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function App() {
  const params = new URLSearchParams(
    location.search || sessionStorage.getItem("dtr-trip") || "",
  );
  const [route, setRoute] = useState(location.pathname),
    [destination, setDestination] = useState(
      params.get("destination") || "Mallorca",
    ),
    [departure, setDeparture] = useState(
      params.get("departure") || "Alle Flughäfen",
    ),
    [start, setStart] = useState(params.get("start") || "2026-10-20"),
    [end, setEnd] = useState(params.get("end") || "2026-10-27"),
    [adults, setAdults] = useState(Number(params.get("adults")) || 2),
    [children, setChildren] = useState(Number(params.get("children")) || 0),
    [travelType, setTravelType] = useState(
      params.get("travelType") || "Flug und Hotel",
    );
  const [modal, setModal] = useState(null),
    [saved, setSaved] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("dtr-saved") || "[]");
      } catch {
        return [];
      }
    }),
    [consent, setConsentState] = useState(readConsent()),
    [cookieOpen, setCookieOpen] = useState(!readConsent()),
    [sort, setSort] = useState("recommended"),
    [family, setFamily] = useState(false),
    [budget, setBudget] = useState(2500),
    [stars, setStars] = useState(false),
    [board, setBoard] = useState(params.get("board") || "Halbpension"),
    [room, setRoom] = useState(params.get("room") || "Doppelzimmer Standard"),
    [tab, setTab] = useState("Angebot"),
    [notice, setNotice] = useState(""),
    [gallery, setGallery] = useState(0),
    [booking, setBooking] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem("dtr-booking") || "null");
      } catch {
        return null;
      }
    });
  useEffect(() => {
    sessionStorage.setItem(
      "dtr-trip",
      new URLSearchParams({
        destination,
        departure,
        start,
        end,
        adults,
        children,
        travelType,
        board,
        room,
      }).toString(),
    );
  }, [
    destination,
    departure,
    start,
    end,
    adults,
    children,
    travelType,
    board,
    room,
  ]);
  const hotel = hotels.find((h) => route.includes(h.id)) || hotels[0];
  const nights = Math.max(
    1,
    Math.round((new Date(end) - new Date(start)) / 86400000),
  );
  const pp =
    hotel.price +
    (board === "All Inclusive" ? 177 : board === "Halbpension Plus" ? 51 : 0) +
    (room === "Doppelzimmer Superior" ? 30 : 0) -
    (travelType === "Nur Hotel" ? 176 : 0);
  const total = pp * (adults + children * 0.65);
  function go(path) {
    history.pushState({}, "", path);
    setRoute(path.split("?")[0]);
    window.scrollTo({ top: 0 });
    setModal(null);
  }
  useEffect(() => {
    const pop = () => {
      setRoute(location.pathname);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", pop);
    startTracking();
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    document.title =
      (route.includes("/hotel/")
        ? hotel.name
        : route === "/angebote"
          ? "Urlaubsangebote"
          : route === "/merkzettel"
            ? "Dein Merkzettel"
            : "Macht Urlaub") + " | DERTOUR Demo";
    track("page_view", { page_path: route });
    if (route.includes("/hotel/"))
      track("view_item", {
        currency: "EUR",
        value: hotel.price,
        items: [item(hotel)],
      });
    if (route === "/angebote")
      track("view_search_results", {
        search_term: destination,
        items: hotels
          .filter((h) => h.destination === destination)
          .map((h) => item(h)),
      });
  }, [route, destination]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  function search(dest = destination) {
    setDestination(dest);
    track("search", {
      search_term: dest,
      destination: dest,
      departure_airport: departure,
      start_date: start,
      end_date: end,
      adults,
      children,
      travel_type: travelType,
    });
    go(
      `/angebote?destination=${encodeURIComponent(dest)}&start=${start}&end=${end}&adults=${adults}&children=${children}`,
    );
  }
  function favourite(h) {
    const added = !saved.includes(h.id);
    const next = added ? [...saved, h.id] : saved.filter((s) => s !== h.id);
    setSaved(next);
    localStorage.setItem("dtr-saved", JSON.stringify(next));
    if (added)
      track("add_to_wishlist", {
        currency: "EUR",
        value: h.price,
        items: [item(h)],
      });
    setNotice(
      added
        ? "Hotel auf deinem Merkzettel gespeichert"
        : "Hotel vom Merkzettel entfernt",
    );
  }
  function chooseConsent(granted) {
    setConsent(granted);
    setConsentState(granted ? "granted" : "denied");
    setCookieOpen(false);
    if (granted) track("page_view", { page_path: route });
  }
  function openHotel(h) {
    track("select_item", {
      item_list_name: "Suchergebnisse",
      items: [item(h)],
    });
    setBoard("Halbpension");
    setRoom("Doppelzimmer Standard");
    go("/hotel/" + h.id);
  }
  function checkout() {
    track("begin_checkout", {
      currency: "EUR",
      value: total,
      items: [item(hotel, total)],
      destination,
      start_date: start,
      end_date: end,
      adults,
      children,
    });
    go("/buchung/" + hotel.id);
  }
  const results = hotels.filter(
    (h) =>
      h.destination === destination &&
      (!family || h.family) &&
      h.price <= budget &&
      (!stars || h.stars >= 4),
  );
  if (sort === "price") results.sort((a, b) => a.price - b.price);
  if (sort === "rating") results.sort((a, b) => b.rating - a.rating);
  const SearchBox = ({ compact = false }) => (
    <div className={"search-box " + (compact ? "compact" : "")}>
      <div className="search-tabs">
        {[
          "Nur Hotel",
          "Flug und Hotel",
          "Rundreisen",
          "% Deals",
          "Bahn und Hotel",
          "Mietwagen",
          "Kreuzfahrten",
          "Wohnmobil",
          "Sportevents",
        ].map((t) => (
          <button
            className={travelType === t ? "active" : ""}
            key={t}
            onClick={() => {
              if (!["Nur Hotel", "Flug und Hotel"].includes(t)) {
                setModal("roundtrip");
              } else setTravelType(t);
            }}
          >
            {t === "Flug und Hotel" && <Icon name="plane" size={18} />} {t}
          </button>
        ))}
      </div>
      <form
        className="search-fields"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <button
          className="search-field"
          type="button"
          onClick={() => setModal("destination")}
        >
          <Icon name="pin" />
          <span>
            <small>Reiseziel, Region oder Hotel</small>
            <strong>{destination || "Wohin soll es gehen?"}</strong>
          </span>
        </button>
        {travelType !== "Nur Hotel" && (
          <button
            type="button"
            className="search-field"
            onClick={() => setModal("airport")}
          >
            <Icon name="plane" />
            <span>
              <small>Abflughafen</small>
              <strong>{departure}</strong>
            </span>
          </button>
        )}
        <button
          type="button"
          className="search-field date-field"
          onClick={() => setModal("dates")}
        >
          <Icon name="calendar" />
          <span>
            <small>Reisezeitraum · {nights} Nächte</small>
            <strong>
              {date(start)} – {date(end)}
            </strong>
          </span>
        </button>
        <button
          type="button"
          className="search-field"
          onClick={() => setModal("travellers")}
        >
          <Icon name="user" />
          <span>
            <small>Reisende</small>
            <strong>
              {adults} Erwachsene{children > 0 ? `, ${children} Kinder` : ""}
            </strong>
          </span>
        </button>
        <button className="primary search-submit" type="submit">
          Reise finden <Icon name="arrow" size={20} />
        </button>
      </form>
    </div>
  );
  const HotelCard = ({ h }) => (
    <article className="hotel-card">
      <div className="hotel-photo">
        <button
          className="photo-link"
          aria-label={`${h.name} ansehen`}
          onClick={() => openHotel(h)}
        >
          <img
            src={asset(h.image)}
            alt={`${h.name} – Hotelansicht`}
            loading="lazy"
          />
        </button>
        <button
          className={"save-button " + (saved.includes(h.id) ? "saved" : "")}
          aria-label={
            saved.includes(h.id) ? `${h.name} entfernen` : `${h.name} merken`
          }
          onClick={() => favourite(h)}
        >
          <Icon name="heart" />
        </button>
        {h.family && <span className="photo-tag">Für Familien</span>}
      </div>
      <div className="hotel-info">
        <small>
          {h.country || "Spanien"} · {h.destination} · {h.town}
        </small>
        <button className="hotel-title" onClick={() => openHotel(h)}>
          <h2>{h.name}</h2>
        </button>
        <div className="stars">{"◆".repeat(h.stars)}</div>
        <div className="review">
          <b>{h.rating}%</b>
          <strong>Weiterempfehlung</strong>
          <span>({h.reviews.toLocaleString("de-DE")} Bewertungen)</span>
        </div>
        <div className="amenities">
          {h.amenities.map((a) => (
            <span key={a}>
              <Icon name="check" size={14} />
              {a}
            </span>
          ))}
        </div>
      </div>
      <div className="hotel-price">
        <span>
          {travelType === "Nur Hotel" ? "Eigene Anreise" : "Inklusive Flug"} ·{" "}
          {nights} Nächte
        </span>
        <span>Doppelzimmer · Halbpension</span>
        <small>Preis pro Person ab</small>
        <strong>
          {euro(h.price - (travelType === "Nur Hotel" ? 176 : 0))}
        </strong>
        <span>
          Gesamt ab{" "}
          {euro((h.price - (travelType === "Nur Hotel" ? 176 : 0)) * adults)}
        </span>
        <button className="primary" onClick={() => openHotel(h)}>
          Hotel ansehen <Icon name="arrow" size={18} />
        </button>
      </div>
    </article>
  );
  return (
    <>
      <header>
        <div className="header-inner">
          <button
            className="logo-button"
            aria-label="DERTOUR Startseite"
            onClick={() => go("/")}
          >
            <img src={asset("9f6850839ecbff3f.svg")} alt="DERTOUR" />
          </button>
          <div className="header-right">
            <div className="utility">
              <button onClick={() => setModal("agency")}>
                <Icon name="pin" size={18} />
                <span>Reisebüro finden</span>
              </button>
              <button onClick={() => setModal("newsletter")}>
                <Icon name="mail" size={18} />
                <span>Newsletter</span>
              </button>
              <button onClick={() => go("/merkzettel")}>
                <Icon name="heart" size={18} />
                <span>
                  Merkzettel{saved.length ? ` (${saved.length})` : ""}
                </span>
              </button>
              <button onClick={() => setModal("account")}>
                <Icon name="user" size={18} />
                <span>Mein DERTOUR</span>
              </button>
              <button
                className="mobile-menu"
                aria-label="Menü öffnen"
                onClick={() => setModal("menu")}
              >
                <Icon name="menu" />
              </button>
            </div>
            <nav aria-label="Hauptnavigation">
              {[
                "Urlaub suchen",
                "Aktuelles & Angebote",
                "Reiseziele",
                "Reisemagazin",
                "Service",
              ].map((label, i) => (
                <button
                  key={label}
                  onClick={() => {
                    if (i === 0) search();
                    else if (i === 1) {
                      go("/");
                      setTimeout(
                        () =>
                          document
                            .getElementById("inspiration")
                            ?.scrollIntoView({ behavior: "smooth" }),
                        30,
                      );
                    } else
                      setModal(
                        ["", "", "destination", "magazine", "service"][i],
                      );
                  }}
                >
                  {label}
                  <span>⌄</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <button className="promo" onClick={() => setModal("newsletter")}>
        Jetzt anmelden & Gutschein für bis zu 500 € Sofortrabatt sichern!{" "}
        <strong>
          Mehr Infos hier <span>›</span>
        </strong>
      </button>
      <main>
        {route === "/" && (
          <>
            <div className="hero">
              <img
                className="hero-photo"
                src={asset("13011aeacd070bdf.webp")}
                alt="Macht Urlaub – entspannte Auszeit mit DERTOUR"
              />
              <img
                className="hero-badge"
                src={asset("c1655a7228639bd1.webp")}
                alt="Bis zu 40 Prozent Frühbucher-Rabatt"
              />
              <div className="hero-copy">
                <h1>MACHT URLAUB</h1>
                <p>Bis zu 40 % sparen²</p>
                <button onClick={() => search()} className="light-button">
                  JETZT ENTDECKEN <Icon name="arrow" />
                </button>
              </div>
            </div>
            <div className="container home-search">
              <SearchBox />
            </div>
            <div className="mobile-hero-copy">
              <h1>MACHT URLAUB</h1>
              <p>Bis zu 40 % sparen²</p>
              <button className="light-button" onClick={() => search()}>
                JETZT ENTDECKEN <Icon name="arrow" />
              </button>
            </div>
            <div className="container assurances">
              <span>
                <Icon name="check" />
                Flexibel buchen, sorgenfrei reisen
              </span>
              <span>
                <Icon name="tag" />
                Bestpreis-Garantie für deinen Urlaub
              </span>
              <span>
                Ein Unternehmen der{" "}
                <img src={asset("fb76ed410ea4ea97.svg")} alt="REWE Group" />
              </span>
            </div>
            <div className="container" id="inspiration">
              {collections.map((c, i) => (
                <section className="collection" key={c.title}>
                  <div className="section-title">
                    <h2>{c.title}</h2>
                    <span className="slider-buttons">
                      <button
                        aria-label="Vorherige Angebote"
                        onClick={(e) =>
                          e.currentTarget
                            .closest("section")
                            .querySelector(".inspiration-grid")
                            .scrollBy({ left: -300, behavior: "smooth" })
                        }
                      >
                        ‹
                      </button>
                      <button
                        aria-label="Weitere Angebote"
                        onClick={(e) =>
                          e.currentTarget
                            .closest("section")
                            .querySelector(".inspiration-grid")
                            .scrollBy({ left: 300, behavior: "smooth" })
                        }
                      >
                        ›
                      </button>
                    </span>
                  </div>
                  <div className="inspiration-grid">
                    {c.cards.map(([title, subtitle, img, dest, badge]) => (
                      <button
                        className="inspiration-card"
                        key={title}
                        onClick={() => {
                          track("select_promotion", { promotion_name: title });
                          search(dest);
                        }}
                      >
                        <img src={asset(img)} alt={title} loading="lazy" />
                        <span
                          className={"card-badge " + (i === 2 ? "yellow" : "")}
                        >
                          {badge}
                        </span>
                        <span className="card-caption">
                          <span>
                            <strong>{title}</strong>
                            <small>{subtitle}</small>
                          </span>
                          <Icon name="arrow" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              <section className="collection safety">
                <h2>Mit einem guten Gefühl in den Urlaub</h2>
                <div className="two-grid">
                  {[
                    [
                      "Sicher und entspannt verreisen",
                      "Alles Wichtige für deine Reise",
                      "e13d04e49b355de6.webp",
                    ],
                    [
                      "Urlaub, der gut tut",
                      "Zeit für dich und deine Erholung",
                      "89c81c2f963fc79e.webp",
                    ],
                  ].map(([t, s, img]) => (
                    <button
                      key={t}
                      className="horizontal-card"
                      onClick={() => setModal("service")}
                    >
                      <img src={asset(img)} alt="" loading="lazy" />
                      <span>
                        <strong>{t}</strong>
                        <small>{s}</small>
                      </span>
                      <Icon name="arrow" />
                    </button>
                  ))}
                </div>
              </section>
              <section className="magazine">
                <img
                  src={asset("c2d3796f720f58ba.webp")}
                  alt="Sonnenuntergang am tropischen Palmenstrand"
                  loading="lazy"
                />
                <div>
                  <span className="eyebrow">DAS DERTOUR REISEMAGAZIN</span>
                  <h2>Die schönsten Ideen für deine nächste Reise</h2>
                  <p>
                    Neue Lieblingsorte, besondere Erlebnisse und ganz viel
                    Vorfreude: Lass dich inspirieren und entdecke die Welt mit
                    uns.
                  </p>
                  <button
                    className="dark-button"
                    onClick={() => setModal("magazine")}
                  >
                    Zum Reisemagazin <Icon name="arrow" />
                  </button>
                </div>
              </section>
              <section className="collection">
                <h2>Unsere Hotelmarken – dein Urlaub</h2>
                <div className="brand-grid">
                  {brands.map(([name, img]) => (
                    <button
                      className="brand"
                      key={name}
                      onClick={() => {
                        setNotice(`${name}: Entdecke unsere Demo-Hotelauswahl`);
                        search();
                      }}
                    >
                      <img src={asset(img)} alt={name} loading="lazy" />
                      <strong>{name}</strong>
                      <Icon name="arrow" />
                    </button>
                  ))}
                </div>
              </section>
              <section className="collection">
                <h2>Inspiration für deinen Urlaub</h2>
                <div className="brand-grid">
                  {[
                    ["Facebook", "3a2759d5af807674.webp"],
                    ["Instagram", "b1283be953eac528.webp"],
                    ["TikTok", "cac5a0ed72f66e57.webp"],
                    ["Pinterest", "6bad3954f67a8ae5.webp"],
                    ["WhatsApp", "0ca4e5dd65774606.webp"],
                    ["Reisepodcast", "176b35591e79e101.webp"],
                  ].map(([name, img]) => (
                    <button
                      key={name}
                      className="brand"
                      onClick={() => setModal("magazine")}
                    >
                      <img src={asset(img)} alt="" loading="lazy" />
                      <strong>{name}</strong>
                      <Icon name="arrow" />
                    </button>
                  ))}
                </div>
              </section>
              {[
                [
                  "Top-Städte in Europa",
                  "Rom",
                  "Paris",
                  "Barcelona",
                  "London",
                  "Wien",
                  "Lissabon",
                ],
                [
                  "Hotels weltweit",
                  "Hotels auf Mallorca",
                  "Hotels in Griechenland",
                  "Hotels in der Türkei",
                  "Hotels in Ägypten",
                  "Hotels auf den Malediven",
                  "Hotels in Thailand",
                ],
                [
                  "Urlaubsregionen in Deutschland",
                  "Ostsee",
                  "Nordsee",
                  "Bayern",
                  "Schwarzwald",
                  "Harz",
                  "Allgäu",
                ],
                [
                  "Beliebte Reiseziele",
                  "Mallorca",
                  "Griechenland",
                  "Türkei",
                  "Ägypten",
                  "Malediven",
                  "Dominikanische Republik",
                ],
              ].map(([title, ...links]) => (
                <section key={title} className="link-section">
                  <h2>{title}</h2>
                  <div className="brand-grid">
                    {links.map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          search(
                            destinations.find((d) => t.includes(d)) ||
                              "Mallorca",
                          )
                        }
                      >
                        {t}
                        <Icon name="arrow" size={18} />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
        {(route === "/angebote" || route === "/merkzettel") && (
          <div className="container results-page">
            <div className="breadcrumbs">
              <button onClick={() => go("/")}>Startseite</button> ›{" "}
              {route === "/merkzettel" ? "Merkzettel" : "Urlaub suchen"} ›{" "}
              {destination}
            </div>
            {route === "/angebote" && <SearchBox compact />}
            <div className="results-layout">
              {route === "/angebote" && (
                <aside className="filters">
                  <div
                    className="map-preview"
                    style={{
                      backgroundImage: `url(${asset("e8891cc3edd54525.webp")})`,
                    }}
                  >
                    <button
                      className="light-button"
                      onClick={() => setModal("map")}
                    >
                      <Icon name="pin" />
                      Karte anzeigen
                    </button>
                  </div>
                  <h2>Dein Urlaub, deine Wünsche</h2>
                  <FilterFields
                    family={family}
                    setFamily={setFamily}
                    stars={stars}
                    setStars={setStars}
                    budget={budget}
                    setBudget={setBudget}
                  />
                  <button
                    className="text-button"
                    onClick={() => {
                      setFamily(false);
                      setStars(false);
                      setBudget(2500);
                    }}
                  >
                    Filter zurücksetzen
                  </button>
                </aside>
              )}
              <section className="results-list">
                <div className="result-heading">
                  <div>
                    <span className="eyebrow">DEIN NÄCHSTER URLAUB WARTET</span>
                    <h1>
                      {route === "/merkzettel"
                        ? "Dein Merkzettel"
                        : `${results.length} Angebote für ${destination}`}
                    </h1>
                  </div>
                  <label className="sort">
                    Sortieren nach
                    <select
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        track("filter_results", { sort: e.target.value });
                      }}
                    >
                      <option value="recommended">Unsere Empfehlung</option>
                      <option value="price">Preis aufsteigend</option>
                      <option value="rating">Beste Bewertung</option>
                    </select>
                  </label>
                </div>
                {route === "/angebote" && (
                  <>
                    <p className="demo-note">
                      Demo-Angebote · Beispielpreise und Hotelbilder · Keine
                      Live-Verfügbarkeit
                    </p>
                    <button
                      className="mobile-filter secondary"
                      onClick={() => setModal("filters")}
                    >
                      <Icon name="filter" />
                      Filtern & Sortieren
                    </button>
                  </>
                )}
                {(route === "/merkzettel"
                  ? hotels.filter((h) => saved.includes(h.id))
                  : results
                ).map((h) => (
                  <HotelCard key={h.id} h={h} />
                ))}
                {((route === "/merkzettel" && !saved.length) ||
                  (route === "/angebote" && !results.length)) && (
                  <div className="empty">
                    <Icon name="heart" size={40} />
                    <h2>
                      {route === "/merkzettel"
                        ? "Hier beginnt deine Urlaubsvorfreude"
                        : "Keine passenden Angebote"}
                    </h2>
                    <p>
                      {route === "/merkzettel"
                        ? "Speichere deine Lieblingshotels mit dem Herzsymbol."
                        : "Passe deine Filter an und entdecke weitere Hotels."}
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        setFamily(false);
                        setStars(false);
                        setBudget(2500);
                        search();
                      }}
                    >
                      Hotels entdecken
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
        {route.startsWith("/hotel/") && (
          <div className="container detail-page">
            <div className="breadcrumbs">
              <button onClick={() => go("/")}>Startseite</button> ›{" "}
              <button onClick={() => search()}>{hotel.destination}</button> ›{" "}
              {hotel.name}
            </div>
            <button className="text-button back" onClick={() => search()}>
              <Icon name="back" size={18} />
              Zurück zur Hotelliste
            </button>
            <div className="detail-heading">
              <div>
                <small>
                  {hotel.country || "Spanien"} · {hotel.destination} ·{" "}
                  {hotel.town}
                </small>
                <h1>
                  {hotel.name}{" "}
                  <span className="stars">{"◆".repeat(hotel.stars)}</span>
                </h1>
                <div className="review">
                  <b>{hotel.rating}%</b>
                  <strong>Weiterempfehlung</strong>
                  <span>{hotel.reviews} Bewertungen</span>
                </div>
              </div>
              <button
                className={
                  "secondary " + (saved.includes(hotel.id) ? "saved" : "")
                }
                onClick={() => favourite(hotel)}
              >
                <Icon name="heart" />
                {saved.includes(hotel.id) ? "Gemerkt" : "Hotel merken"}
              </button>
            </div>
            <div className="gallery">
              <button
                className="main-image"
                onClick={() => {
                  setGallery(0);
                  setModal("gallery");
                }}
              >
                <img src={asset(hotel.gallery[0])} alt={hotel.name} />
              </button>
              <div className="gallery-side">
                {[1, 2].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setGallery(n % hotel.gallery.length);
                      setModal("gallery");
                    }}
                  >
                    <img
                      src={asset(hotel.gallery[n % hotel.gallery.length])}
                      alt={`${hotel.name} – Ansicht ${n + 1}`}
                    />
                  </button>
                ))}
              </div>
              <button
                className="gallery-count light-button"
                onClick={() => setModal("gallery")}
              >
                Alle Bilder ansehen ({hotel.gallery.length})
              </button>
            </div>
            <div className="detail-amenities">
              {hotel.amenities.map((a) => (
                <span key={a}>
                  <Icon name="check" />
                  {a}
                </span>
              ))}
            </div>
            <div className="detail-tabs">
              {[
                "Angebot",
                "Lage",
                "Hotelüberblick",
                "Hotelbeschreibung",
                "Bewertungen",
              ].map((t) => (
                <button
                  className={tab === t ? "active" : ""}
                  key={t}
                  onClick={() => {
                    setTab(t);
                    document
                      .getElementById("detail-content")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="detail-layout" id="detail-content">
              <section>
                {tab === "Angebot" ? (
                  <>
                    <h2>Dein Angebot individuell anpassen</h2>
                    <div className="travel-toggle">
                      {["Flug und Hotel", "Nur Hotel"].map((t) => (
                        <button
                          className={travelType === t ? "selected" : ""}
                          key={t}
                          onClick={() => setTravelType(t)}
                        >
                          <Icon name={t === "Nur Hotel" ? "pin" : "plane"} />
                          <strong>
                            {t === "Nur Hotel" ? "Eigene Anreise" : "Mit Flug"}
                          </strong>
                          <span>
                            Gesamt ab{" "}
                            {euro(
                              (hotel.price - (t === "Nur Hotel" ? 176 : 0)) *
                                adults,
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="detail-options">
                      <button onClick={() => setModal("dates")}>
                        <Icon name="calendar" />
                        <span>
                          {date(start)} – {date(end)}
                          <small>{nights} Nächte</small>
                        </span>
                        <Icon name="edit" size={16} />
                      </button>
                      <button onClick={() => setModal("travellers")}>
                        <Icon name="user" />
                        <span>
                          {adults} Erwachsene
                          {children ? `, ${children} Kinder` : ""}
                          <small>1 Zimmer</small>
                        </span>
                        <Icon name="edit" size={16} />
                      </button>
                    </div>
                    <h2>Wähle dein Zimmer</h2>
                    {["Doppelzimmer Standard", "Doppelzimmer Superior"].map(
                      (r) => (
                        <div
                          className={
                            "room " + (room === r ? "selected-room" : "")
                          }
                          key={r}
                        >
                          <div>
                            <h3>{r}</h3>
                            <p>Balkon oder Terrasse · Klimaanlage · WLAN</p>
                            <span className="green">
                              <Icon name="check" size={16} /> Für deine Reise
                              verfügbar (Demo)
                            </span>
                          </div>
                          <label>
                            Verpflegung
                            <select
                              value={room === r ? board : "Halbpension"}
                              onChange={(e) => {
                                setRoom(r);
                                setBoard(e.target.value);
                              }}
                            >
                              <option>Halbpension</option>
                              <option>Halbpension Plus</option>
                              <option>All Inclusive</option>
                            </select>
                          </label>
                          <button
                            className={room === r ? "secondary" : "primary"}
                            onClick={() => {
                              const selectedPrice =
                                pp +
                                (r === room
                                  ? 0
                                  : r === "Doppelzimmer Superior"
                                    ? 30
                                    : -30);
                              setRoom(r);
                              track("add_to_cart", {
                                currency: "EUR",
                                value: selectedPrice,
                                items: [item(hotel, selectedPrice)],
                                room_type: r,
                                board_type: board,
                              });
                            }}
                          >
                            {room === r ? (
                              <>
                                <Icon name="check" size={18} />
                                Ausgewählt
                              </>
                            ) : (
                              "Zimmer wählen"
                            )}
                          </button>
                        </div>
                      ),
                    )}
                    {travelType !== "Nur Hotel" && (
                      <div className="flight">
                        <h2>Deine Flüge</h2>
                        <div>
                          <Icon name="plane" />
                          <span>
                            <strong>
                              {departure === "Alle Flughäfen"
                                ? "Stuttgart"
                                : departure}{" "}
                              →{" "}
                              {hotel.destination === "Mallorca"
                                ? "Palma de Mallorca"
                                : hotel.town}
                            </strong>
                            <small>
                              {date(start)} · 12:00 – 14:00 · Direktflug
                            </small>
                          </span>
                        </div>
                        <div>
                          <Icon name="plane" />
                          <span>
                            <strong>
                              {hotel.destination === "Mallorca"
                                ? "Palma de Mallorca"
                                : hotel.town}{" "}
                              →{" "}
                              {departure === "Alle Flughäfen"
                                ? "Stuttgart"
                                : departure}
                            </strong>
                            <small>
                              {date(end)} · 21:25 – 23:25 · Direktflug
                            </small>
                          </span>
                        </div>
                        <small>Beispiel-Flugverbindung für diese Demo.</small>
                      </div>
                    )}
                  </>
                ) : tab === "Lage" ? (
                  <>
                    <h2>Dein Hotel am Urlaubsziel</h2>
                    <img
                      className="location-map"
                      src={asset("e8891cc3edd54525.webp")}
                      alt="Illustrative Kartenansicht"
                    />
                    <h3>
                      {hotel.town}, {hotel.destination}
                    </h3>
                    <p>
                      Genieße die Nähe zum Meer und entdecke die schönsten
                      Seiten der Insel. Die Karte dient der Illustration.
                    </p>
                  </>
                ) : tab === "Bewertungen" ? (
                  <>
                    <h2>Das sagen unsere Gäste</h2>
                    <div className="review big">
                      <b>{hotel.rating}%</b>
                      <span>
                        Weiterempfehlung bei {hotel.reviews} Bewertungen
                      </span>
                    </div>
                    <p>
                      Bewertungskennzahlen der Referenzseite. In dieser Demo
                      werden keine neuen Bewertungen veröffentlicht.
                    </p>
                  </>
                ) : (
                  <>
                    <h2>
                      {tab === "Hotelüberblick"
                        ? "Dein Urlaub auf einen Blick"
                        : `Willkommen im ${hotel.name}`}
                    </h2>
                    <p>
                      Ein entspannter Urlaub unter der Sonne: Freue dich auf
                      erholsame Tage am Pool, mediterrane Küche und die Nähe zu
                      traumhaften Buchten.
                    </p>
                    <div className="amenities">
                      {hotel.amenities.map((a) => (
                        <span key={a}>
                          <Icon name="check" />
                          {a}
                        </span>
                      ))}
                    </div>
                    <h3>Erholung und Erlebnisse</h3>
                    <p>
                      Ob du die Insel erkunden oder einfach die Seele baumeln
                      lassen möchtest – hier beginnt deine Auszeit. Ausstattung
                      und Beschreibungen sind für die Demo vereinfacht.
                    </p>
                  </>
                )}
              </section>
              <aside className="booking-summary">
                <span className="eyebrow">DEIN URLAUB IM ÜBERBLICK</span>
                <h2>Ihr Angebot</h2>
                <h3>{hotel.name}</h3>
                <p>
                  {date(start)} – {date(end)}
                  <br />
                  {nights} Nächte · {adults} Erwachsene
                  {children ? ` · ${children} Kinder` : ""}
                  <br />
                  {room}
                  <br />
                  {board}
                  <br />
                  {travelType === "Nur Hotel"
                    ? "Eigene Anreise"
                    : "Inklusive Flug"}
                </p>
                <hr />
                <div className="price-line">
                  <span>Preis pro Person</span>
                  <b>{euro(pp)}</b>
                </div>
                <div className="price-line total">
                  <strong>Reisepreis</strong>
                  <strong>{euro(total)}</strong>
                </div>
                <button className="primary" onClick={checkout}>
                  Angebot prüfen <Icon name="arrow" />
                </button>
                <small className="demo-note">
                  Demo-Angebot · Keine echte Buchung
                </small>
              </aside>
            </div>
          </div>
        )}
        {route.startsWith("/buchung/") && (
          <div className="container checkout-page">
            <button
              className="text-button back"
              onClick={() => go("/hotel/" + hotel.id)}
            >
              <Icon name="back" />
              Zurück zum Angebot
            </button>
            <div className="checkout-steps">
              <b>1 Reise ausgewählt</b>
              <b className="active">2 Angaben zur Reise</b>
              <span>3 Bestätigung</span>
            </div>
            <h1>Dein Urlaub ist zum Greifen nah</h1>
            <p className="demo-banner">
              Du bist in einer Demo. Es werden keine Reise gebucht und keine
              Zahlung ausgelöst.
            </p>
            <div className="detail-layout">
              <form
                className="checkout-form"
                onFocus={() => {
                  if (!window.__dtrFormStarted) {
                    window.__dtrFormStarted = true;
                    track("form_start", { form_id: "demo_booking" });
                  }
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const order = {
                    id: "DTR-DEMO-" + Date.now().toString(36).toUpperCase(),
                    hotel: hotel.name,
                    total,
                    start,
                    end,
                    adults,
                    children,
                    room,
                    board,
                  };
                  track("form_submit", { form_id: "demo_booking" });
                  track("purchase", {
                    transaction_id: order.id,
                    order_id: order.id,
                    currency: "EUR",
                    value: total,
                    items: [item(hotel, total)],
                    booking_type: "simulated",
                  });
                  sessionStorage.setItem("dtr-booking", JSON.stringify(order));
                  setBooking(order);
                  go("/bestaetigung");
                }}
              >
                <h2>Wer reist mit?</h2>
                <p>
                  Für den Demo-Ablauf reichen erfundene Angaben. Namen und
                  E-Mail werden nicht gespeichert oder an Meiro gesendet.
                </p>
                <div className="two-grid">
                  <label>
                    Vorname
                    <input
                      name="first"
                      required
                      placeholder="Max"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Nachname
                    <input
                      name="last"
                      required
                      placeholder="Mustermann"
                      autoComplete="off"
                    />
                  </label>
                </div>
                <label>
                  E-Mail
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="demo@example.com"
                    autoComplete="off"
                  />
                </label>
                <h2>Deine Reise</h2>
                <p>
                  {date(start)} – {date(end)} · {adults} Erwachsene · {nights}{" "}
                  Nächte
                </p>
                <label className="checkbox">
                  <input type="checkbox" required />
                  Ich möchte den Buchungsablauf unverbindlich simulieren.
                </label>
                <button className="primary" type="submit">
                  Demo-Buchung abschließen <Icon name="arrow" />
                </button>
              </form>
              <aside className="booking-summary">
                <img src={asset(hotel.image)} alt={hotel.name} />
                <h2>{hotel.name}</h2>
                <p>
                  {room}
                  <br />
                  {board}
                </p>
                <div className="price-line total">
                  <strong>Reisepreis</strong>
                  <strong>{euro(total)}</strong>
                </div>
                <small>Simulierter Preis · Keine Zahlung erforderlich</small>
              </aside>
            </div>
          </div>
        )}
        {route === "/bestaetigung" && (
          <div className="container confirmation">
            <span className="success-circle">
              <Icon name="check" size={40} />
            </span>
            <span className="eyebrow">VORFREUDE IST DIE SCHÖNSTE FREUDE</span>
            <h1>
              {booking
                ? "Deine Demo-Reise ist bestätigt!"
                : "Dein nächster Urlaub wartet"}
            </h1>
            {booking ? (
              <>
                <p>
                  Der Buchungsablauf wurde erfolgreich simuliert.
                  <br />
                  Es wurde keine echte Reise gebucht.
                </p>
                <div className="confirmation-card">
                  <small>DEMO-BUCHUNGSNUMMER</small>
                  <h3>{booking.id}</h3>
                  <h2>{booking.hotel}</h2>
                  <p>
                    {date(booking.start)} – {date(booking.end)}
                    <br />
                    {booking.adults} Erwachsene · {booking.room}
                    <br />
                    {booking.board}
                  </p>
                  <strong>{euro(booking.total)}</strong>
                </div>
              </>
            ) : (
              <p>Wähle zuerst dein Lieblingshotel aus.</p>
            )}
            <button className="primary" onClick={() => go("/")}>
              Weiter träumen <Icon name="arrow" />
            </button>
          </div>
        )}
        {!["/", "/angebote", "/merkzettel", "/bestaetigung"].includes(route) &&
          !route.startsWith("/hotel/") &&
          !route.startsWith("/buchung/") && (
            <div className="empty">
              <h1>Hier geht’s zurück in den Urlaub</h1>
              <button className="primary" onClick={() => go("/")}>
                Zur Startseite
              </button>
            </div>
          )}
      </main>
      {route.startsWith("/hotel/") && (
        <button
          className="mobile-offer-bar"
          onClick={() =>
            document
              .querySelector(".booking-summary")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <span>
            <strong>Ihr Angebot</strong>
            <small>Reisepreis {euro(total)}</small>
          </span>
          <Icon name="chevron" />
        </button>
      )}
      <footer>
        <div className="container">
          <div className="footer-top">
            <img src={asset("9f6850839ecbff3f.svg")} alt="DERTOUR" />
            <p>Dein Urlaub. Deine Welt.</p>
            <button
              className="secondary"
              onClick={() => setModal("newsletter")}
            >
              <Icon name="mail" />
              Newsletter abonnieren
            </button>
          </div>
          <p className="footnote">
            ² Beispielhafte Aktionskommunikation der DERTOUR Referenzseite.
            Konditionen, Preise und Verfügbarkeiten in dieser Demo sind
            unverbindlich. Die Hotelbilder dienen teilweise als illustrative
            Beispiele.
          </p>
          <div className="footer-bottom">
            <div>
              {[
                "Impressum",
                "Datenschutz",
                "Cookie-Einstellungen",
                "Kontakt",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    t === "Cookie-Einstellungen"
                      ? setCookieOpen(true)
                      : setModal(t === "Datenschutz" ? "privacy" : "legal")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <img src={asset("b36c3a0794e779a5.svg")} alt="DERTOUR Group" />
          </div>
          <p className="demo-footer">
            DERTOUR Demo · Unabhängiger Prototyp für Demonstrationszwecke ·
            Keine echten Buchungen
          </p>
        </div>
      </footer>
      {notice && (
        <div role="status" className="toast">
          <Icon name="check" />
          {notice}
        </div>
      )}
      {cookieOpen && (
        <div className="cookie-shade">
          <section
            className="cookie-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Datenschutzeinstellungen"
          >
            <div>
              <img src={asset("9f6850839ecbff3f.svg")} alt="DERTOUR" />
              <h2>Dein Urlaub beginnt mit deiner Entscheidung</h2>
              <p>
                Wir verwenden notwendige lokale Speicherfunktionen für deinen
                Merkzettel. Mit deiner Zustimmung analysiert Meiro die Nutzung
                dieser Demo, zum Beispiel Suchanfragen, Hotelaufrufe und
                simulierte Buchungen. Du kannst deine Entscheidung jederzeit in
                den Cookie-Einstellungen ändern.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setCookieOpen(false);
                  setModal("privacy");
                }}
              >
                Mehr zum Datenschutz
              </button>
            </div>
            <div className="cookie-actions">
              <button className="primary" onClick={() => chooseConsent(true)}>
                Alle akzeptieren
              </button>
              <button
                className="secondary"
                onClick={() => chooseConsent(false)}
              >
                Nur notwendige
              </button>
            </div>
          </section>
        </div>
      )}
      {modal && (
        <Modal
          title={
            {
              destination: "Wohin soll es gehen?",
              airport: "Von wo möchtest du fliegen?",
              dates: "Wann möchtest du verreisen?",
              travellers: "Wer reist mit?",
              filters: "Deine Urlaubswünsche",
              newsletter: "Urlaubspost für dich",
              gallery: hotel.name,
              account: "Mein DERTOUR",
              agency: "Dein Reisebüro",
              map: "Dein Urlaubsziel",
              privacy: "Datenschutz in dieser Demo",
              legal: "Über diese Demo",
              service: "Gut vorbereitet in den Urlaub",
              magazine: "Entdecke die Welt",
              menu: "Dein Urlaub mit DERTOUR",
              roundtrip: "Rundreisen entdecken",
            }[modal] || "DERTOUR"
          }
          onClose={() => setModal(null)}
          wide={["dates", "gallery", "map"].includes(modal)}
        >
          {modal === "destination" && (
            <>
              <label className="destination-input">
                <Icon name="search" />
                <input
                  autoFocus
                  placeholder="Land, Region oder Hotel suchen"
                  defaultValue=""
                  onChange={(e) => {
                    document
                      .querySelectorAll(".destination-option")
                      .forEach(
                        (el) =>
                          (el.hidden = !el.textContent
                            .toLowerCase()
                            .includes(e.target.value.toLowerCase())),
                      );
                  }}
                />
              </label>
              <p className="muted">Beliebte Reiseziele</p>
              {destinations.map((d, i) => (
                <button
                  className="destination-option"
                  key={d}
                  onClick={() => {
                    setDestination(d);
                    setModal(null);
                  }}
                >
                  <Icon name="pin" />
                  <span>
                    <strong>{d}</strong>
                    <small>{i === 0 ? "Region" : "Land"}</small>
                  </span>
                  <Icon name="chevron" size={18} />
                </button>
              ))}
              <p className="demo-note">
                Für jedes Reiseziel stehen exemplarische Demo-Angebote bereit.
              </p>
            </>
          )}
          {modal === "airport" && (
            <div className="option-list">
              {[
                "Alle Flughäfen",
                "Frankfurt",
                "München",
                "Düsseldorf",
                "Stuttgart",
                "Berlin",
                "Hamburg",
                "Wien",
                "Zürich",
              ].map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setDeparture(a);
                    setModal(null);
                  }}
                >
                  <Icon name="plane" />
                  {a}
                  {departure === a && <Icon name="check" />}
                </button>
              ))}
            </div>
          )}
          {modal === "dates" && (
            <>
              <div className="two-grid date-inputs">
                <label>
                  Früheste Hinreise
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => {
                      setStart(e.target.value);
                      if (e.target.value >= end) {
                        const next = new Date(e.target.value);
                        next.setDate(next.getDate() + 7);
                        setEnd(next.toISOString().slice(0, 10));
                      }
                    }}
                    required
                  />
                </label>
                <label>
                  Rückreise
                  <input
                    type="date"
                    min={start}
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="calendar-grid">
                {[0, 1].map((offset) => (
                  <Calendar
                    key={offset}
                    offset={offset}
                    start={start}
                    end={end}
                    onSelect={(value) => {
                      if (value <= start || start === end) {
                        setStart(value);
                        setEnd(value);
                      } else setEnd(value);
                    }}
                  />
                ))}
              </div>
              <h3>Wie lange möchtest du verreisen?</h3>
              <div className="duration-options">
                {[7, 14, 21].map((n) => (
                  <button
                    className={nights === n ? "selected" : ""}
                    key={n}
                    onClick={() => {
                      const d = new Date(start);
                      d.setDate(d.getDate() + n);
                      setEnd(d.toISOString().slice(0, 10));
                    }}
                  >
                    {n / 7} {n === 7 ? "Woche" : "Wochen"}
                  </button>
                ))}
              </div>
              <button
                className="primary full"
                onClick={() => {
                  if (!start || !end || end <= start) {
                    setNotice("Bitte wähle eine Rückreise nach der Hinreise.");
                    return;
                  }
                  setModal(null);
                }}
              >
                Reisezeitraum übernehmen
              </button>
            </>
          )}
          {modal === "travellers" && (
            <>
              <Counter
                label="Erwachsene"
                subtitle="Ab 18 Jahren"
                value={adults}
                set={setAdults}
                min={1}
                max={6}
              />
              <Counter
                label="Kinder"
                subtitle="Bis 17 Jahre"
                value={children}
                set={setChildren}
                min={0}
                max={4}
              />
              <p className="muted">
                Die Preise für Kinder werden in dieser Demo pauschal berechnet.
              </p>
              <button className="primary full" onClick={() => setModal(null)}>
                Übernehmen
              </button>
            </>
          )}
          {modal === "filters" && (
            <>
              <FilterFields
                family={family}
                setFamily={setFamily}
                stars={stars}
                setStars={setStars}
                budget={budget}
                setBudget={setBudget}
              />
              <button className="primary full" onClick={() => setModal(null)}>
                {results.length} Angebote anzeigen
              </button>
            </>
          )}
          {modal === "gallery" && (
            <div className="lightbox">
              <img
                src={asset(hotel.gallery[gallery % hotel.gallery.length])}
                alt={`${hotel.name}, Ansicht ${gallery + 1}`}
              />
              <div>
                <button
                  aria-label="Vorheriges Bild"
                  className="secondary"
                  onClick={() =>
                    setGallery(
                      (gallery + hotel.gallery.length - 1) %
                        hotel.gallery.length,
                    )
                  }
                >
                  ‹
                </button>
                <span>
                  {gallery + 1} / {hotel.gallery.length}
                </span>
                <button
                  aria-label="Nächstes Bild"
                  className="secondary"
                  onClick={() =>
                    setGallery((gallery + 1) % hotel.gallery.length)
                  }
                >
                  ›
                </button>
              </div>
            </div>
          )}
          {modal === "newsletter" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                track("sign_up", { method: "newsletter_demo" });
                setModal(null);
                setNotice("Danke! Deine Newsletter-Anmeldung wurde simuliert.");
              }}
            >
              <p>
                Urlaubsideen, Reiseinspiration und besondere Angebote. Probiere
                die Anmeldung mit einer erfundenen E-Mail aus.
              </p>
              <label>
                E-Mail-Adresse
                <input type="email" required placeholder="demo@example.com" />
              </label>
              <label className="checkbox">
                <input type="checkbox" required />
                Ich möchte die Newsletter-Anmeldung simulieren. Es wird keine
                E-Mail versendet.
              </label>
              <button className="primary full">Jetzt anmelden</button>
            </form>
          )}
          {modal === "map" && (
            <>
              <img
                className="location-map"
                src={asset("e8891cc3edd54525.webp")}
                alt="Illustrative Karte"
              />
              <p>
                Die Karte illustriert Mallorca; weitere Reiseziele bieten
                synthetische Beispielhotels. Wähle ein Hotel, um das Angebot
                anzusehen.
              </p>
              {hotels.map((h) => (
                <button
                  className="destination-option"
                  key={h.id}
                  onClick={() => openHotel(h)}
                >
                  <Icon name="pin" />
                  <span>
                    {h.name}
                    <small>{h.town}</small>
                  </span>
                  <strong>{euro(h.price)}</strong>
                </button>
              ))}
            </>
          )}
          {modal === "privacy" && (
            <>
              <p>
                Dieser Prototyp speichert den Merkzettel und deine
                Cookie-Entscheidung lokal in deinem Browser. Nur nach Zustimmung
                wird das Meiro Web SDK geladen und sendet Nutzungsereignisse an
                die separate Quelle „DERTOUR Demo Web“ der Travel-Demoinstanz.
              </p>
              <p>
                Die Ereignisse enthalten die besuchten Seiten, Reiseauswahl,
                Hotel-IDs und simulierte Bestellwerte. Eingaben zu Namen und
                E-Mail im Demo-Checkout werden weder gespeichert noch in
                Tracking-Ereignisse übernommen. Meiro kann technische Browser-
                und Sitzungskennungen verarbeiten.
              </p>
              <p>
                Aktuelle Entscheidung:{" "}
                <strong>
                  {consent === "granted"
                    ? "Analyse erlaubt"
                    : "Nur notwendige Funktionen"}
                </strong>
              </p>
              <button
                className="secondary"
                onClick={() => {
                  setModal(null);
                  setCookieOpen(true);
                }}
              >
                Cookie-Einstellungen ändern
              </button>
            </>
          )}
          {["legal", "account", "agency", "service", "roundtrip"].includes(
            modal,
          ) && (
            <>
              <p>
                {modal === "account"
                  ? "Deine Lieblingshotels findest du jederzeit auf deinem Merkzettel. Ein echtes Kundenkonto ist für diese Demo nicht erforderlich."
                  : modal === "agency"
                    ? "Eine persönliche Beratung gehört zum DERTOUR Urlaubserlebnis. In diesem Prototyp kannst du die Reise selbst entdecken; es werden keine Beratungsanfragen versendet."
                    : modal === "roundtrip"
                      ? "Entdecke neue Lieblingsorte. Dieser Prototyp konzentriert sich auf Flug-und-Hotel-Angebote sowie eigene Anreise."
                      : modal === "service"
                        ? "Plane deine Auszeit ganz entspannt. In der Demo kannst du Reisezeitraum, Reisende, Zimmer und Verpflegung individuell auswählen."
                        : "Dies ist ein unabhängiger, nicht buchbarer Demonstrationsprototyp. DERTOUR Marken, Bildmaterial und Gestaltung dienen ausschließlich als Referenz für die angeforderte Demo. Es besteht keine Live-Verbindung zu DERTOUR Buchungssystemen."}
              </p>
              <button
                className="primary"
                onClick={() =>
                  modal === "account" ? go("/merkzettel") : search()
                }
              >
                {" "}
                {modal === "account" ? "Zum Merkzettel" : "Urlaub entdecken"}
                <Icon name="arrow" />
              </button>
            </>
          )}
          {modal === "magazine" && (
            <>
              <img
                className="magazine-modal"
                src={asset("c2d3796f720f58ba.webp")}
                alt="Palmenstrand"
              />
              <h3>Einfach mal dem Meer zuhören</h3>
              <p>
                Warmer Sand unter den Füßen, eine sanfte Brise und ganz viel
                Zeit für dich. Entdecke unsere Ideen für deine nächste Auszeit –
                von Mallorcas Buchten bis zu den Traumstränden der Malediven.
              </p>
              <button className="primary" onClick={() => search("Malediven")}>
                Traumurlaub entdecken <Icon name="arrow" />
              </button>
            </>
          )}
          {modal === "menu" && (
            <div className="option-list">
              {[
                "Urlaub suchen",
                "Reiseziele",
                "Merkzettel",
                "Reisemagazin",
                "Service",
              ].map((t, i) => (
                <button
                  key={t}
                  onClick={() =>
                    i === 0
                      ? search()
                      : i === 2
                        ? go("/merkzettel")
                        : setModal(
                            ["", "destination", "", "magazine", "service"][i],
                          )
                  }
                >
                  {t}
                  <Icon name="chevron" />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
function Counter({ label, subtitle, value, set, min, max }) {
  return (
    <div className="counter">
      <div>
        <strong>{label}</strong>
        <small>{subtitle}</small>
      </div>
      <div>
        <button
          aria-label={`${label} weniger`}
          disabled={value <= min}
          onClick={() => set(value - 1)}
        >
          −
        </button>
        <strong>{value}</strong>
        <button
          aria-label={`${label} mehr`}
          disabled={value >= max}
          onClick={() => set(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
function FilterFields({
  family,
  setFamily,
  stars,
  setStars,
  budget,
  setBudget,
}) {
  return (
    <div className="filter-fields">
      <h3>Preis pro Person</h3>
      <label>
        Bis {euro(budget)}
        <input
          type="range"
          min="500"
          max="2500"
          step="25"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </label>
      <h3>Hotelkategorie</h3>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={stars}
          onChange={(e) => setStars(e.target.checked)}
        />
        Mindestens 4 Sterne
      </label>
      <h3>Was dir wichtig ist</h3>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={family}
          onChange={(e) => setFamily(e.target.checked)}
        />
        Familienfreundlich
      </label>
      <p className="muted">Alle Demo-Hotels verfügen über einen Pool.</p>
    </div>
  );
}
function Calendar({ offset, start, end, onSelect }) {
  const base = new Date(start + "T12:00:00");
  const year = base.getFullYear(),
    month = base.getMonth() + offset;
  const first = new Date(year, month, 1),
    days = new Date(year, month + 1, 0).getDate(),
    skip = (first.getDay() + 6) % 7;
  return (
    <div className="calendar">
      <h3>
        {first.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
      </h3>
      <div>
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <small key={d}>{d}</small>
        ))}
        {Array.from({ length: skip }, (_, i) => (
          <span key={"b" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = new Date(year, month, i + 1);
          const v = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(i + 1).padStart(2, "0"),
          ].join("-");
          return (
            <button
              aria-label={date(v)}
              key={v}
              className={
                v === start || v === end
                  ? "edge "
                  : v > start && v < end
                    ? "range"
                    : ""
              }
              onClick={() => onSelect(v)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
