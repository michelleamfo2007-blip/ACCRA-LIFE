# AccraLife

Live Accra. A discovery app for places, events, neighbourhoods, and plans in Accra.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts, password `AccraLife!26`:

- `admin@accralife.app` for the editor desk at `/admin`
- `ama@accralife.app` for a member with a few saves

Accounts, reviews, saves, submissions, and reservations are stored in `data/store.json` on this machine. `supabase/schema.sql` is the shape for moving that store to Postgres later. Google sign-in is reserved on the account screens and not wired yet.

Listings are sample city-guide content so the product feels lived in. Submissions stay in the admin queue until an editor approves them.
