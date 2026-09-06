# Tapkeep — mobile-first to-do app

A phone-first task app: add, edit, complete and delete tasks, group them by
category, search them, and keep them in sync across devices — including while
offline.

## Screens

| Route | Purpose |
| --- | --- |
| `/` | Today's tasks: search, category filters, complete/edit/delete |
| `/new` | Add a task (title, note, category) with validation |
| `/task/$taskId` | Edit a task, change its category, or delete it |
| `/categories` | Category overview with progress |
| `/categories/$categoryId` | Tasks in one category |
| `/reminders` | Daily reminder settings and delivery status |
| `/auth` | Sign in / create an account (optional) |
| `/style-guide` | Screenshot-ready view of every UI component |

## Structure

```
src/
  components/    TaskCard, BottomNav, Screen, SyncBar, ui/ (shadcn)
  lib/           tasks.tsx (offline-first store), *.functions.ts (server calls)
  routes/        file-based routes, incl. api/public/hooks/ for scheduled jobs
  styles.css     design tokens (colors, fonts, shadows)
```

## Offline-first sync

Tasks live in the device cache first, so every add, edit and delete works with
no connection. Each pending change is flagged and replayed to the cloud when
the app is online and signed in; conflicts resolve last-write-wins. Deletes are
tombstoned so they replay correctly instead of resurrecting.

## Daily reminders

Reminder preferences (on/off, time, address) are stored per user. An hourly
scheduled job calls `/api/public/hooks/daily-reminders`, which collects each due
user's unfinished tasks. Delivery stays off — and the app says so plainly —
until a verified sender domain (`REMINDER_SENDER_DOMAIN`) is configured. Nothing
is faked.
