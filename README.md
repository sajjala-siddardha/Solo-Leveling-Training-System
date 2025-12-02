# ⚔️ SOLO LEVELING – TRAINING SYSTEM

A futuristic gamified training platform inspired by **Solo Leveling**, built using **React + TypeScript + Vite**.  
Train daily, level up, equip gear, purchase items, survive penalties, and speak with the AI “SYSTEM” powered by Google Gemini.

---

## ⭐ FEATURES

### 🔥 Daily Quest System  
✔ Pushups, Situps, Squats, Running tracking  
✔ XP + Gold rewards  
✔ Auto-leveling with stat points  
✔ Daily streak bonuses  
✔ Penalty Mode at 20:00 (STRUGGLE to survive)  

### 👤 Player Status & Leveling  
✔ Level, Rank, Job, Title  
✔ Stats: Strength, Agility, Sense, Vitality, Intelligence  
✔ Upgrade stats using level-up points  
✔ Status window shows equipped bonuses  

### 🧰 Item Box & Item Shop  
✔ Potions, Mystery Boxes, Dungeon Keys  
✔ Gear (weapons, armor, cloak, gloves, boots, rings, necklace)  
✔ Legendary Runes  
✔ Each item has rarity + optional stat bonuses  
✔ Equip / Unequip gear  
✔ Inventory saved locally  

### 🧠 AI SYSTEM CONSULTANT (Gemini)  
✔ Real-time AI system responses  
✔ Scrollable message window  
✔ “CLEAR CHAT” button  
✔ Auto-saves conversation per user  

### 🔔 Notifications  
✔ Desktop reminders  
✔ Sound effects for level-up, alerts, penalties  

---

## 🛠 TECH STACK

| Technology | Usage |
|-----------|-------|
| React + TypeScript | UI + Game logic |
| Vite | Compiler & bundler |
| TailwindCSS | Styling |
| LocalStorage | Persistence |
| Google Gemini API | System AI |
| Vercel | Hosting |

---

## 📁 PROJECT STRUCTURE

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
.env.local        ← (contains API key, DO NOT upload)
.gitignore        ← (hides .env.local automatically)
package.json
vite.config.ts
README.md

---

## 🚀 INSTALLATION GUIDE

### 1️⃣ Install dependencies
```sh
npm install
