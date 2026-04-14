// Quest/Story data for PokeClaude
// Main storyline: "The Rug Pull Syndicate" threatens the CryptoVerse

export const QUEST_STATES = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

// Main story quests (must be done in order)
export const MAIN_QUESTS = [
  {
    id: 'prologue',
    title: 'The Journey Begins',
    description: 'Get your first CryptoMon from Professor Hashimoto.',
    region: 'Satoshi Town',
    objectives: [
      { id: 'get_starter', text: 'Receive your starter CryptoMon', type: 'event' },
    ],
    rewards: { coins: 0 }, // starter + items given in dialog
    nextQuest: 'forest_crisis',
  },
  {
    id: 'forest_crisis',
    title: 'Trouble in DeFi Forest',
    description: 'Strange creatures are appearing in DeFi Forest. Investigate and defeat the Rug Pull grunt causing chaos.',
    region: 'DeFi Forest',
    objectives: [
      { id: 'talk_kid', text: 'Talk to the Kid in Satoshi Town about rumors', type: 'talk', npcId: 'kid' },
      { id: 'enter_forest', text: 'Travel to DeFi Forest', type: 'enter_area', area: 'DeFi Forest' },
      { id: 'beat_grunt1', text: 'Defeat the Rug Pull Grunt', type: 'beat_trainer', trainerId: 'grunt_forest' },
      { id: 'report_prof', text: 'Report back to Prof. Hashimoto', type: 'talk', npcId: 'prof_hashimoto' },
    ],
    rewards: { coins: 200, items: { potions: 3 } },
    nextQuest: 'meme_mayhem',
  },
  {
    id: 'meme_mayhem',
    title: 'Meme Meadow Mayhem',
    description: 'The Meme Lord reports that someone is manipulating meme creatures. Find and stop the Rug Pull agent.',
    region: 'Meme Meadow',
    objectives: [
      { id: 'talk_memelord', text: 'Talk to Meme Lord in the meadow', type: 'talk', npcId: 'meme_lord' },
      { id: 'catch_meme', text: 'Catch a Meme-type creature', type: 'catch_type', creatureType: 'Meme' },
      { id: 'beat_grunt2', text: 'Defeat the Rug Pull Agent', type: 'beat_trainer', trainerId: 'agent_meadow' },
      { id: 'talk_memelord2', text: 'Report back to Meme Lord', type: 'talk', npcId: 'meme_lord' },
    ],
    rewards: { coins: 350, items: { premiumSpheres: 3 } },
    nextQuest: 'lab_breach',
  },
  {
    id: 'lab_breach',
    title: 'AI Labs Security Breach',
    description: 'The Rug Pull Syndicate has infiltrated AI Labs. Help Dr. Neural secure the facility and protect the AI creatures.',
    region: 'AI Labs',
    objectives: [
      { id: 'talk_neural', text: 'Speak with Dr. Neural at AI Labs', type: 'talk', npcId: 'dr_neural' },
      { id: 'beat_hacker1', text: 'Defeat Hacker Alpha', type: 'beat_trainer', trainerId: 'hacker_alpha' },
      { id: 'beat_hacker2', text: 'Defeat Hacker Beta', type: 'beat_trainer', trainerId: 'hacker_beta' },
      { id: 'talk_neural2', text: 'Report to Dr. Neural', type: 'talk', npcId: 'dr_neural' },
    ],
    rewards: { coins: 500, items: { ultraSpheres: 2, superPotions: 3 } },
    nextQuest: 'mountain_mystery',
  },
  {
    id: 'mountain_mystery',
    title: 'The Mountain Conspiracy',
    description: 'The Rug Pull Syndicate has a hidden base in Chain Mountains. Investigate with the Mountaineer.',
    region: 'Chain Mountains',
    objectives: [
      { id: 'talk_mountaineer', text: 'Meet the Mountaineer at the summit path', type: 'talk', npcId: 'mountaineer' },
      { id: 'beat_guard1', text: 'Defeat the Base Guard', type: 'beat_trainer', trainerId: 'guard_mountain' },
      { id: 'find_base', text: 'Find the hidden base entrance', type: 'enter_area', area: 'Chain Mountains' },
      { id: 'beat_commander', text: 'Defeat Commander Liquidator', type: 'beat_trainer', trainerId: 'commander_liquidator' },
      { id: 'talk_mountaineer2', text: 'Debrief with the Mountaineer', type: 'talk', npcId: 'mountaineer' },
    ],
    rewards: { coins: 750, items: { revives: 3, superPotions: 5 } },
    nextQuest: 'final_showdown',
  },
  {
    id: 'final_showdown',
    title: 'Final Showdown: The Rug Pull Boss',
    description: 'The leader of the Rug Pull Syndicate, the notorious "Whale", has been found. Defeat them to save the CryptoVerse!',
    region: 'Chain Mountains',
    objectives: [
      { id: 'talk_prof_final', text: 'Get a pep talk from Prof. Hashimoto', type: 'talk', npcId: 'prof_hashimoto' },
      { id: 'heal_up', text: 'Heal your team at Nurse Joy', type: 'talk', npcId: 'nurse_joy' },
      { id: 'beat_whale', text: 'Defeat The Whale', type: 'beat_trainer', trainerId: 'the_whale' },
    ],
    rewards: { coins: 2000, items: { masterSpheres: 1 } },
    nextQuest: null,
  },
];

