// WorldScene - Top-down overworld with quest system, NPCs, trainer battles, encounters

import { STARTERS, createCreatureInstance, getWildCreaturesForArea } from '../characters/creatures.js';
import { TRAINERS } from '../data/quests.js';
import { NPC_DATA, QUEST_NPCS } from '../data/npcs.js';
import QuestManager from '../systems/QuestManager.js';
import DialogBox from '../ui/DialogBox.js';
import HUD from '../ui/HUD.js';

// Map tile constants
const T = {
  GRASS: 0, TALLGRASS: 1, PATH: 2, WATER: 3, WALL: 4,
  TREE: 5, BUILDING: 6, SAND: 7, MOUNTAIN: 8, LAB_FLOOR: 9, SIGN: 10,
};

const TILE_TEXTURES = [
  'tile_grass', 'tile_tallgrass', 'tile_path', 'tile_water', 'tile_wall',
  'tile_tree', 'tile_building', 'tile_sand', 'tile_mountain', 'tile_lab_floor', 'tile_sign',
];

const COLLISION_TILES = [T.WATER, T.WALL, T.TREE, T.BUILDING, T.MOUNTAIN];
const ENCOUNTER_TILES = [T.TALLGRASS];
const TILE_SIZE = 32;

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data) {
    this.initData = data || {};
  }

  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Player data
    this.playerData = this.initData.saveData || this._createNewGame();

    // Quest manager
    this.questManager = new QuestManager(this.playerData.questData || null);
    if (this.playerData.hasStarter) {
      this.questManager.checkForNewQuests();
    }

    // Generate map
    this.mapData = this._generateWorldMap();
    this.mapWidth = this.mapData[0].length;
    this.mapHeight = this.mapData.length;
    this._renderMap();

    // Create player
    const startX = this.playerData.x || 25;
    const startY = this.playerData.y || 45;
    this.player = this.physics.add.sprite(
      startX * TILE_SIZE + TILE_SIZE / 2,
      startY * TILE_SIZE + TILE_SIZE / 2,
      'player'
    ).setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 20);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.mapWidth * TILE_SIZE, this.mapHeight * TILE_SIZE);
    this.physics.world.setBounds(0, 0, this.mapWidth * TILE_SIZE, this.mapHeight * TILE_SIZE);

    // NPCs
    this.npcs = this.physics.add.staticGroup();
    this.npcObjects = [];
    this.questNpcObjects = [];
    this._createNPCs();
    this._refreshQuestNPCs();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.menuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.questKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Dialog box
    this.dialogBox = new DialogBox(this);

    // HUD
    this.hud = new HUD(this);

    // State
    this.inDialog = false;
    this.encounterCooldown = 0;
    this.stepCount = 0;
    this.currentArea = this._getAreaForPosition(startX, startY);
    this.questLogVisible = false;

    // If new game, show intro
    if (this.initData.newGame && !this.playerData.hasStarter) {
      this.questManager.startGame();
      this.time.delayedCall(500, () => this._showStarterSelection());
    }

    // Interact key
    this.interactKey.on('down', () => {
      if (this.inDialog) {
        this.dialogBox.handleInput('CONFIRM');
        return;
      }
      if (this.questLogVisible) return;
      this._checkInteraction();
    });

    this.input.keyboard.on('keydown-UP', () => {
      if (this.inDialog) this.dialogBox.handleInput('UP');
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.inDialog) this.dialogBox.handleInput('DOWN');
    });

    // Menu key - inventory
    this.menuKey.on('down', () => {
      if (!this.inDialog && !this.questLogVisible) {
        this.scene.launch('InventoryScene', { playerData: this.playerData });
        this.scene.pause();
      }
    });

    // Quest log key
    this.questKey.on('down', () => {
      if (this.inDialog) return;
      if (this.questLogVisible) {
        this._hideQuestLog();
      } else {
        this._showQuestLog();
      }
    });

    // Return from battle
    this.events.on('wake', (sys, data) => {
      this.cameras.main.fadeIn(300, 0, 0, 0);
      if (data) {
        if (data.playerData) {
          this.playerData = data.playerData;
        }
        if (data.captured) {
          this.playerData.party.push(data.captured);
          this.questManager.onCreatureCaught(data.captured);
          this.questManager.checkTypeDiversity(this.playerData.party, this.playerData.box);
        }
        if (data.evolved) {
          this.questManager.onCreatureEvolved();
        }
        if (data.trainerDefeated) {
          this.questManager.onTrainerDefeated(data.trainerDefeated);
          this.questManager.tryAutoComplete();
          this.questManager.checkForNewQuests();
          this._refreshQuestNPCs();

          // Show post-win trainer dialog
          this.time.delayedCall(400, () => {
            this._showTrainerPostBattleDialog(data.trainerDefeated, true);
          });
        }
        if (data.trainerLost) {
          this.time.delayedCall(400, () => {
            this._showTrainerPostBattleDialog(data.trainerLost, false);
          });
        }
      }
      // Save quest data
      this.playerData.questData = this.questManager.serialize();
      this._saveGame();

      // Show any quest notifications
      this.time.delayedCall(600, () => this._showQuestNotifications());
    });

    this.events.on('resume', () => {});
  }

  update(time, delta) {
    if (this.inDialog || this.questLogVisible) {
      this.player.setVelocity(0, 0);
      return;
    }

    // Movement
    const speed = 160;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx, vy);
    this._checkTileCollision();

    // Steps & encounters
    if (vx !== 0 || vy !== 0) {
      this.stepCount++;
      if (this.encounterCooldown > 0) this.encounterCooldown--;

      const tileX = Math.floor(this.player.x / TILE_SIZE);
      const tileY = Math.floor(this.player.y / TILE_SIZE);
      const newArea = this._getAreaForPosition(tileX, tileY);
      if (newArea !== this.currentArea) {
        this.currentArea = newArea;
        this.hud.setArea(newArea);
        this._showAreaTransition(newArea);
        this.questManager.onEnterArea(newArea);
        this.questManager.tryAutoComplete();
      }

      if (this.stepCount % 8 === 0 && this.encounterCooldown <= 0) {
        this._checkRandomEncounter();
      }
    }

    // HUD
    this.hud.update({
      currentArea: this.currentArea,
      coins: this.playerData.coins,
      party: this.playerData.party,
      worldX: this.player.x,
      worldY: this.player.y,
      worldWidth: this.mapWidth * TILE_SIZE,
      worldHeight: this.mapHeight * TILE_SIZE,
      questSummary: this.questManager.getActiveQuestSummary(),
    });
  }

  // === NEW GAME ===

  _createNewGame() {
    return {
      name: 'Trainer',
      party: [],
      box: [],
      inventory: {
        cryptospheres: 10,
        premiumSpheres: 3,
        potions: 5,
        superPotions: 0,
        ultraSpheres: 0,
        masterSpheres: 0,
        revives: 2,
      },
      coins: 100,
      badges: 0,
      hasStarter: false,
      x: 25,
      y: 45,
      questData: null,
    };
  }

  // === STARTER SELECTION ===

  async _showStarterSelection() {
    this.inDialog = true;

    await this.dialogBox.show(
      "Welcome to the world of PokeClaude! I'm Professor Hashimoto.",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      'The CryptoVerse is a digital world filled with creatures called CryptoMons.',
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      "But lately, a dark organization called the Rug Pull Syndicate has been causing trouble...",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      "They're trying to manipulate CryptoMons for their own evil purposes!",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      "I need a brave trainer to help protect this world. Will you be that trainer?",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      'First, choose your partner CryptoMon! Each one has unique strengths.',
      'Prof. Hashimoto'
    );

    const choice = await this.dialogBox.show(
      'Which starter will you choose?',
      'Prof. Hashimoto',
      ['Satoshimp (Layer1)', 'Vitapup (DeFi)', 'Elonix (Meme)']
    );

    const starterId = STARTERS[choice];
    const starter = createCreatureInstance(starterId, 100);
    this.playerData.party.push(starter);
    this.playerData.hasStarter = true;

    await this.dialogBox.show(
      `Excellent choice! ${starter.name} is a wonderful partner!`,
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      "Take these CryptoSpheres to catch wild creatures, and some potions for healing.",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      "One more thing... I've been hearing strange reports from DeFi Forest.",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      "Talk to the Kid in town - he said he saw something suspicious there.",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      "Press Q to check your quest log anytime. Good luck, trainer!",
      'Prof. Hashimoto'
    );

    this.questManager.completeStarter();
    this.questManager.checkForNewQuests();
    this.playerData.questData = this.questManager.serialize();
    this._saveGame();

    this.inDialog = false;
    this._showQuestNotifications();
  }

  // === MAP GENERATION ===

  _generateWorldMap() {
    const W = 80, H = 80;
    const map = Array.from({ length: H }, () => Array(W).fill(T.GRASS));

    const fill = (x1, y1, x2, y2, tile) => {
      for (let y = y1; y <= y2 && y < H; y++)
        for (let x = x1; x <= x2 && x < W; x++)
          if (y >= 0 && x >= 0) map[y][x] = tile;
    };

    const border = (x1, y1, x2, y2, tile) => {
      for (let x = x1; x <= x2; x++) {
        if (y1 >= 0 && x >= 0 && x < W && y1 < H) map[y1][x] = tile;
        if (y2 >= 0 && x >= 0 && x < W && y2 < H) map[y2][x] = tile;
      }
      for (let y = y1; y <= y2; y++) {
        if (y >= 0 && x1 >= 0 && x1 < W && y < H) map[y][x1] = tile;
        if (y >= 0 && x2 >= 0 && x2 < W && y < H) map[y][x2] = tile;
      }
    };

    // === SATOSHI TOWN (center-bottom: 15-40, 35-55) ===
    fill(15, 35, 40, 55, T.PATH);
    border(15, 35, 40, 55, T.TREE);
    fill(18, 38, 22, 41, T.BUILDING);
    fill(18, 42, 18, 42, T.LAB_FLOOR);
    fill(26, 38, 30, 41, T.BUILDING);
    fill(34, 38, 38, 41, T.BUILDING);
    fill(26, 48, 30, 51, T.BUILDING);
    fill(34, 48, 38, 51, T.BUILDING);
    fill(20, 42, 38, 43, T.PATH);
    fill(25, 38, 25, 55, T.PATH);
    fill(33, 38, 33, 55, T.PATH);
    map[43][19] = T.SIGN;
    map[43][27] = T.SIGN;
    map[43][35] = T.SIGN;
    map[47][25] = T.SIGN; // Quest board sign
    fill(27, 35, 29, 35, T.PATH);
    fill(15, 44, 15, 46, T.PATH);
    fill(40, 44, 40, 46, T.PATH);
    fill(27, 55, 29, 55, T.PATH);

    // === DEFI FOREST ===
    fill(0, 25, 14, 60, T.TREE);
    fill(2, 27, 12, 58, T.TALLGRASS);
    fill(7, 27, 7, 58, T.PATH);
    fill(2, 35, 12, 35, T.PATH);
    fill(2, 45, 14, 46, T.PATH);
    fill(2, 50, 12, 50, T.PATH);
    fill(3, 30, 6, 33, T.GRASS);
    fill(9, 42, 12, 45, T.GRASS);

    // === MEME MEADOW ===
    fill(41, 35, 65, 60, T.GRASS);
    fill(43, 37, 63, 58, T.TALLGRASS);
    fill(40, 44, 50, 46, T.PATH);
    fill(50, 37, 50, 58, T.PATH);
    fill(43, 47, 63, 47, T.PATH);
    fill(44, 39, 48, 41, T.SAND);
    fill(55, 50, 60, 54, T.SAND);
    fill(44, 53, 47, 56, T.SAND);
    fill(57, 39, 62, 43, T.WATER);

    // === AI LABS ===
    fill(20, 5, 50, 25, T.LAB_FLOOR);
    border(20, 5, 50, 25, T.WALL);
    fill(30, 5, 30, 15, T.WALL);
    fill(40, 10, 40, 25, T.WALL);
    map[15][30] = T.LAB_FLOOR;
    map[18][40] = T.LAB_FLOOR;
    fill(22, 7, 24, 9, T.BUILDING);
    fill(32, 7, 34, 9, T.BUILDING);
    fill(42, 12, 44, 14, T.BUILDING);
    fill(46, 18, 48, 20, T.BUILDING);
    fill(27, 25, 29, 35, T.PATH);
    fill(33, 25, 33, 25, T.LAB_FLOOR);

    // === CHAIN MOUNTAINS ===
    fill(50, 0, 79, 34, T.MOUNTAIN);
    fill(50, 20, 65, 20, T.PATH);
    fill(55, 10, 55, 34, T.PATH);
    fill(65, 5, 65, 30, T.PATH);
    fill(55, 10, 75, 10, T.PATH);
    fill(58, 7, 62, 9, T.BUILDING);
    fill(70, 12, 74, 15, T.BUILDING);
    fill(55, 34, 55, 37, T.PATH);
    fill(68, 2, 77, 8, T.SAND);
    // Path to summit for final boss
    fill(70, 5, 72, 10, T.PATH);

    // === WATER BORDERS ===
    fill(0, 0, 79, 2, T.WATER);
    fill(0, 75, 79, 79, T.WATER);
    fill(0, 0, 1, 24, T.WATER);
    fill(66, 35, 79, 60, T.WATER);
    fill(0, 60, 40, 62, T.WATER);
    fill(27, 56, 29, 62, T.WATER);
    fill(27, 58, 29, 60, T.PATH);

    return map;
  }

  _renderMap() {
    this.tileSprites = this.add.group();
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileId = this.mapData[y][x];
        const texture = TILE_TEXTURES[tileId];
        const sprite = this.add.image(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          texture
        );
        this.tileSprites.add(sprite);
      }
    }
  }

  _checkTileCollision() {
    const px = Math.floor(this.player.x / TILE_SIZE);
    const py = Math.floor(this.player.y / TILE_SIZE);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = px + dx, ty = py + dy;
        if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) continue;
        if (!COLLISION_TILES.includes(this.mapData[ty][tx])) continue;

        const tileLeft = tx * TILE_SIZE;
        const tileRight = tileLeft + TILE_SIZE;
        const tileTop = ty * TILE_SIZE;
        const tileBottom = tileTop + TILE_SIZE;
        const pL = this.player.x - 10, pR = this.player.x + 10;
        const pT = this.player.y - 10, pB = this.player.y + 10;

        if (pR > tileLeft && pL < tileRight && pB > tileTop && pT < tileBottom) {
          const oL = pR - tileLeft, oR = tileRight - pL;
          const oT = pB - tileTop, oB = tileBottom - pT;
          const min = Math.min(oL, oR, oT, oB);
          if (min === oL) this.player.x -= oL;
          else if (min === oR) this.player.x += oR;
          else if (min === oT) this.player.y -= oT;
          else this.player.y += oB;
        }
      }
    }
  }

  // === NPCs ===

  _createNPCs() {
    // Create permanent/story NPCs from NPC_DATA
    for (const [npcId, data] of Object.entries(NPC_DATA)) {
      const sprite = this.physics.add.staticSprite(
        data.x * TILE_SIZE + TILE_SIZE / 2,
        data.y * TILE_SIZE + TILE_SIZE / 2,
        data.sprite || 'npc'
      ).setDepth(9);
      sprite.npcData = { ...data, isQuestNpc: false };
      this.npcs.add(sprite);
      this.npcObjects.push(sprite);

      // Add name label above NPC
      const label = this.add.text(
        data.x * TILE_SIZE + TILE_SIZE / 2,
        data.y * TILE_SIZE - 4,
        data.name,
        { fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#FFD700' }
      ).setOrigin(0.5, 1).setDepth(9);
      sprite.nameLabel = label;
    }
  }

  _refreshQuestNPCs() {
    // Remove old quest NPC sprites
    this.questNpcObjects.forEach(obj => {
      if (obj.nameLabel) obj.nameLabel.destroy();
      if (obj.exclamation) obj.exclamation.destroy();
      obj.destroy();
    });
    this.questNpcObjects = [];

    // Add quest NPCs that should be visible
    const visible = this.questManager.getVisibleQuestNpcs();
    for (const data of visible) {
      const sprite = this.physics.add.staticSprite(
        data.x * TILE_SIZE + TILE_SIZE / 2,
        data.y * TILE_SIZE + TILE_SIZE / 2,
        data.sprite || 'npc'
      ).setDepth(9);
      sprite.npcData = {
        id: data.id,
        name: data.name,
        x: data.x,
        y: data.y,
        sprite: data.sprite,
        isQuestNpc: true,
        trainerId: data.id,
        dialogToFight: data.dialogToFight,
      };
      this.npcs.add(sprite);
      this.questNpcObjects.push(sprite);

      // Name label
      const label = this.add.text(
        data.x * TILE_SIZE + TILE_SIZE / 2,
        data.y * TILE_SIZE - 4,
        data.name,
        { fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#FF4444' }
      ).setOrigin(0.5, 1).setDepth(9);
      sprite.nameLabel = label;

      // Exclamation mark (!) above hostile NPCs
      const excl = this.add.text(
        data.x * TILE_SIZE + TILE_SIZE / 2,
        data.y * TILE_SIZE - 16,
        '!',
        { fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#FF0000' }
      ).setOrigin(0.5, 1).setDepth(10);
      this.tweens.add({
        targets: excl,
        y: excl.y - 6,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      sprite.exclamation = excl;
    }
  }

  // === INTERACTION ===

  _checkInteraction() {
    const interactDist = 48;
    let closestNPC = null;
    let closestDist = Infinity;

    // Check all NPCs (permanent + quest)
    const allNpcs = [...this.npcObjects, ...this.questNpcObjects];
    for (const npc of allNpcs) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < interactDist && dist < closestDist) {
        closestDist = dist;
        closestNPC = npc;
      }
    }

    if (closestNPC) {
      if (closestNPC.npcData.isQuestNpc) {
        this._startTrainerEncounter(closestNPC.npcData);
      } else {
        this._startNPCDialog(closestNPC.npcData);
      }
      return;
    }

    // Check signs
    const px = Math.floor(this.player.x / TILE_SIZE);
    const py = Math.floor(this.player.y / TILE_SIZE);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = px + dx, ty = py + dy;
        if (tx >= 0 && ty >= 0 && tx < this.mapWidth && ty < this.mapHeight) {
          if (this.mapData[ty][tx] === T.SIGN) {
            const signText = this._getSignText(tx, ty);
            if (signText) {
              this._showSign(signText);
              return;
            }
          }
        }
      }
    }
  }

  _getSignText(x, y) {
    if (y === 43 && x === 19) return 'West: DeFi Forest - Beware of wild creatures!';
    if (y === 43 && x === 27) return 'Satoshi Town - Where every journey begins';
    if (y === 43 && x === 35) return 'East: Meme Meadow - Home of meme creatures';
    if (y === 47 && x === 25) return 'North: AI Labs | Mountains via Labs';
    return 'PokeClaude World';
  }

  async _showSign(text) {
    this.inDialog = true;
    await this.dialogBox.show(text);
    this.inDialog = false;
  }

  async _startNPCDialog(npcData) {
    this.inDialog = true;

    // Get quest-aware dialog
    const dialogState = this.questManager.getDialogStateForNpc(npcData.id);
    const dialogs = npcData.dialogByQuest || {};

    // Find best matching dialog
    let lines = dialogs._default || ['...'];

    // Check states from most to least specific
    for (const [key, value] of Object.entries(dialogState)) {
      if (value && dialogs[key]) {
        lines = dialogs[key];
        break;
      }
    }

    // Show all lines
    for (const line of lines) {
      await this.dialogBox.show(line, npcData.name);
    }

    // Healing at Nurse Joy
    if (npcData.heals) {
      this.playerData.party.forEach(c => { c.currentHp = c.stats.hp; });
    }

    // Quest hooks
    const questUpdated = this.questManager.onTalkToNpc(npcData.id);
    this.questManager.tryAutoComplete();
    this.questManager.checkForNewQuests();

    // Apply quest rewards if a quest just completed
    this._applyPendingRewards();

    // Save
    this.playerData.questData = this.questManager.serialize();
    this._saveGame();

    this.inDialog = false;

    // Show quest notifications
    this._showQuestNotifications();

    // Refresh quest NPCs in case new ones appeared
    this._refreshQuestNPCs();

    // Check if this NPC has a trainer battle side quest
    if (npcData.id === 'defi_trainer' && this.questManager.isQuestActive('defi_trainer_challenge')
        && !this.questManager.isObjectiveDone('defi_trainer_challenge', 'beat_defi')) {
      this.time.delayedCall(300, () => {
        this._startTrainerBattle('defi_trainer');
      });
    }
  }

  async _startTrainerEncounter(npcData) {
    this.inDialog = true;

    // Show pre-fight dialog
    if (npcData.dialogToFight) {
      for (const line of npcData.dialogToFight) {
        await this.dialogBox.show(line, npcData.name);
      }
    }

    this.inDialog = false;

    // Start the trainer battle
    this._startTrainerBattle(npcData.trainerId);
  }

  async _showTrainerPostBattleDialog(trainerId, won) {
    const trainer = TRAINERS[trainerId];
    if (!trainer) return;

    this.inDialog = true;
    const lines = won ? trainer.postWinDialog : trainer.postLoseDialog;
    for (const line of lines) {
      await this.dialogBox.show(line, trainer.name);
    }

    // Apply rewards if quest completed
    this._applyPendingRewards();
    this.playerData.questData = this.questManager.serialize();
    this._saveGame();

    this.inDialog = false;
    this._showQuestNotifications();
    this._refreshQuestNPCs();
  }

  _startTrainerBattle(trainerId) {
    const trainer = TRAINERS[trainerId];
    if (!trainer || this.playerData.party.length === 0) return;

    // Create enemy party
    const enemyParty = trainer.party.map(p => createCreatureInstance(p.id, p.level));
    const enemyCreature = enemyParty[0];

    this._battleTransition(enemyCreature, {
      isWild: false,
      trainerId: trainerId,
      trainerName: trainer.name,
      enemyParty: enemyParty,
    });
  }

  // === QUEST REWARDS ===

  _applyPendingRewards() {
    // Check recently completed quests for rewards
    const completed = this.questManager.completedQuests;
    const applied = this.playerData._appliedRewards || [];

    for (const questId of completed) {
      if (applied.includes(questId)) continue;

      const rewards = this.questManager.getRewards(questId);
      if (rewards) {
        if (rewards.coins) this.playerData.coins += rewards.coins;
        if (rewards.items) {
          for (const [item, count] of Object.entries(rewards.items)) {
            this.playerData.inventory[item] = (this.playerData.inventory[item] || 0) + count;
          }
        }
        applied.push(questId);
      }
    }

    this.playerData._appliedRewards = applied;
  }

  // === QUEST LOG UI ===

  _showQuestLog() {
    this.questLogVisible = true;
    this.player.setVelocity(0, 0);

    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = Math.min(600, w - 40);
    const panelH = Math.min(500, h - 40);
    const px = (w - panelW) / 2;
    const py = (h - panelH) / 2;

    this.questLogContainer = this.add.container(0, 0).setDepth(2000).setScrollFactor(0);

    // Dim background
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.7);
    dim.fillRect(0, 0, w, h);
    this.questLogContainer.add(dim);

    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 12);
    panel.lineStyle(2, 0xF7931A, 0.8);
    panel.strokeRoundedRect(px, py, panelW, panelH, 12);
    this.questLogContainer.add(panel);

    // Title
    const title = this.add.text(w / 2, py + 20, 'QUEST LOG', {
      fontSize: '16px', fontFamily: '"Press Start 2P", monospace', color: '#F7931A',
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this.questLogContainer.add(title);

    // Close hint
    const hint = this.add.text(w / 2, py + panelH - 20, 'Press Q to close', {
      fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color: '#666',
    }).setOrigin(0.5, 1).setScrollFactor(0);
    this.questLogContainer.add(hint);

    // Quest list
    const quests = this.questManager.getAllActiveQuests();
    let yOff = py + 50;

    if (quests.length === 0) {
      const noQuest = this.add.text(w / 2, yOff + 20, 'No active quests', {
        fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#888',
      }).setOrigin(0.5, 0).setScrollFactor(0);
      this.questLogContainer.add(noQuest);
    }

    for (const quest of quests) {
      if (yOff > py + panelH - 60) break;

      // Quest title
      const questTag = quest.isMain ? '[MAIN] ' : '[SIDE] ';
      const tagColor = quest.isMain ? '#FF4444' : '#44FF44';
      const qTitle = this.add.text(px + 20, yOff, questTag + quest.title, {
        fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: tagColor,
      }).setScrollFactor(0);
      this.questLogContainer.add(qTitle);
      yOff += 22;

      // Description
      const desc = this.add.text(px + 30, yOff, quest.description, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#AAA',
        wordWrap: { width: panelW - 60 },
      }).setScrollFactor(0);
      this.questLogContainer.add(desc);
      yOff += desc.height + 10;

      // Objectives
      for (const obj of quest.objectives) {
        if (yOff > py + panelH - 60) break;
        const checkmark = obj.completed ? '[x]' : '[ ]';
        const color = obj.completed ? '#44FF44' : '#FFFFFF';
        const objText = this.add.text(px + 40, yOff, `${checkmark} ${obj.text}`, {
          fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color,
        }).setScrollFactor(0);
        this.questLogContainer.add(objText);
        yOff += 18;
      }

      yOff += 12;
    }

    // Also show completed quests count
    const completedCount = this.questManager.completedQuests.length;
    if (completedCount > 0) {
      const compText = this.add.text(px + 20, py + panelH - 40, `Completed: ${completedCount} quests`, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#666',
      }).setScrollFactor(0);
      this.questLogContainer.add(compText);
    }
  }

  _hideQuestLog() {
    this.questLogVisible = false;
    if (this.questLogContainer) {
      this.questLogContainer.destroy();
      this.questLogContainer = null;
    }
  }

  // === QUEST NOTIFICATIONS ===

  _showQuestNotifications() {
    const notifications = this.questManager.popNotifications();
    if (notifications.length === 0) return;

    let delay = 0;
    for (const note of notifications) {
      this.time.delayedCall(delay, () => {
        this._showNotificationBanner(note);
      });
      delay += 2500;
    }
  }

  _showNotificationBanner(note) {
    const w = this.scale.width;
    const colors = {
      quest_start: { bg: 0x1a4a2e, border: 0x44FF44, text: '#44FF44' },
      quest_complete: { bg: 0x4a4a1a, border: 0xFFD700, text: '#FFD700' },
      objective_complete: { bg: 0x1a2a4a, border: 0x4488FF, text: '#4488FF' },
    };
    const style = colors[note.type] || colors.objective_complete;

    const container = this.add.container(w / 2, -50).setDepth(3000).setScrollFactor(0);

    const bannerW = Math.min(500, w - 40);
    const bg = this.add.graphics();
    bg.fillStyle(style.bg, 0.95);
    bg.fillRoundedRect(-bannerW / 2, -20, bannerW, 40, 8);
    bg.lineStyle(2, style.border, 0.8);
    bg.strokeRoundedRect(-bannerW / 2, -20, bannerW, 40, 8);
    container.add(bg);

    const text = this.add.text(0, 0, note.message, {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: style.text,
    }).setOrigin(0.5);
    container.add(text);

    // Animate in
    this.tweens.add({
      targets: container,
      y: 40,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Animate out
    this.tweens.add({
      targets: container,
      y: -60,
      alpha: 0,
      duration: 400,
      delay: 2000,
      ease: 'Power2',
      onComplete: () => container.destroy(),
    });
  }

  // === AREAS ===

  _getAreaForPosition(x, y) {
    if (x >= 15 && x <= 40 && y >= 35 && y <= 55) return 'Satoshi Town';
    if (x <= 14 && y >= 25 && y <= 60) return 'DeFi Forest';
    if (x >= 41 && x <= 65 && y >= 35 && y <= 60) return 'Meme Meadow';
    if (x >= 20 && x <= 50 && y >= 5 && y <= 25) return 'AI Labs';
    if (x >= 50 && y <= 34) return 'Chain Mountains';
    return 'Wilderness';
  }

  _showAreaTransition(areaName) {
    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      areaName,
      {
        fontSize: '24px',
        fontFamily: '"Press Start 2P", monospace',
        color: '#FFD700',
        backgroundColor: '#000000AA',
        padding: { x: 20, y: 10 },
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(999);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: this.scale.height / 2 - 40,
      duration: 2000,
      delay: 1000,
      onComplete: () => text.destroy(),
    });
  }

  // === ENCOUNTERS ===

  _checkRandomEncounter() {
    const px = Math.floor(this.player.x / TILE_SIZE);
    const py = Math.floor(this.player.y / TILE_SIZE);
    if (px < 0 || py < 0 || px >= this.mapWidth || py >= this.mapHeight) return;
    if (!ENCOUNTER_TILES.includes(this.mapData[py][px])) return;
    if (this.playerData.party.length === 0) return;
    if (Math.random() > 0.08) return;

    this.encounterCooldown = 30;

    const area = this._getAreaForPosition(px, py);
    const possibleCreatures = getWildCreaturesForArea(area);
    const creatureId = Phaser.Utils.Array.GetRandom(possibleCreatures);

    const levelRanges = {
      'Satoshi Town': [3, 7],
      'DeFi Forest': [5, 12],
      'Meme Meadow': [8, 15],
      'AI Labs': [12, 20],
      'Chain Mountains': [15, 25],
      'Wilderness': [5, 10],
    };
    const [minLvl, maxLvl] = levelRanges[area] || [3, 7];
    const level = Phaser.Math.Between(minLvl, maxLvl);

    const wildCreature = createCreatureInstance(creatureId, level);
    if (!wildCreature) return;

    this._battleTransition(wildCreature, { isWild: true });
  }

  _battleTransition(creature, battleConfig = {}) {
    this.cameras.main.flash(300, 255, 255, 255);

    const overlay = this.add.graphics().setDepth(2000).setScrollFactor(0);

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 600,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const progress = tween.getValue();
        overlay.clear();
        overlay.fillStyle(0x000000, 1);
        const barH = (this.scale.height / 2) * progress;
        overlay.fillRect(0, 0, this.scale.width, barH);
        overlay.fillRect(0, this.scale.height - barH, this.scale.width, barH);
      },
      onComplete: () => {
        overlay.destroy();
        this.playerData.x = Math.floor(this.player.x / TILE_SIZE);
        this.playerData.y = Math.floor(this.player.y / TILE_SIZE);
        this.playerData.questData = this.questManager.serialize();
        this._saveGame();

        this.scene.sleep();
        this.scene.run('BattleScene', {
          playerCreature: this.playerData.party[0],
          enemyCreature: creature,
          isWild: battleConfig.isWild !== false,
          playerData: this.playerData,
          trainerId: battleConfig.trainerId || null,
          trainerName: battleConfig.trainerName || null,
          enemyParty: battleConfig.enemyParty || null,
        });
      },
    });
  }

  // === SAVE ===

  _saveGame() {
    this.playerData.x = Math.floor(this.player.x / TILE_SIZE);
    this.playerData.y = Math.floor(this.player.y / TILE_SIZE);
    this.playerData.questData = this.questManager.serialize();
    localStorage.setItem('pokeclaude_save', JSON.stringify(this.playerData));
  }
}
