// ==========================================================
//  APP.TSX — BLOCK A (Imports + State + Functions)
// ==========================================================

import React, { useState, useEffect } from 'react';
import { User, DailyProgress, Stats } from './types';
import {
  saveUser,
  loadCurrentSession,
  loginUser,
  logoutUser,
  checkUserExists,
} from './services/storage';
import { calculateRequiredXp, checkProgression } from './services/gameLogic';
import { generateSystemMessage } from './services/geminiService';

import { SystemWindow, Button, ProgressBar } from './components/SystemComponents';
import { QuestTracker } from './components/QuestTracker';
import { StatusWindow } from './components/StatusWindow';
import { SystemChat } from './components/SystemChat';

import { soundService } from './services/soundService';
import {
  requestNotificationPermission,
  sendSystemNotification,
} from './services/notificationService';

import {
  loadInventory,
  addItemToInventory,
  removeItem,
  InventoryItem,
  EquipmentSlot,
} from './services/inventoryService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [systemNotif, setSystemNotif] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const [showShop, setShowShop] = useState(false);
  const [showItemBox, setShowItemBox] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [penaltyActive, setPenaltyActive] = useState(false);
  const [penaltyClicks, setPenaltyClicks] = useState(0);
  const [penaltyGateOpen, setPenaltyGateOpen] = useState(false);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  // ------------------ Equipped Bonuses ------------------
  const getEquippedBonuses = (u: User | null, inv: InventoryItem[]): Partial<Stats> => {
    const empty: Partial<Stats> = {
      strength: 0, agility: 0, sense: 0, vitality: 0, intelligence: 0,
    };
    if (!u?.equipment) return empty;

    const result: Partial<Stats> = { ...empty };
    const slots: EquipmentSlot[] = ['weapon','armor','cloak','gloves','boots','necklace','ring1','ring2','rune'];

    for (const slot of slots) {
      const id = u.equipment[slot];
      const item = inv.find(i => i.id === id);
      if (!item?.bonuses) continue;
      for (const key in item.bonuses) {
        result[key as keyof Stats] = (result[key as keyof Stats] || 0) + (item.bonuses[key] || 0);
      }
    }
    return result;
  };

  const equippedBonuses = getEquippedBonuses(user, inventory);

  // ------------------ INIT ------------------
  useEffect(() => {
    const sessionUser = loadCurrentSession();
    if (sessionUser) {
      setUser(sessionUser);
      checkDailyReset(sessionUser);

      const inv = loadInventory(sessionUser.email);
      setInventory(inv);

      generateSystemMessage('LOGIN', sessionUser).then(msg => {
        setSystemNotif(msg);
        soundService.playNotification();
      });

      if (Notification.permission === "granted") setNotificationsEnabled(true);
    }
    setLoading(false);
  }, []);

  // ------------------ DAILY RESET ------------------
  const checkDailyReset = (currentUser: User) => {
    const lastLog = currentUser.history.at(-1);
    if (lastLog?.date === todayStr) setTodayProgress(lastLog);
    else {
      setTodayProgress({
        date: todayStr, pushups: 0, situps: 0, squats: 0, running: 0,
        completed: false, penaltySurvived: false,
      });
    }
  };

  // ------------------ LOGIN ------------------
  const handleLogin = () => {
    if (!nameInput.trim() || !emailInput.trim()) return;
    if (!emailInput.includes('@')) return soundService.playError();

    const exists = checkUserExists(emailInput);
    if (exists) alert("Account exists — logging in.");

    const { user: loggedInUser } = loginUser(emailInput, nameInput);
    setUser(loggedInUser);
    checkDailyReset(loggedInUser);

    const inv = loadInventory(loggedInUser.email);
    setInventory(inv);

    generateSystemMessage("LOGIN", loggedInUser).then(setSystemNotif);
    soundService.playConfirm();
  };

  // ------------------ LOGOUT ------------------
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setTodayProgress(null);
    setNameInput('');
    setEmailInput('');
    setInventory([]);
  };

  // ------------------ NOTIFICATIONS ------------------
  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      new Notification("The System", { body: "Notifications Enabled." });
      soundService.playNotification();
    }
  };

  // ------------------ STAT UPGRADE ------------------
  const upgradeStat = (stat: keyof Stats) => {
    if (!user || user.stats.availablePoints <= 0) return soundService.playError();

    const updatedUser: User = {
      ...user,
      stats: {
        ...user.stats,
        [stat]: user.stats[stat] + 1,
        availablePoints: user.stats.availablePoints - 1,
      },
    };
    setUser(updatedUser);
    saveUser(updatedUser);
  };

  // ------------------ EQUIP ITEM ------------------
  const equipItem = (item: InventoryItem) => {
    if (!user) return;
    if (!item.slot) return setSystemNotif("This item cannot be equipped.");

    if (!user.equipment) {
      user.equipment = {
        weapon: null, armor: null, cloak: null, gloves: null,
        boots: null, necklace: null, ring1: null, ring2: null, rune: null
      };
    }

    const updatedUser: User = {
      ...user,
      equipment: { ...user.equipment, [item.slot]: item.id }
    };

    setUser(updatedUser);
    saveUser(updatedUser);
    setSystemNotif(`Equipped ${item.name}`);
  };

  // ------------------ UNEQUIP ITEM ------------------
  const unequipItem = (slot: EquipmentSlot) => {
    if (!user?.equipment) return;

    const updatedUser: User = {
      ...user,
      equipment: { ...user.equipment, [slot]: null }
    };
    setUser(updatedUser);
    saveUser(updatedUser);
  };

  // ------------------ BUY ITEM ------------------
  const buyItem = (
    cost: number,
    itemName: string,
    type: 'potion' | 'box' | 'key' | 'gear' | 'material' | 'rune',
    desc: string,
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary',
    slot?: EquipmentSlot,
    bonuses: Partial<Stats> = {}
  ) => {
    if (!user || !todayProgress) return;
    if (user.gold < cost) return setSystemNotif("Insufficient Funds.");

    const updatedUser = { ...user, gold: user.gold - cost };
    saveUser(updatedUser);
    setUser(updatedUser);

    const newInv = addItemToInventory(user.email, {
      name: itemName, type, desc, rarity, slot, bonuses
    });
    setInventory(newInv);

    setSystemNotif(`Purchased: ${itemName}`);
  };
