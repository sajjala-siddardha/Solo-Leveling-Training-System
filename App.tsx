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

  // Inputs
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // UI
  const [showShop, setShowShop] = useState(false);
  const [showItemBox, setShowItemBox] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Penalty
  const [penaltyActive, setPenaltyActive] = useState(false);
  const [penaltyClicks, setPenaltyClicks] = useState(0);
  const [penaltyGateOpen, setPenaltyGateOpen] = useState(false);


  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  // ---- Helpers: Equipped Bonuses ----
  const getEquippedBonuses = (u: User | null, inv: InventoryItem[]): Partial<Stats> => {
    const empty: Partial<Stats> = {
      strength: 0,
      agility: 0,
      sense: 0,
      vitality: 0,
      intelligence: 0,
    };
    if (!u || !u.equipment) return empty;

    const result: Partial<Stats> = { ...empty };

    const slots: EquipmentSlot[] = [
      'weapon',
      'armor',
      'cloak',
      'gloves',
      'boots',
      'necklace',
      'ring1',
      'ring2',
      'rune',
    ];

    for (const slot of slots) {
      const id = u.equipment[slot];
      if (!id) continue;
      const item = inv.find((it) => it.id === id);
      if (!item || !item.bonuses) continue;

      for (const key of Object.keys(item.bonuses) as (keyof Stats)[]) {
        const val = item.bonuses[key] || 0;
        (result as any)[key] = ((result as any)[key] || 0) + val;
      }
    }

    return result;
  };

  const equippedBonuses = getEquippedBonuses(user, inventory);

  // ---- INIT ----
  useEffect(() => {
    const sessionUser = loadCurrentSession();
    if (sessionUser) {
      setUser(sessionUser);
      checkDailyReset(sessionUser);

      // Load inventory too
      const inv = loadInventory(sessionUser.email);
      setInventory(inv);

      // System welcome
      generateSystemMessage('LOGIN', sessionUser).then((msg) => {
        setSystemNotif(msg);
        soundService.playNotification();
      });

      // Notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }

    setLoading(false);
  }, []);

  // ---- PENALTY (20:00) ----
  useEffect(() => {
    if (
      !user ||
      !todayProgress ||
      todayProgress.completed ||
      todayProgress.penaltySurvived ||
      penaltyActive
    )
      return;

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() >= 20) {
        triggerPenalty('TIME LIMIT EXCEEDED (20:00). PENALTY INITIATED.');
      }
    };

    const interval = setInterval(checkTime, 30000);
    checkTime();

    return () => clearInterval(interval);
  }, [user, todayProgress, penaltyActive]);

  // ---- AI REMINDER ----
  useEffect(() => {
    if (
      !user ||
      !todayProgress ||
      todayProgress.completed ||
      todayProgress.penaltySurvived ||
      !notificationsEnabled ||
      penaltyActive
    )
      return;

    const timer = setTimeout(async () => {
      const now = new Date();
      if (now.getHours() < 20) {
        const msg = await generateSystemMessage('REMINDER', user);
        sendSystemNotification('The System', msg);
        soundService.playNotification();
        setSystemNotif(msg);
      }
    }, 60000 * 15);

    return () => clearTimeout(timer);
  }, [user, todayProgress, notificationsEnabled, penaltyActive]);

  // ---- DAILY RESET ----
  const checkDailyReset = (currentUser: User) => {
    const lastLog = currentUser.history[currentUser.history.length - 1];

    if (lastLog && lastLog.date === todayStr) {
      setTodayProgress(lastLog);
    } else {
      const fresh: DailyProgress = {
        date: todayStr,
        pushups: 0,
        situps: 0,
        squats: 0,
        running: 0,
        completed: false,
        penaltySurvived: false,
      };
      setTodayProgress(fresh);
    }
  };
  // ---- LOGIN ----
  const handleLogin = () => {
    if (!nameInput.trim() || !emailInput.trim()) return;

    if (!emailInput.includes('@')) {
      soundService.playError();
      return;
    }

    const exists = checkUserExists(emailInput);
    if (exists) {
      alert('Account already registered. Logging in...');
    }

    const { user: loggedInUser } = loginUser(emailInput, nameInput);
    setUser(loggedInUser);
    checkDailyReset(loggedInUser);

    // Load their saved inventory
    const inv = loadInventory(loggedInUser.email);
    setInventory(inv);

    soundService.playConfirm();

    generateSystemMessage('LOGIN', loggedInUser).then((msg) => setSystemNotif(msg));
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setTodayProgress(null);
    setNameInput('');
    setEmailInput('');
    setInventory([]);
    soundService.playClick();
  };

  // ---- NOTIFICATION PERMISSION ----
  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);

    if (granted) {
      soundService.playConfirm();
      new Notification('The System', {
        body: 'Notifications Enabled. Do not fail your daily quest.',
        silent: true,
      });
      soundService.playNotification();
    }
  };

  // ---- QUEST PROGRESS ----
  const updateProgress = (field: keyof DailyProgress, value: number) => {
    if (!todayProgress) return;

    setTodayProgress((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  const completeQuest = async () => {
    if (!user || !todayProgress) return;

    const xpGain = 150;
    const goldGain = 1000;

    let newLevel = user.level;
    let currentXp = user.currentXp + xpGain;
    let requiredXp = user.requiredXp;
    let availablePoints = user.stats.availablePoints;
    let leveledUp = false;

    // LEVEL UP LOOP
    while (currentXp >= requiredXp) {
      currentXp -= requiredXp;
      newLevel++;
      requiredXp = calculateRequiredXp(newLevel);
      availablePoints += 3;
      leveledUp = true;
    }

    const completedEntry = { ...todayProgress, completed: true };
    const newHistory = user.history.filter((h) => h.date !== todayStr);
    newHistory.push(completedEntry);

    let updatedUser: User = {
      ...user,
      level: newLevel,
      currentXp,
      requiredXp,
      gold: user.gold + goldGain,
      stats: { ...user.stats, availablePoints },
      streak: user.streak + 1,
      history: newHistory,
    };

    // RANK / JOB PROGRESSION
    const prog = checkProgression(updatedUser);
    updatedUser = prog.user;

    setUser(updatedUser);
    setTodayProgress(completedEntry);
    saveUser(updatedUser);

    soundService.playLevelUp();

    if (leveledUp) {
      const msg = await generateSystemMessage('LEVEL_UP', updatedUser);
      setSystemNotif(msg);
    } else {
      setSystemNotif('DAILY QUEST COMPLETED. REWARDS ACCEPTED.');
    }

    // CLASS CHANGE / RANK UP
    if (prog.newJob) {
      setTimeout(() => {
        soundService.playConfirm();
        setSystemNotif(`CLASS CHANGE: You have advanced to [${prog.newJob}].`);
      }, 4000);
    } else if (prog.newRank) {
      setTimeout(() => {
        soundService.playConfirm();
        setSystemNotif(`RANK UPDATE: Evaluated as [${prog.newRank}].`);
      }, 4000);
    }
  };

  // ---- PENALTY ----
  const triggerPenalty = async (reason?: string) => {
    if (!user) return;

    setPenaltyActive(true);
    setPenaltyClicks(50);
    setPenaltyGateOpen(false);

    soundService.playAlarm();

    const penaltyMsg = await generateSystemMessage('PENALTY', user);
    setSystemNotif(reason ? `${reason}\n\n${penaltyMsg}` : penaltyMsg);

    const interval = setInterval(() => {
      if (Math.random() > 0.6 && !penaltyGateOpen) soundService.playAlarm();
    }, 2000);

    (window as any).penaltyInterval = interval;
  };

  const handleSurviveClick = () => {
    if (penaltyClicks > 0) {
      setPenaltyClicks((prev) => prev - 1);
      soundService.playClick();

      if (penaltyClicks === 1) {
        setPenaltyGateOpen(true);
        soundService.playLevelUp();
        if ((window as any).penaltyInterval) clearInterval((window as any).penaltyInterval);
      }
      return;
    }

    // Exit if gate open
    if (penaltyGateOpen) {
      setPenaltyActive(false);
      setPenaltyGateOpen(false);

      setSystemNotif('PENALTY SURVIVED. REWARD: NONE.');
      soundService.playConfirm();

      if (todayProgress && user) {
        const updated = { ...todayProgress, penaltySurvived: true };
        setTodayProgress(updated);

        const newHistory = user.history.filter((h) => h.date !== todayStr);
        newHistory.push(updated);

        const updatedUser = { ...user, history: newHistory };
        setUser(updatedUser);
        saveUser(updatedUser);
      }
    }
  };
  // ---- STAT UPGRADE ----
  const upgradeStat = (stat: keyof Stats) => {
    if (!user || user.stats.availablePoints <= 0) {
      soundService.playError();
      return;
    }

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
    soundService.playConfirm();
  };

  // ---- EQUIP ITEM ----
  const equipItem = (item: InventoryItem) => {
    if (!user) return;
    if (!item.slot) {
      setSystemNotif('This item cannot be equipped.');
      soundService.playError();
      return;
    }

    // Add equipment field if missing (safety)
    if (!user.equipment) {
      user.equipment = {
        weapon: null,
        armor: null,
        cloak: null,
        gloves: null,
        boots: null,
        necklace: null,
        ring1: null,
        ring2: null,
        rune: null,
      };
    }

    const newEquipment = {
      ...user.equipment,
      [item.slot]: item.id,
    };

    const updatedUser: User = { ...user, equipment: newEquipment };
    setUser(updatedUser);
    saveUser(updatedUser);

    setSystemNotif(`Equipped: ${item.name} in [${item.slot.toUpperCase()}]`);
    soundService.playConfirm();
  };

  const unequipItem = (slot: EquipmentSlot) => {
    if (!user || !user.equipment) return;

    const newEquipment = { ...user.equipment, [slot]: null };
    const updatedUser: User = { ...user, equipment: newEquipment };

    setUser(updatedUser);
    saveUser(updatedUser);

    setSystemNotif(`Unequipped item from [${slot.toUpperCase()}]`);
    soundService.playConfirm();
  };

  // ---- SHOP PURCHASE ----
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

    if (user.gold < cost) {
      setSystemNotif('INSUFFICIENT FUNDS.');
      soundService.playError();
      return;
    }

    let updatedUser = { ...user, gold: user.gold - cost };
    let message = `PURCHASED: [${itemName}] added to Item Box.`;

    // Apply potion effect immediately
    if (type === 'potion') {
      setTodayProgress(prev => prev ? {
        ...prev,
        pushups: prev.pushups + 20,
        situps: prev.situps + 20,
        squats: prev.squats + 20,
        running: prev.running + 2
      } : prev);

      message += '\nBuff Applied: +20 reps, +2 km today.';
    }

    // Add to Inventory
    const newInv = addItemToInventory(user.email, {
      name: itemName,
      type,
      desc,
      rarity,
      slot,
      bonuses,
    });

    setInventory(newInv);
    saveUser(updatedUser);
    setUser(updatedUser);

    setSystemNotif(message);
    soundService.playConfirm();
  };

  const closeNotif = () => setSystemNotif(null);
  // ---- LOADING SCREEN ----
  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-mono-tech animate-pulse">
        CONNECTING TO SYSTEM...
      </div>
    );

  // ---- LOGIN SCREEN ----
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 bg-[url('https://images.unsplash.com/photo-1518544806352-a2221ed0670d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"></div>

        <SystemWindow title="Security Clearance" className="w-full max-w-md z-10 border-2 border-cyan-500/50">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-[0.2em] font-mono-tech system-text-shadow">
              SYSTEM LOGIN
            </h1>
            <p className="text-cyan-400 text-xs mt-2 uppercase">Authentication Required</p>
          </div>

          <div className="space-y-4">
            
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1">
                Player Name
              </label>
              <input
                type="text"
                placeholder="ENTER NAME"
                className="w-full bg-slate-800/80 border border-slate-600 p-3 text-white focus:border-cyan-500 outline-none font-mono-tech text-lg"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1">
                Gmail Address
              </label>
              <input
                type="email"
                placeholder="ENTER GMAIL"
                className="w-full bg-slate-800/80 border border-slate-600 p-3 text-white focus:border-cyan-500 outline-none font-mono-tech text-lg"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-center">
              <Button 
                onClick={handleLogin} 
                className="w-full text-center justify-center flex py-4 text-xl"
              >
                INITIATE
              </Button>
            </div>

          </div>

          <div className="mt-6 text-center text-slate-600 text-[10px]">
            SECURE CONNECTION // ENCRYPTED
          </div>

        </SystemWindow>
      </div>
    );
  }

  // ---- MAIN APP ----
  return (
    <div
      className={`min-h-screen transition-colors duration-1000 ${
        penaltyActive ? 'bg-red-950' : 'bg-slate-950'
      } text-slate-200 p-4 md:p-8 font-sans`}
    >
      {/* PENALTY ZONE */}
      {penaltyActive && (
        <div className="fixed inset-0 z-[100] bg-red-900/90 flex flex-col items-center justify-center p-8 animate-pulse">
          
          <h1 className="text-6xl font-black text-black mb-4 uppercase tracking-tighter">
            PENALTY ZONE
          </h1>

          <p className="text-xl text-white font-mono-tech mb-8 text-center max-w-2xl border-4 border-black p-4 bg-red-800">
            {systemNotif || "SURVIVE UNTIL THE TIMER ENDS."}
          </p>

          {!penaltyGateOpen ? (
            <>
              <div className="text-4xl font-bold text-white mb-8">
                CLICKS TO SURVIVE: {penaltyClicks}
              </div>

              <button
                onClick={handleSurviveClick}
                className="bg-black text-red-500 text-2xl font-bold px-12 py-6 border-4 border-red-500 hover:bg-red-500 hover:text-black hover:border-black transition-all transform active:scale-95"
              >
                STRUGGLE
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl font-bold text-green-400 mb-8 animate-bounce">
                SURVIVAL CONFIRMED
              </div>

              <button
                onClick={handleSurviveClick}
                className="bg-green-500 text-black text-2xl font-bold px-12 py-6 border-4 border-black hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.8)]"
              >
                OPEN GATE
              </button>
            </>
          )}

        </div>
      )}

            {/* SHOP MODAL */}
      {showShop && !penaltyActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <SystemWindow title="Hunter Supply Shop" className="max-w-3xl w-full">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

              {/* ───────── POTIONS ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-cyan-500 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    100,
                    "Fatigue Potion",
                    "potion",
                    "Recovers fatigue. +20 reps, +2km today.",
                    "Common"
                  )
                }
              >
                <div className="text-cyan-300 font-bold mb-1">Fatigue Potion</div>
                <div className="text-xs text-slate-400 mb-2">Boost workout performance.</div>
                <div className="text-yellow-400 font-mono-tech">100 G</div>
              </div>

              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-blue-400 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    350,
                    "High-Grade Mana Potion",
                    "potion",
                    "Elite-grade mana potion.",
                    "Rare"
                  )
                }
              >
                <div className="text-blue-300 font-bold mb-1">High-Grade Mana Potion</div>
                <div className="text-xs text-slate-400 mb-2">Powerful recovery.</div>
                <div className="text-yellow-400 font-mono-tech">350 G</div>
              </div>

              {/* ───────── MYSTERY BOX ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-purple-500 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    500,
                    "Mystery Box",
                    "box",
                    "Random reward. Gold, XP or nothing.",
                    "Rare"
                  )
                }
              >
                <div className="text-purple-300 font-bold mb-1">Mystery Box</div>
                <div className="text-xs text-slate-400 mb-2">Try your luck.</div>
                <div className="text-yellow-400 font-mono-tech">500 G</div>
              </div>

              {/* ───────── DUNGEON KEY ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-red-500 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    5000,
                    "Dungeon Key (E-Rank)",
                    "key",
                    "Instant dungeon clear.",
                    "Epic"
                  )
                }
              >
                <div className="text-red-300 font-bold mb-1">Dungeon Key (E-Rank)</div>
                <div className="text-xs text-slate-400 mb-2">Opens instant dungeon.</div>
                <div className="text-yellow-400 font-mono-tech">5000 G</div>
              </div>

              {/* ───────── WEAPONS ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-orange-400 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    1500,
                    "Steel Longsword",
                    "gear",
                    "A balanced blade.",
                    "Rare",
                    "weapon",
                    { strength: 5 }
                  )
                }
              >
                <div className="text-orange-300 font-bold mb-1">Steel Longsword</div>
                <div className="text-xs text-slate-400 mb-2">STR +5</div>
                <div className="text-yellow-400 font-mono-tech">1500 G</div>
              </div>

              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-red-300 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    2800,
                    "Crimson Greatsword",
                    "gear",
                    "A heavy, destructive blade.",
                    "Epic",
                    "weapon",
                    { strength: 10 }
                  )
                }
              >
                <div className="text-red-300 font-bold mb-1">Crimson Greatsword</div>
                <div className="text-xs text-slate-400 mb-2">STR +10</div>
                <div className="text-yellow-400 font-mono-tech">2800 G</div>
              </div>

              {/* ───────── ARMOR ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-green-400 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    1200,
                    "Reinforced Armor",
                    "gear",
                    "Strong armor with high defense.",
                    "Rare",
                    "armor",
                    { vitality: 6 }
                  )
                }
              >
                <div className="text-green-300 font-bold mb-1">Reinforced Armor</div>
                <div className="text-xs text-slate-400 mb-2">VIT +6</div>
                <div className="text-yellow-400 font-mono-tech">1200 G</div>
              </div>

              {/* ───────── CLOAK ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-emerald-400 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    1000,
                    "Shadow Cloak",
                    "gear",
                    "Assassin-style cloak.",
                    "Epic",
                    "cloak",
                    { agility: 5 }
                  )
                }
              >
                <div className="text-emerald-300 font-bold mb-1">Shadow Cloak</div>
                <div className="text-xs text-slate-400 mb-2">AGI +5</div>
                <div className="text-yellow-400 font-mono-tech">1000 G</div>
              </div>

              {/* ───────── BOOTS ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-blue-300 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    900,
                    "Hunter Boots",
                    "gear",
                    "Increases movement speed.",
                    "Rare",
                    "boots",
                    { agility: 3, vitality: 2 }
                  )
                }
              >
                <div className="text-blue-300 font-bold mb-1">Hunter Boots</div>
                <div className="text-xs text-slate-400 mb-2">AGI +3 · VIT +2</div>
                <div className="text-yellow-400 font-mono-tech">900 G</div>
              </div>

              {/* ───────── ACCESSORIES ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-yellow-400 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    1100,
                    "Ring of Focus",
                    "gear",
                    "Improves perception.",
                    "Rare",
                    "ring1",
                    { sense: 4 }
                  )
                }
              >
                <div className="text-yellow-300 font-bold mb-1">Ring of Focus</div>
                <div className="text-xs text-slate-400 mb-2">SENSE +4</div>
                <div className="text-yellow-400 font-mono-tech">1100 G</div>
              </div>

              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-yellow-200 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    2000,
                    "Necklace of Wisdom",
                    "gear",
                    "Boosts intelligence.",
                    "Epic",
                    "necklace",
                    { intelligence: 6 }
                  )
                }
              >
                <div className="text-yellow-200 font-bold mb-1">Necklace of Wisdom</div>
                <div className="text-xs text-slate-400 mb-2">INT +6</div>
                <div className="text-yellow-400 font-mono-tech">2000 G</div>
              </div>

              {/* ───────── RUNES ───────── */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-indigo-400 transition cursor-pointer"
                onClick={() =>
                  buyItem(
                    2500,
                    "Rune of Insight",
                    "rune",
                    "Magical rune.",
                    "Epic",
                    "rune",
                    { intelligence: 3, sense: 2 }
                  )
                }
              >
                <div className="text-indigo-300 font-bold mb-1">Rune of Insight</div>
                <div className="text-xs text-slate-400 mb-2">INT +3 · SENSE +2</div>
                <div className="text-yellow-400 font-mono-tech">2500 G</div>
              </div>

            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
              <div className="text-yellow-400 font-bold font-mono-tech">
                Gold: {user.gold.toLocaleString()} G
              </div>
              <Button onClick={() => setShowShop(false)}>Close Shop</Button>
            </div>

          </SystemWindow>
        </div>
      )}

      {/* ITEM BOX MODAL */}
      {showItemBox && !penaltyActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <SystemWindow title="Item Box" className="max-w-lg w-full">

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">

              {inventory.length === 0 ? (
                <div className="text-slate-400 text-center py-6 text-sm">
                  No items stored. Buy something from the Shop.
                </div>
              ) : (
                inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800 border border-slate-700 rounded flex justify-between items-center"
                  >
                    {/* ITEM DETAILS */}
                    <div className="flex flex-col">
                      <span className="font-bold text-cyan-300 text-sm">
                        {item.name}{" "}
                        <span
                          className={`text-[10px] uppercase ml-1 ${
                            item.rarity === "Common"
                              ? "text-slate-400"
                              : item.rarity === "Rare"
                              ? "text-blue-300"
                              : item.rarity === "Epic"
                              ? "text-purple-300"
                              : "text-yellow-300"
                          }`}
                        >
                          [{item.rarity}]
                        </span>
                      </span>

                      <span className="text-xs text-slate-400">{item.desc}</span>

                      <span className="text-[10px] text-slate-500 mt-1 uppercase">
                        Type: {item.type}
                        {item.slot ? ` · Slot: ${item.slot}` : ""}
                      </span>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-col gap-1">

                      {(item.type === "gear" || item.type === "rune") && (
                        <Button
                          onClick={() => equipItem(item)}
                          className="text-[10px] px-2 py-1"
                        >
                          Equip
                        </Button>
                      )}

                      <Button
                        onClick={() => {
                          const updated = removeItem(user.email, item.id);
                          setInventory(updated);
                          setSystemNotif(`${item.name} used.`);
                        }}
                        className="text-[10px] px-2 py-1"
                      >
                        Use
                      </Button>

                      <Button
                        onClick={() => {
                          const updated = removeItem(user.email, item.id);
                          setInventory(updated);
                        }}
                        variant="secondary"
                        className="text-[10px] px-2 py-1"
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                ))
              )}

            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-slate-700">
              <Button onClick={() => setShowItemBox(false)}>Close</Button>
            </div>

          </SystemWindow>
        </div>
      )}

      {/* SYSTEM NOTIFICATION MODAL */}
      {systemNotif && !penaltyActive && !showShop && !showItemBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <SystemWindow title="System Notification" className="max-w-lg w-full">
            <div className="font-mono-tech text-lg text-cyan-100 mb-6 whitespace-pre-wrap">
              {systemNotif}
            </div>
            <div className="flex justify-end">
              <Button onClick={closeNotif}>Acknowledge</Button>
            </div>
          </SystemWindow>
        </div>
      )}

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-start md:items-end flex-col md:flex-row gap-4">

          <div>
            <h1 className="text-3xl font-bold italic tracking-tighter text-white uppercase">
              Player:{" "}
              <span className={penaltyActive ? "text-red-500" : "text-cyan-400"}>
                {user.username}
              </span>
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 uppercase tracking-widest">
              <span>ID: {user.email}</span>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 border-b border-red-900"
              >
                [LOGOUT]
              </button>
            </div>
          </div>

          <div className="text-right flex flex-col items-end w-full md:w-auto">
            <div className="flex gap-2 mb-2">

              <Button
                onClick={() => setShowShop(true)}
                className="text-xs py-1 px-2 border-yellow-600 text-yellow-500 hover:text-yellow-300"
              >
                SHOP
              </Button>

              <Button
                onClick={() => setShowItemBox(true)}
                className="text-xs py-1 px-2 border-cyan-600 text-cyan-400 hover:text-cyan-200"
              >
                ITEM BOX
              </Button>

              {!notificationsEnabled && (
                <button
                  onClick={enableNotifications}
                  className="text-[10px] text-cyan-500 border border-cyan-500 px-2 py-0.5 uppercase hover:bg-cyan-500/20"
                >
                  Enable Alerts
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 uppercase tracking-widest">Level</div>
            <div className="text-4xl font-bold text-white leading-none font-mono-tech">
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

      {/* MAIN GRID */}
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

          <SystemWindow title="Streak Info" className="h-40 flex flex-col justify-center items-center">
            <div className="text-sm text-slate-400 uppercase mb-2">Current Streak</div>

            <div className="text-5xl font-bold text-white font-mono-tech system-text-shadow">
              {user.streak} <span className="text-lg text-slate-500">DAYS</span>
            </div>

            {user.streak > 7 && (
              <div className="text-xs text-yellow-500 mt-2 font-bold uppercase tracking-widest">
                Consistent Hunter Bonus Active
              </div>
            )}
          </SystemWindow>
        </div>

      </div>

      <div className="max-w-6xl mx-auto mt-12 text-center text-slate-600 text-xs font-mono-tech pb-8">
        SYSTEM ID: SOLO-LVL-TRAINER-V2.0.0 // AUTH: GMAIL // STATUS: ONLINE
      </div>

    </div>
  );
};

export default App;



