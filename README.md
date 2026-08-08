# chatflow

**conversation, held open.**

Real-time team chat with rooms, presence, and an embedded approval workflow
for reviewing and unblocking employee work. Built on the MERN stack +
Socket.io.

This is a full working scaffold: auth, live chat, presence/typing, file
submissions, manager approve/request-changes, and a mobile-responsive shell
down to ~375px. It's meant to be run locally and built on from here — see
"Where to go next" at the bottom.

---

## Stack

- **Frontend:** React (Vite) + Tailwind CSS + React Router
- **Backend:** Node.js + Express
- **Real-time:** Socket.io (rooms, presence, typing, live status broadcast)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (REST + socket handshake)
- **File storage:** local disk by default (swap for Cloudinary/S3 later)

## Project structure

```
chatflow/
├── server/            Express API + Socket.io
│   └── src/
│       ├── config/        db connection
│       ├── models/        User, Room, Message, Submission
│       ├── middleware/    auth (JWT), upload (multer)
│       ├── routes/        auth, users, rooms, messages, submissions
│       ├── socket/        presence, typing, live message broadcast
│       └── utils/         token signing, seed script
└── client/            React app
    └── src/
        ├── context/        Auth + Socket providers
        ├── pages/          Landing, SignIn, SignUp, AppShell, MySubmissions
        └── components/     Sidebar, RoomView, MessageList/Input,
                             SubmissionCard, presence dot, typing indicator
```

## Prerequisites

- Node.js 18+
- A MongoDB instance — local (`mongod`) or a free [Atlas](https://www.mongodb.com/atlas) cluster

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# edit .env — at minimum set MONGO_URI and a real JWT_SECRET
npm install
npm run seed   # optional: creates demo manager + employee accounts
npm run dev    # starts on http://localhost:5000
```

Demo accounts created by `npm run seed`:

| Role     | Email                  | Password    |
|----------|-------------------------|-------------|
| Manager  | manager@chatflow.dev    | password123 |
| Employee | employee@chatflow.dev   | password123 |

They're already placed in a shared "General" room.

### 2. Frontend

```bash
cd client
cp .env.example .env   # points VITE_API_URL at the server above
npm install
npm run dev             # starts on http://localhost:5173
```

Open `http://localhost:5173`. Sign in with a seeded account, or sign up a
new one (choose employee or manager at signup).

## How the core flow works

1. Sign in (JWT stored client-side, sent on REST calls and the socket handshake)
2. Pick a team room or a person to DM
3. Send plain messages — these go straight over the socket
   (`message:send` → broadcast `message:new`), no REST round trip, no polling
4. Or submit work — upload a file + note via the `+` button; this creates a
   `Submission` + a `submission`-type `Message`, broadcast to the room
5. If you're signed in as the manager, the submission card in the room shows
   **Approve** / **Request changes** buttons
6. Whichever way you decide, the status updates live for everyone in the
   room (`message:updated`) — no refresh
7. If changes were requested, the employee can resubmit a new file straight
   from the same card; status returns to `pending` and the loop continues
8. Once `approved`, that submission shows as approved in **My submissions** too

Presence (online/offline) and typing indicators run over the same socket
connection and update the sidebar / chat header in real time.

## Mobile responsiveness

Breakpoints follow the brief: `640px` / `768px` / `1024px`. Below `768px`
the sidebar becomes an off-canvas drawer (hamburger to open, backdrop tap or
back-arrow to close), the room view goes full-width, the approval card's
buttons stack, the message input sticks to the bottom with safe-area
padding for notched devices, and all tap targets are ≥44px.

## Where to go next

This scaffold intentionally stops at "everything in the brief, working
end-to-end." Natural next steps, in the order the brief's own
"next session starting point" lays out:

- [ ] Swap local disk uploads for Cloudinary/S3 in `server/src/middleware/upload.js`
      (the rest of the app only depends on the resulting `fileUrl`)
- [ ] Pagination / infinite scroll on message history (currently loads the
      last 50 messages per room)
- [ ] Read receipts, unread badges
- [ ] Room creation UI (the API route `POST /api/rooms` already exists —
      there's no "new team channel" button in the sidebar yet)
- [ ] Deploy: server behind something like Render/Fly/EC2 with a real
      MongoDB Atlas connection string; client to Vercel/Netlify with
      `VITE_API_URL` pointed at the deployed API

Deliberately **not** on this list, per the brief's scope guardrails: payroll/
benefits, org charts, multi-level approval chains, calendar integrations,
video/voice, end-to-end encryption.
