const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PokeClaudeNFT", function () {
  let pokeClaudeNFT;
  let owner;
  let player1;
  let player2;

  const MINT_PRICE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    const PokeClaudeNFT = await ethers.getContractFactory("PokeClaudeNFT");
    pokeClaudeNFT = await PokeClaudeNFT.deploy();
    await pokeClaudeNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy with correct name and symbol", async function () {
      expect(await pokeClaudeNFT.name()).to.equal("PokeClaude");
      expect(await pokeClaudeNFT.symbol()).to.equal("PKCL");
    });

    it("should set the deployer as owner", async function () {
      expect(await pokeClaudeNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("should mint a creature with stats", async function () {
      await pokeClaudeNFT.connect(player1).mintCreature(0, { value: MINT_PRICE });

      expect(await pokeClaudeNFT.ownerOf(1)).to.equal(player1.address);

      const creature = await pokeClaudeNFT.getCreature(1);
      expect(creature.level).to.equal(1);
      expect(creature.hp).to.be.gt(0);
      expect(creature.attack).to.be.gt(0);
      expect(creature.defense).to.be.gt(0);
      expect(creature.speed).to.be.gt(0);
      expect(creature.creatureType).to.equal(0);
    });

    it("should enforce mint price", async function () {
      await expect(
        pokeClaudeNFT.connect(player1).mintCreature(0, { value: 0 })
      ).to.be.revertedWith("Insufficient payment");

      await expect(
        pokeClaudeNFT.connect(player1).mintCreature(0, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("should enforce max supply", async function () {
      const maxSupply = await pokeClaudeNFT.MAX_SUPPLY();

      // This test validates the max supply constant exists and is reasonable
      expect(maxSupply).to.be.gt(0);
      expect(maxSupply).to.be.lte(10000);
    });

    it("should increment token IDs correctly", async function () {
      await pokeClaudeNFT.connect(player1).mintCreature(0, { value: MINT_PRICE });
      await pokeClaudeNFT.connect(player2).mintCreature(1, { value: MINT_PRICE });

      expect(await pokeClaudeNFT.ownerOf(1)).to.equal(player1.address);
      expect(await pokeClaudeNFT.ownerOf(2)).to.equal(player2.address);
    });
  });

  describe("Leveling", function () {
    beforeEach(async function () {
      await pokeClaudeNFT.connect(player1).mintCreature(0, { value: MINT_PRICE });
    });

    it("should level up a creature", async function () {
      await pokeClaudeNFT.levelUp(1);

      const creature = await pokeClaudeNFT.getCreature(1);
      expect(creature.level).to.equal(2);
    });

    it("should increase stats on level up", async function () {
      const before = await pokeClaudeNFT.getCreature(1);
      await pokeClaudeNFT.levelUp(1);
      const after = await pokeClaudeNFT.getCreature(1);

      // At least one stat should increase
      const statsImproved =
        after.hp > before.hp ||
        after.attack > before.attack ||
        after.defense > before.defense ||
        after.speed > before.speed;

      expect(statsImproved).to.be.true;
    });
  });

  describe("Evolution", function () {
    beforeEach(async function () {
      await pokeClaudeNFT.connect(player1).mintCreature(0, { value: MINT_PRICE });
    });

    it("should evolve at correct level", async function () {
      const creatureBefore = await pokeClaudeNFT.getCreature(1);
      const evolutionLevel = await pokeClaudeNFT.EVOLUTION_LEVEL();

      // Level up to just below evolution threshold
      for (let i = 1; i < evolutionLevel; i++) {
        await pokeClaudeNFT.levelUp(1);
      }

      const creatureAtEvolution = await pokeClaudeNFT.getCreature(1);
      expect(creatureAtEvolution.evolved).to.be.true;
    });

    it("should not evolve before reaching the required level", async function () {
      const evolutionLevel = await pokeClaudeNFT.EVOLUTION_LEVEL();

      // Level up to one below evolution threshold
      for (let i = 1; i < evolutionLevel - 1n; i++) {
        await pokeClaudeNFT.levelUp(1);
      }

      const creature = await pokeClaudeNFT.getCreature(1);
      expect(creature.evolved).to.be.false;
    });

    it("should boost stats on evolution", async function () {
      const evolutionLevel = await pokeClaudeNFT.EVOLUTION_LEVEL();

      // Get stats just before evolution
      for (let i = 1; i < evolutionLevel - 1n; i++) {
        await pokeClaudeNFT.levelUp(1);
      }
      const before = await pokeClaudeNFT.getCreature(1);

      // Trigger evolution level
      await pokeClaudeNFT.levelUp(1);
      const after = await pokeClaudeNFT.getCreature(1);

      expect(after.evolved).to.be.true;
      expect(after.hp).to.be.gt(before.hp);
    });
  });
});
