// NPC data with context-sensitive dialogues based on quest progress

export const NPC_DATA = {
  prof_hashimoto: {
    id: 'prof_hashimoto',
    name: 'Prof. Hashimoto',
    x: 20, y: 44,
    sprite: 'npc',
    dialogByQuest: {
      // Before getting starter
      _default: [
        "Welcome to the world of PokeClaude!",
        "I'm Professor Hashimoto, the leading CryptoMon researcher.",
        "Choose your first partner and begin your adventure!",
      ],
      // Lost pokeball quest
      lost_pokeball_active: [
        "Oh no! I just realized I dropped my rare Ultra Sphere!",
        "I was studying creatures in DeFi Forest near the clearing at coordinates (4, 31).",
        "It must have fallen out of my bag there! Please go find it!",
      ],
      // Ancient artifact quest
      ancient_artifact_done: [
        "This hard drive... it contains data from the Genesis Era!",
        "The first CryptoMon ever recorded is documented here!",
        "This is the greatest discovery of my career! Thank you!",
      ],
      // After prologue, before forest quest
      prologue_done: [
        "I've been hearing strange reports from DeFi Forest...",
        "Creatures are acting aggressively, unlike anything I've seen.",
        "Could you investigate? Talk to the Kid in town - he saw something there.",
      ],
      // During forest crisis
      forest_crisis_active: [
        "Have you found out what's happening in DeFi Forest yet?",
        "Be careful out there. Something sinister is going on.",
      ],
      // Forest crisis - player beat the grunt, needs to report
      forest_crisis_report: [
        "You defeated a Rug Pull Grunt?! This is serious...",
        "The Rug Pull Syndicate... I thought they were just a rumor.",
        "They must be using CryptoMons for some nefarious scheme.",
        "We need to stay vigilant. Check on other areas too!",
        "Here, take these supplies for your trouble.",
      ],
      // After forest, before meme
      forest_crisis_done: [
        "The Rug Pull Syndicate is a real threat.",
        "I've heard rumors of activity in Meme Meadow too.",
        "Talk to the Meme Lord there - he might know something.",
      ],
      // During later quests
      meme_mayhem_done: [
        "Two areas compromised by the Syndicate...",
        "I'm worried about AI Labs. Dr. Neural might need help.",
        "Please check on the situation there!",
      ],
      lab_breach_done: [
        "The Syndicate infiltrated AI Labs too?!",
        "This is worse than I thought. They must have a base somewhere.",
        "The Mountaineer in Chain Mountains might have seen something.",
      ],
      mountain_mystery_done: [
        "You found their base! And defeated Commander Liquidator!",
        "The leader... they call them 'The Whale'.",
        "You're the only one who can stop them now.",
        "When you're ready, head to Chain Mountains summit.",
        "I believe in you!",
      ],
      // Final quest pep talk
      final_showdown_active: [
        "This is it. You're about to face The Whale.",
        "Remember everything you've learned on this journey.",
        "Your CryptoMons trust you. Fight with everything you've got!",
        "The entire CryptoVerse is counting on you!",
      ],
      // Game complete
      final_showdown_done: [
        "You did it! You actually saved the CryptoVerse!",
        "The Rug Pull Syndicate has been dismantled.",
        "But there are still mysteries out there...",
        "Keep exploring! There might be legendary creatures to discover!",
      ],
    },
  },

  nurse_joy: {
    id: 'nurse_joy',
    name: 'Nurse Joy',
    x: 36, y: 44,
    sprite: 'npc',
    heals: true,
    dialogByQuest: {
      _default: [
        "Welcome to the PokeCenter!",
        "Let me heal your CryptoMons...",
        "There you go! Your team is fully restored!",
      ],
      medicine_run_active: [
        "Oh, you came at the right time!",
        "I'm running low on healing herbs...",
        "There are rare medicinal herbs in DeFi Forest, near coordinates (10, 44).",
        "Could you gather some for me? I'll make potions for you in return!",
      ],
      medicine_run_done: [
        "These herbs are perfect! Thank you so much!",
        "I've made a big batch of potions for you as thanks!",
        "Your team is also fully healed!",
      ],
      final_showdown_active: [
        "I can tell you're preparing for something big.",
        "Let me make sure your team is in perfect shape!",
        "All healed up! Go get 'em!",
      ],
    },
  },

  shopkeeper: {
    id: 'shopkeeper',
    name: 'Shopkeeper',
    x: 28, y: 44,
    sprite: 'npc',
    dialogByQuest: {
      _default: [
        "Welcome to the PokeMart!",
        "We sell CryptoSpheres, potions, and more.",
        "Good luck on your adventure!",
      ],
      // Side quest: supply run
      shopkeeper_delivery_active: [
        "Oh, thank goodness you're here!",
        "I packed supplies for the Mountaineer but I can't leave the shop!",
        "The crate is behind the PokeMart at coordinates (30, 42).",
        "Pick it up and deliver it to the Mountaineer in Chain Mountains!",
        "I'll pay you well for the trouble!",
      ],
      shopkeeper_delivery_delivering: [
        "Have you picked up the supply crate behind my shop yet?",
        "It's at (30, 42). Then take it to the Mountaineer!",
      ],
      shopkeeper_delivery_complete: [
        "You delivered the supplies? Wonderful!",
        "Here's your payment. Thanks so much!",
        "You're a real hero, you know that?",
      ],
      shopkeeper_delivery_done: [
        "Business is booming thanks to you!",
        "Stop by anytime you need supplies.",
      ],
    },
  },

  kid: {
    id: 'kid',
    name: 'Kid',
    x: 28, y: 50,
    sprite: 'npc',
    dialogByQuest: {
      _default: [
        "Did you know there are legendary CryptoMons?",
        "I've heard Pepeking lives somewhere in the meadows!",
        "And Claudius roams the AI Labs at night!",
      ],
      // Forest crisis - player needs to talk to kid
      forest_crisis_rumors: [
        "Hey, have you been to DeFi Forest lately?",
        "I saw some weird people there wearing dark outfits...",
        "They had this symbol on their clothes - looked like a pulled rug!",
        "I'm scared... can you check it out?",
      ],
      forest_crisis_active: [
        "Did you find those scary people in the forest?",
        "Be careful! They looked really mean!",
      ],
      forest_crisis_done: [
        "You beat those bad guys? Wow, you're so cool!",
        "I wanna be a trainer like you when I grow up!",
      ],
      ancient_artifact_active: [
        "Hey! My grandpa told me a story about the Genesis Era!",
        "He said there's an ancient hard drive buried in the snow!",
        "It's up in Chain Mountains, in the snowy area around (72, 5)!",
        "If you find it, Prof. Hashimoto would be so excited!",
      ],
      ghost_hunter_done: [
        "Whoa!! A ghost creature?! That's so scary and cool!!",
        "Can I pet it?! ...Oh, it went right through my hand!",
      ],
      kid_hero_active: [
        "You've saved DeFi Forest, Meme Meadow, AI Labs, AND the Mountains?!",
        "You're the greatest trainer in the whole CryptoVerse!",
        "When I grow up, I'm gonna be just like you!",
        "Here, I found this while you were gone. You should have it!",
      ],
      kid_hero_done: [
        "I'm training hard every day to be like you!",
        "One day I'll have my own CryptoMon team!",
      ],
      final_showdown_done: [
        "You saved the whole CryptoVerse?!",
        "You're my hero!! Can I have your autograph?!",
      ],
    },
  },

  defi_trainer: {
    id: 'defi_trainer',
    name: 'DeFi Trainer',
    x: 7, y: 36,
    sprite: 'npc',
    dialogByQuest: {
      _default: [
        "The DeFi Forest is full of DeFi-type creatures.",
        "Watch out for Rugpullers - they're tricky!",
        "Type matchups are crucial in battle. Learn them well!",
      ],
      // Side quest battle
      defi_trainer_challenge_active: [
        "You want to test your skills?",
        "Alright, let's battle! Show me what you've got!",
      ],
      defi_trainer_challenge_done: [
        "Great battle! You've really improved!",
        "Keep coming back if you want more practice.",
      ],
      forest_crisis_active: [
        "Be careful deeper in the forest...",
        "I've seen some suspicious characters lurking around.",
        "They don't look like regular trainers.",
      ],
    },
  },

  meme_lord: {
    id: 'meme_lord',
    name: 'Meme Lord',
    x: 50, y: 48,
    sprite: 'npc',
    dialogByQuest: {
      _default: [
        "Welcome to Meme Meadow, fren!",
        "This is where the meme creatures gather.",
        "Diamond hands forever!",
      ],
      meme_treasure_active: [
        "Yo fren! I buried some treasure in the meadow!",
        "Here's how to find it - follow the clues!",
        "First clue is near the south flowers at (45, 54).",
        "Each clue leads to the next! Good luck, fren!",
      ],
      meme_treasure_done: [
        "You found the treasure! Absolute legend!",
        "Diamond hands paid off! Here's your share!",
        "You're an honorary Meme Lord now, fren!",
      ],
      meme_mayhem_start: [
        "Dude, something's seriously wrong!",
        "The meme creatures are going crazy!",
        "Someone's been pumping them with some weird energy...",
        "I saw a suspicious person near the south flowers.",
        "But first, catch a Meme creature - you'll need one to understand them!",
      ],
      meme_mayhem_active: [
        "Have you caught a Meme creature yet?",
        "You'll need one to blend in and find that agent!",
      ],
      meme_mayhem_report: [
        "You stopped the agent? Based!",
        "The creatures are calming down already!",
        "You're a real diamond hands legend, fren!",
        "Here, take this as thanks from Meme Meadow!",
      ],
      meme_mayhem_done: [
        "Meme Meadow is peaceful again, thanks to you!",
        "The creatures here are much happier now.",
        "Come visit anytime - we don't forget our frens!",
      ],
    },
  },

  dr_neural: {
    id: 'dr_neural',
    name: 'Dr. Neural',
    x: 35, y: 15,
    sprite: 'npc',
    dialogByQuest: {
      _default: [
        "Welcome to AI Labs.",
        "We study the mysterious AI-type creatures here.",
        "Claudius is said to roam these halls...",
      ],
      stolen_data_active: [
        "Oh no! Someone stole my research USB drive!",
        "I think the Rug Pull agents hid it in Meme Meadow...",
        "Near the pond, around coordinates (58, 41).",
        "That data contains years of AI research! Please retrieve it!",
      ],
      stolen_data_done: [
        "My USB drive! Thank heavens!",
        "All my research on Claudius is safe now!",
        "You've saved years of work. Here, take this reward!",
      ],
      lab_keycards_active: [
        "The security system is still compromised from the breach!",
        "Three keycards were scattered during the hack.",
        "Keycard A is in the west wing at (23, 8).",
        "Keycard B is in the east wing at (43, 13).",
        "Keycard C is in the south hall at (35, 22).",
        "Please find them all so I can restore security!",
      ],
      lab_keycards_done: [
        "All three keycards! The security system is back online!",
        "The lab is finally fully secure. Thank you so much!",
      ],
      lab_breach_start: [
        "Thank goodness you're here!",
        "Hackers from the Rug Pull Syndicate have breached our systems!",
        "They've taken control of the east and west wings.",
        "Two hackers - Alpha and Beta - are blocking our access.",
        "Please, you have to stop them before they steal our research!",
      ],
      lab_breach_partial: [
        "You got one of the hackers? Great!",
        "But the other one is still in control of the system.",
        "We need both of them gone to secure the lab!",
      ],
      lab_breach_report: [
        "Both hackers defeated! You've saved our research!",
        "The data they were after... it's about Claudius.",
        "They wanted to capture the legendary AI creature.",
        "Thank you for protecting the lab.",
        "Here - our best supplies as a reward!",
      ],
      lab_breach_done: [
        "The lab is secure again, thanks to you.",
        "Our research on AI creatures continues safely.",
        "If you ever encounter Claudius... treat it with kindness.",
      ],
      ai_researcher_active: [
        "Oh, you're helping with my research?",
        "I need an AI-type creature for my neural mapping study.",
        "Catch one in the lab area and bring it to me!",
      ],
      ai_researcher_done: [
        "Magnificent! This AI creature is perfect for my research!",
        "The neural patterns are unlike anything I've seen!",
        "Thank you so much! Here's your reward!",
      ],
    },
  },

  mountaineer: {
    id: 'mountaineer',
    name: 'Mountaineer',
    x: 60, y: 20,
    sprite: 'npc',
    dialogByQuest: {
      _default: [
        "Chain Mountains is treacherous.",
        "But the rarest Layer1 creatures live here.",
        "Watch your step and keep your creatures close!",
      ],
      mountain_flags_active: [
        "Hey! I've been wanting to mark the mountain peaks!",
        "I've got three flags here. Can you plant them for me?",
        "West peak is at (52, 12), east peak at (73, 7), north peak at (62, 3).",
        "I'd do it myself but my knees aren't what they used to be!",
      ],
      mountain_flags_done: [
        "All three flags planted! You can see them from miles away!",
        "Now other trainers will know the safe routes!",
        "You're a true mountaineer at heart!",
      ],
      shopkeeper_delivery_receive: [
        "Oh! Supplies from the Shopkeeper? Perfect timing!",
        "I was running low up here. Thanks for the delivery!",
        "Tell the Shopkeeper I said thanks!",
      ],
      mountain_mystery_start: [
        "Hey, you! You look like a capable trainer.",
        "I've spotted something strange on the mountain...",
        "There's a group of people coming and going from a hidden cave.",
        "I think it's connected to those Rug Pull guys everyone's talking about.",
        "There's a guard blocking the upper path. Can you deal with them?",
      ],
      mountain_mystery_active: [
        "The guard is up the northern path.",
        "Be prepared - they looked tough!",
      ],
      mountain_mystery_report: [
        "You found their base AND defeated the Commander?!",
        "That's incredible! But... their leader is still out there.",
        "They call them 'The Whale'. Controls huge amounts of resources.",
        "If you're going after them, make sure you're ready.",
        "Here's everything I can spare for your journey.",
      ],
      mountain_mystery_done: [
        "The mountain feels safer already.",
        "But be careful near the summit - that's where The Whale was last seen.",
      ],
      // Side quest delivery
      shopkeeper_delivery_receive: [
        "Oh! Supplies from the Shopkeeper? Perfect timing!",
        "I was running low up here. Thanks for the delivery!",
        "Tell the Shopkeeper I said thanks!",
      ],
      final_showdown_done: [
        "You beat The Whale! The mountains are free!",
        "You're a legend! The creatures here are celebrating!",
      ],
    },
  },
};

