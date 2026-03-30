// Smart contract interactions for PokeClaude
// Uses placeholder addresses - replace with actual deployed contracts

import walletManager from './wallet.js';

// Placeholder contract addresses (Polygon)
const CONTRACT_ADDRESSES = {
  PokeClaudeNFT: '0x0000000000000000000000000000000000000001',
  ClaudeToken: '0x0000000000000000000000000000000000000002',
  Marketplace: '0x0000000000000000000000000000000000000003',
  BattleSystem: '0x0000000000000000000000000000000000000004',
};

// Simplified ABIs
const ABIS = {
  PokeClaudeNFT: [
    'function mint(string creatureId, uint256 level) payable returns (uint256)',
    'function getStats(uint256 tokenId) view returns (string creatureId, uint256 level, uint256 xp, uint256 hp, uint256 attack, uint256 defense)',
    'function levelUp(uint256 tokenId)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'event CreatureMinted(address indexed owner, uint256 indexed tokenId, string creatureId)',
    'event CreatureLevelUp(uint256 indexed tokenId, uint256 newLevel)',
  ],
  ClaudeToken: [
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ],
  Marketplace: [
    'function listCreature(uint256 tokenId, uint256 price)',
    'function buyCreature(uint256 listingId) payable',
    'function cancelListing(uint256 listingId)',
    'function getListing(uint256 listingId) view returns (address seller, uint256 tokenId, uint256 price, bool active)',
    'function getActiveListings() view returns (uint256[])',
    'event CreatureListed(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 price)',
    'event CreatureSold(uint256 indexed listingId, address indexed buyer, uint256 tokenId, uint256 price)',
  ],
  BattleSystem: [
    'function challengePlayer(address opponent, uint256 wager)',
    'function acceptChallenge(uint256 challengeId) payable',
    'function resolveChallenge(uint256 challengeId, address winner)',
    'function getChallenge(uint256 challengeId) view returns (address challenger, address opponent, uint256 wager, bool resolved)',
    'event ChallengeCreated(uint256 indexed challengeId, address indexed challenger, address indexed opponent, uint256 wager)',
    'event ChallengeResolved(uint256 indexed challengeId, address indexed winner)',
  ],
};

function getContract(name) {
  if (!walletManager.connected || !walletManager.signer) {
    console.warn('Wallet not connected. Contract calls will fail.');
    return null;
  }
  if (typeof window.ethers === 'undefined') {
    console.warn('ethers.js not loaded.');
    return null;
  }
  const address = CONTRACT_ADDRESSES[name];
  const abi = ABIS[name];
  if (!address || !abi) return null;
  return new window.ethers.Contract(address, abi, walletManager.signer);
}

// PokeClaudeNFT functions
export async function mintCreature(creatureId, level) {
  const contract = getContract('PokeClaudeNFT');
  if (!contract) return null;
  try {
    const tx = await contract.mint(creatureId, level, {
      value: window.ethers.parseEther('0.01'),
    });
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Mint failed:', error);
    throw error;
  }
}

export async function getCreatureStats(tokenId) {
  const contract = getContract('PokeClaudeNFT');
  if (!contract) return null;
  try {
    const stats = await contract.getStats(tokenId);
    return {
      creatureId: stats.creatureId,
      level: Number(stats.level),
      xp: Number(stats.xp),
      hp: Number(stats.hp),
      attack: Number(stats.attack),
      defense: Number(stats.defense),
    };
  } catch (error) {
    console.error('Get stats failed:', error);
    return null;
  }
}

export async function levelUpCreature(tokenId) {
  const contract = getContract('PokeClaudeNFT');
  if (!contract) return null;
  try {
    const tx = await contract.levelUp(tokenId);
    return await tx.wait();
  } catch (error) {
    console.error('Level up failed:', error);
    throw error;
  }
}

// ClaudeToken functions
export async function getTokenBalance(address) {
  const contract = getContract('ClaudeToken');
  if (!contract) return '0';
  try {
    const balance = await contract.balanceOf(address || walletManager.address);
    const decimals = await contract.decimals();
    return window.ethers.formatUnits(balance, decimals);
  } catch {
    return '0';
  }
}

export async function transferTokens(to, amount) {
  const contract = getContract('ClaudeToken');
  if (!contract) return null;
  try {
    const decimals = await contract.decimals();
    const parsedAmount = window.ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(to, parsedAmount);
    return await tx.wait();
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}

// Marketplace functions
export async function listCreatureForSale(tokenId, priceInEth) {
  const contract = getContract('Marketplace');
  if (!contract) return null;
  try {
    const price = window.ethers.parseEther(priceInEth.toString());
    const tx = await contract.listCreature(tokenId, price);
    return await tx.wait();
  } catch (error) {
    console.error('Listing failed:', error);
    throw error;
  }
}

export async function buyCreatureFromMarket(listingId, priceInEth) {
  const contract = getContract('Marketplace');
  if (!contract) return null;
  try {
    const tx = await contract.buyCreature(listingId, {
      value: window.ethers.parseEther(priceInEth.toString()),
    });
    return await tx.wait();
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}

export async function cancelMarketListing(listingId) {
  const contract = getContract('Marketplace');
  if (!contract) return null;
  try {
    const tx = await contract.cancelListing(listingId);
    return await tx.wait();
  } catch (error) {
    console.error('Cancel listing failed:', error);
    throw error;
  }
}

// BattleSystem functions
export async function challengePlayer(opponentAddress, wagerInEth) {
  const contract = getContract('BattleSystem');
  if (!contract) return null;
  try {
    const wager = window.ethers.parseEther(wagerInEth.toString());
    const tx = await contract.challengePlayer(opponentAddress, wager);
    return await tx.wait();
  } catch (error) {
    console.error('Challenge failed:', error);
    throw error;
  }
}

export async function acceptBattleChallenge(challengeId) {
  const contract = getContract('BattleSystem');
  if (!contract) return null;
  try {
    const challenge = await contract.getChallenge(challengeId);
    const tx = await contract.acceptChallenge(challengeId, {
      value: challenge.wager,
    });
    return await tx.wait();
  } catch (error) {
    console.error('Accept challenge failed:', error);
    throw error;
  }
}

export async function resolveBattleChallenge(challengeId, winnerAddress) {
  const contract = getContract('BattleSystem');
  if (!contract) return null;
  try {
    const tx = await contract.resolveChallenge(challengeId, winnerAddress);
    return await tx.wait();
  } catch (error) {
    console.error('Resolve challenge failed:', error);
    throw error;
  }
}

export { CONTRACT_ADDRESSES, ABIS };
