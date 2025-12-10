# ⚔️ Solo Leveling Training System — React + Vite

![Solo Leveling Training System Banner](./assets/solo-leveling-banner.png)

> **Created by Shadow Monarch — Siddardha** (`@sajjala-siddardha`)

![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite-blue)
![Status](https://img.shields.io/badge/Status-Active%20Development-purple)

A gamified training assistant inspired by **Solo Leveling**, built using **React**, **TypeScript**, **Vite**, and **Gemini AI**.  
Complete your daily quests, manage inventory, equip gear, chat with the System, and level up — just like a real hunter.

---

## 🌌 Concept

Train like a hunter in a Solo Leveling–inspired world:

- Accept and clear **daily quests**
- Equip **weapons, armor, runes, rings, cloaks**
- Use **potions and materials**
- Survive **Penalty Mode** under time pressure
- Get guidance from an **AI System Consultant**

---

## 🚀 Features

- 🧠 **AI System Consultant (Gemini-powered)**
  - Training, diet, motivation, and anime-style responses
  - Local chat history stored in `localStorage`

- 📅 **Daily Quest Tracking**
  - Pushups, Situps, Squats, Running
  - Progress-based XP and leveling

- ⚔️ **Equipment & Gear System**
  - Equip weapon, armor, cloak, rings, runes
  - Stat changes reflected in the status window

- 🎒 **Inventory & Shop**
  - Buy items from the shop
  - Store gear, potions, loot boxes, and materials

- 🧪 **Potions, Materials, Loot Boxes**
  - Potions apply temporary buffs
  - Materials & loot boxes for future expansions

- 📈 **Level, XP, and Rank**
  - Leveling system with rank-style progression (hunter feel)

- 🔥 **Penalty Mode**
  - If quests aren’t completed in time, survival click challenge
  - Alarms, dark UI effects, and tension like Solo Leveling

- 🔔 **System Notifications & SFX**
  - Toast-like system messages
  - Sound effects for key actions

- 🌑 **Solo Leveling Dark UI Theme**
  - Dark, anime-inspired layout
  - Thematic styling for an immersive experience

- 💾 **LocalStorage Save System**
  - Quests, status, and inventory persisted between sessions

---

## 📁 Project Structure

```txt
src/
│── App.tsx
│── main.tsx
│── types.ts
│
├── components/
│   │── ItemBox.tsx
│   │── QuestTracker.tsx
│   │── StatusWindow.tsx
│   │── SystemChat.tsx
│   └── SystemComponents.tsx
│
├── services/
│   │── geminiService.ts
│   │── inventoryService.ts
│   │── notificationService.ts
│   │── soundService.ts
│   └── storage.ts
│
public/
│── index.html
│
.env.local        ← (HIDDEN — contains API key, DO NOT upload)
.gitignore        ← (prevents .env.local from uploading)
package.json
vite.config.ts
README.md

```

---
🤖 System Chat

The System Consultant can answer:

Training recommendations

Diet advice

Motivation

Solo Leveling–style responses

Clear chat feature

Memory saved in LocalStorage
---
🎒 Inventory & Gear System

Purchase items from Shop

Equip Gear (weapon/armor/cloak/rings/runes)

Potions give temporary boosts

Runes grant stat enhancements

Materials & Boxes stored for later use
---
🔥 Penalty Mode

If quests remain incomplete after 20:00:

System activates penalty

User must survive by rapid clicking

Alarms and dramatic UI effects

Inspired by Solo Leveling time-limit scenes
---
🧙 Powered By

React + TypeScript

Vite

Gemini AI

TailwindCSS

LocalStorage persistence
---
⭐ Give the Project a Star

If you like the project, please ⭐ the repo!
More updates coming soon — raids, dungeon mode, awakening system, pets, and more.
---
📞 Developer

Built by: Sajjala Siddardha
Solo Leveling Inspired Trainer System
---
🔐 License

© 2025 Sajjala Siddardha — Solo-Leveling-Training-System
All rights reserved.
Unauthorized copying, reuse, modification, or distribution of any part of this project is strictly prohibited.
