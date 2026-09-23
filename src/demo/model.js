// Synthetic travel state. Meiro computes the live decision from these business inputs.
export const STATE_KEY = "dtr-lifecycle-v1";
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
export function freshState(persona = "researcher") {
  const id = uid();
  return {
    version: 1,
    revision: uid(),
    run_id: id,
    persona,
    demo_site: "dertour",
    synthetic: true,
    experiment: parseInt(id[0], 16) < 3 ? "control" : "treatment",
    stage: "new",
    destination: "Mallorca",
    email_permission: false,
    ads_permission: false,
    clock: now(),
    last_action_at: now(),
    last_contact_at: null,
    contact_keys: [],
    history_count: 0,
    history_value: 0,
    last_trip_days: 0,
    complaint: false,
    quote: null,
    booking: null,
    watch: null,
    feedback: null,
    extras: [],
    ledger: [],
  };
}
export function readState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY)) || freshState();
  } catch {
    return freshState();
  }
}
export function saveState(s) {
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("dtr-lifecycle", { detail: s }));
  return s;
}
export function hoursSince(s, t) {
  return t ? (new Date(s.clock) - new Date(t)) / 3600000 : Infinity;
}
export function candidate(s) {
  if (s.complaint)
    return {
      key: "care",
      reason: "Open service case takes priority over promotions.",
      marketing: false,
    };
  if (s.stage === "cancelled")
    return {
      key: "cancelled",
      reason: "Booking cancelled; recovery and trip offers stopped.",
      marketing: false,
    };
  if (s.booking && s.stage === "booked") {
    const days = (new Date(s.booking.start) - new Date(s.clock)) / 86400000;
    if (days < 0)
      return {
        key: "service",
        reason: "Departure has passed; no pre-trip promotions.",
        marketing: false,
      };
    if (days <= 14 && !s.extras.includes("transfer"))
      return {
        key: "pretrip",
        reason: "Departure within 14 days; transfer not booked.",
        marketing: true,
      };
    return {
      key: "service",
      reason: "Confirmed booking excludes booking recovery.",
      marketing: false,
    };
  }
  if (s.stage === "completed" && !s.feedback)
    return {
      key: "feedback",
      reason: "Completed trip; feedback not yet submitted.",
      marketing: false,
    };
  if (s.stage === "completed")
    return {
      key: "rebook",
      reason: "Completed trip with feedback and no open case.",
      marketing: true,
    };
  if (s.quote && s.stage === "checkout") {
    if (new Date(s.clock) > new Date(s.quote.expires_at))
      return {
        key: "expired",
        reason: "Saved quote expired; fresh search required.",
        marketing: false,
      };
    if (hoursSince(s, s.last_action_at) >= 0.5)
      return {
        key: "recovery",
        reason: "Checkout incomplete for at least 30 minutes; quote valid.",
        marketing: true,
      };
    return {
      key: "waiting",
      reason: "Checkout is active; recovery delay has not elapsed.",
      marketing: false,
    };
  }
  if (
    s.watch?.active &&
    s.watch.current_price <= s.watch.threshold &&
    s.watch.permission &&
    new Date(s.watch.expires_at) > new Date(s.clock)
  )
    return {
      key: "price",
      reason: "Explicit price watch threshold met; offer current.",
      marketing: true,
    };
  if (s.history_count >= 4)
    return {
      key: "vip",
      reason:
        "At least four completed demo trips; recognize loyalty without discounting.",
      marketing: true,
    };
  if (s.last_trip_days >= 365)
    return {
      key: "winback",
      reason: "No active booking; last completed trip at least a year ago.",
      marketing: true,
    };
  if (s.stage === "research" && hoursSince(s, s.last_action_at) >= 2)
    return {
      key: "research",
      reason: "Recent destination interest; two-hour research delay elapsed.",
      marketing: true,
    };
  return {
    key: "inspiration",
    reason:
      s.stage === "research"
        ? "Recent destination preference."
        : "Generic destination inspiration.",
    marketing: true,
  };
}
export function decide(s) {
  const c = candidate(s);
  if (c.marketing && !s.email_permission && c.key !== "price")
    return {
      key: "generic",
      reason: "Marketing permission not granted.",
      marketing: false,
    };
  if (c.marketing && s.experiment === "control")
    return {
      key: "control",
      reason: "Persistent control assignment; neutral experience.",
      marketing: false,
    };
  return c;
}
export function emailEligibility(s, d) {
  if (d.key === "inspiration")
    return { allowed: false, reason: "Research delay has not elapsed." };
  if (
    !d.marketing &&
    !["service", "care", "feedback", "cancelled"].includes(d.key)
  )
    return { allowed: false, reason: "No message for this decision." };
  const key = `${d.key}:${s.booking?.id || s.quote?.id || s.watch?.id || s.run_id}`;
  if (s.contact_keys.includes(key))
    return {
      allowed: false,
      reason: "This step has already been previewed for this trip.",
    };
  if (d.marketing && hoursSince(s, s.last_contact_at) < 24)
    return {
      allowed: false,
      reason: "Shared marketing cap: one preview per 24 demo hours.",
    };
  return { allowed: true, key };
}
export function reduce(s, type, p = {}) {
  let next = {
    ...s,
    revision: uid(),
    ledger: [
      ...s.ledger.slice(-99),
      { id: uid(), type, at: s.clock, value: p.value || 0 },
    ],
    ...p,
  };
  if (type === "search")
    next = {
      ...next,
      stage: "research",
      destination: p.destination,
      last_action_at: s.clock,
    };
  if (type === "checkout")
    next = {
      ...next,
      stage: "checkout",
      last_action_at: s.clock,
      quote: p.quote,
    };
  if (type === "purchase")
    next = {
      ...next,
      stage: "booked",
      booking: p.booking,
      watch: s.watch ? { ...s.watch, active: false } : null,
    };
  if (type === "cancel") next = { ...next, stage: "cancelled", watch: null };
  if (type === "complete") next = { ...next, stage: "completed" };
  if (type === "advance")
    next.clock = new Date(
      new Date(s.clock).getTime() + p.hours * 3600000,
    ).toISOString();
  if (type === "feedback") next.feedback = { rating: p.rating, at: s.clock };
  if (type === "extra") next.extras = [...new Set([...s.extras, p.extra])];
  if (type === "contact")
    next = {
      ...next,
      contact_keys: [...s.contact_keys, p.key],
      last_contact_at: p.marketing ? s.clock : s.last_contact_at,
    };
  return next;
}
export function snapshot(s) {
  return {
    trip: s.booking || s.quote || null,
    watch_id: s.watch?.id || null,
    watch_hotel_id: s.watch?.hotel_id || null,
    contact_keys: s.contact_keys,
    run_id: s.run_id,
    revision: s.revision,
    synthetic: true,
    demo_site: "dertour",
    persona: s.persona,
    experiment: s.experiment,
    stage: s.stage,
    destination: s.destination,
    email_permission: s.email_permission,
    ads_permission: s.ads_permission,
    demo_clock: s.clock,
    last_action_at: s.last_action_at,
    history_count: s.history_count,
    history_value: s.history_value,
    last_trip_days: s.last_trip_days,
    complaint: s.complaint,
    quote_id: s.quote?.id || "",
    quote_expires_at: s.quote?.expires_at || null,
    booking_id: s.booking?.id || "",
    departure_date: s.booking?.start || null,
    booked_value: s.booking?.total || 0,
    net_value: s.stage === "cancelled" ? 0 : s.booking?.total || 0,
    transfer_owned: s.extras.includes("transfer"),
    ancillary_value: s.stage === "cancelled" ? 0 : s.extras.length * 79,
    ancillary_margin: s.stage === "cancelled" ? 0 : s.extras.length * 24,
    feedback_received: !!s.feedback,
    watch_active: !!s.watch?.active,
    watch_permission: !!s.watch?.permission,
    watch_price: s.watch?.current_price || 0,
    watch_threshold: s.watch?.threshold || 0,
    watch_expires_at: s.watch?.expires_at || null,
    searched: s.ledger.some((e) => e.type === "search") ? 1 : 0,
    checkout_started: s.quote || s.booking ? 1 : 0,
    confirmed: s.booking ? 1 : 0,
    net_booking: s.booking && s.stage !== "cancelled" ? 1 : 0,
    repeat_booking: s.booking && s.history_count > 0 ? 1 : 0,
    last_contact_at: s.last_contact_at,
    updated_at: now(),
  };
}
export function priceFor(
  h,
  {
    board = "Halbpension",
    room = "Doppelzimmer Standard",
    travelType = "Flug und Hotel",
    adults = 2,
    children = 0,
  },
) {
  return (
    Math.round(
      (h.price +
        (board === "All Inclusive"
          ? 177
          : board === "Halbpension Plus"
            ? 51
            : 0) +
        (room === "Doppelzimmer Superior" ? 30 : 0) -
        (travelType === "Nur Hotel" ? 176 : 0)) *
        (adults + children * 0.65) *
        100,
    ) / 100
  );
}
export function newQuote(h, trip, s) {
  return {
    id: uid(),
    hotel_id: h.id,
    hotel: h.name,
    ...trip,
    total: trip.total ?? priceFor(h, trip),
    created_at: s.clock,
    expires_at: new Date(
      new Date(s.clock).getTime() + 48 * 3600000,
    ).toISOString(),
  };
}
export function resumeURL(q) {
  return `/buchung/${q.hotel_id}?${new URLSearchParams({ destination: q.destination, start: q.start, end: q.end, adults: q.adults, children: q.children, board: q.board, room: q.room, travelType: q.travelType, departure: q.departure, quote: q.id })}`;
}

export const offerKey = (hotel, trip) =>
  JSON.stringify([
    hotel.id,
    trip.start,
    trip.end,
    trip.adults,
    trip.children,
    trip.board,
    trip.room,
    trip.travelType,
  ]);

export const watchURL = (watch) =>
  `/hotel/${watch.hotel_id}?${new URLSearchParams(watch.trip || {})}`;
