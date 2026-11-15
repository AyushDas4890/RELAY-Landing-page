import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate, type MotionValue } from 'motion/react';
import { LogoMark } from './LogoIntro.tsx';
import { Doodle, PushPin } from './Notebook.tsx';

/**
 * PageIntro: the notebook opening, driven by scroll.
 *
 * The page opens on the same squared paper as the site. The Relay logo is pinned in the middle on a
 * yellow sticky note, with four notes from a team's Monday stuck around it. Scrolling (wheel, touch,
 * arrow keys, Page Down or Space) scrubs the opening: the notes slide off to the edges, the torn strips
 * peel away, and the logo note lifts off the page toward you, uncovering the site underneath. Scrolling
 * back up scrubs it back. Left alone, it opens by itself after a few seconds. A click, Enter or Escape
 * skips it. Reduced motion skips it entirely.
 */

// Wheel distance (px) to go from closed to fully open.
const TRAVEL = 900;
const IDLE_MS = 3200;

// The notes around the logo: where each sits (vw/vh from centre), its tilt, and which way it leaves.
const NOTES = [
  { tint: 'pink', x: -30, y: -22, r: -7, out: [-70, -40], kicker: '9:02 AM', text: 'Standup runs itself in a thread' },
  { tint: 'green', x: 29, y: -24, r: 6, out: [70, -45], kicker: '9:30 AM', text: 'Every task has an owner' },
  { tint: 'blue', x: -27, y: 23, r: 5, out: [-70, 45], kicker: '11:00 AM', text: '/remind keeps the follow-up' },
  { tint: 'purple', x: 31, y: 21, r: -5, out: [70, 40], kicker: '2:00 PM', text: 'Decisions stay on the page' },
] as const;

function OrbitNote({ n, p, i }: { n: (typeof NOTES)[number]; p: MotionValue<number>; i: number }) {
  // Each note leaves on its own slice of the scroll, so they peel off one after another.
  const start = 0.04 + i * 0.07;
  const t = useTransform(p, [start, start + 0.45], [0, 1], { clamp: true });
  const x = useTransform(t, (v) => `calc(${n.x}vw + ${v * n.out[0]}vw)`);
  const y = useTransform(t, (v) => `calc(${n.y}vh + ${v * n.out[1]}vh)`);
  const rotate = useTransform(t, (v) => n.r + v * n.r * 3);
  return (
    <motion.div className="pi-orbit" style={{ x, y, rotate }}>
      <motion.div className={`nb-note nb-${n.tint} pi-note`}
        initial={{ opacity: 0, scale: 1.15, y: -16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.35 + i * 0.12 }}>
        <span className="nb-fix nb-fix-tape" aria-hidden />
        <span className="pi-kicker">{n.kicker}</span>
        <span className="pi-text">{n.text}</span>
      </motion.div>
    </motion.div>
  );
}

export function PageIntro({ onDone, onReveal }: { onDone: () => void; onReveal?: () => void }) {
  const reduce = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches).current;
  const [gone, setGone] = useState(reduce);

  // `goal` is where scrolling has asked the opening to be; `p` follows it on a spring, so the scrub feels
  // like paper with a little weight rather than a scrollbar.
  const goal = useMotionValue(0);
  const p = useSpring(goal, { stiffness: 120, damping: 26, mass: 0.6 });
  const finishing = useRef(false);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    void animate(goal, 1, { duration: 0.9, ease: [0.65, 0, 0.35, 1] });
    // Safety net: if frames are throttled (a background tab), still hand over to the page.
    window.setTimeout(() => { setGone(true); onReveal?.(); onDone(); }, 2600);
  }, [goal, onDone, onReveal]);

  useEffect(() => { if (reduce) onDone(); }, [reduce, onDone]);

  // The page underneath mounts as the paper starts to fade, so its entrance plays as it is uncovered;
  // the opening unmounts once it has fully played out.
  const revealed = useRef(false);
  useEffect(() => p.on('change', (v) => {
    if (v > 0.7 && !revealed.current) { revealed.current = true; onReveal?.(); }
    if (v > 0.985 && !gone) { setGone(true); onDone(); }
  }), [p, gone, onDone, onReveal]);

  // Scroll input: wheel, touch drag and keys all push `goal`. Each input also restarts the idle timer.
  useEffect(() => {
    if (reduce) return;
    let idle = window.setTimeout(finish, IDLE_MS);
    const nudge = (delta: number) => {
      if (finishing.current) return;
      window.clearTimeout(idle);
      const next = Math.min(1, Math.max(0, goal.get() + delta / TRAVEL));
      goal.set(next);
      if (next >= 0.92) finish();
      else idle = window.setTimeout(finish, IDLE_MS);
    };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); nudge(e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY); };
    let lastY: number | null = null;
    const onTouchStart = (e: TouchEvent) => { lastY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (lastY === null) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      nudge((lastY - y) * 2.2);
      lastY = y;
    };
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); nudge(e.key === 'ArrowDown' ? 140 : 320); }
      else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); nudge(e.key === 'ArrowUp' ? -140 : -320); }
      else if (e.key === 'Enter' || e.key === 'Escape') finish();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [reduce, goal, finish]);

  // The logo note lifts toward you and tips back like a page being peeled up, then the paper fades.
  const noteScale = useTransform(p, [0, 0.55, 1], [1, 1.25, 3.2]);
  const noteRotX = useTransform(p, [0.35, 1], [0, 58]);
  const noteRot = useTransform(p, [0, 1], [-3, 4]);
  const noteY = useTransform(p, [0.35, 1], ['0vh', '-30vh']);
  const noteOpacity = useTransform(p, [0.7, 0.95], [1, 0]);
  const stripL = useTransform(p, [0, 0.5], ['0vw', '-60vw']);
  const stripR = useTransform(p, [0, 0.5], ['0vw', '60vw']);
  const paperOpacity = useTransform(p, [0.78, 1], [1, 0]);
  const hintOpacity = useTransform(p, [0, 0.12], [1, 0]);
  const progress = useTransform(p, [0, 1], [0, 1]);

  if (gone) return null;

  return (
    <motion.div className="pi" style={{ opacity: paperOpacity }} onClick={finish} role="presentation">
      <motion.i className="pi-strip pi-strip-l" style={{ x: stripL }} />
      <motion.i className="pi-strip pi-strip-r" style={{ x: stripR }} />

      {NOTES.map((n, i) => <OrbitNote key={n.text} n={n} p={p} i={i} />)}

      <div className="pi-stage">
        <motion.div className="pi-logo-note" style={{ scale: noteScale, rotateX: noteRotX, rotate: noteRot, y: noteY, opacity: noteOpacity }}
          initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
          <span className="pi-pin"><PushPin /></span>
          <LogoMark size={84} />
          <span className="pi-word">Relay</span>
          <span className="pi-tag">Team management, minus the meetings</span>
          <Doodle kind="burst" className="pi-burst" />
        </motion.div>
      </div>

      <motion.div className="pi-hint" style={{ opacity: hintOpacity }}>
        <span>Scroll to open</span>
        <svg width="18" height="26" viewBox="0 0 18 26" aria-hidden>
          <path d="M9 2 C 6 8, 12 13, 9 22" fill="none" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
          <path d="M4 18 L9 23 L14 18" fill="none" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      {/* A pen line across the bottom fills as the page opens. */}
      <svg className="pi-progress" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden>
        <motion.path d="M2 5 C 50 2, 120 7, 198 4" fill="none" stroke="#1b1b1b" strokeWidth="2.4" strokeLinecap="round" style={{ pathLength: progress }} />
      </svg>
    </motion.div>
  );
}
