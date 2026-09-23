import { useEffect, useState, useCallback } from "react";
import { track, readConsent } from "../tracking";
import {
  readState,
  saveState,
  reduce,
  snapshot,
  decide,
  freshState,
} from "./model";
const API =
  import.meta.env.VITE_MEIRO_PROFILE_URL ||
  "https://travel.eu1.pipes.meiro.io/profile-api/dertour-demo";
export function useLifecycle() {
  const [state, setState] = useState(readState),
    [remote, setRemote] = useState(null),
    [status, setStatus] = useState("Waiting for consent");
  const act = useCallback((type, p = {}) => {
    const current = readState();
    if (type === "purchase" && current.booking && current.stage === "booked")
      return current;
    if (type === "extra" && current.extras.includes(p.extra)) return current;
    const s = saveState(reduce(current, type, p));
    track("dtr_demo_state", {
      ...snapshot(s),
      action: type,
      event_id: crypto.randomUUID(),
    });
    return s;
  }, []);
  const reset = useCallback((persona) => {
    const s = freshState(persona);
    s.experiment = readState().experiment;
    if (persona === "vip") {
      s.history_count = 6;
      s.history_value = 14800;
      s.last_trip_days = 70;
    }
    if (persona === "lapsed") {
      s.history_count = 2;
      s.history_value = 4100;
      s.last_trip_days = 440;
    }
    s.email_permission = true;
    s.ads_permission = true;
    saveState(s);
    track("dtr_demo_state", {
      ...snapshot(s),
      action: "reset",
      event_id: crypto.randomUUID(),
    });
  }, []);
  useEffect(() => {
    const listener = (e) => {
      setState(e.detail);
      setRemote(null);
    };
    window.addEventListener("dtr-lifecycle", listener);
    return () => window.removeEventListener("dtr-lifecycle", listener);
  }, []);
  useEffect(() => {
    let stopped = false,
      controller;
    async function refresh() {
      if (readConsent() !== "granted" || !window.mpt) {
        setRemote(null);
        setStatus("Consent not granted");
        return;
      }
      try {
        const user = await Promise.race([
          new Promise((resolve) => window.mpt("get", "user_id", resolve)),
          new Promise((_, reject) =>
            setTimeout(() => reject(Error("SDK unavailable")), 3000),
          ),
        ]);
        if (!user) throw Error("No SDK identifier");
        controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        let response;
        try {
          response = await fetch(
            `${API}?${new URLSearchParams({ identifier_type: "user_id", identifier_value: user })}`,
            { signal: controller.signal },
          );
        } finally {
          clearTimeout(timeout);
        }
        if (!response.ok) throw Error(`Profile API ${response.status}`);
        const json = await response.json();
        const raw = json.attributes?.dtr_decision;
        const scalar = (value) => {
          const first = Array.isArray(value) ? value[0] : value;
          return first
            ? Object.fromEntries(
                Object.entries(first).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v[0] : v,
                ]),
              )
            : null;
        };
        const row = scalar(raw);
        const eligibility = scalar(json.attributes?.dtr_message_eligibility);
        if (
          !row ||
          row.run_id !== state.run_id ||
          row.revision !== state.revision
        )
          throw Error("Waiting for current profile");
        if (!stopped) {
          setRemote({
            ...row,
            email_eligibility:
              eligibility?.revision === state.revision
                ? {
                    allowed: eligibility.eligible === 1,
                    reason: eligibility.reason,
                  }
                : null,
          });
          setStatus("Live Meiro decision");
        }
      } catch (e) {
        if (!stopped) {
          setRemote(null);
          setStatus(e.message);
        }
      }
    }
    refresh();
    const timer = setInterval(refresh, 6000);
    return () => {
      stopped = true;
      controller?.abort();
      clearInterval(timer);
    };
  }, [state]);
  return {
    state,
    act,
    reset,
    decision: remote
      ? {
          key: remote.decision,
          reason: remote.reason,
          marketing: !!remote.marketing,
        }
      : decide(state),
    live: !!remote,
    status,
    emailEligibility: remote?.email_eligibility,
  };
}
