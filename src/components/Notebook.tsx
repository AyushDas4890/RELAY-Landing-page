// Notebook pieces for the public home page: sticky notes you can pick up, a task board made of them, and the
// pen marks (dashed arrow, double underline) that annotate the page. Built on motion; everything moves with
// transform and opacity, and reduced motion keeps every interaction but drops the flourishes.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { useMediaQuery } from '@astryxdesign/core/hooks';

// On touch screens dragging a note would trap the page scroll, so notes stay put and a tap moves them.
const useTouch = () => useMediaQuery('(pointer: coarse)');

export type NoteTint = 'yellow' | 'pink' | 'green' | 'blue' | 'purple';
const EASE = [0.16, 1, 0.3, 1] as const;

// A push pin seen from above: a coloured head with a small highlight, and its shadow on the paper.
export function PushPin({ color = 'var(--nb-pin)' }: { color?: string }) {
  return (
    <svg className="nb-pin" width="28" height="30" viewBox="0 0 28 30" aria-hidden>
      <ellipse cx="16" cy="25" rx="7" ry="2.6" fill="rgba(27,27,27,.18)" />
      <path d="M14 15 L14 25" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="11" r="9" fill={color} stroke="#1b1b1b" strokeWidth="2" />
      <circle cx="11" cy="8" r="2.6" fill="rgba(255,255,255,.7)" />
    </svg>
  );
}