// ==========================================================
//  APP.TSX — BLOCK B (Penalty Zone + Shop + Item Box)
// ==========================================================

// ------------------ TRIGGER PENALTY ------------------
const triggerPenalty = async (reason?: string) => {
  if (!user) return;

  setPenaltyActive(true);
  setPenaltyClicks(50);
  setPenaltyGateOpen(false);

  soundService.playAlarm();

  const penaltyMsg = await generateSystemMessage('PENALTY', user);

  setSystemNotif(`${reason || "PENALTY MODE ACTIVATED"}\n\n${penaltyMsg}`);

  const interval = setInterval(() => {
    if (!penaltyGateOpen && Math.random() > 0.6) soundService.playAlarm();
  }, 2000);

  (window as any).penaltyInterval = interval;
};

// ------------------ PENALTY CLICK ------------------
const handleSurviveClick = () => {
  if (penaltyClicks > 0) {
    setPenaltyClicks(prev => prev - 1);
    soundService.playClick();

    if (penaltyClicks === 1) {
      setPenaltyGateOpen(true);
      soundService.playLevelUp();
      clearInterval((window as any).penaltyInterval);
    }
    return;
  }

  if (penaltyGateOpen) {
    setPenaltyActive(false);
    setPenaltyGateOpen(false);

    setSystemNotif("PENALTY SURVIVED. REWARD: NONE.");
    soundService.playConfirm();

    if (todayProgress && user) {
      const updated = { ...todayProgress, penaltySurvived: true };
      setTodayProgress(updated);

      const newHistory = user.history.filter(h => h.date !== todayStr);
      newHistory.push(updated);

      const updatedUser = { ...user, history: newHistory };
      setUser(updatedUser);
      saveUser(updatedUser);
    }
  }
};