// Side quests (can be done anytime after unlocking)
export const SIDE_QUESTS = [
  {
    id: 'catch_5',
    title: 'Budding Collector',
    description: 'Catch 5 different CryptoMons to build your team.',
    unlockAfter: 'prologue',
    objectives: [
      { id: 'catch5', text: 'Catch 5 CryptoMons', type: 'catch_count', count: 5 },
    ],
    rewards: { coins: 300, items: { premiumSpheres: 5 } },
  },
  {
    id: 'evolve_starter',
    title: 'Growth Spurt',
    description: 'Train your starter until it evolves.',
    unlockAfter: 'forest_crisis',
    objectives: [
      { id: 'evolve1', text: 'Evolve your starter CryptoMon', type: 'evolve_count', count: 1 },
    ],
    rewards: { coins: 500, items: { superPotions: 5 } },
  },
  {
    id: 'type_master',
    title: 'Type Diversity',
    description: 'Collect creatures of 5 different types.',
    unlockAfter: 'meme_mayhem',
    objectives: [
      { id: 'types5', text: 'Own creatures of 5 different types', type: 'own_types', count: 5 },
    ],
    rewards: { coins: 800, items: { ultraSpheres: 3 } },
  },
  {
    id: 'defi_trainer_challenge',
    title: 'DeFi Trainer Challenge',
    description: 'The DeFi Trainer wants to test your skills. Battle them!',
    unlockAfter: 'forest_crisis',
    objectives: [
      { id: 'beat_defi', text: 'Defeat the DeFi Trainer', type: 'beat_trainer', trainerId: 'defi_trainer' },
    ],
    rewards: { coins: 400, items: { potions: 5 } },
  },
  {
    id: 'shopkeeper_delivery',
    title: 'Supply Run',
    description: 'The Shopkeeper needs you to deliver supplies to the Mountaineer.',
    unlockAfter: 'lab_breach',
    objectives: [
      { id: 'talk_shop', text: 'Talk to the Shopkeeper', type: 'talk', npcId: 'shopkeeper' },
      { id: 'deliver', text: 'Deliver supplies to the Mountaineer', type: 'talk', npcId: 'mountaineer' },
      { id: 'return_shop', text: 'Return to the Shopkeeper', type: 'talk', npcId: 'shopkeeper' },
    ],
    rewards: { coins: 600, items: { revives: 2, potions: 5 } },
  },
  {
    id: 'catch_10',
    title: 'Seasoned Collector',
    description: 'Catch 10 CryptoMons to prove your skills as a collector.',
    unlockAfter: 'forest_crisis',
    objectives: [
      { id: 'catch10', text: 'Catch 10 CryptoMons', type: 'catch_count', count: 10 },
    ],
    rewards: { coins: 500, items: { ultraSpheres: 5 } },
  },
  {
    id: 'catch_20',
    title: 'Master Collector',
    description: 'Catch 20 CryptoMons. Gotta catch em all!',
    unlockAfter: 'meme_mayhem',
    objectives: [
      { id: 'catch20', text: 'Catch 20 CryptoMons', type: 'catch_count', count: 20 },
    ],
    rewards: { coins: 1500, items: { masterSpheres: 1 } },
  },
  {
    id: 'all_types',
    title: 'Type Master',
    description: 'Collect creatures of all 8 types to master the CryptoVerse.',
    unlockAfter: 'lab_breach',
    objectives: [
      { id: 'types8', text: 'Own creatures of all 8 types', type: 'own_types', count: 8 },
    ],
    rewards: { coins: 2000, items: { masterSpheres: 1, ultraSpheres: 5 } },
  },
  {
    id: 'evolve_3',
    title: 'Evolution Expert',
    description: 'Evolve 3 different CryptoMons.',
    unlockAfter: 'meme_mayhem',
    objectives: [
      { id: 'evolve3', text: 'Evolve 3 CryptoMons', type: 'evolve_count', count: 3 },
    ],
    rewards: { coins: 1000, items: { superPotions: 10 } },
  },
  {
    id: 'nurse_checkup',
    title: 'Health Checkup',
    description: 'Visit Nurse Joy for a checkup after your first battle.',
    unlockAfter: 'prologue',
    objectives: [
      { id: 'heal_nurse', text: 'Talk to Nurse Joy to heal your team', type: 'talk', npcId: 'nurse_joy' },
    ],
    rewards: { coins: 50, items: { potions: 3 } },
  },
  {
    id: 'explore_all',
    title: 'World Explorer',
    description: 'Visit every region of the CryptoVerse.',
    unlockAfter: 'forest_crisis',
    objectives: [
      { id: 'visit_forest', text: 'Visit DeFi Forest', type: 'enter_area', area: 'DeFi Forest' },
      { id: 'visit_meadow', text: 'Visit Meme Meadow', type: 'enter_area', area: 'Meme Meadow' },
      { id: 'visit_labs', text: 'Visit AI Labs', type: 'enter_area', area: 'AI Labs' },
      { id: 'visit_mountains', text: 'Visit Chain Mountains', type: 'enter_area', area: 'Chain Mountains' },
    ],
    rewards: { coins: 800, items: { premiumSpheres: 5, revives: 3 } },
  },
  {
    id: 'ghost_hunter',
    title: 'Ghost Hunter',
    description: 'The mountains hold ghostly Privacy-type creatures. Catch one!',
    unlockAfter: 'mountain_mystery',
    objectives: [
      { id: 'catch_privacy', text: 'Catch a Privacy-type creature', type: 'catch_type', creatureType: 'Privacy' },
    ],
    rewards: { coins: 600, items: { ultraSpheres: 3 } },
  },
  {
    id: 'oracle_seeker',
    title: 'Seek the Oracle',
    description: 'Oracle creatures can see the future. Catch one to gain their wisdom.',
    unlockAfter: 'lab_breach',
    objectives: [
      { id: 'catch_oracle', text: 'Catch an Oracle-type creature', type: 'catch_type', creatureType: 'Oracle' },
    ],
    rewards: { coins: 600, items: { superPotions: 5 } },
  },
  {
    id: 'ai_researcher',
    title: 'AI Research Assistant',
    description: 'Dr. Neural needs an AI creature for research. Catch one in the labs!',
    unlockAfter: 'lab_breach',
    objectives: [
      { id: 'catch_ai', text: 'Catch an AI-type creature', type: 'catch_type', creatureType: 'AI' },
      { id: 'show_neural', text: 'Show it to Dr. Neural', type: 'talk', npcId: 'dr_neural' },
    ],
    rewards: { coins: 900, items: { ultraSpheres: 2, superPotions: 5 } },
  },
  {
    id: 'kid_hero',
    title: 'Hometown Hero',
    description: 'The Kid looks up to you. Visit him after saving all the regions.',
    unlockAfter: 'mountain_mystery',
    objectives: [
      { id: 'talk_kid_hero', text: 'Visit the Kid in Satoshi Town', type: 'talk', npcId: 'kid' },
    ],
    rewards: { coins: 300, items: { potions: 10 } },
  },
];

