# Realtime School Event Scoreboard System

## Project Overview

This project is a production-ready realtime school scoreboard system designed for large LCD/LED display screens.

The system allows event staff to update scores through an admin panel while live ranking updates are displayed instantly on fullscreen scoreboard displays.

The design theme is:

* Back to School
* Sports Stadium
* Fun and colorful
* Animated scoreboard
* Realtime ranking movement

The system must support:

* realtime score updates
* animated ranking reorder
* fullscreen LCD mode
* responsive 16:10 layout
* smooth GPU optimized animations

---

# Tech Stack

## Frontend

* Next.js App Router
* TailwindCSS
* Framer Motion
* Socket.IO Client

Deployment:

* Vercel

---

## Backend

* Bun Runtime
* ElysiaJS
* Socket.IO Server

Deployment:

* Railway
* Docker

---

## Database

* PostgreSQL
* Neon PostgreSQL

ORM:

* Prisma

---

# Main Features

## Live Display Screen

Route:

* /display

Features:

* fullscreen scoreboard
* animated ranking reorder
* animated score counting
* realtime websocket updates
* responsive scaling
* GPU optimized rendering

---

## Admin Panel

Route:

* /admin

Features:

* add score
* remove score
* reset score
* realtime update
* manage teams
* update event title

---

# Animation Requirements

## Ranking Animation

* smooth row movement
* spring animation
* reorder transition

## Score Animation

* count up effect
* glow pulse effect

## Screen Transition

* smooth fade
* no full page refresh

---

# Asset Structure

Assets are separated into layers.

## Background Layer

Static background only.

Examples:

* stadium-bg.webp

---

## UI Layer

Reusable UI graphics.

Examples:

* row-bg.webp
* header.webp
* badge-gold.svg

---

## Decoration Layer

Static decorations.

Examples:

* confetti.webp
* doodles.svg

---

## Dynamic Layer

Must NOT use PNG.

Dynamic content:

* score
* rank
* team name

These must render using React components.

---

# Folder Structure

/apps
/frontend
/backend

/packages
/ui
/config

/public
/assets

---

# Frontend Requirements

* Use reusable React components
* Use TypeScript
* Use TailwindCSS
* Use Framer Motion
* Use App Router
* Use responsive scaling
* Optimize for fullscreen TV

---

# Backend Requirements

* Use ElysiaJS
* Use Socket.IO
* Use Prisma
* Use PostgreSQL
* Use websocket events

---

# Performance Requirements

* Avoid unnecessary rerenders
* Use transform animation instead of top/left
* Optimize animation for LCD display
* Use WebP assets
* Use SVG for icons

---

# Future Expansion

The system should support:

* multiple events
* multiple displays
* sponsor banners
* countdown timer
* sound effects
* OBS streaming integration
