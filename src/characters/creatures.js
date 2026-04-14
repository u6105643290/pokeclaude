// Creature database for PokeClaude
// All creatures with full stats, moves, evolution chains, and lore

const CREATURES = {
  // === LAYER1 TYPE ===
  satoshimp: {
    id: 'satoshimp', name: 'Satoshimp', type: 'Layer1',
    description: 'A small chimp that discovered the blockchain.',
    baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
    moves: ['hash_strike', 'fork_attack', 'block_confirm', 'fomo_rush'],
    evolution: { level: 16, evolvesTo: 'nakamotus' },
    rarity: 'common',
    spriteColor: '#F7931A',
    lore: 'Born from the genesis block, Satoshimp carries the original whitepaper in its tiny hands.'
  },
  nakamotus: {
    id: 'nakamotus', name: 'Nakamotus', type: 'Layer1',
    description: 'An evolved primate wielding consensus power.',
    baseStats: { hp: 60, attack: 62, defense: 63, specialAttack: 80, specialDefense: 80, speed: 60 },
    moves: ['consensus_beam', 'hash_strike', 'block_confirm', 'fork_attack'],
    evolution: { level: 36, evolvesTo: 'blockchainus' },
    rarity: 'uncommon',
    spriteColor: '#E8860C',
    lore: 'Nakamotus has learned to wield multiple chains at once, its power growing with each block.'
  },
  blockchainus: {
    id: 'blockchainus', name: 'Blockchainus', type: 'Layer1',
    description: 'The ultimate chain guardian, an unstoppable force.',
    baseStats: { hp: 80, attack: 82, defense: 83, specialAttack: 100, specialDefense: 100, speed: 80 },
    moves: ['fifty_one_attack', 'consensus_beam', 'hash_strike', 'block_confirm'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#D4770A',
    lore: 'Blockchainus is said to be immutable. No attack can alter its resolved state.'
  },

  // === DEFI TYPE ===
  vitapup: {
    id: 'vitapup', name: 'Vitapup', type: 'DeFi',
    description: 'A playful pup fueled by smart contract energy.',
    baseStats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43 },
    moves: ['yield_farm', 'smart_contract', 'impermanent_loss', 'fork_attack'],
    evolution: { level: 16, evolvesTo: 'etherhound' },
    rarity: 'common',
    spriteColor: '#627EEA',
    lore: 'Vitapup was created when a developer accidentally deployed a puppy to the mainnet.'
  },
  etherhound: {
    id: 'etherhound', name: 'Etherhound', type: 'DeFi',
    description: 'A loyal hound that guards DeFi protocols.',
    baseStats: { hp: 59, attack: 63, defense: 80, specialAttack: 65, specialDefense: 80, speed: 58 },
    moves: ['liquidity_drain', 'yield_farm', 'smart_contract', 'hash_strike'],
    evolution: { level: 36, evolvesTo: 'smartdoge' },
    rarity: 'uncommon',
    spriteColor: '#4A6BC5',
    lore: 'Etherhound can sniff out vulnerabilities in smart contracts from miles away.'
  },
  smartdoge: {
    id: 'smartdoge', name: 'Smartdoge', type: 'DeFi',
    description: 'A majestic DeFi wolf, master of all protocols.',
    baseStats: { hp: 79, attack: 83, defense: 100, specialAttack: 85, specialDefense: 100, speed: 78 },
    moves: ['flash_loan', 'liquidity_drain', 'smart_contract', 'yield_farm'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#3558B0',
    lore: 'Smartdoge oversees the entire DeFi ecosystem. Its howl can liquidate positions.'
  },

  // === MEME TYPE ===
  elonix: {
    id: 'elonix', name: 'Elonix', type: 'Meme',
    description: 'A mischievous creature that thrives on hype.',
    baseStats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65 },
    moves: ['pump_and_dump', 'fomo_rush', 'to_the_moon', 'diamond_hands'],
    evolution: { level: 16, evolvesTo: 'musketeer' },
    rarity: 'common',
    spriteColor: '#FFD700',
    lore: 'Elonix posts cryptic tweets that cause market chaos wherever it goes.'
  },
  musketeer: {
    id: 'musketeer', name: 'Musketeer', type: 'Meme',
    description: 'A swashbuckling meme warrior.',
    baseStats: { hp: 58, attack: 64, defense: 58, specialAttack: 80, specialDefense: 65, speed: 80 },
    moves: ['pump_and_dump', 'to_the_moon', 'fomo_rush', 'diamond_hands'],
    evolution: { level: 36, evolvesTo: 'dogelord' },
    rarity: 'uncommon',
    spriteColor: '#E6C200',
    lore: 'Musketeer rallies armies of followers with a single post.'
  },
  dogelord: {
    id: 'dogelord', name: 'Dogelord', type: 'Meme',
    description: 'The supreme meme sovereign. Much power. Very wow.',
    baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
    moves: ['to_the_moon', 'rug_pull', 'pump_and_dump', 'diamond_hands'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#CCA800',
    lore: 'Dogelord commands all meme coins. Its approval can 1000x any token overnight.'
  },

  // === NFT TYPE ===
  trumpunk: {
    id: 'trumpunk', name: 'Trumpunk', type: 'NFT',
    description: 'A brash pixel-art creature from the early NFT era.',
    baseStats: { hp: 50, attack: 70, defense: 55, specialAttack: 45, specialDefense: 50, speed: 55 },
    moves: ['mint_strike', 'floor_sweep', 'airdrop_bomb', 'delist'],
    evolution: { level: 20, evolvesTo: 'wallstreetbull' },
    rarity: 'uncommon',
    spriteColor: '#FF6B35',
    lore: 'Trumpunk was one of the first 10,000 creatures ever minted on-chain.'
  },
  wallstreetbull: {
    id: 'wallstreetbull', name: 'Wallstreetbull', type: 'NFT',
    description: 'A charging bull made of golden pixels.',
    baseStats: { hp: 70, attack: 95, defense: 75, specialAttack: 60, specialDefense: 70, speed: 70 },
    moves: ['royalty_slash', 'floor_sweep', 'mint_strike', 'delist'],
    evolution: { level: 40, evolvesTo: 'goldenbull' },
    rarity: 'rare',
    spriteColor: '#E85A20',
    lore: 'Wallstreetbull charges at bears on sight. Its hooves leave golden pixel trails.'
  },
  goldenbull: {
    id: 'goldenbull', name: 'Goldenbull', type: 'NFT',
    description: 'A legendary bull coated in 24-karat pixel gold.',
    baseStats: { hp: 90, attack: 120, defense: 95, specialAttack: 75, specialDefense: 85, speed: 85 },
    moves: ['royalty_slash', 'floor_sweep', 'airdrop_bomb', 'combo_breaker'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#CC4A10',
    lore: 'Goldenbull is the spirit of every bull market. Its presence guarantees green candles.'
  },

  // === LAYER1 - Gavinite line ===
  gavinite: {
    id: 'gavinite', name: 'Gavinite', type: 'Layer1',
    description: 'A polymorphic creature bridging multiple chains.',
    baseStats: { hp: 55, attack: 55, defense: 60, specialAttack: 70, specialDefense: 60, speed: 50 },
    moves: ['hash_strike', 'consensus_beam', 'fork_attack', 'block_confirm'],
    evolution: { level: 28, evolvesTo: 'polkadroid' },
    rarity: 'uncommon',
    spriteColor: '#E6007A',
    lore: 'Gavinite can connect to any parachain, translating between all creature languages.'
  },
  polkadroid: {
    id: 'polkadroid', name: 'Polkadroid', type: 'Layer1',
    description: 'A multi-chain android with relay capabilities.',
    baseStats: { hp: 75, attack: 75, defense: 80, specialAttack: 95, specialDefense: 80, speed: 70 },
    moves: ['consensus_beam', 'fifty_one_attack', 'hash_strike', 'block_confirm'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#C50066',
    lore: 'Polkadroid relays messages across all chains, orchestrating a grand multi-chain symphony.'
  },

  // === DEFI - SBFraud ===
  sbfraud: {
    id: 'sbfraud', name: 'SBFraud', type: 'DeFi',
    description: 'A fallen DeFi creature. Once trusted, now despised.',
    baseStats: { hp: 65, attack: 40, defense: 40, specialAttack: 95, specialDefense: 55, speed: 90 },
    moves: ['flash_loan', 'liquidity_drain', 'rug_pull', 'impermanent_loss'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#1A4B8C',
    lore: 'SBFraud once managed vast treasuries, but its house of cards collapsed spectacularly.'
  },

  // === MEME - Rugpuller ===
  rugpuller: {
    id: 'rugpuller', name: 'Rugpuller', type: 'Meme',
    description: 'A trickster creature that vanishes with your funds.',
    baseStats: { hp: 50, attack: 55, defense: 35, specialAttack: 80, specialDefense: 40, speed: 95 },
    moves: ['rug_pull', 'pump_and_dump', 'fomo_rush', 'to_the_moon'],
    evolution: null,
    rarity: 'uncommon',
    spriteColor: '#8B0000',
    lore: 'Rugpuller appears friendly at first, but always disappears right after gaining trust.'
  },

  // === AI - Vaporware line ===
  vaporware: {
    id: 'vaporware', name: 'Vaporware', type: 'AI',
    description: 'A creature made of unfulfilled promises and pitch decks.',
    baseStats: { hp: 48, attack: 45, defense: 50, specialAttack: 72, specialDefense: 55, speed: 58 },
    moves: ['hallucinate', 'overfit', 'deep_learn', 'neural_blast'],
    evolution: { level: 24, evolvesTo: 'deepfaker' },
    rarity: 'uncommon',
    spriteColor: '#9B59B6',
    lore: 'Vaporware promises incredible features but mostly just generates impressive demos.'
  },
  deepfaker: {
    id: 'deepfaker', name: 'Deepfaker', type: 'AI',
    description: 'An AI entity that can mimic any creature perfectly.',
    baseStats: { hp: 68, attack: 65, defense: 70, specialAttack: 100, specialDefense: 75, speed: 78 },
    moves: ['prompt_inject', 'neural_blast', 'hallucinate', 'deep_learn'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#7D3C98',
    lore: 'Deepfaker has become so convincing that even oracles cannot tell its creations from reality.'
  },

  // === LAYER1 - CZDragon line ===
  czdragon: {
    id: 'czdragon', name: 'CZDragon', type: 'Layer1',
    description: 'A dragon-like creature powered by exchange energy.',
    baseStats: { hp: 55, attack: 65, defense: 50, specialAttack: 60, specialDefense: 50, speed: 60 },
    moves: ['hash_strike', 'consensus_beam', 'fork_attack', 'pump_and_dump'],
    evolution: { level: 30, evolvesTo: 'bnbeast' },
    rarity: 'uncommon',
    spriteColor: '#F3BA2F',
    lore: 'CZDragon guards the largest exchange vault, breathing hashed fire at intruders.'
  },
  bnbeast: {
    id: 'bnbeast', name: 'BNBeast', type: 'Layer1',
    description: 'A colossal beast that runs its own blockchain.',
    baseStats: { hp: 80, attack: 90, defense: 75, specialAttack: 85, specialDefense: 75, speed: 80 },
    moves: ['fifty_one_attack', 'consensus_beam', 'hash_strike', 'floor_sweep'],
    evolution: null,
    rarity: 'rare',
    spriteColor: '#D4A020',
    lore: 'BNBeast quarterly burns off excess energy, growing stronger with each cycle.'
  },

  // === PRIVACY TYPE ===
  moneroach: {
    id: 'moneroach', name: 'Moneroach', type: 'Privacy',
    description: 'A roach-like creature impossible to trace or eliminate.',
    baseStats: { hp: 60, attack: 55, defense: 65, specialAttack: 75, specialDefense: 70, speed: 50 },
    moves: ['zero_knowledge', 'stealth_tx', 'mixer_shield', 'obfuscate'],
    evolution: null,
    rarity: 'uncommon',
    spriteColor: '#FF6600',
    lore: 'Moneroach thrives in the shadows. Even the most advanced analytics cannot track it.'
  },

  // === ORACLE TYPE ===
  chainlinker: {
    id: 'chainlinker', name: 'Chainlinker', type: 'Oracle',
    description: 'A creature that bridges the real and digital worlds.',
    baseStats: { hp: 55, attack: 50, defense: 60, specialAttack: 80, specialDefense: 70, speed: 55 },
    moves: ['price_feed', 'data_stream', 'oracle_vision', 'verify'],
    evolution: null,
    rarity: 'uncommon',
    spriteColor: '#375BD2',
    lore: 'Chainlinker feeds real-world data into the blockchain, a bridge between two realms.'
  },

  // === GAMING TYPE ===
  axiebot: {
    id: 'axiebot', name: 'Axiebot', type: 'Gaming',
    description: 'A small gaming robot that earns rewards through play.',
    baseStats: { hp: 52, attack: 58, defense: 48, specialAttack: 62, specialDefense: 48, speed: 60 },
    moves: ['play_to_earn', 'pixel_blast', 'respawn', 'loot_drop'],
    evolution: null,
    rarity: 'common',
    spriteColor: '#00BFFF',
    lore: 'Axiebot grinds levels endlessly, converting playtime into pure combat power.'
  },

  // === MEME - Pepeking (LEGENDARY) ===
  pepeking: {
    id: 'pepeking', name: 'Pepeking', type: 'Meme',
    description: 'The legendary sovereign of all meme creatures.',
    baseStats: { hp: 100, attack: 100, defense: 90, specialAttack: 120, specialDefense: 95, speed: 110 },
    moves: ['to_the_moon', 'rug_pull', 'pump_and_dump', 'diamond_hands'],
    evolution: null,
    rarity: 'legendary',
    spriteColor: '#00FF00',
    lore: 'Pepeking has existed since the dawn of the internet. Its meme energy is infinite and self-sustaining.'
  },

  // === AI - Claudius (LEGENDARY) ===
  claudius: {
    id: 'claudius', name: 'Claudius', type: 'AI',
    description: 'A legendary AI entity of immense intelligence and kindness.',
    baseStats: { hp: 95, attack: 85, defense: 100, specialAttack: 130, specialDefense: 110, speed: 95 },
    moves: ['prompt_inject', 'neural_blast', 'deep_learn', 'hallucinate'],
    evolution: null,
    rarity: 'legendary',
    spriteColor: '#D4A574',
    lore: 'Claudius appeared when AI reached a new threshold of understanding. It is helpful, harmless, and honest.'
  },

  // === PRIVACY ===
  zcashghost: {
    id: 'zcashghost', name: 'Zcashghost', type: 'Privacy',
    description: 'A spectral creature that exists in shielded transactions.',
    baseStats: { hp: 55, attack: 50, defense: 55, specialAttack: 85, specialDefense: 70, speed: 65 },
    moves: ['zero_knowledge', 'ring_signature', 'obfuscate', 'mixer_shield'],
    evolution: null,
    rarity: 'uncommon',
    spriteColor: '#ECB244',
    lore: 'Zcashghost phases between transparent and shielded pools at will.'
  },

  // === ORACLE ===
  bandoracle: {
    id: 'bandoracle', name: 'Bandoracle', type: 'Oracle',
    description: 'A musical oracle that delivers data through song.',
    baseStats: { hp: 58, attack: 55, defense: 58, specialAttack: 78, specialDefense: 65, speed: 62 },
    moves: ['data_stream', 'price_feed', 'api_overload', 'oracle_vision'],
    evolution: null,
    rarity: 'uncommon',
    spriteColor: '#516AFF',
    lore: 'Bandoracle harmonizes data feeds into accurate price melodies.'
  },

  // === GAMING ===
  sandboxer: {
    id: 'sandboxer', name: 'Sandboxer', type: 'Gaming',
    description: 'A voxel creature that builds worlds from raw blocks.',
    baseStats: { hp: 62, attack: 55, defense: 68, specialAttack: 70, specialDefense: 60, speed: 48 },
    moves: ['pixel_blast', 'play_to_earn', 'combo_breaker', 'respawn'],
    evolution: null,
    rarity: 'uncommon',
    spriteColor: '#00CED1',
    lore: 'Sandboxer crafts entire metaverse landscapes, block by block.'
  },

  // === NFT ===
  boredchimp: {
    id: 'boredchimp', name: 'Boredchimp', type: 'NFT',
    description: 'A bored-looking chimp that is inexplicably valuable.',
    baseStats: { hp: 65, attack: 70, defense: 60, specialAttack: 55, specialDefense: 55, speed: 65 },
    moves: ['mint_strike', 'floor_sweep', 'airdrop_bomb', 'royalty_slash'],
    evolution: null,
    rarity: 'uncommon',
    spriteColor: '#8B4513',
    lore: 'Nobody knows why Boredchimp is worth so much. It just sits there, looking unimpressed.'
  },
};

// Starter creature IDs
export const STARTERS = ['satoshimp', 'vitapup', 'elonix'];

// Get a creature template by ID (returns a deep copy)
export function getCreature(id) {
  const template = CREATURES[id];
  if (!template) return null;
  return JSON.parse(JSON.stringify(template));
}

// Create a creature instance at a given level
export function createCreatureInstance(id, level = 5) {
  const creature = getCreature(id);
  if (!creature) return null;

  creature.level = level;
  creature.xp = 0;
  creature.xpToNext = getXpForLevel(level + 1);

  // Calculate actual stats from base stats and level
  creature.stats = {};
  for (const stat in creature.baseStats) {
    if (stat === 'hp') {
      creature.stats.hp = Math.floor(((2 * creature.baseStats.hp * level) / 100) + level + 10);
    } else {
      creature.stats[stat] = Math.floor(((2 * creature.baseStats[stat] * level) / 100) + 5);
    }
  }
  creature.currentHp = creature.stats.hp;

  // Set up move PP
  creature.currentMoves = creature.moves.map(moveId => ({
    id: moveId,
    currentPp: null // Will be filled from move data
  }));

  return creature;
}

export function getXpForLevel(level) {
  return Math.floor(Math.pow(level, 3) * 0.8);
}

export function getCreaturesByRarity(rarity) {
  return Object.values(CREATURES).filter(c => c.rarity === rarity);
}

export function getCreaturesByType(type) {
  return Object.values(CREATURES).filter(c => c.type === type);
}

export function getWildCreaturesForArea(areaName) {
  const areaCreatures = {
    'Satoshi Town': ['satoshimp', 'axiebot', 'elonix'],
    'DeFi Forest': ['vitapup', 'etherhound', 'sbfraud', 'rugpuller'],
    'Meme Meadow': ['elonix', 'musketeer', 'rugpuller', 'boredchimp', 'trumpunk'],
    'AI Labs': ['vaporware', 'deepfaker', 'chainlinker', 'bandoracle'],
    'Chain Mountains': ['gavinite', 'czdragon', 'polkadroid', 'moneroach', 'zcashghost'],
  };
  return areaCreatures[areaName] || ['satoshimp', 'elonix', 'vitapup'];
}

export function getAllCreatures() {
  return { ...CREATURES };
}

export { CREATURES };