// Trainer NPCs that appear during quests (spawned dynamically)
export const QUEST_NPCS = {
  grunt_forest: {
    id: 'grunt_forest',
    name: 'Rug Pull Grunt',
    x: 5, y: 40,
    sprite: 'npc_grunt',
    appearsOnQuest: 'forest_crisis',
    appearsOnObjective: 'enter_forest',
    dialogToFight: [
      "Hey! You're not supposed to be here!",
      "The Rug Pull Syndicate controls this forest now!",
    ],
  },
  agent_meadow: {
    id: 'agent_meadow',
    name: 'Rug Pull Agent',
    x: 46, y: 55,
    sprite: 'npc_agent',
    appearsOnQuest: 'meme_mayhem',
    appearsOnObjective: 'catch_meme',
    dialogToFight: [
      "So, the little trainer found me...",
      "I've been pumping these meme creatures full of chaos energy!",
    ],
  },
  hacker_alpha: {
    id: 'hacker_alpha',
    name: 'Hacker Alpha',
    x: 25, y: 12,
    sprite: 'npc_hacker',
    appearsOnQuest: 'lab_breach',
    appearsOnObjective: 'talk_neural',
    dialogToFight: [
      "INTRUSION DETECTED.",
      "Initiating defense protocol...",
    ],
  },
  hacker_beta: {
    id: 'hacker_beta',
    name: 'Hacker Beta',
    x: 45, y: 18,
    sprite: 'npc_hacker',
    appearsOnQuest: 'lab_breach',
    appearsOnObjective: 'talk_neural',
    dialogToFight: [
      "You beat Alpha? No matter.",
      "I'm the real firewall!",
    ],
  },
  guard_mountain: {
    id: 'guard_mountain',
    name: 'Base Guard',
    x: 58, y: 15,
    sprite: 'npc_grunt',
    appearsOnQuest: 'mountain_mystery',
    appearsOnObjective: 'talk_mountaineer',
    dialogToFight: [
      "Halt! This path is closed!",
      "By order of The Whale!",
    ],
  },
  commander_liquidator: {
    id: 'commander_liquidator',
    name: 'Cmdr. Liquidator',
    x: 68, y: 8,
    sprite: 'npc_commander',
    appearsOnQuest: 'mountain_mystery',
    appearsOnObjective: 'beat_guard1',
    dialogToFight: [
      "So you made it past my guards.",
      "I am Commander Liquidator.",
      "Prepare to be liquidated!",
    ],
  },
  the_whale: {
    id: 'the_whale',
    name: 'The Whale',
    x: 72, y: 5,
    sprite: 'npc_whale',
    appearsOnQuest: 'final_showdown',
    appearsOnObjective: 'heal_up',
    dialogToFight: [
      "...",
      "So you're the one who's been disrupting my operations.",
      "I am The Whale. And I will swallow you whole!",
    ],
  },
};

// Get the appropriate dialog for an NPC based on current quest state
export function getNpcDialog(npcId, questState) {
  const npc = NPC_DATA[npcId];
  if (!npc) return ["..."];

  const dialogs = npc.dialogByQuest;

  // Check quest-specific dialog keys (most specific first)
  for (const [key, lines] of Object.entries(dialogs)) {
    if (key === '_default') continue;
    if (questState[key]) {
      return lines;
    }
  }

  return dialogs._default || ["..."];
}
