# ⚔️ Solo Leveling Training System — React + Vite

![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)

A gamified training assistant inspired by **Solo Leveling**, built using **React**, **TypeScript**, **Vite**, and **Gemini AI**.  
Complete your daily quests, manage inventory, equip gear, chat with the System, and level up — just like a real hunter.

---

## 🚀 Features

- 🧠 **AI System Consultant** (Gemini-powered)
- 📅 **Daily Quest Tracking** (Pushups, Situps, Squats, Running)
- ⚔️ **Equipment System**  
  Weapons, Armor, Runes, Cloaks, Rings, etc.
- 🎒 **Inventory + Shop System**
- 🧪 **Potions, Materials, Loot Boxes**
- 📈 **Leveling, XP, Stats, Rank Progression**
- 🔔 **System Notifications**
- 🔊 **Sound Effects**
- 🌑 **Solo Leveling Dark UI Theme**
- 🔥 **Penalty Mode** (20:00 survival clicks — anime inspired)
- 💾 **LocalStorage Save System**

---

## 📁 PROJECT STRUCTURE



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
