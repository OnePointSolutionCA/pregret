"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Applies the effects-playbook animations and re-attaches on every route change.
 * Uses BOTH IntersectionObserver and a scroll-listener fallback so reveals fire
 * in any environment (some sandboxed iframes, preview shells, and older browsers
 * suppress IntersectionObserver callbacks). Also handles the "reveals disappear
 * on back-nav" bug by re-scanning the DOM whenever pathname changes.
 */
export default function AnimationLayer() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __rd: string }).__rd = "AnimationLayer:" + pathname;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;

    // Scroll to top on every mount (refresh, route change, back-nav)
    // unless the URL has a hash target — in which case respect the deep link.
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }

    // ---- Hero line reveal ----
    const heroes = document.querySelectorAll<HTMLElement>(".rd-hero");
    heroes.forEach((h) => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => h.classList.add("is-ready"))
      );
      setTimeout(() => h.classList.add("is-ready"), 500);
    });

    // ---- Scroll progress ----
    const bar = document.querySelector<HTMLElement>("[data-progress]");
    const onProgress = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const y = h.scrollTop || document.body.scrollTop;
      const p = max > 0 ? y / max : 0;
      if (bar) bar.style.width = p * 100 + "%";
    };
    addEventListener("scroll", onProgress, { passive: true });
    onProgress();

    // ---- Reveal: scroll-listener path (works everywhere) + optional IO boost ----
    const revealSel = "[data-rr],[data-rr-l],[data-rr-r]";
    if (reduce) {
      document.querySelectorAll(revealSel).forEach((el) => el.classList.add("is-in"));
    } else {
      const inView = (el: Element) => {
        const r = el.getBoundingClientRect();
        const vh = innerHeight;
        return r.top < vh * 0.94 && r.bottom > 0;
      };
      const revealPass = () => {
        document.querySelectorAll<HTMLElement>(revealSel).forEach((el) => {
          if (!el.classList.contains("is-in") && inView(el)) el.classList.add("is-in");
        });
      };
      revealPass();
      addEventListener("scroll", revealPass, { passive: true });
      addEventListener("resize", revealPass);

      // Extra IO for smoother stagger where supported
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) (e.target as HTMLElement).classList.add("is-in");
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        );
        document.querySelectorAll(revealSel).forEach((el) => io.observe(el));
      }

      // rAF polling for the first ~4 seconds — catches sandboxed environments
      // where scroll events don't dispatch. Belt-and-suspenders; harmless in real browsers.
      let pollUntil = performance.now() + 4000;
      let lastY = -1;
      const pollTick = (now: number) => {
        const y = window.scrollY;
        if (y !== lastY) {
          lastY = y;
          revealPass();
        }
        if (now < pollUntil) requestAnimationFrame(pollTick);
      };
      requestAnimationFrame(pollTick);
      // Extend polling window on scroll so long-scroll sessions stay covered
      addEventListener(
        "scroll",
        () => {
          pollUntil = performance.now() + 2000;
        },
        { passive: true }
      );
    }

    // ---- Count-up ----
    const countEls = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
    const countStarted = new WeakSet<HTMLElement>();
    const runCount = (el: HTMLElement) => {
      if (countStarted.has(el)) return;
      countStarted.add(el);
      const target = parseInt(el.getAttribute("data-count") || "0", 10) || 0;
      const suf = el.getAttribute("data-suffix") || "";
      let t0: number | null = null;
      const dur = 1400;
      const step = (ts: number) => {
        if (t0 === null) t0 = ts;
        const p = Math.min((ts - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const countPass = () => {
      countEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.9 && r.bottom > 0) runCount(el);
      });
    };
    countPass();
    addEventListener("scroll", countPass, { passive: true });

    // ---- Outline light-up ----
    const outlineEls = Array.from(document.querySelectorAll<HTMLElement>("[data-outline]"));
    const outlineLit = new WeakSet<HTMLElement>();
    const outlinePass = () => {
      outlineEls.forEach((el) => {
        if (outlineLit.has(el)) return;
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.1) {
          outlineLit.add(el);
          el.classList.add("is-lit");
          setTimeout(() => el.classList.remove("is-lit"), 1200);
        }
      });
    };
    outlinePass();
    addEventListener("scroll", outlinePass, { passive: true });

    // ---- Marquee ----
    type Track = {
      track: HTMLElement;
      dir: number;
      pos: number;
      setW: number;
      extra: number;
      hover: boolean;
      onEnter: () => void;
      onLeave: () => void;
    };
    const tracks: Track[] = [];
    let marqRAF: number | null = null;
    let marqScroll: ((e: Event) => void) | null = null;
    if (!reduce) {
      document.querySelectorAll<HTMLElement>(".rd-marquee").forEach((mq) => {
        const track = mq.querySelector<HTMLElement>(".rd-marquee__track");
        if (!track) return;
        mq.classList.add("-js");
        const st: Track = {
          track,
          dir: parseFloat(track.getAttribute("data-marq") || "1") || 1,
          pos: 0,
          setW: track.scrollWidth / 3,
          extra: 0,
          hover: false,
          onEnter: () => {},
          onLeave: () => {},
        };
        st.onEnter = () => (st.hover = true);
        st.onLeave = () => (st.hover = false);
        mq.addEventListener("mouseenter", st.onEnter);
        mq.addEventListener("mouseleave", st.onLeave);
        tracks.push(st);
      });
      if (tracks.length) {
        const frame = () => {
          tracks.forEach((st) => {
            if (!st.setW) st.setW = st.track.scrollWidth / 3 || 1;
            const base = st.hover ? 0.06 : 0.5;
            st.pos -= (base + st.extra) * st.dir;
            const w = st.setW;
            st.pos = st.pos % w;
            if (st.pos > 0) st.pos -= w;
            st.track.style.transform = `translateX(${st.pos}px)`;
            st.extra *= 0.9;
          });
          marqRAF = requestAnimationFrame(frame);
        };
        marqRAF = requestAnimationFrame(frame);
        let lastY = pageYOffset;
        marqScroll = () => {
          const y = pageYOffset;
          const vel = Math.min(Math.abs(y - lastY), 90);
          lastY = y;
          tracks.forEach((st) => (st.extra += vel * 0.22));
        };
        addEventListener("scroll", marqScroll, { passive: true });
      }
    }

    // ---- Magnetic buttons ----
    type Mag = {
      el: HTMLElement;
      tx: number;
      ty: number;
      cx: number;
      cy: number;
      rect: DOMRect | null;
      onEnter: () => void;
      onMove: (ev: MouseEvent) => void;
      onLeave: () => void;
    };
    const mag: Mag[] = [];
    let magRAF: number | null = null;
    if (fine && !reduce) {
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const m: Mag = {
          el,
          tx: 0,
          ty: 0,
          cx: 0,
          cy: 0,
          rect: null,
          onEnter: () => (m.rect = el.getBoundingClientRect()),
          onMove: (ev) => {
            m.rect = m.rect || el.getBoundingClientRect();
            m.tx = (ev.clientX - m.rect.left - m.rect.width / 2) * 0.3;
            m.ty = (ev.clientY - m.rect.top - m.rect.height / 2) * 0.4;
          },
          onLeave: () => {
            m.rect = null;
            m.tx = 0;
            m.ty = 0;
          },
        };
        el.addEventListener("mouseenter", m.onEnter);
        el.addEventListener("mousemove", m.onMove);
        el.addEventListener("mouseleave", m.onLeave);
        mag.push(m);
      });
      if (mag.length) {
        const loop = () => {
          for (const m of mag) {
            m.cx += (m.tx - m.cx) * 0.18;
            m.cy += (m.ty - m.cy) * 0.18;
            if (m.tx === 0 && m.ty === 0 && Math.abs(m.cx) < 0.03 && Math.abs(m.cy) < 0.03) {
              if (m.el.style.transform) m.el.style.transform = "";
              m.cx = 0;
              m.cy = 0;
            } else {
              m.el.style.transform = `translate(${m.cx.toFixed(2)}px,${m.cy.toFixed(2)}px)`;
            }
          }
          magRAF = requestAnimationFrame(loop);
        };
        magRAF = requestAnimationFrame(loop);
      }
    }

    return () => {
      removeEventListener("scroll", onProgress);
      if (marqScroll) removeEventListener("scroll", marqScroll);
      if (marqRAF !== null) cancelAnimationFrame(marqRAF);
      if (magRAF !== null) cancelAnimationFrame(magRAF);
      mag.forEach((m) => {
        m.el.removeEventListener("mouseenter", m.onEnter);
        m.el.removeEventListener("mousemove", m.onMove);
        m.el.removeEventListener("mouseleave", m.onLeave);
        m.el.style.transform = "";
      });
      tracks.forEach((st) => {
        st.track.parentElement?.removeEventListener("mouseenter", st.onEnter);
        st.track.parentElement?.removeEventListener("mouseleave", st.onLeave);
      });
      document.querySelectorAll(".rd-marquee.-js").forEach((el) => el.classList.remove("-js"));
    };
  }, [pathname]);

  return null;
}