// A paper clip drawn as one inked line.
export function PaperClip() {
  return (
    <svg className="nb-clip" width="22" height="58" viewBox="0 0 22 58" aria-hidden>
      <path d="M15 14 V44 a5 5 0 0 1 -10 0 V9 a7 7 0 0 1 14 0 V40" fill="none" stroke="#1b1b1b" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// A pen line that draws itself when it scrolls into view.
function useDraw() {
  const reduce = useReducedMotion();
  return {
    initial: { pathLength: reduce ? 1 : 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true, amount: 0.6 },
    transition: { duration: 1.1, ease: EASE },
  };
}

// The curly dashed arrow from the brainstorm deck. The dash is a mask over a line that draws in.
export function DashedArrow({ className, flip }: { className?: string; flip?: boolean }) {
  const draw = useDraw();
  const id = useRef(`nbmask-${Math.random().toString(36).slice(2, 8)}`).current;
  const d = 'M6 10 C 60 0, 112 18, 104 58 C 98 88, 46 84, 58 60 C 70 36, 132 50, 150 104';
  return (
    <svg className={`nb-arrow ${className ?? ''}`} width="170" height="130" viewBox="0 0 170 130" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
      <mask id={id}>
        <motion.path d={d} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" {...draw} />
      </mask>
      <path d={d} fill="none" stroke="#1b1b1b" strokeWidth="2.4" strokeDasharray="8 7" strokeLinecap="round" mask={`url(#${id})`} />
      <motion.path d="M136 98 L151 106 L154 89" fill="none" stroke="#1b1b1b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ delay: 0.9, duration: 0.2 }} />
    </svg>
  );
}

// Two quick pen strokes under a heading, from the workshop deck.
export function Underline() {
  const draw = useDraw();
  return (
    <svg className="nb-underline" width="240" height="18" viewBox="0 0 240 18" aria-hidden>
      <motion.path d="M4 6 C 70 2, 160 3, 236 6" fill="none" stroke="#1b1b1b" strokeWidth="2.6" strokeLinecap="round" {...draw} />
      <motion.path d="M22 14 C 90 10, 170 11, 226 13" fill="none" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round" {...draw} transition={{ ...draw.transition, delay: 0.25 }} />
    </svg>
  );
}

// One sticky note: perforated top, a flat tint, a pin or a strip of tape, a resting tilt. Picking it up
// straightens it and lifts it off the paper; let go and it springs back to where it was stuck.
export function StickyNote({ tint, tilt = 0, fixing = 'pin', children, className, lined, style, enter }: {
  tint: NoteTint; tilt?: number; fixing?: 'pin' | 'tape' | 'clip'; children: ReactNode; className?: string; lined?: boolean; style?: CSSProperties;
  /** Seconds to wait, then the note is slapped onto the page: it drops in a little large and settles. */
  enter?: number;
}) {
  const reduce = useReducedMotion();
  const touch = useTouch();
  const stickOn = enter !== undefined && !reduce;
  return (
    <motion.div
      className={`nb-note nb-${tint}${lined ? ' is-lined' : ''}${touch ? ' is-touch' : ''} ${className ?? ''}`}
      style={{ ...style }}
      initial={stickOn ? { opacity: 0, y: -18, scale: 1.12, rotate: tilt + 7 } : { rotate: tilt }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
      transition={stickOn ? { type: 'spring', stiffness: 300, damping: 22, delay: enter } : { type: 'spring', stiffness: 380, damping: 24 }}
      drag={!touch}
      dragSnapToOrigin
      dragElastic={0.35}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 18 }}
      whileHover={reduce ? undefined : { rotate: tilt * 0.3, y: -4 }}
      whileDrag={{ rotate: 0, scale: 1.05, zIndex: 5, boxShadow: '10px 14px 0 rgba(27,27,27,.12)', cursor: 'grabbing' }}
    >
      {fixing === 'pin' && <span className="nb-fix nb-fix-pin"><PushPin /></span>}
      {fixing === 'tape' && <span className="nb-fix nb-fix-tape" aria-hidden />}
      {fixing === 'clip' && <span className="nb-fix nb-fix-clip"><PaperClip /></span>}
      {children}
    </motion.div>
  );
}

// ----- Hero notes: the notebook around the headline. -----

// A hand-drawn tick that draws itself when `on` turns true.
function Tick({ on, delay = 0 }: { on: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg className="nb-tick" viewBox="0 0 20 20" aria-hidden>
      <rect x="2" y="3" width="15" height="15" rx="2" fill="rgba(255,255,255,.7)" stroke="#1b1b1b" strokeWidth="1.8" />
      <motion.path d="M5 11 L9 15 L19 2" fill="none" stroke="#1b1b1b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.35, delay: on && !reduce ? delay : 0, ease: EASE }} />
    </svg>
  );
}

// Monday's checklist. One item ticks itself off after the note lands; the rest tick when clicked.
const TODAY = [
  { label: 'Standup in a thread', who: 'Ken' },
  { label: 'Q3 deck to the client', who: 'Maya' },
  { label: 'Pricing page copy', who: 'Priya' },
];
export function HeroChecklist({ enter = 0 }: { enter?: number }) {
  const [done, setDone] = useState([false, false, false]);
  useEffect(() => { const t = setTimeout(() => setDone((d) => [true, d[1], d[2]]), (enter + 0.9) * 1000); return () => clearTimeout(t); }, [enter]);
  return (
    <StickyNote tint="green" tilt={3} fixing="pin" lined enter={enter} className="nb-hero-list">
      <span className="nb-hand-title">Monday</span>
      <ul className="nb-list">
        {TODAY.map((t, k) => (
          <li key={t.label}>
            <button type="button" className={done[k] ? 'is-done' : undefined} aria-pressed={done[k]}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setDone((d) => d.map((v, i) => (i === k ? !v : v)))}>
              <Tick on={done[k]} />
              <span>{t.label}</span>
              <em>{t.who}</em>
            </button>
          </li>
        ))}
      </ul>
    </StickyNote>
  );
}

// The meeting that did not happen: a pen line strikes it out once the note lands.
export function CancelledMeeting({ enter = 0 }: { enter?: number }) {
  const reduce = useReducedMotion();
  return (
    <StickyNote tint="pink" tilt={-5} fixing="tape" enter={enter} className="nb-hero-meeting">
      <span className="nb-meeting-time">Mon 10:00</span>
      <span className="nb-meeting-title">
        Status meeting
        <svg className="nb-strike" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden>
          <motion.path d="M2 8 C 30 3, 70 10, 98 4" fill="none" stroke="#1b1b1b" strokeWidth="2.6" strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: reduce ? 0 : enter + 0.8, ease: EASE }} />
        </svg>
      </span>
      <span className="nb-meeting-note">Updates went in the #product-team thread instead</span>
    </StickyNote>
  );
}

