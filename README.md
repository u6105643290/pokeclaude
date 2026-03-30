# PokeClaude 🎮⛓️

> A Web3 creature-collection RPG where crypto culture meets turn-based battling. Catch, train, evolve, and trade blockchain-native creatures on the Polygon network.

PokeClaude is a crypto-themed creature collection RPG inspired by classic monster-catching games but built from the ground up with Web3 mechanics. Every creature is a unique NFT. Battles are settled on-chain. Rewards are earned in ClaudeCoin. The world is a playful parody of the crypto ecosystem, populated by original characters themed around DeFi, AI, memes, privacy tech, oracles, and more.

---

## 🕹️ Core Gameplay Loop

1. **Explore the CryptoVerse** — Navigate a 2D pixel-art world divided into themed zones, each representing a sector of the crypto ecosystem. Talk to NPCs, discover lore, and find hidden items.

2. **Encounter & Capture Creatures** — Wild creatures appear in tall grass, caves, and special encounter zones. Weaken them in battle and throw CryptoSpheres to capture them. Rarer creatures require rarer spheres and careful strategy.

3. **Battle Trainers & Wild Creatures** — Engage in turn-based combat with a type-advantage system. Choose from four moves per turn. Manage your team of up to 6 creatures, switching strategically to exploit type matchups.

4. **Level Up & Evolve** — Gain XP from battles. When creatures hit certain level thresholds, they evolve into stronger forms with new abilities, boosted stats, and updated artwork.

5. **Trade on the Marketplace** — Every creature is an ERC-721 NFT. List creatures for sale, browse offerings from other players, and make trades using ClaudeCoin (ERC-20). A 2.5% marketplace fee funds the reward pool.

6. **Compete in PvP Battles** — Challenge other players to on-chain battles. Wager ClaudeCoin, climb the leaderboard, and earn seasonal rewards in ranked tournaments.

7. **Earn ClaudeCoin Rewards** — Defeating gym leaders, completing quests, winning PvP matches, and discovering rare items all earn ClaudeCoin. Spend it on CryptoSpheres, items, marketplace purchases, and cosmetics.

---

## 🌍 World & Zones

The CryptoVerse is divided into 9 distinct zones, each with unique terrain, creatures, NPCs, and challenges:

| Zone | Theme | Description |
|------|-------|-------------|
| **Satoshi Town** | Starter | Your journey begins here. Meet Professor Nakamoto, choose your starter, and learn the basics. |
| **DeFi Forest** | DeFi | A dense forest filled with yield-farming creatures. Liquidity pools serve as healing stations. |
| **Meme Meadow** | Memes | A chaotic open field where meme creatures roam. NPCs speak in crypto Twitter slang. |
| **AI Labs** | Artificial Intelligence | A high-tech research facility. AI-type creatures are engineered here. Home of the Neural Gym. |
| **Chain Mountains** | Layer 1 | Rugged mountain terrain. Layer1-type creatures guard the consensus peaks. |
| **NFT Gallery** | Digital Art | An art museum district. NFT-type creatures are inspired by famous collections. |
| **Privacy Caves** | Privacy | Dark underground tunnels. Privacy-type creatures hide in zero-knowledge fog. |
| **Oracle Temple** | Oracles | An ancient temple that bridges worlds. Oracle-type creatures channel off-chain data. |
| **Gaming Arena** | Gaming | The final zone. A massive colosseum for PvP battles and tournament finals. |

---

## ⚔️ Type System

PokeClaude uses 8 creature types. Each type is strong against two others and weak against two others, creating deep strategic team-building decisions.

| Type | Strong Against | Weak Against | Description |
|------|---------------|-------------|-------------|
| 🏦 **DeFi** | NFT, Gaming | AI, Privacy | Financial protocol creatures. Masters of yield and leverage. |
| 🤖 **AI** | DeFi, Meme | Oracle, Layer1 | Machine-learning creatures. Predict and adapt mid-battle. |
| 😂 **Meme** | Privacy, Oracle | DeFi, Gaming | Chaotic creatures powered by community hype. Unpredictable moves. |
| ⛓️ **Layer1** | AI, Gaming | NFT, Meme | Foundational blockchain creatures. High defense, slow but powerful. |
| 🖼️ **NFT** | Layer1, Privacy | DeFi, Oracle | Digital art creatures. Unique abilities tied to rarity traits. |
| 🔒 **Privacy** | DeFi, AI | Meme, Layer1 | Stealth creatures. Can dodge attacks and hide stats from opponents. |
| 🔮 **Oracle** | Meme, NFT | AI, Privacy | Data-bridge creatures. Can reveal hidden information and counter stealth. |
| 🎮 **Gaming** | Meme, Oracle | DeFi, Layer1 | Play-to-earn creatures. Gain bonus XP and extra reward drops. |

