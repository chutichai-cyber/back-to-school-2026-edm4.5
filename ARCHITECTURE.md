# architecture.md

# Realtime School Event Scoreboard System

## Overview

This project is a production-ready realtime school event scoreboard system for large LCD/LED displays.

The system allows admins/staff to:

* create teams
* create games
* update scores
* manage realtime rankings

The display screen updates instantly with smooth animated ranking movement.

The project theme:

* Back To School
* Sports Stadium
* Realtime Live Scoreboard

---

# System Goals

The system must support:

* realtime score updates
* animated ranking reorder
* fullscreen LCD display
* responsive 16:10 layout
* reusable UI components
* scalable backend architecture
* multiple games per event
* score history tracking

---

# Tech Stack

## Frontend

* Next.js App Router
* JavaScript
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
* Docker Compose

---

## Database

* PostgreSQL
* Prisma ORM

Deployment:

* Neon PostgreSQL

---

# Monorepo Structure

/apps
/frontend
/backend

/packages
/shared

/docs

---

# Frontend Architecture

## Main Routes

/display

* fullscreen scoreboard display

/admin

* admin management panel

---

# Frontend Components

/components
/scoreboard
/layout
/effects
/admin

---

# Scoreboard Components

* ScoreBoard
* ScoreRow
* RankBadge
* TeamAvatar
* ScoreNumber
* HeaderBoard

---

# Frontend Responsibilities

Frontend controls:

* animation
* ranking reorder
* realtime rendering
* responsive scaling
* fullscreen mode

Frontend MUST render:

* score
* rank
* team name

using React components.

Dynamic content MUST NOT use PNG images.

---

# Backend Architecture

## Backend Responsibilities

Backend handles:

* REST API
* websocket events
* score updates
* ranking calculation
* realtime broadcasting
* database communication

---

# API Structure

/api/events
/api/games
/api/teams
/api/scores

---

# Socket.IO Events

score.updated
ranking.updated
team.created
team.deleted
game.created
game.updated

---

# Database Architecture

## Entity Relationship

Event
├── Games
├── Teams
└── Scores

---

# Database Tables

## events

Main event container.

Examples:

* Sports Day 2026
* Back To School Festival

---

## games

Scoring activities.

Examples:

* Football
* Basketball
* Quiz

---

## teams

School team list.

Examples:

* Blue Team
* Red Team

---

## scores

Stores score per team per game.

---

## score_histories

Stores score change history.

---

# Ranking Rules

Ranking MUST be calculated dynamically.

DO NOT store final ranking directly.

Ranking must be generated from:
SUM(team scores)

---

# Realtime Flow

Admin Panel
↓
REST API
↓
PostgreSQL
↓
Socket.IO Broadcast
↓
Display Screen
↓
Animated Ranking Update

---

# Animation Architecture

## Animation Library

* Framer Motion

---

# Required Animations

## Ranking Animation

* smooth reorder
* spring movement
* slide transition

## Score Animation

* count up
* glow pulse
* score highlight

---

# Performance Rules

Frontend MUST:

* avoid unnecessary rerenders
* use transform animation
* optimize fullscreen rendering
* optimize LCD performance

---

# Asset Rules

Designer assets are separated into layers.

Frontend must support:

* background layer
* UI layer
* decoration layer
* team layer

Dynamic layer is rendered using React.

See:
asset_rule.md

---

# Responsive Rules

Primary design ratio:

* 16:10

Supported resolutions:

* 1152x768
* 1920x1200

---

# Docker Compose Architecture

Services:

* frontend
* backend
* postgres

---

# Docker Ports

Frontend:

* 3000

Backend:

* 4000

PostgreSQL:

* 5432

---

# Deployment Architecture

Frontend:

* Vercel

Backend:

* Railway

Database:

* Neon PostgreSQL

---

# Future Expansion

The architecture must support future features:

* multiple displays
* sponsor banners
* countdown timer
* OBS overlay
* TV broadcast mode
* sound effects
* admin authentication
* event history replay

---

# Important Rules

* Dynamic text MUST NOT be exported as images
* Score MUST render with React
* Ranking MUST be realtime
* Assets MUST remain reusable
* Frontend and assets MUST remain decoupled