// Loose pen marks from the decks: an asterisk, a cross and a few burst strokes, drawn in once.
export function Doodle({ kind, className }: { kind: 'asterisk' | 'cross' | 'burst'; className?: string }) {
  const reduce = useReducedMotion();
  const paths = {
    asterisk: ['M20 3 L19 37', 'M4 13 L36 27', 'M6 29 L34 10'],
    cross: ['M6 8 L34 32', 'M32 6 L8 34'],
    burst: ['M8 30 L2 22', 'M18 26 L18 14', 'M28 30 L36 22'],
  }[kind];
  return (
    <svg className={`nb-doodle ${className ?? ''}`} width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      {paths.map((d, i) => (
        <motion.path key={d} d={d} fill="none" stroke="#1b1b1b" strokeWidth="2.4" strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, delay: reduce ? 0 : 1.4 + i * 0.12, ease: EASE }} />
      ))}
    </svg>
  );
}

// ----- Margin notes for the inner pages: two notes beside the page's opening, and a pen mark. -----

export interface MarginNote { tint: NoteTint; tilt: number; fixing: 'pin' | 'tape' | 'clip'; kicker: string; title: string; lines?: string[]; lined?: boolean }

export function MarginNotes({ left, right, split }: { left?: MarginNote; right?: MarginNote; split?: boolean }) {
  const note = (n: MarginNote, side: 'left' | 'right', enter: number) => (
    <StickyNote tint={n.tint} tilt={n.tilt} fixing={n.fixing} lined={n.lined} enter={enter} className={`nb-margin-note is-${side}`}>
      <span className="nb-meeting-time">{n.kicker}</span>
      <span className="nb-meeting-title">{n.title}</span>
      {n.lines?.map((l) => <span key={l} className="nb-meeting-note">{l}</span>)}
    </StickyNote>
  );
  return (
    <div className={`nb-margin-notes${split ? ' is-split' : ''}`}>
      {left && note(left, 'left', 0.5)}
      {right && note(right, 'right', 0.75)}
      <Doodle kind="asterisk" className="nb-md-1" />
      <Doodle kind="cross" className="nb-md-2" />
    </div>
  );
}

// ----- The sticky task board: the channel board from the product, made of notes you can move. -----

type Col = 'todo' | 'doing' | 'done';
const COLS: { id: Col; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
];
type Card = { id: string; title: string; owner: string; tint: NoteTint; col: Col; tilt: number };
const START: Card[] = [
  { id: 'c1', title: 'Pricing page copy', owner: 'Priya Nair', tint: 'pink', col: 'todo', tilt: -2.5 },
  { id: 'c2', title: 'Q3 deck for the client', owner: 'Maya Chen', tint: 'yellow', col: 'todo', tilt: 1.8 },
  { id: 'c3', title: 'Release notes', owner: 'Ken Ito', tint: 'green', col: 'doing', tilt: -1.4 },
  { id: 'c4', title: 'Onboarding checklist', owner: 'Sam Ortiz', tint: 'purple', col: 'doing', tilt: 2.2 },
  { id: 'c5', title: 'Export fix', owner: 'Ken Ito', tint: 'blue', col: 'done', tilt: -1.8 },
];
const ORDER: Col[] = ['todo', 'doing', 'done'];