---

## 🐾 Example Creatures

| Name | Type | Rarity | Description | Evolution |
|------|------|--------|-------------|-----------|
| **Clawdius** | 🤖 AI | Starter | A small fox-like AI assistant creature. Eager to learn and adapt. | Clawdius -> Claudenoir -> Opusflare |
| **Yieldling** | 🏦 DeFi | Starter | A plant creature that grows by absorbing liquidity. Calm and steady. | Yieldling -> Harvestor -> APYtitan |
| **Dogekin** | 😂 Meme | Starter | A playful dog creature fueled by community energy. Very wow. | Dogekin -> Shibrawl -> Memechad |
| **Etherion** | ⛓️ Layer1 | Rare | A crystalline golem formed from pure consensus energy. | Etherion -> Validatron |
| **Pepeflux** | 😂 Meme | Uncommon | A frog creature that shapeshifts based on market sentiment. | Pepeflux -> Kekmorph |
| **Stakeowl** | 🏦 DeFi | Uncommon | A wise owl that guards staking pools. Patient and calculating. | Stakeowl -> Compoundor |
| **Zk-Shade** | 🔒 Privacy | Rare | A shadow creature that cannot be fully observed. Proof without knowledge. | Zk-Shade -> NullVoid |
| **Pixelape** | 🖼️ NFT | Uncommon | A pixelated primate inspired by profile-picture collections. | Pixelape -> Boredking |
| **Linkora** | 🔮 Oracle | Rare | A celestial creature that channels real-world data into battle power. | Linkora -> Oracleon |
| **Axiebot** | 🎮 Gaming | Uncommon | A small robot built for play-to-earn combat. Earns bonus ClaudeCoin. | Axiebot -> Guildmech |
| **Gaswyrm** | ⛓️ Layer1 | Legendary | A massive dragon whose power scales with network activity. | -- (no evolution) |
| **Satoshimu** | 🤖 AI | Legendary | A mythical creature said to have created the CryptoVerse itself. | -- (no evolution) |

---

## 🏗️ Tech Architecture

### Architecture Diagram

```
┌──────────────────┐          ┌──────────────────┐
│  Browser Client  │          │  Polygon Network  │
│                  │  ethers  │                   │
│  Phaser 3 Engine ├──────────┤  Smart Contracts  │
│  (Game World,    │   .js    │                   │
│   Battles, UI)   │          │  - ClaudeToken    │
│                  │          │  - PokeClaudeNFT  │
│  Vite Dev Server │          │  - Marketplace    │
│                  │          │  - BattleSystem   │
└───────┬──────────┘          └──────────────────┘
        │
        │ Local Storage
        │ + IPFS (metadata)
        ▼
┌──────────────────┐
│  Off-chain State │
│  (saves, world,  │
│   dialogue, map) │
└──────────────────┘
```

### Frontend

| Technology | Purpose |
|-----------|---------|
| **Phaser 3** | 2D game engine -- rendering, physics, input, animations, tilemaps |
| **Vite** | Fast HMR dev server and production bundler |
| **ethers.js** | Wallet connection, contract interaction, transaction signing |

### Smart Contracts

| Technology | Purpose |
|-----------|---------|
| **Solidity 0.8.20** | Contract language with overflow protection |
| **OpenZeppelin** | Battle-tested ERC-721, ERC-20, Ownable, ReentrancyGuard base contracts |
| **Polygon** | Low gas fees (fractions of a cent per tx), fast finality (~2s blocks) |
| **Hardhat** | Compilation, testing, deployment, and verification toolchain |

### On-chain vs Off-chain

| Aspect | On-chain (Polygon) | Off-chain (Client/IPFS) |
|--------|-------------------|------------------------|
| Creature ownership | Yes | -- |
| Token balances | Yes | -- |
| Marketplace listings & sales | Yes | -- |
| PvP battle results & wagers | Yes | -- |
| Creature metadata & images | -- | IPFS |
| Game world & exploration | -- | Local client |
| NPC dialogue & quests | -- | Local client |
| Save files | -- | Local storage |

