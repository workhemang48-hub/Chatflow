import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const STEPS = [
  {
    tag: 'msg',
    title: 'Talk in real time',
    body: 'Rooms and DMs update instantly over one open socket connection — no refresh, no polling.',
  },
  {
    tag: 'sub',
    title: 'Submit the work',
    body: 'Drop a file and a note right into the room. It shows up as a card, not a buried attachment.',
  },
  {
    tag: 'rev',
    title: 'Manager reviews, live',
    body: 'Approve or request changes. The status flips for everyone watching, the moment it happens.',
  },
  {
    tag: 'go',
    title: 'Unblocked, instantly',
    body: 'Approved work clears the way to the next task. Changes requested loops back without leaving the thread.',
  },
];

export default function Landing() {
  return (
    <div className="bg-ink text-mist min-h-screen">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto">
        <Logo size={26} className="text-mist" />
        <nav className="flex items-center gap-3">
          <Link
            to="/signin"
            className="min-h-[44px] px-4 flex items-center text-sm text-mist/70 hover:text-mist"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="min-h-[44px] px-4 flex items-center rounded-full bg-flow text-white text-sm font-medium"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero — the socket bracket, held open, is the thesis */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pt-10 sm:pt-16 pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-xs text-signal tracking-wide mb-4">
            [ real-time team chat + approvals ]
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] mb-5">
            conversation,
            <br />
            held open.
          </h1>
          <p className="text-mist/60 text-base sm:text-lg leading-relaxed max-w-md mb-8">
            chatflow is where a team's messages and a team's work-in-review
            live in the same thread — so a submission's status changes for
            everyone the instant it's reviewed, not on the next page load.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="min-h-[44px] px-6 flex items-center rounded-full bg-flow text-white text-sm font-medium"
            >
              Create an account
            </Link>
            <Link
              to="/signin"
              className="min-h-[44px] px-6 flex items-center rounded-full border border-white/15 text-mist/80 text-sm"
            >
              I already have one
            </Link>
          </div>
        </div>

        <SocketBracketHero />
      </section>

      {/* How it works — a real sequence, so numbering earns its place */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16 border-t border-white/10">
        <p className="font-mono text-xs text-mist/40 mb-8">how a submission moves</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.tag} className="relative">
              <p className="font-mono text-xs text-signal mb-3">0{i + 1} · {step.tag}</p>
              <h3 className="font-display text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-mist/50 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status states — shown honestly, the same badges used in the app */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16 border-t border-white/10">
        <p className="font-mono text-xs text-mist/40 mb-6">the states, honestly</p>
        <div className="flex flex-wrap gap-3">
          <StatusPill label="pending" color="#E9B949" />
          <StatusPill label="approved" color="#5DCAA5" />
          <StatusPill label="changes requested" color="#E4685D" />
        </div>
        <p className="text-sm text-mist/40 mt-6 max-w-lg">
          No decorative "processing" spinners standing in for nothing. Every
          badge in chatflow reflects a real row in the database, broadcast
          the moment it changes.
        </p>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Logo size={20} className="text-mist/50" />
          <p className="font-mono text-xs text-mist/30">
            real-time chat · file submissions · manager approvals
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatusPill({ label, color }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-mono"
      style={{ borderColor: `${color}55`, color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// Signature element: the socket bracket mark, scaled up, with the held dot
// pulsing gently — a persistent connection, not a static logo lockup.
function SocketBracketHero() {
  return (
    <div className="relative flex items-center justify-center py-8">
      <svg
        viewBox="0 0 320 320"
        className="w-full max-w-sm"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M120 50C70 50 50 90 50 150v20c0 60 20 100 70 100"
          stroke="#0F6E56"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M200 50c50 0 70 40 70 100v20c0 60-20 100-70 100"
          stroke="#0F6E56"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="160" cy="160" r="20" fill="#5DCAA5">
          <animate attributeName="r" values="20;24;20" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.75;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
