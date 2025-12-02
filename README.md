# ⚔️ Solo Leveling Training System — React + Vite

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
- 🔥 **Penalty Mode** (20:00 survival clicks — from anime)
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
🔐 Environment Setup
Create a file:

lua
Copy code
.env.local
Inside add:

ini
Copy code
VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
⚠️ Never upload this file
It is already protected using .gitignore.

---
🛠 Installation
bash
Copy code
npm install
Start development:

bash
Copy code
npm run dev
Build for production:

bash
Copy code
npm run build
Preview build:

bash
Copy code
npm run preview
☁️ Deploy on Vercel
Push repo to GitHub

Go to vercel.com → Import repository

Add an environment variable:

ini
Copy code
VITE_GEMINI_API_KEY=YOUR_KEY
Deploy ✔
---
🤖 System Chat Example
Ask for training routines
Ask for diet advice
Ask for strategy upgrades
Ask for Solo Leveling themed responses
Clear chat anytime
---
📦 Inventory & Gear System
Buy items from the Shop

Equip gear with stat bonuses

Inventory saved in LocalStorage

Runes give special buffs

Potions give one-time boosts
---
🔥 Penalty Mode
After 20:00, if quests are not completed:

System triggers penalty

User must survive by clicking

Dramatic sound effects

Inspired by anime time-limit penalties
---
🧙 Powered By
React + TypeScript

Vite

Gemini AI

TailwindCSS

LocalStorage Persistence
---
⭐ Give the Project a Star!
If you like the project, please ⭐ the repo!
More features coming soon — raids, dungeon mode, awakening system, pets, and more.
---
📞 Developer
Built by Sajjala Siddardha
Solo Leveling Inspired Training Assistant
