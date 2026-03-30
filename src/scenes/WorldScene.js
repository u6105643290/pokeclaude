// WorldScene - Top-down overworld with areas, NPCs, encounters

import { STARTERS, createCreatureInstance, getWildCreaturesForArea } from '../characters/creatures.js';
import DialogBox from '../ui/DialogBox.js';
import HUD from '../ui/HUD.js';

// Map tile constants
const T = {
  GRASS: 0,
  TALLGRASS: 1,
  PATH: 2,
  WATER: 3,
  WALL: 4,
  TREE: 5,
  BUILDING: 6,
  SAND: 7,
  MOUNTAIN: 8,
  LAB_FLOOR: 9,
  SIGN: 10,
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

    // Generate map
    this.mapData = this._generateWorldMap();
    this.mapWidth = this.mapData[0].length;
    this.mapHeight = this.mapData.length;

    // Create tilemap from data
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
    this._createNPCs();

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

    // Dialog box
    this.dialogBox = new DialogBox(this);

    // HUD
    this.hud = new HUD(this);

    // Movement state
    this.isMoving = false;
    this.inDialog = false;
    this.encounterCooldown = 0;
    this.stepCount = 0;

    // Area tracking
    this.currentArea = this._getAreaForPosition(startX, startY);

    // If new game, show intro
    if (this.initData.newGame && !this.playerData.hasStarter) {
      this.time.delayedCall(500, () => this._showStarterSelection());
    }

    // Interact key handler
    this.interactKey.on('down', () => {
      if (this.inDialog) {
        this.dialogBox.handleInput('CONFIRM');
        return;
      }
      this._checkNPCInteraction();
    });

    this.input.keyboard.on('keydown-UP', () => {
      if (this.inDialog) this.dialogBox.handleInput('UP');
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.inDialog) this.dialogBox.handleInput('DOWN');
    });

    // Menu key
    this.menuKey.on('down', () => {
      if (!this.inDialog) {
        this.scene.launch('InventoryScene', { playerData: this.playerData });
        this.scene.pause();
      }
    });

    // Listen for return from battle
    this.events.on('wake', (sys, data) => {
      this.cameras.main.fadeIn(300, 0, 0, 0);
      if (data) {
        if (data.playerData) {
          this.playerData = data.playerData;
        }
        if (data.captured) {
          this.playerData.party.push(data.captured);
        }
      }
    });

    this.events.on('resume', () => {
      // Return from inventory
    });
  }

  update(time, delta) {
    if (this.inDialog) {
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

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    // Check tile collision manually
    this._checkTileCollision();

    // Track steps for encounters
    if (vx !== 0 || vy !== 0) {
      this.stepCount++;
      if (this.encounterCooldown > 0) this.encounterCooldown--;

      // Check for area change
      const tileX = Math.floor(this.player.x / TILE_SIZE);
      const tileY = Math.floor(this.player.y / TILE_SIZE);
      const newArea = this._getAreaForPosition(tileX, tileY);
      if (newArea !== this.currentArea) {
        this.currentArea = newArea;
        this.hud.setArea(newArea);
        this._showAreaTransition(newArea);
      }

      // Random encounter check
      if (this.stepCount % 8 === 0 && this.encounterCooldown <= 0) {
        this._checkRandomEncounter();
      }
    }

    // Update HUD
    this.hud.update({
      currentArea: this.currentArea,
      coins: this.playerData.coins,
      party: this.playerData.party,
      worldX: this.player.x,
      worldY: this.player.y,
      worldWidth: this.mapWidth * TILE_SIZE,
      worldHeight: this.mapHeight * TILE_SIZE,
    });
  }

  _createNewGame() {
    return {
      name: 'Trainer',
      party: [],
      box: [],
      inventory: {
        cryptospheres: 10,
        premiumSpheres: 3,
        potions: 5,
        revives: 2,
      },
      coins: 100,
      badges: 0,
      hasStarter: false,
      x: 25,
      y: 45,
    };
  }

  async _showStarterSelection() {
    this.inDialog = true;

    await this.dialogBox.show(
      "Welcome to the world of PokeClaude! I'm Professor Hashimoto.",
      'Prof. Hashimoto'
    );

    await this.dialogBox.show(
      'This world is filled with digital creatures called CryptoMons. Choose your first partner!',
      'Prof. Hashimoto'
    );

    const choice = await this.dialogBox.show(
      'Which starter will you choose?',
      'Prof. Hashimoto',
      ['Satoshimp (Layer1)', 'Vitapup (DeFi)', 'Elonix (Meme)']
    );

    const starterId = STARTERS[choice];
    const starter = createCreatureInstance(starterId, 5);
    this.playerData.party.push(starter);
    this.playerData.hasStarter = true;

    await this.dialogBox.show(
      `Great choice! ${starter.name} will be a wonderful partner. Take these CryptoSpheres too!`,
      'Prof. Hashimoto'
    );

    this.inDialog = false;
  }

  _generateWorldMap() {
    // 80x80 world map with different areas
    const W = 80, H = 80;
    const map = Array.from({ length: H }, () => Array(W).fill(T.GRASS));

    // Helper functions
    const fill = (x1, y1, x2, y2, tile) => {
      for (let y = y1; y <= y2 && y < H; y++)
        for (let x = x1; x <= x2 && x < W; x++)
          if (y >= 0 && x >= 0) map[y][x] = tile;
    };

    const border = (x1, y1, x2, y2, tile) => {
      for (let x = x1; x <= x2; x++) { if (y1 >= 0 && x >= 0 && x < W && y1 < H) map[y1][x] = tile; if (y2 >= 0 && x >= 0 && x < W && y2 < H) map[y2][x] = tile; }
      for (let y = y1; y <= y2; y++) { if (y >= 0 && x1 >= 0 && x1 < W && y < H) map[y][x1] = tile; if (y >= 0 && x2 >= 0 && x2 < W && y < H) map[y][x2] = tile; }
    };

    // === SATOSHI TOWN (center-bottom: 15-40, 35-55) ===
    fill(15, 35, 40, 55, T.PATH);
    border(15, 35, 40, 55, T.TREE);
    // Buildings in town
    fill(18, 38, 22, 41, T.BUILDING); // Prof lab
    fill(18, 42, 18, 42, T.LAB_FLOOR); // lab door
    fill(26, 38, 30, 41, T.BUILDING); // PokeMart
    fill(34, 38, 38, 41, T.BUILDING); // PokeCenter
    fill(26, 48, 30, 51, T.BUILDING); // House 1
    fill(34, 48, 38, 51, T.BUILDING); // House 2
    // Town paths
    fill(20, 42, 38, 43, T.PATH);
    fill(25, 38, 25, 55, T.PATH);
    fill(33, 38, 33, 55, T.PATH);
    // Signs
    map[43][19] = T.SIGN;
    map[43][27] = T.SIGN;
    map[43][35] = T.SIGN;
    // Town exits
    fill(27, 35, 29, 35, T.PATH); // North exit
    fill(15, 44, 15, 46, T.PATH); // West exit
    fill(40, 44, 40, 46, T.PATH); // East exit
    fill(27, 55, 29, 55, T.PATH); // South exit

    // === DEFI FOREST (left: 0-14, 25-55) ===
    fill(0, 25, 14, 60, T.TREE);
    fill(2, 27, 12, 58, T.TALLGRASS);
    // Forest paths
    fill(7, 27, 7, 58, T.PATH);
    fill(2, 35, 12, 35, T.PATH);
    fill(2, 45, 14, 46, T.PATH); // Connect to town
    fill(2, 50, 12, 50, T.PATH);
    // Clearings
    fill(3, 30, 6, 33, T.GRASS);
    fill(9, 42, 12, 45, T.GRASS);

    // === MEME MEADOW (right: 41-65, 35-60) ===
    fill(41, 35, 65, 60, T.GRASS);
    fill(43, 37, 63, 58, T.TALLGRASS);
    // Meadow paths
    fill(40, 44, 50, 46, T.PATH); // Connect from town
    fill(50, 37, 50, 58, T.PATH);
    fill(43, 47, 63, 47, T.PATH);
    // Flowers (sand patches)
    fill(44, 39, 48, 41, T.SAND);
    fill(55, 50, 60, 54, T.SAND);
    fill(44, 53, 47, 56, T.SAND);
    // Pond
    fill(57, 39, 62, 43, T.WATER);

    // === AI LABS (top: 20-50, 5-25) ===
    fill(20, 5, 50, 25, T.LAB_FLOOR);
    border(20, 5, 50, 25, T.WALL);
    // Internal walls
    fill(30, 5, 30, 15, T.WALL);
    fill(40, 10, 40, 25, T.WALL);
    map[15][30] = T.LAB_FLOOR; // Door in wall
    map[18][40] = T.LAB_FLOOR; // Door in wall
    // Lab equipment (buildings as machines)
    fill(22, 7, 24, 9, T.BUILDING);
    fill(32, 7, 34, 9, T.BUILDING);
    fill(42, 12, 44, 14, T.BUILDING);
    fill(46, 18, 48, 20, T.BUILDING);
    // Entrance
    fill(27, 25, 29, 35, T.PATH); // Connects to town
    fill(33, 25, 33, 25, T.LAB_FLOOR); // Extra entrance

    // === CHAIN MOUNTAINS (top-right: 50-79, 0-34) ===
    fill(50, 0, 79, 34, T.MOUNTAIN);
    // Mountain paths
    fill(50, 20, 65, 20, T.PATH);
    fill(55, 10, 55, 34, T.PATH);
    fill(65, 5, 65, 30, T.PATH);
    fill(55, 10, 75, 10, T.PATH);
    // Caves (buildings)
    fill(58, 7, 62, 9, T.BUILDING);
    fill(70, 12, 74, 15, T.BUILDING);
    // Connect to meadow
    fill(55, 34, 55, 37, T.PATH);
    // Snow/ice areas
    fill(68, 2, 77, 8, T.SAND);

    // === WATER BORDERS ===
    fill(0, 0, 79, 2, T.WATER); // Top
    fill(0, 75, 79, 79, T.WATER); // Bottom
    fill(0, 0, 1, 24, T.WATER); // Left top
    fill(66, 35, 79, 60, T.WATER); // Right middle lake
    // River through the map
    fill(0, 60, 40, 62, T.WATER);
    fill(27, 56, 29, 62, T.WATER);
    // Bridge over river
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

    // Check surrounding tiles for collision
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = px + dx;
        const ty = py + dy;
        if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) continue;
        const tile = this.mapData[ty][tx];
        if (COLLISION_TILES.includes(tile)) {
          const tileLeft = tx * TILE_SIZE;
          const tileRight = tileLeft + TILE_SIZE;
          const tileTop = ty * TILE_SIZE;
          const tileBottom = tileTop + TILE_SIZE;

          const playerLeft = this.player.x - 10;
          const playerRight = this.player.x + 10;
          const playerTop = this.player.y - 10;
          const playerBottom = this.player.y + 10;

          if (playerRight > tileLeft && playerLeft < tileRight &&
              playerBottom > tileTop && playerTop < tileBottom) {
            // Push player out
            const overlapLeft = playerRight - tileLeft;
            const overlapRight = tileRight - playerLeft;
            const overlapTop = playerBottom - tileTop;
            const overlapBottom = tileBottom - playerTop;

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft) this.player.x -= overlapLeft;
            else if (minOverlap === overlapRight) this.player.x += overlapRight;
            else if (minOverlap === overlapTop) this.player.y -= overlapTop;
            else this.player.y += overlapBottom;
          }
        }
      }
    }
  }

  _createNPCs() {
    const npcData = [
      { x: 20, y: 44, name: 'Prof. Hashimoto', dialog: ['The world of CryptoMons is vast!', 'There are 8 types of creatures, each with strengths and weaknesses.', 'Explore and catch them all!'] },
      { x: 28, y: 44, name: 'Nurse Joy', dialog: ['Welcome to the PokeCenter!', 'Your creatures have been fully healed!'] },
      { x: 36, y: 44, name: 'Shopkeeper', dialog: ['Welcome to the PokeMart!', 'We sell CryptoSpheres and potions.'] },
      { x: 28, y: 50, name: 'Kid', dialog: ['Did you know Pepeking is legendary?', 'Nobody has ever captured one!'] },
      { x: 7, y: 36, name: 'DeFi Trainer', dialog: ['The DeFi Forest is full of DeFi-type creatures.', 'Watch out for Rugpullers!'] },
      { x: 50, y: 48, name: 'Meme Lord', dialog: ['This meadow is where the meme creatures gather.', 'Diamond hands, my friend!'] },
      { x: 35, y: 15, name: 'Dr. Neural', dialog: ['Welcome to AI Labs.', 'We study the mysterious AI-type creatures here.', 'Claudius is said to roam these halls...'] },
      { x: 60, y: 20, name: 'Mountaineer', dialog: ['Chain Mountains is treacherous.', 'But the rarest Layer1 creatures live here.'] },
    ];

    this.npcObjects = npcData.map(data => {
      const npc = this.physics.add.staticSprite(
        data.x * TILE_SIZE + TILE_SIZE / 2,
        data.y * TILE_SIZE + TILE_SIZE / 2,
        'npc'
      ).setDepth(9);
      npc.npcData = data;
      this.npcs.add(npc);
      return npc;
    });
  }

  _checkNPCInteraction() {
    const interactDist = 48;
    let closestNPC = null;
    let closestDist = Infinity;

    this.npcObjects.forEach(npc => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < interactDist && dist < closestDist) {
        closestDist = dist;
        closestNPC = npc;
      }
    });

    if (closestNPC) {
      this._startNPCDialog(closestNPC.npcData);
    }

    // Check sign interaction
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

    // Heal at PokeCenter location
    if (closestNPC && closestNPC.npcData.name === 'Nurse Joy') {
      this.playerData.party.forEach(c => { c.currentHp = c.stats.hp; });
    }
  }

  _getSignText(x, y) {
    // Signs near town exits
    if (y === 43 && x === 19) return 'West: DeFi Forest';
    if (y === 43 && x === 27) return 'Satoshi Town - Where it all begins';
    if (y === 43 && x === 35) return 'East: Meme Meadow';
    return 'PokeClaude World';
  }

  async _showSign(text) {
    this.inDialog = true;
    await this.dialogBox.show(text);
    this.inDialog = false;
  }

  async _startNPCDialog(npcData) {
    this.inDialog = true;
    for (const line of npcData.dialog) {
      await this.dialogBox.show(line, npcData.name);
    }
    this.inDialog = false;
  }

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

  _checkRandomEncounter() {
    const px = Math.floor(this.player.x / TILE_SIZE);
    const py = Math.floor(this.player.y / TILE_SIZE);

    if (px < 0 || py < 0 || px >= this.mapWidth || py >= this.mapHeight) return;

    const tile = this.mapData[py][px];
    if (!ENCOUNTER_TILES.includes(tile)) return;
    if (this.playerData.party.length === 0) return;

    // ~8% encounter rate per check
    if (Math.random() > 0.08) return;

    this.encounterCooldown = 30;

    // Determine wild creature based on area
    const area = this._getAreaForPosition(px, py);
    const possibleCreatures = getWildCreaturesForArea(area);
    const creatureId = Phaser.Utils.Array.GetRandom(possibleCreatures);

    // Level based on area
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

    // Battle transition effect
    this._battleTransition(wildCreature);
  }

  _battleTransition(wildCreature) {
    // Flash effect
    this.cameras.main.flash(300, 255, 255, 255);

    const overlay = this.add.graphics().setDepth(2000).setScrollFactor(0);

    // Swipe transition
    let progress = 0;
    const anim = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 600,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        progress = tween.getValue();
        overlay.clear();
        overlay.fillStyle(0x000000, 1);
        // Horizontal bars closing in
        const barH = (this.scale.height / 2) * progress;
        overlay.fillRect(0, 0, this.scale.width, barH);
        overlay.fillRect(0, this.scale.height - barH, this.scale.width, barH);
      },
      onComplete: () => {
        overlay.destroy();
        // Save position
        this.playerData.x = Math.floor(this.player.x / TILE_SIZE);
        this.playerData.y = Math.floor(this.player.y / TILE_SIZE);

        // Start battle scene
        this.scene.sleep();
        this.scene.run('BattleScene', {
          playerCreature: this.playerData.party[0],
          enemyCreature: wildCreature,
          isWild: true,
          playerData: this.playerData,
        });
      },
    });
  }

  _saveGame() {
    this.playerData.x = Math.floor(this.player.x / TILE_SIZE);
    this.playerData.y = Math.floor(this.player.y / TILE_SIZE);
    localStorage.setItem('pokeclaude_save', JSON.stringify(this.playerData));
  }
}
