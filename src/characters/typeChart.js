// Type effectiveness chart for PokeClaude
// 2.0 = super effective, 0.5 = not very effective, 1.0 = normal, 0.0 = no effect

const TYPES = ['DeFi', 'AI', 'Meme', 'Layer1', 'NFT', 'Privacy', 'Oracle', 'Gaming'];

// effectiveness[attackType][defendType]
const TYPE_CHART = {
  DeFi:    { DeFi: 1.0, AI: 1.0, Meme: 0.5, Layer1: 2.0, NFT: 1.0, Privacy: 1.0, Oracle: 1.0, Gaming: 1.0 },
  AI:      { DeFi: 1.0, AI: 1.0, Meme: 1.0, Layer1: 1.0, NFT: 1.0, Privacy: 2.0, Oracle: 0.5, Gaming: 1.0 },
  Meme:    { DeFi: 2.0, AI: 0.5, Meme: 1.0, Layer1: 1.0, NFT: 1.0, Privacy: 1.0, Oracle: 1.0, Gaming: 1.0 },
  Layer1:  { DeFi: 0.5, AI: 1.0, Meme: 1.0, Layer1: 1.0, NFT: 1.0, Privacy: 1.0, Oracle: 2.0, Gaming: 1.0 },
  NFT:     { DeFi: 1.0, AI: 1.0, Meme: 1.0, Layer1: 1.0, NFT: 1.0, Privacy: 0.5, Oracle: 1.0, Gaming: 2.0 },
  Privacy: { DeFi: 1.0, AI: 0.5, Meme: 1.0, Layer1: 1.0, NFT: 2.0, Privacy: 1.0, Oracle: 1.0, Gaming: 1.0 },
  Oracle:  { DeFi: 1.0, AI: 2.0, Meme: 1.0, Layer1: 0.5, NFT: 1.0, Privacy: 1.0, Oracle: 1.0, Gaming: 1.0 },
  Gaming:  { DeFi: 1.0, AI: 1.0, Meme: 2.0, Layer1: 1.0, NFT: 0.5, Privacy: 1.0, Oracle: 1.0, Gaming: 1.0 },
};

export function getEffectiveness(attackType, defendType) {
  if (!TYPE_CHART[attackType] || !TYPE_CHART[attackType][defendType]) return 1.0;
  return TYPE_CHART[attackType][defendType];
}

export function getEffectivenessText(multiplier) {
  if (multiplier >= 2.0) return "It's super effective!";
  if (multiplier <= 0.5) return "It's not very effective...";
  if (multiplier === 0) return "It has no effect!";
  return null;
}

export { TYPES, TYPE_CHART };