// Trainer definitions for story battles
export const TRAINERS = {
  grunt_forest: {
    name: 'Rug Pull Grunt',
    sprite: 'npc_grunt',
    preDialog: [
      "Hey! You're not supposed to be here!",
      "The Rug Pull Syndicate controls this forest now!",
      "I'll teach you to mind your own business!",
    ],
    postWinDialog: [
      "Impossible! How did you beat me?",
      "Fine... but this isn't over. The Syndicate is bigger than you think!",
    ],
    postLoseDialog: [
      "Ha! That's what happens when you mess with us!",
    ],
    party: [
      { id: 'rugpuller', level: 8 },
      { id: 'sbfraud', level: 7 },
    ],
  },
  agent_meadow: {
    name: 'Rug Pull Agent',
    sprite: 'npc_agent',
    preDialog: [
      "So, the little trainer found me...",
      "I've been pumping these meme creatures full of chaos energy!",
      "You can't stop the pump! Let me show you real power!",
    ],
    postWinDialog: [
      "No way... my perfectly pumped creatures, defeated?!",
      "You haven't seen the last of us. The Whale will hear about this!",
    ],
    postLoseDialog: [
      "See? You can't fight the market, kid!",
    ],
    party: [
      { id: 'rugpuller', level: 12 },
      { id: 'elonix', level: 13 },
      { id: 'trumpunk', level: 11 },
    ],
  },
  hacker_alpha: {
    name: 'Hacker Alpha',
    sprite: 'npc_hacker',
    preDialog: [
      "INTRUSION DETECTED. Initiating defense protocol...",
      "My AI creatures will delete you from this network!",
    ],
    postWinDialog: [
      "SYSTEM FAILURE. Retreating to backup node...",
    ],
    postLoseDialog: [
      "ACCESS DENIED. You lack sufficient permissions.",
    ],
    party: [
      { id: 'vaporware', level: 15 },
      { id: 'deepfaker', level: 14 },
    ],
  },
  hacker_beta: {
    name: 'Hacker Beta',
    sprite: 'npc_hacker',
    preDialog: [
      "You beat Alpha? No matter. I'm the real firewall!",
      "Prepare to be overwritten!",
    ],
    postWinDialog: [
      "Buffer overflow... I can't... compute...",
      "The mainframe is unprotected now. Dr. Neural can lock it down.",
    ],
    postLoseDialog: [
      "Firewall holds. This lab belongs to us now.",
    ],
    party: [
      { id: 'deepfaker', level: 16 },
      { id: 'chainlinker', level: 15 },
      { id: 'bandoracle', level: 15 },
    ],
  },
  guard_mountain: {
    name: 'Base Guard',
    sprite: 'npc_grunt',
    preDialog: [
      "Halt! This mountain path is closed by order of The Whale!",
      "Turn back now, or face the consequences!",
    ],
    postWinDialog: [
      "Ugh... fine, go ahead. But the Commander won't be so easy!",
    ],
    postLoseDialog: [
      "That's right, scram! And don't come back!",
    ],
    party: [
      { id: 'czdragon', level: 18 },
      { id: 'bnbeast', level: 17 },
    ],
  },
  commander_liquidator: {
    name: 'Cmdr. Liquidator',
    sprite: 'npc_commander',
    preDialog: [
      "So you made it past my guards. Impressive.",
      "I am Commander Liquidator. I've liquidated thousands of positions...",
      "And now, I'll liquidate your entire team!",
    ],
    postWinDialog: [
      "How... my portfolio... it's all gone...",
      "Fine. The Whale is at the summit. But you'll never defeat them!",
    ],
    postLoseDialog: [
      "Another position liquidated. Come back when you have more collateral.",
    ],
    party: [
      { id: 'moneroach', level: 20 },
      { id: 'gavinite', level: 19 },
      { id: 'polkadroid', level: 21 },
      { id: 'zcashghost', level: 20 },
    ],
  },
  the_whale: {
    name: 'The Whale',
    sprite: 'npc_whale',
    preDialog: [
      "...",
      "So you're the trainer who's been disrupting my operations.",
      "I've manipulated markets. I've crashed chains. I've rugged millions.",
      "You think your little creatures can stop ME?",
      "I am The Whale. And I will swallow you whole!",
    ],
    postWinDialog: [
      "No... my portfolio... impossible!",
      "I poured everything into these creatures...",
      "You... you've actually done it. The Syndicate is finished.",
      "Maybe there's hope for this CryptoVerse after all...",
    ],
    postLoseDialog: [
      "The market always wins, kid. And I AM the market.",
    ],
    party: [
      { id: 'sbfraud', level: 28 },
      { id: 'rugpuller', level: 26 },
      { id: 'deepfaker', level: 27 },
      { id: 'dogelord', level: 28 },
      { id: 'pepeking', level: 30 },
    ],
  },
  // Side quest trainer
  defi_trainer: {
    name: 'DeFi Trainer',
    sprite: 'npc',
    preDialog: [
      "You've gotten stronger since we last met!",
      "Let me test your skills properly this time!",
    ],
    postWinDialog: [
      "Wow! You're even better than I expected!",
      "Keep training - you'll be the best in the CryptoVerse!",
    ],
    postLoseDialog: [
      "Good effort! Keep training those DeFi strategies!",
    ],
    party: [
      { id: 'vitapup', level: 12 },
      { id: 'etherhound', level: 14 },
    ],
  },
};

export function getQuestById(questId) {
  return MAIN_QUESTS.find(q => q.id === questId)
    || SIDE_QUESTS.find(q => q.id === questId)
    || null;
}

export function getTrainer(trainerId) {
  return TRAINERS[trainerId] || null;
}
