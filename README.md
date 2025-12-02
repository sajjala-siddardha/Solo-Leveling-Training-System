# ⚔️ SOLO LEVELING — TRAINING SYSTEM (React + Vite)

A full gamified fitness system inspired by **Solo Leveling**.  
Players complete daily quests, level up, earn gold, buy items, equip gear, gain bonuses, survive penalties, and receive AI-generated guidance — all inside a futuristic “System Interface”.

Built with:
- **React + TypeScript**
- **Vite**
- **LocalStorage Persistence**
- **Google Gemini API (for System Assistant)**

---

## 🚀 FEATURES

### 🧩 Player System
- Login with **name + Gmail**
- Persistent user data (level, XP, gold, stats, streak)

### 🏋️ Daily Training Quest
- Push-ups, Sit-ups, Squats, Running
- Auto reset daily
- Rewards XP + Gold on completion

### 🏆 Leveling System
- Level up automatically
- Earn stat points
- XP scaling per level

### 🛒 Item Shop
- Buy Potions, Mystery Boxes, Dungeon Keys  
- Buy Gear (Weapon/Armor/Cloak/Boots/Gloves/Rings/Necklace)
- Buy Legendary Runes
- Items added to **Item Box**

### 📦 Item Box (Inventory)
- View, Equip, Use, Discard items  
- Gear gives stats  
- Runes give bonuses

### 🧰 Equipment System
- Equip items to dedicated slots  
- Unequip items anytime  
- Auto-calculated **gear bonus stats**

### ⚠️ Penalty Mode
- If quest not finished by **8 PM**
- System triggers a penalty survival mode
- Player must tap 50 times to escape

### 💬 System Consultant (AI Chat)
- Ask questions to the “System”
- Powered by Google Gemini API
- Messages are stored per user
- CLEAR button resets chat

---

## 🛠️ TECH STACK

| Technology | Purpose |
|-----------|---------|
| React + Vite | Frontend Framework |
| TypeScript | Strong typing |
| LocalStorage | User persistence |
| TailwindCSS | UI Styling |
| Google Gemini API | AI chat system |

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
.env.local        ← (HIDDEN — contains API key)
.gitignore        ← (prevents .env.local from uploading)
package.json
vite.config.ts
README.md

---

🔧 INSTALLATION
1️⃣ Clone the Repository
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO

2️⃣ Install Dependencies
npm install

3️⃣ Create .env.local
VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE


IMPORTANT:
.env.local is automatically protected by .gitignore.
NEVER upload your API key.

4️⃣ Start Development Server
npm run dev

🌐 DEPLOY TO VERCEL (SAFE API KEY)
✔ Step 1: Push to GitHub

Your .env.local will NOT be uploaded (safe).

✔ Step 2: On Vercel Dashboard → Project → Settings → Environment Variables

Add:

KEY: VITE_GEMINI_API_KEY
VALUE: your_api_key


✔ Deploy
✔ No API key leakage
✔ Works perfectly

👑 CREDITS

Developer: Sajjala Siddardha

AI System Integration: Gemini API

Inspiration: Solo Leveling Webtoon

🛡️ LICENSE

This project is for educational and personal use.