---

## 📜 Smart Contract Design

### ClaudeToken (ERC-20)

The in-game currency. Earned through gameplay, spent on items and marketplace purchases.

- `mint(address to, uint256 amount)` — Owner-only minting for reward distribution
- `burn(uint256 amount)` — Players can burn tokens (used by marketplace fees)
- Standard ERC-20 transfer, approve, allowance functions

### PokeClaudeNFT (ERC-721)

Each creature is a unique NFT with on-chain stats.

- `mintCreature(uint8 creatureType)` — Mint a new creature (requires payment)
- `getCreature(uint256 tokenId)` — View creature stats (level, HP, ATK, DEF, SPD, type, evolved)
- `levelUp(uint256 tokenId)` — Increase level and boost stats
- Constants: `MAX_SUPPLY`, `MINT_PRICE`, `EVOLUTION_LEVEL`

### Marketplace

Peer-to-peer creature trading with ClaudeCoin.

- `listCreature(uint256 tokenId, uint256 price)` — List a creature for sale
- `buyCreature(uint256 listingId)` — Purchase a listed creature
- `cancelListing(uint256 listingId)` — Remove a listing
- 2.5% fee on sales, sent to the reward pool

### BattleSystem

On-chain PvP battle resolution.

- `startBattle(uint256 creatureId, uint256 wager)` — Queue for a PvP match
- `resolveBattle(uint256 battleId)` — Determine winner based on stats + type advantage
- `claimReward(uint256 battleId)` — Winner withdraws wager + bonus ClaudeCoin

---

## 🗺️ Roadmap

### Phase 1: MVP (Months 1-3)

- Core Phaser 3 game engine (tilemap, player movement, encounters)
- 20 launch creatures with unique sprites and stats
- Turn-based battle system with type advantages
- MetaMask wallet connection
- NFT minting contract on Polygon testnet
- Basic UI: inventory, team, creature details

### Phase 2: Marketplace (Months 4-5)

- Creature trading marketplace (list, buy, cancel)
- Breeding system -- combine two creatures for offspring with blended stats
- Expand roster to 50+ creatures
- IPFS metadata and image hosting
- Achievement system

### Phase 3: PvP & Social (Months 6-8)

- Real-time PvP matchmaking with on-chain resolution
- Global leaderboards (seasonal and all-time)
- Guild/team system with shared rewards
- Tournament mode with entry fees and prize pools
- Chat and social features

### Phase 4: Full Launch (Months 9-12)

- Mobile-optimized responsive layout
- 100+ creatures with full evolution trees
- ClaudeCoin staking for passive yield
- Cross-chain bridging (Ethereum, Arbitrum, Base)
- Governance token for community voting on new creatures and features
- Mainnet launch with audit

---

## 💰 Monetization

| Revenue Stream | Details |
|---------------|---------|
| **NFT Starter Packs** | Bundles of 3 creatures + CryptoSpheres at discounted rates |
| **Rare Creature Drops** | Limited-edition legendary creatures sold via Dutch auction |
| **Marketplace Fees** | 2.5% fee on all peer-to-peer creature sales |
| **Cosmetic Items** | Skins, trails, emotes, and trainer customization (no gameplay advantage) |
| **Season Passes** | Quarterly passes unlocking exclusive quests, creatures, and rewards |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- Git

### Install & Run

```bash
git clone https://github.com/your-username/pokeclaude.git
cd pokeclaude
cp .env.example .env
# Edit .env with your keys
npm install
npm run dev
```

The game opens at `http://localhost:3000`.

### Deploy Contracts

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local node
npx hardhat node
npm run deploy:local

# Deploy to Polygon
npm run deploy:polygon
```

### Project Structure

```
pokeclaude/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deployment scripts
├── test/               # Contract tests
├── src/
│   ├── scenes/         # Phaser game scenes
│   ├── entities/       # Creature and player classes
│   ├── web3/           # Wallet and contract integration
│   ├── utils/          # Helpers and constants
│   └── assets/         # Sprites, tilemaps, audio
├── public/             # Static assets
├── hardhat.config.js
├── vite.config.js
└── package.json
```

---

## 📄 License

MIT