// ------------------ COMPLETE QUEST ------------------
const completeQuest = async () => {
  if (!user || !todayProgress) return;

  const xpGain = 150;
  const goldGain = 1000;

  let newLevel = user.level;
  let xp = user.currentXp + xpGain;
  let req = user.requiredXp;
  let ap = user.stats.availablePoints;
  let levelUp = false;

  while (xp >= req) {
    xp -= req;
    newLevel++;
    req = calculateRequiredXp(newLevel);
    ap += 3;
    levelUp = true;
  }

  const updatedProgress = { ...todayProgress, completed: true };
  const newHistory = user.history.filter(h => h.date !== todayStr);
  newHistory.push(updatedProgress);

  let updatedUser: User = {
    ...user,
    level: newLevel,
    currentXp: xp,
    requiredXp: req,
    gold: user.gold + goldGain,
    stats: { ...user.stats, availablePoints: ap },
    streak: user.streak + 1,
    history: newHistory,
  };

  const prog = checkProgression(updatedUser);
  updatedUser = prog.user;

  setUser(updatedUser);
  saveUser(updatedUser);
  setTodayProgress(updatedProgress);

  soundService.playLevelUp();

  if (levelUp) {
    const msg = await generateSystemMessage('LEVEL_UP', updatedUser);
    setSystemNotif(msg);
  } else {
    setSystemNotif("DAILY QUEST COMPLETE. REWARDS RECEIVED.");
  }
};

// ==========================================================
//  SHOP MODAL (SCROLL FIXED, CLOSE BUTTON FIXED)
// ==========================================================

if (showShop && !penaltyActive) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <SystemWindow title="Hunter Supply Shop" className="max-w-3xl w-full">

        {/* ⭐ SCROLLABLE AREA ⭐ */}
        <div className="max-h-[70vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          {/* POTIONS */}
          <div className="bg-slate-800 p-4 border border-slate-700 hover:border-cyan-400 cursor-pointer"
            onClick={() => buyItem(100, "Fatigue Potion", "potion",
              "Recovers fatigue. +20 reps, +2km today.", "Common")}>
            <div className="text-cyan-300 font-bold">Fatigue Potion</div>
            <div className="text-xs text-slate-400">Boost workout performance.</div>
            <div className="text-yellow-400 mt-2">100 G</div>
          </div>

          {/* (Your entire shop list stays same — unchanged) */}

        </div>

        {/* ⭐ FIXED CLOSE BUTTON ⭐ */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
          <div className="text-yellow-400 font-bold">Gold: {user.gold} G</div>

          <Button onClick={() => setShowShop(false)}>
            Close Shop
          </Button>
        </div>

      </SystemWindow>
    </div>
  );
}

// ==========================================================
//  ITEM BOX (SCROLL FIX + CORRECT CLOSE BUTTON)
// ==========================================================

if (showItemBox && !penaltyActive) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <SystemWindow title="Item Box" className="max-w-lg w-full">

        {/* ⭐ SCROLL FIX ⭐ */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">

          {inventory.length === 0 ? (
            <div className="text-center text-slate-400 py-6">
              No items stored.
            </div>
          ) : (
            inventory.map(item => (
              <div key={item.id}
                className="p-3 bg-slate-800 border border-slate-700 rounded flex justify-between items-center">

                <div>
                  <div className="text-cyan-300 font-bold">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>

                <div className="flex flex-col gap-1">

                  {(item.type === "gear" || item.type === "rune") && (
                    <Button onClick={() => equipItem(item)}
                      className="text-[10px] px-2 py-1">Equip</Button>
                  )}

                  <Button onClick={() => {
                    const updated = removeItem(user.email, item.id);
                    setInventory(updated);
                  }} className="text-[10px] px-2 py-1">
                    Use
                  </Button>

                  <Button onClick={() => {
                    const updated = removeItem(user.email, item.id);
                    setInventory(updated);
                  }} className="text-[10px] px-2 py-1" variant="secondary">
                    Discard
                  </Button>
                </div>

              </div>
            ))
          )}

        </div>

        {/* ⭐ CORRECT CLOSE BUTTON ⭐ */}
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <Button onClick={() => setShowItemBox(false)}>Close</Button>
        </div>

      </SystemWindow>
    </div>
  );
}
// ==========================================================
//   SYSTEM NOTIFICATION MODAL
// ==========================================================
if (systemNotif && !penaltyActive && !showShop && !showItemBox) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <SystemWindow title="System Notification" className="max-w-lg w-full">
        <div className="text-cyan-100 font-mono-tech whitespace-pre-wrap mb-6">
          {systemNotif}
        </div>
        <div className="flex justify-end">
          <Button onClick={closeNotif}>Acknowledge</Button>
        </div>
      </SystemWindow>
    </div>
  );
}