function BoardNote({ card, focus, onDrop, onStep, onTap }: { card: Card; focus: boolean; onDrop: (id: string, x: number, y: number) => void; onStep: (id: string, dir: -1 | 1) => void; onTap: (id: string) => void }) {
  const reduce = useReducedMotion();
  const touch = useTouch();
  const [dragging, setDragging] = useState(false);
  // A note moved with the keyboard remounts in its new column; keep focus on it so arrows keep working.
  const self = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (focus) self.current?.focus({ preventScroll: true }); }, [focus]);
  const done = card.col === 'done';
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); onStep(card.id, 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); onStep(card.id, -1); }
  };
  return (
    <motion.button
      ref={self}
      type="button"
      layout={!dragging}
      layoutId={card.id}
      className={`nb-note nb-card nb-${card.tint}${touch ? ' is-touch' : ''}`}
      onClick={touch ? () => onTap(card.id) : undefined}
      aria-label={`${card.title}, owned by ${card.owner}, in ${COLS.find((c) => c.id === card.col)!.label}. Use the left and right arrow keys to move it.`}
      onKeyDown={onKey}
      style={{ rotate: card.tilt, zIndex: dragging ? 10 : 1 }}
      drag={!touch}
      whileTap={touch && !reduce ? { scale: 0.96 } : undefined}
      dragSnapToOrigin
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={(e) => {
        setDragging(false);
        const p = 'clientX' in e ? (e as PointerEvent) : (e as TouchEvent).changedTouches[0];
        onDrop(card.id, p.clientX, p.clientY);
      }}
      whileHover={reduce ? undefined : { rotate: card.tilt * 0.3, y: -3 }}
      whileDrag={{ rotate: card.tilt * -0.6, scale: 1.08, boxShadow: '12px 16px 0 rgba(27,27,27,.13)', cursor: 'grabbing' }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
    >
      <span className="nb-card-title">
        {card.title}
        <svg className="nb-strike" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden>
          <motion.path d="M2 7 C 30 4, 70 9, 98 5" fill="none" stroke="#1b1b1b" strokeWidth="2.4" strokeLinecap="round"
            initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.5, ease: EASE, delay: done && !reduce ? 0.2 : 0 }} />
        </svg>
      </span>
      <span className="nb-card-owner"><Avatar name={card.owner} size="sm" tooltip={false} /> {card.owner.split(' ')[0]}</span>
    </motion.button>
  );
}

export function StickyBoard() {
  const [cards, setCards] = useState(START);
  const [focusId, setFocusId] = useState<string | null>(null);
  const cols = useRef<Record<Col, HTMLDivElement | null>>({ todo: null, doing: null, done: null });
  const move = (id: string, col: Col) => setCards((cs) => {
    const card = cs.find((c) => c.id === id)!;
    if (card.col === col) return cs;
    // Moving a note to the end of its new column, with a fresh tilt so it looks stuck on by hand.
    return [...cs.filter((c) => c.id !== id), { ...card, col, tilt: Math.round((Math.random() * 5 - 2.5) * 10) / 10 }];
  });
  const onDrop = (id: string, x: number, y: number) => {
    for (const c of ORDER) {
      const r = cols.current[c]?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top - 40 && y <= r.bottom + 40) { move(id, c); return; }
    }
  };
  const onStep = (id: string, dir: -1 | 1) => {
    const i = ORDER.indexOf(cards.find((c) => c.id === id)!.col) + dir;
    if (i >= 0 && i < ORDER.length) { setFocusId(id); move(id, ORDER[i]); }
  };
  // A tap moves a note one column along; a done note goes back to To do.
  const onTap = (id: string) => {
    const i = ORDER.indexOf(cards.find((c) => c.id === id)!.col);
    move(id, ORDER[(i + 1) % ORDER.length]);
  };
  const doneCount = cards.filter((c) => c.col === 'done').length;
  return (
    <div className="nb-board">
      <div className="nb-board-head">
        <span className="nb-board-channel"># product-team board</span>
        <span className="nb-board-count" aria-live="polite">{doneCount} of {cards.length} done</span>
      </div>
      <LayoutGroup>
        <div className="nb-board-cols">
          {COLS.map((col) => {
            const list = cards.filter((c) => c.col === col.id);
            return (
              <div key={col.id} ref={(el) => { cols.current[col.id] = el; }} className={`nb-col nb-col-${col.id}`}>
                <div className="nb-col-label">{col.label} <span>{list.length}</span></div>
                <div className="nb-col-notes">
                  {list.map((card) => <BoardNote key={card.id} card={card} focus={focusId === card.id} onDrop={(id, x, y) => { setFocusId(null); onDrop(id, x, y); }} onStep={onStep} onTap={onTap} />)}
                  {list.length === 0 && <div className="nb-col-empty">Drop a note here</div>}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
