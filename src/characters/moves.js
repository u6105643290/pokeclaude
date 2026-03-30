// Move database for PokeClaude
// Categories: physical (uses attack/defense), special (uses spAtk/spDef), status (no damage)

const MOVES = {
  // DeFi moves
  yield_farm: {
    id: 'yield_farm', name: 'Yield Farm', type: 'DeFi', category: 'special',
    power: 65, accuracy: 100, pp: 20, maxPp: 20,
    effect: null, description: 'Harvests DeFi yields to attack the opponent.'
  },
  liquidity_drain: {
    id: 'liquidity_drain', name: 'Liquidity Drain', type: 'DeFi', category: 'special',
    power: 80, accuracy: 90, pp: 10, maxPp: 10,
    effect: 'drain', description: 'Drains liquidity, healing the user for 50% of damage dealt.'
  },
  flash_loan: {
    id: 'flash_loan', name: 'Flash Loan', type: 'DeFi', category: 'special',
    power: 120, accuracy: 70, pp: 5, maxPp: 5,
    effect: 'recoil', description: 'A devastating flash loan attack with recoil damage.'
  },
  smart_contract: {
    id: 'smart_contract', name: 'Smart Contract', type: 'DeFi', category: 'status',
    power: 0, accuracy: 100, pp: 15, maxPp: 15,
    effect: 'defUp', description: 'Deploys a smart contract shield, raising defense.'
  },
  impermanent_loss: {
    id: 'impermanent_loss', name: 'Impermanent Loss', type: 'DeFi', category: 'special',
    power: 50, accuracy: 100, pp: 25, maxPp: 25,
    effect: 'atkDown', description: 'Inflicts impermanent loss, lowering foe attack.'
  },

  // AI moves
  neural_blast: {
    id: 'neural_blast', name: 'Neural Blast', type: 'AI', category: 'special',
    power: 90, accuracy: 85, pp: 10, maxPp: 10,
    effect: null, description: 'Fires a concentrated neural network beam.'
  },
  deep_learn: {
    id: 'deep_learn', name: 'Deep Learn', type: 'AI', category: 'status',
    power: 0, accuracy: 100, pp: 10, maxPp: 10,
    effect: 'spAtkUp', description: 'Studies the opponent deeply, raising special attack.'
  },
  hallucinate: {
    id: 'hallucinate', name: 'Hallucinate', type: 'AI', category: 'special',
    power: 70, accuracy: 80, pp: 15, maxPp: 15,
    effect: 'confuse', description: 'Generates hallucinations that confuse the foe.'
  },
  prompt_inject: {
    id: 'prompt_inject', name: 'Prompt Inject', type: 'AI', category: 'special',
    power: 100, accuracy: 75, pp: 5, maxPp: 5,
    effect: null, description: 'Injects a malicious prompt for massive damage.'
  },
  overfit: {
    id: 'overfit', name: 'Overfit', type: 'AI', category: 'physical',
    power: 60, accuracy: 100, pp: 20, maxPp: 20,
    effect: null, description: 'An overfitted attack. Reliable but predictable.'
  },

  // Meme moves
  pump_and_dump: {
    id: 'pump_and_dump', name: 'Pump & Dump', type: 'Meme', category: 'physical',
    power: 85, accuracy: 90, pp: 10, maxPp: 10,
    effect: null, description: 'Pumps up power then dumps it on the foe.'
  },
  diamond_hands: {
    id: 'diamond_hands', name: 'Diamond Hands', type: 'Meme', category: 'status',
    power: 0, accuracy: 100, pp: 10, maxPp: 10,
    effect: 'defUp', description: 'Holds firm with diamond hands, raising defense sharply.'
  },
  fomo_rush: {
    id: 'fomo_rush', name: 'FOMO Rush', type: 'Meme', category: 'physical',
    power: 70, accuracy: 95, pp: 15, maxPp: 15,
    effect: null, description: 'Charges in with FOMO-fueled urgency.'
  },
  to_the_moon: {
    id: 'to_the_moon', name: 'To The Moon', type: 'Meme', category: 'special',
    power: 130, accuracy: 60, pp: 5, maxPp: 5,
    effect: null, description: 'Launches a moonshot attack. Powerful but unreliable.'
  },
  rug_pull: {
    id: 'rug_pull', name: 'Rug Pull', type: 'Meme', category: 'special',
    power: 95, accuracy: 85, pp: 5, maxPp: 5,
    effect: 'spdDown', description: 'Pulls the rug, dealing damage and lowering speed.'
  },

  // Layer1 moves
  hash_strike: {
    id: 'hash_strike', name: 'Hash Strike', type: 'Layer1', category: 'physical',
    power: 75, accuracy: 100, pp: 15, maxPp: 15,
    effect: null, description: 'Strikes with raw hashing power.'
  },
  consensus_beam: {
    id: 'consensus_beam', name: 'Consensus Beam', type: 'Layer1', category: 'special',
    power: 90, accuracy: 90, pp: 10, maxPp: 10,
    effect: null, description: 'Fires a beam of consensus energy.'
  },
  fork_attack: {
    id: 'fork_attack', name: 'Fork Attack', type: 'Layer1', category: 'physical',
    power: 60, accuracy: 100, pp: 20, maxPp: 20,
    effect: null, description: 'Attacks with a chain fork. Hits reliably.'
  },
  block_confirm: {
    id: 'block_confirm', name: 'Block Confirm', type: 'Layer1', category: 'status',
    power: 0, accuracy: 100, pp: 10, maxPp: 10,
    effect: 'spdUp', description: 'Confirms blocks quickly, raising speed.'
  },
  fifty_one_attack: {
    id: 'fifty_one_attack', name: '51% Attack', type: 'Layer1', category: 'special',
    power: 150, accuracy: 50, pp: 3, maxPp: 3,
    effect: null, description: 'A devastating majority attack. Extremely hard to land.'
  },

  // NFT moves
  mint_strike: {
    id: 'mint_strike', name: 'Mint Strike', type: 'NFT', category: 'physical',
    power: 65, accuracy: 100, pp: 20, maxPp: 20,
    effect: null, description: 'Strikes by minting a new NFT projectile.'
  },
  floor_sweep: {
    id: 'floor_sweep', name: 'Floor Sweep', type: 'NFT', category: 'physical',
    power: 80, accuracy: 90, pp: 10, maxPp: 10,
    effect: null, description: 'Sweeps the floor, hitting hard.'
  },
  airdrop_bomb: {
    id: 'airdrop_bomb', name: 'Airdrop Bomb', type: 'NFT', category: 'special',
    power: 70, accuracy: 95, pp: 15, maxPp: 15,
    effect: null, description: 'Drops an explosive airdrop on the foe.'
  },
  delist: {
    id: 'delist', name: 'Delist', type: 'NFT', category: 'status',
    power: 0, accuracy: 85, pp: 10, maxPp: 10,
    effect: 'atkDown', description: 'Delists the foe, lowering their attack.'
  },
  royalty_slash: {
    id: 'royalty_slash', name: 'Royalty Slash', type: 'NFT', category: 'physical',
    power: 110, accuracy: 80, pp: 5, maxPp: 5,
    effect: null, description: 'A devastating slash fueled by royalty fees.'
  },

  // Privacy moves
  zero_knowledge: {
    id: 'zero_knowledge', name: 'Zero Knowledge', type: 'Privacy', category: 'special',
    power: 85, accuracy: 90, pp: 10, maxPp: 10,
    effect: null, description: 'Attacks with zero-knowledge proof energy.'
  },
  stealth_tx: {
    id: 'stealth_tx', name: 'Stealth TX', type: 'Privacy', category: 'physical',
    power: 70, accuracy: 100, pp: 15, maxPp: 15,
    effect: null, description: 'A stealthy transaction strike. Never misses.'
  },
  mixer_shield: {
    id: 'mixer_shield', name: 'Mixer Shield', type: 'Privacy', category: 'status',
    power: 0, accuracy: 100, pp: 10, maxPp: 10,
    effect: 'spDefUp', description: 'Mixes up defenses, raising special defense.'
  },
  ring_signature: {
    id: 'ring_signature', name: 'Ring Signature', type: 'Privacy', category: 'special',
    power: 95, accuracy: 85, pp: 8, maxPp: 8,
    effect: null, description: 'Signs a ring of destructive energy.'
  },
  obfuscate: {
    id: 'obfuscate', name: 'Obfuscate', type: 'Privacy', category: 'status',
    power: 0, accuracy: 100, pp: 15, maxPp: 15,
    effect: 'evasionUp', description: 'Obfuscates presence, boosting evasion.'
  },

  // Oracle moves
  price_feed: {
    id: 'price_feed', name: 'Price Feed', type: 'Oracle', category: 'special',
    power: 70, accuracy: 100, pp: 15, maxPp: 15,
    effect: null, description: 'Feeds volatile price data as an attack.'
  },
  data_stream: {
    id: 'data_stream', name: 'Data Stream', type: 'Oracle', category: 'special',
    power: 85, accuracy: 90, pp: 10, maxPp: 10,
    effect: null, description: 'Blasts the foe with a high-bandwidth data stream.'
  },
  oracle_vision: {
    id: 'oracle_vision', name: 'Oracle Vision', type: 'Oracle', category: 'status',
    power: 0, accuracy: 100, pp: 10, maxPp: 10,
    effect: 'accuracyUp', description: 'Peers into the oracle for enhanced accuracy.'
  },
  api_overload: {
    id: 'api_overload', name: 'API Overload', type: 'Oracle', category: 'special',
    power: 110, accuracy: 75, pp: 5, maxPp: 5,
    effect: null, description: 'Overloads the foe with API requests.'
  },
  verify: {
    id: 'verify', name: 'Verify', type: 'Oracle', category: 'physical',
    power: 60, accuracy: 100, pp: 25, maxPp: 25,
    effect: null, description: 'A quick verification strike. Reliable damage.'
  },

  // Gaming moves
  play_to_earn: {
    id: 'play_to_earn', name: 'Play to Earn', type: 'Gaming', category: 'physical',
    power: 75, accuracy: 95, pp: 15, maxPp: 15,
    effect: null, description: 'Earns power through gameplay and strikes.'
  },
  pixel_blast: {
    id: 'pixel_blast', name: 'Pixel Blast', type: 'Gaming', category: 'special',
    power: 80, accuracy: 90, pp: 10, maxPp: 10,
    effect: null, description: 'Fires a blast of concentrated pixel energy.'
  },
  respawn: {
    id: 'respawn', name: 'Respawn', type: 'Gaming', category: 'status',
    power: 0, accuracy: 100, pp: 5, maxPp: 5,
    effect: 'heal', description: 'Respawns health. Heals 50% of max HP.'
  },
  combo_breaker: {
    id: 'combo_breaker', name: 'Combo Breaker', type: 'Gaming', category: 'physical',
    power: 100, accuracy: 80, pp: 8, maxPp: 8,
    effect: null, description: 'Breaks through with a devastating combo.'
  },
  loot_drop: {
    id: 'loot_drop', name: 'Loot Drop', type: 'Gaming', category: 'special',
    power: 55, accuracy: 100, pp: 20, maxPp: 20,
    effect: null, description: 'Drops random loot on the foe.'
  },
};

export function getMove(id) {
  return MOVES[id] ? { ...MOVES[id], currentPp: MOVES[id].pp } : null;
}

export function getMovesByType(type) {
  return Object.values(MOVES).filter(m => m.type === type);
}

export function getAllMoves() {
  return { ...MOVES };
}

export { MOVES };
