# Physio Vision

Mobile-first physiotherapy workspace app (frontend demo / PWA).

Two isolated workspaces:

- **Clinic** — patients at the clinic
- **Private** — private clients

Opening a workspace lands on a **Today dashboard**. Day-to-day work happens in **Sessions** (search, history, notes, documents). Patients is a directory, not the home screen.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Install on phone / tablet

- **iPhone / iPad (Safari):** Share → Add to Home Screen  
- **Android (Chrome):** Install app / Add to Home screen  

## Navigation

| Tab | Purpose |
|-----|---------|
| **Today** | Workspace dashboard — stats, up next, today’s schedule, check-in |
| **Sessions** | Search all sessions; open one for notes, previous visits, documents |
| **Patients** | Directory / profiles (add patient when needed) |
| **More** | Settings + reset demo data |

Data is stored in the browser (`localStorage`). No backend yet.
