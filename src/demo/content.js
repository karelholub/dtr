import { watchURL } from "./model.js";
export const content = {
  inspiration: {
    eyebrow: "DEIN NÄCHSTER LIEBLINGSORT",
    title: "Zeit für deinen Urlaub",
    body: "Entdecke unsere Reiseideen und finde deine persönliche Auszeit.",
    cta: "Urlaub entdecken",
  },
  research: {
    eyebrow: "DEINE REISEIDEEN",
    title: "Dein {destination}-Urlaub wartet",
    body: "Du hast schon ein Reiseziel im Blick. Entdecke passende Hotels und plane in Ruhe weiter.",
    cta: "Reise weiterplanen",
  },
  recovery: {
    eyebrow: "DEINE GESPEICHERTE REISE",
    title: "Nur noch ein Schritt bis zum Urlaub",
    body: "Deine Auswahl ist gespeichert. Prüfe Reisedaten, Zimmer und Verpflegung und setze deine Buchung fort.",
    cta: "Reise fortsetzen",
  },
  price: {
    eyebrow: "DEIN PREISALARM",
    title: "Dein Wunschpreis ist erreicht",
    body: "Das beobachtete Demo-Angebot liegt jetzt innerhalb deines Preislimits. Prüfe die aktuelle Auswahl.",
    cta: "Angebot ansehen",
  },
  pretrip: {
    eyebrow: "BALD GEHT’S LOS",
    title: "Entspannt in den Urlaub starten",
    body: "Deine Reise steht vor der Tür. Ein Transfer vom Flughafen ist noch nicht enthalten – ergänze ihn, wenn er zu deinen Plänen passt.",
    cta: "Meine Reise ergänzen",
  },
  service: {
    eyebrow: "DEINE REISEINFORMATIONEN",
    title: "Vorfreude, gut organisiert",
    body: "Hier findest du deine gebuchten Leistungen und die Checkliste für deine Reise.",
    cta: "Meine Reise öffnen",
  },
  feedback: {
    eyebrow: "WILLKOMMEN ZURÜCK",
    title: "Wie war dein Urlaub?",
    body: "Teile deine Erfahrungen mit uns. Dein Feedback hilft uns, deine nächste Reise noch besser zu begleiten.",
    cta: "Feedback geben",
  },
  rebook: {
    eyebrow: "NEUE REISEIDEEN",
    title: "Wohin zieht es dich als Nächstes?",
    body: "Nach dem Urlaub ist vor der nächsten Auszeit. Entdecke Reiseideen passend zu deinen Interessen.",
    cta: "Neue Reise entdecken",
  },
  vip: {
    eyebrow: "SCHÖN, DASS DU WIEDER DA BIST",
    title: "Deine Reiselust verbindet uns",
    body: "Du bist gerne unterwegs. Entdecke deine persönlichen Reiseideen und plane deine nächste Auszeit mit uns.",
    cta: "Reiseideen ansehen",
  },
  winback: {
    eyebrow: "ZEIT FÜR EIN WIEDERSEHEN",
    title: "Die nächste Auszeit wartet auf dich",
    body: "Ein neuer Blick aufs Meer, ein vertrautes Urlaubsgefühl. Lass dich wieder für deine nächste Reise inspirieren.",
    cta: "Auszeit finden",
  },
  care: {
    eyebrow: "WIR SIND FÜR DICH DA",
    title: "Dein Anliegen steht an erster Stelle",
    body: "Wir haben dein Demo-Anliegen aufgenommen. Hier kannst du den Bearbeitungsstand ansehen.",
    cta: "Anliegen ansehen",
  },
  cancelled: {
    eyebrow: "DEINE REISE",
    title: "Stornierung vorgemerkt",
    body: "Deine Demo-Reise ist storniert. Erinnerungen und Angebote für diese Reise wurden beendet.",
    cta: "Übersicht öffnen",
  },
  expired: {
    eyebrow: "NEU PLANEN",
    title: "Dein gespeichertes Angebot ist abgelaufen",
    body: "Suche erneut nach deiner Reise, um ein aktuelles Demo-Angebot zu erhalten.",
    cta: "Neue Suche starten",
  },
};
export const textFor = (key, destination = "Mallorca") =>
  Object.fromEntries(
    Object.entries(content[key] || content.inspiration).map(([k, v]) => [
      k,
      v.replaceAll("{destination}", destination),
    ]),
  );
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function emailHTML(key, s, h, origin = "https://dtrdemo.netlify.app") {
  const c = textFor(key, s.destination),
    e = escapeHTML;
  const defaultHref =
    key === "recovery" && s.quote
      ? `${origin}/buchung/${encodeURIComponent(s.quote.hotel_id)}?${new URLSearchParams({ ...s.quote, quote: s.quote.id })}`
      : `${origin}/${["service", "pretrip", "feedback", "care", "cancelled"].includes(key) ? "meine-reise" : `angebote?destination=${encodeURIComponent(s.destination)}`}`;
  const href =
    key === "price" && s.watch ? `${origin}${watchURL(s.watch)}` : defaultHref;
  const trip = s.booking || s.quote;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fcfaf8;font-family:Arial,sans-serif;color:#271c1a"><div style="display:none">${e(c.title)} – ${e(s.destination)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:white" cellpadding="0" cellspacing="0"><tr><td style="padding:28px"><img src="${origin}/assets/9f6850839ecbff3f.svg" width="150" alt="DERTOUR"><p style="font-size:12px;color:#716560">E-Mail-Vorschau · synthetische Demo · kein Versand</p></td></tr><tr><td><img width="600" height="240" style="width:100%;height:240px;object-fit:cover;display:block" src="${origin}/assets/${e(h.image)}" alt="${e(s.destination)}"></td></tr><tr><td style="padding:32px"><p style="font-size:12px;letter-spacing:2px;color:#a0001b">${e(c.eyebrow)}</p><h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.2">${e(c.title)}</h1><p style="font-size:17px;line-height:1.6">Hallo,</p><p style="font-size:17px;line-height:1.6">${e(c.body)}</p>${trip ? `<table role="presentation" width="100%" style="background:#fcfaf8;padding:18px"><tr><td><strong>${e(trip.hotel)}</strong><p>${e(trip.start)} – ${e(trip.end)}</p><p>${e(trip.room)} · ${e(trip.board)}</p><p>${e(trip.adults)} Erwachsene · ${e(trip.children || 0)} Kinder</p><strong>${Number(trip.total).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong></td></tr></table>` : ""}${key === "price" ? `<p>Aktueller Demo-Preis: <strong>${Number(s.watch?.current_price || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong></p>` : ""}<p style="margin:28px 0"><a target="_blank" href="${e(href)}" style="display:inline-block;background:#e40028;color:white;padding:16px 24px;text-decoration:none;font-weight:bold">${e(c.cta)}</a></p><p style="font-size:12px;line-height:1.6;color:#716560">Unverbindliches Demo-Angebot. Keine echte Buchung, keine Zahlung. Preise und Verfügbarkeit werden vor der Auswahl erneut geprüft.</p></td></tr><tr><td style="padding:24px 32px;background:#f1ebe7;font-size:12px;line-height:1.7">DERTOUR Demo · Dein Urlaub. Deine Welt.<br><a href="${origin}/meine-reise" style="color:#271c1a">Kommunikationswünsche verwalten</a> · <a href="${origin}/" style="color:#271c1a">Zur Website</a></td></tr></table></td></tr></table></body></html>`;
}