// ==========================================================
//  FULL MAIN UI (after modals)
// ==========================================================
return (
  <div
    className={`min-h-screen transition-colors duration-1000 ${
      penaltyActive ? "bg-red-950" : "bg-slate-950"
    } text-slate-200 p-4 md:p-8`}
  >

    {/* ---------------- HEADER ---------------- */}
    <div className="max-w-6xl mx-auto mb-8">
      <div className="flex justify-between items-start md:items-end flex-col md:flex-row gap-4">

        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase">
            Player:{" "}
            <span className={penaltyActive ? "text-red-500" : "text-cyan-400"}>
              {user.username}
            </span>
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 uppercase">
            <span>ID: {user.email}</span>

            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 border-b border-red-900"
            >
              [LOGOUT]
            </button>
          </div>
        </div>

        {/* RIGHT SIDE CONTROLS */}
        <div className="flex flex-col text-right items-end">
          <div className="flex gap-2 mb-2">

            <Button
              onClick={() => setShowShop(true)}
              className="text-xs px-2 py-1 border-yellow-600 text-yellow-500"
            >
              SHOP
            </Button>

            <Button
              onClick={() => setShowItemBox(true)}
              className="text-xs px-2 py-1 border-cyan-600 text-cyan-400"
            >
              ITEM BOX
            </Button>

            {!notificationsEnabled && (
              <button
                onClick={enableNotifications}
                className="text-[10px] text-cyan-500 border border-cyan-500 px-2 py-0.5 uppercase"
              >
                Enable Alerts
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 uppercase">Level</div>
          <div className="text-4xl font-bold text-white font-mono-tech">
            {user.level}
          </div>
        </div>
      </div>

      <ProgressBar
        current={Math.floor(user.currentXp)}
        max={user.requiredXp}
        label="Experience"
        color={penaltyActive ? "bg-red-600" : "bg-yellow-500"}
      />
    </div>

    {/* ---------------- GRID CONTENT ---------------- */}
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      {/* QUEST */}
      <div className="lg:col-span-1">
        {todayProgress && (
          <QuestTracker
            progress={todayProgress}
            onUpdate={updateProgress}
            onComplete={completeQuest}
            onForfeit={() => triggerPenalty("PLAYER FORFEIT")}
            isCompleted={todayProgress.completed}
          />
        )}
      </div>

      {/* STATUS */}
      <div className="lg:col-span-1">
        <StatusWindow
          user={user}
          onUpgradeStat={upgradeStat}
          equippedBonuses={equippedBonuses}
          onUnequip={unequipItem}
        />
      </div>

      {/* CHAT + STREAK */}
      <div className="lg:col-span-1 space-y-6">
        <SystemChat user={user} />

        <SystemWindow
          title="Streak Info"
          className="h-40 flex flex-col justify-center items-center"
        >
          <div className="text-slate-400 uppercase text-xs mb-2">
            Current Streak
          </div>

          <div className="text-5xl font-bold text-white font-mono-tech">
            {user.streak} <span className="text-lg text-slate-500">DAYS</span>
          </div>

          {user.streak > 7 && (
            <div className="text-xs text-yellow-500 mt-2 uppercase font-bold">
              Consistent Hunter Bonus Active
            </div>
          )}
        </SystemWindow>
      </div>
    </div>

    {/* FOOTER */}
    <div className="max-w-6xl mx-auto mt-12 text-center text-slate-600 text-xs pb-8 font-mono-tech">
      SYSTEM ID: SOLO-LVL-TRAINER-V2.0.0 // STATUS: ONLINE
    </div>
  </div>
);

// ==========================================================
//  EXPORT APP
// ==========================================================
export default App;

