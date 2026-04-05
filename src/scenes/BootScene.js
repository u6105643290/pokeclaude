// BootScene - Loads real sprite images + generates tile/UI assets

import { CREATURES } from '../characters/creatures.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Loading bar
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(w / 2 - 160, h / 2 - 25, 320, 50);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(w / 2, h / 2 - 50, 'Loading CryptoVerse...', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#F7931A',
    }).setOrigin(0.5);

    const percentText = this.add.text(w / 2, h / 2, '0%', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x627EEA, 1);
      progressBar.fillRect(w / 2 - 150, h / 2 - 15, 300 * value, 30);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load all creature sprite sheets (128x88, front on right half, back on left)
    const creatureIds = Object.keys(CREATURES);
    creatureIds.forEach(id => {
      this.load.spritesheet(`sheet_${id}`, `assets/sprites/creatures/${id}.png`, {
        frameWidth: 64,
        frameHeight: 64,
      });
    });

    // Load player/NPC sprites
    this.load.image('player_img', 'assets/sprites/characters/player.png');
    this.load.image('npc1_img', 'assets/sprites/characters/npc1.png');
    this.load.image('npc2_img', 'assets/sprites/characters/npc2.png');
    this.load.image('npc3_img', 'assets/sprites/characters/npc3.png');
  }

  create() {
    // Extract front/back sprites from sprite sheets
    this._extractCreatureSprites();
    // Generate procedural player/NPC/tile/UI textures
    this._generatePlayerSprites();
    this._generateTileSprites();
    this._generateUISprites();
    this._generateItemSprites();

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  _extractCreatureSprites() {
    const creatureIds = Object.keys(CREATURES);

    creatureIds.forEach(id => {
      const sheetKey = `sheet_${id}`;

      if (this.textures.exists(sheetKey)) {
        // The sprite sheet is 128x88, frameWidth=64, frameHeight=64
        // Frame 0 = back view (top-left 64x64)
        // Frame 1 = front view (top-right 64x64)
        // We extract front (frame 1) as the creature's main battle sprite
        // and back (frame 0) for the player's creature

        // Create front texture
        const frontCanvas = document.createElement('canvas');
        frontCanvas.width = 64;
        frontCanvas.height = 64;
        const frontCtx = frontCanvas.getContext('2d');
        const sourceImg = this.textures.get(sheetKey).getSourceImage();
        // Front sprite is in the right half (x=64, y=0)
        frontCtx.drawImage(sourceImg, 64, 0, 64, 64, 0, 0, 64, 64);
        this.textures.addCanvas(`${id}_front`, frontCanvas);

        // Create back texture
        const backCanvas = document.createElement('canvas');
        backCanvas.width = 64;
        backCanvas.height = 64;
        const backCtx = backCanvas.getContext('2d');
        // Back sprite is in the left half (x=0, y=0)
        backCtx.drawImage(sourceImg, 0, 0, 64, 64, 0, 0, 64, 64);
        this.textures.addCanvas(`${id}_back`, backCanvas);

        // Also create default texture using front view (for overworld/inventory)
        const defCanvas = document.createElement('canvas');
        defCanvas.width = 64;
        defCanvas.height = 64;
        const defCtx = defCanvas.getContext('2d');
        defCtx.drawImage(sourceImg, 64, 0, 64, 64, 0, 0, 64, 64);
        this.textures.addCanvas(id, defCanvas);
      } else {
        // Fallback: generate procedural sprite
        this._generateFallbackCreature(id);
      }
    });
  }

  _generateFallbackCreature(id) {
    const creature = CREATURES[id];
    if (!creature) return;
    const g = this.make.graphics({ add: false });
    const color = Phaser.Display.Color.HexStringToColor(creature.spriteColor).color;
    g.fillStyle(color, 1);
    g.fillRoundedRect(8, 8, 48, 48, 10);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 28, 5);
    g.fillCircle(40, 28, 5);
    g.fillStyle(0x111111, 1);
    g.fillCircle(25, 29, 2.5);
    g.fillCircle(41, 29, 2.5);
    g.lineStyle(2, 0x333333, 1);
    g.beginPath(); g.arc(32, 38, 6, 0.2, Math.PI - 0.2); g.strokePath();
    g.generateTexture(id, 64, 64);
    g.generateTexture(`${id}_front`, 64, 64);
    g.generateTexture(`${id}_back`, 64, 64);
    g.destroy();
  }

  _generatePlayerSprites() {
    // Convert loaded player image to 32x32 tile-friendly version
    if (this.textures.exists('player_img')) {
      const src = this.textures.get('player_img').getSourceImage();
      // The Tuxemon player sprite is a sheet with back+front (like 128xH)
      // Extract just the front-facing portion and scale to 32x32
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      // Use right half (front facing) of the sprite, scale to 32x32
      const halfW = Math.floor(src.width / 2);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, halfW, 0, halfW, src.height, 2, 2, 28, 28);
      this.textures.addCanvas('player', canvas);
    } else {
      this._genProcPlayer();
    }

    // NPC sprites
    ['npc1_img', 'npc2_img', 'npc3_img'].forEach((key, i) => {
      if (this.textures.exists(key)) {
        const src = this.textures.get(key).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const halfW = Math.floor(src.width / 2);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(src, halfW, 0, halfW, src.height, 2, 2, 28, 28);
        this.textures.addCanvas(i === 0 ? 'npc' : `npc${i + 1}`, canvas);
      }
    });

    // Also generate fallback npc if needed
    if (!this.textures.exists('npc')) {
      this._genProcNPC();
    }
  }

  _genProcPlayer() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x3E2723, 1); g.fillRoundedRect(8, 2, 16, 8, 3);
    g.fillStyle(0xFFCCBC, 1); g.fillRoundedRect(9, 4, 14, 12, 4);
    g.fillStyle(0x222222, 1); g.fillRect(12, 8, 2, 3); g.fillRect(18, 8, 2, 3);
    g.fillStyle(0xDD3333, 1); g.fillRoundedRect(8, 15, 16, 12, 3);
    g.fillStyle(0xCC2222, 1); g.fillRect(15, 15, 2, 12);
    g.fillStyle(0x555555, 1); g.fillRoundedRect(4, 16, 6, 8, 2);
    g.fillStyle(0xDD3333, 1); g.fillRect(5, 16, 4, 8); g.fillRect(23, 16, 4, 8);
    g.fillStyle(0xFFCCBC, 1); g.fillCircle(7, 24, 2); g.fillCircle(25, 24, 2);
    g.fillStyle(0x333399, 1); g.fillRect(10, 26, 5, 6); g.fillRect(17, 26, 5, 6);
    g.fillStyle(0x222222, 1); g.fillRect(9, 30, 6, 3); g.fillRect(17, 30, 6, 3);
    g.generateTexture('player', 32, 32);
    g.destroy();
  }

  _genProcNPC() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xFFCC00, 1); g.fillRoundedRect(8, 2, 16, 8, 3);
    g.fillStyle(0xFFCCBC, 1); g.fillRoundedRect(9, 4, 14, 12, 4);
    g.fillStyle(0x222222, 1); g.fillRect(12, 8, 2, 3); g.fillRect(18, 8, 2, 3);
    g.fillStyle(0x3F51B5, 1); g.fillRoundedRect(8, 15, 16, 12, 3);
    g.fillStyle(0x303F9F, 1); g.fillRect(15, 15, 2, 12);
    g.fillStyle(0x3F51B5, 1); g.fillRect(5, 16, 4, 8); g.fillRect(23, 16, 4, 8);
    g.fillStyle(0xFFCCBC, 1); g.fillCircle(7, 24, 2); g.fillCircle(25, 24, 2);
    g.fillStyle(0x444444, 1); g.fillRect(10, 26, 5, 6); g.fillRect(17, 26, 5, 6);
    g.fillStyle(0x333333, 1); g.fillRect(9, 30, 6, 3); g.fillRect(17, 30, 6, 3);
    g.generateTexture('npc', 32, 32);
    g.destroy();
  }

  _generateTileSprites() {
    const S = 32;

    const tiles = [
      { key: 'grass', base: 0x4CAF50, fn: (g) => {
        g.fillStyle(0x4CAF50, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0x55BD55, 0.5);
        g.fillRect(4, 4, 3, 3); g.fillRect(18, 12, 3, 3); g.fillRect(10, 24, 3, 3);
        g.fillStyle(0x3D9140, 0.4);
        g.fillRect(24, 6, 2, 2); g.fillRect(8, 16, 2, 2); g.fillRect(26, 22, 2, 2);
        g.fillStyle(0xFFFF88, 0.6); g.fillCircle(14, 8, 1.5);
        g.fillStyle(0xFF88AA, 0.4); g.fillCircle(28, 26, 1.5);
      }},
      { key: 'tallgrass', fn: (g) => {
        g.fillStyle(0x2E7D32, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0x1B5E20, 0.9);
        for (let i = 0; i < 6; i++) { const x = 2 + i * 5; g.fillTriangle(x, S, x + 2, S - 16 - (i % 3) * 3, x + 4, S); }
        g.fillStyle(0x4CAF50, 0.7);
        for (let i = 0; i < 5; i++) { const x = 4 + i * 6; g.fillTriangle(x, S, x + 2, S - 12 - (i % 2) * 4, x + 4, S); }
        g.fillStyle(0x66BB6A, 0.5);
        for (let i = 0; i < 4; i++) g.fillCircle(6 + i * 8, 10 + (i % 2) * 4, 1.5);
      }},
      { key: 'path', fn: (g) => {
        g.fillStyle(0xD2B48C, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0xC4A87A, 0.5);
        g.fillCircle(8, 12, 3); g.fillCircle(22, 6, 2); g.fillCircle(16, 26, 2.5);
        g.fillStyle(0xDEC49A, 0.4); g.fillRect(4, 18, 4, 3); g.fillRect(20, 28, 5, 2);
      }},
      { key: 'water', fn: (g) => {
        g.fillStyle(0x1565C0, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0x1976D2, 0.6); g.fillRect(0, 0, S, 16);
        g.lineStyle(1, 0x42A5F5, 0.6);
        g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 5); g.lineTo(16, 8); g.lineTo(24, 5); g.lineTo(32, 8); g.strokePath();
        g.lineStyle(1, 0x64B5F6, 0.4);
        g.beginPath(); g.moveTo(0, 20); g.lineTo(10, 17); g.lineTo(20, 20); g.lineTo(30, 17); g.lineTo(32, 20); g.strokePath();
        g.fillStyle(0x90CAF9, 0.3); g.fillRect(6, 12, 4, 2); g.fillRect(22, 24, 3, 2);
      }},
      { key: 'wall', fn: (g) => {
        g.fillStyle(0x757575, 1); g.fillRect(0, 0, S, S);
        g.lineStyle(1, 0x616161, 0.7);
        g.strokeRect(0, 0, 16, 10); g.strokeRect(16, 0, 16, 10);
        g.strokeRect(-8, 10, 16, 11); g.strokeRect(8, 10, 16, 11); g.strokeRect(24, 10, 16, 11);
        g.strokeRect(0, 21, 16, 11); g.strokeRect(16, 21, 16, 11);
        g.fillStyle(0x6B6B6B, 0.4); g.fillRect(0, 9, 32, 2); g.fillRect(0, 20, 32, 2);
      }},
      { key: 'tree', fn: (g) => {
        g.fillStyle(0x4CAF50, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5D4037, 1); g.fillRect(12, 16, 8, 16);
        g.fillStyle(0x4E342E, 0.5); g.fillRect(14, 18, 2, 12);
        g.fillStyle(0x1B5E20, 1); g.fillCircle(16, 12, 14);
        g.fillStyle(0x2E7D32, 1); g.fillCircle(16, 10, 11);
        g.fillStyle(0x388E3C, 0.8); g.fillCircle(12, 8, 7);
        g.fillStyle(0x43A047, 0.5); g.fillCircle(20, 6, 5);
        g.fillStyle(0x66BB6A, 0.4); g.fillCircle(10, 6, 3);
      }},
      { key: 'building', fn: (g) => {
        g.fillStyle(0x8D6E63, 1); g.fillRect(0, 6, S, S - 6);
        g.fillStyle(0xCC4444, 1); g.fillTriangle(0, 8, 16, 0, 32, 8);
        g.fillStyle(0xAA3333, 1); g.fillRect(0, 6, 32, 3);
        g.fillStyle(0x88CCFF, 1); g.fillRect(4, 12, 10, 8);
        g.lineStyle(1, 0x5D4037, 1); g.strokeRect(4, 12, 10, 8);
        g.beginPath(); g.moveTo(9, 12); g.lineTo(9, 20); g.strokePath();
        g.beginPath(); g.moveTo(4, 16); g.lineTo(14, 16); g.strokePath();
        g.fillStyle(0xFFCC44, 1); g.fillRect(20, 14, 10, 18);
        g.fillStyle(0xDDAA33, 1); g.fillRect(20, 14, 10, 2);
        g.fillStyle(0xBB8822, 1); g.fillCircle(27, 24, 1.5);
      }},
      { key: 'sand', fn: (g) => {
        g.fillStyle(0xFFE082, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0xFFCC44, 0.3);
        g.fillCircle(6, 10, 2); g.fillCircle(20, 24, 1.5); g.fillCircle(28, 8, 1);
        g.fillStyle(0xFFAA88, 0.5); g.fillCircle(24, 18, 2);
      }},
      { key: 'mountain', fn: (g) => {
        g.fillStyle(0x5D4037, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6D4C41, 1); g.fillTriangle(16, 0, 0, 32, 32, 32);
        g.fillStyle(0x795548, 0.8); g.fillTriangle(16, 4, 4, 28, 28, 28);
        g.fillStyle(0xEEEEEE, 1); g.fillTriangle(16, 0, 10, 10, 22, 10);
        g.fillStyle(0xFFFFFF, 0.8); g.fillTriangle(16, 2, 12, 8, 20, 8);
      }},
      { key: 'lab_floor', fn: (g) => {
        g.fillStyle(0xE0E0E0, 1); g.fillRect(0, 0, S, S);
        g.lineStyle(1, 0xBDBDBD, 0.4);
        for (let i = 0; i <= S; i += 8) { g.lineBetween(i, 0, i, S); g.lineBetween(0, i, S, i); }
        g.lineStyle(1, 0x00BCD4, 0.3);
        g.beginPath(); g.moveTo(4, 16); g.lineTo(12, 16); g.lineTo(12, 8); g.lineTo(24, 8); g.strokePath();
        g.fillStyle(0x00BCD4, 0.5); g.fillCircle(4, 16, 1.5); g.fillCircle(24, 8, 1.5);
      }},
      { key: 'sign', fn: (g) => {
        g.fillStyle(0x4CAF50, 1); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5D4037, 1); g.fillRect(14, 14, 4, 18);
        g.fillStyle(0xFFCC80, 1); g.fillRoundedRect(4, 4, 24, 14, 2);
        g.lineStyle(1, 0x8D6E63, 1); g.strokeRoundedRect(4, 4, 24, 14, 2);
        g.lineStyle(1, 0xDDB070, 0.4);
        g.beginPath(); g.moveTo(6, 8); g.lineTo(26, 8); g.strokePath();
        g.beginPath(); g.moveTo(6, 12); g.lineTo(26, 12); g.strokePath();
        g.fillStyle(0x5D4037, 1); g.fillRect(14, 6, 3, 5); g.fillRect(14, 13, 3, 2);
      }},
    ];

    tiles.forEach(({ key, fn }) => {
      const g = this.make.graphics({ add: false });
      fn(g);
      g.lineStyle(1, 0x000000, 0.08); g.strokeRect(0, 0, S, S);
      g.generateTexture(`tile_${key}`, S, S);
      g.destroy();
    });
  }

  _generateUISprites() {
    // Battle background (800x600)
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4A90D9, 0x4A90D9);
      g.fillRect(0, 0, 800, 200);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(120, 60, 30); g.fillCircle(150, 50, 40); g.fillCircle(180, 60, 25);
      g.fillCircle(500, 80, 25); g.fillCircle(530, 70, 35); g.fillCircle(560, 80, 20);
      g.fillCircle(700, 40, 20); g.fillCircle(720, 35, 28);
      g.fillGradientStyle(0x4A90D9, 0x4A90D9, 0x6AB04C, 0x6AB04C);
      g.fillRect(0, 180, 800, 80);
      g.fillStyle(0x4CAF50, 0.6);
      g.fillCircle(200, 280, 120); g.fillCircle(500, 290, 100); g.fillCircle(700, 280, 80);
      g.fillStyle(0x4CAF50, 1); g.fillRect(0, 260, 800, 340);
      g.fillStyle(0x43A047, 1); g.fillRect(0, 260, 800, 8);
      g.fillStyle(0x66BB6A, 1); g.fillEllipse(200, 380, 280, 70);
      g.fillStyle(0x4CAF50, 1); g.fillEllipse(200, 375, 260, 55);
      g.fillStyle(0x66BB6A, 1); g.fillEllipse(580, 260, 240, 60);
      g.fillStyle(0x4CAF50, 1); g.fillEllipse(580, 256, 220, 48);
      g.generateTexture('battle_bg', 800, 600); g.destroy();
    })();

    // HP bar bg
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x1a1a2e, 0.95); g.fillRoundedRect(0, 0, 200, 60, 8);
      g.lineStyle(2, 0x627EEA, 0.6); g.strokeRoundedRect(0, 0, 200, 60, 8);
      g.generateTexture('hp_bar_bg', 200, 60); g.destroy();
    })();

    // Menu panel
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x0d0d1e, 0.95); g.fillRoundedRect(0, 0, 400, 150, 10);
      g.lineStyle(2, 0x627EEA, 0.7); g.strokeRoundedRect(0, 0, 400, 150, 10);
      g.generateTexture('menu_panel', 400, 150); g.destroy();
    })();

    // Button
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillGradientStyle(0x2196F3, 0x2196F3, 0x1976D2, 0x1976D2);
      g.fillRoundedRect(0, 0, 180, 40, 6);
      g.fillStyle(0x64B5F6, 0.3); g.fillRoundedRect(2, 2, 176, 18, 4);
      g.lineStyle(1, 0x64B5F6, 0.6); g.strokeRoundedRect(0, 0, 180, 40, 6);
      g.generateTexture('button', 180, 40); g.destroy();
    })();

    // Button hover
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillGradientStyle(0x42A5F5, 0x42A5F5, 0x2196F3, 0x2196F3);
      g.fillRoundedRect(0, 0, 180, 40, 6);
      g.fillStyle(0x90CAF9, 0.4); g.fillRoundedRect(2, 2, 176, 18, 4);
      g.lineStyle(2, 0x90CAF9, 0.8); g.strokeRoundedRect(0, 0, 180, 40, 6);
      g.generateTexture('button_hover', 180, 40); g.destroy();
    })();

    // CryptoSphere
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xEE1111, 1); g.fillCircle(16, 16, 14);
      g.fillStyle(0x0a0a1a, 1); g.fillRect(0, 15, 32, 17);
      g.fillStyle(0xffffff, 1); g.fillCircle(16, 16, 14);
      g.fillStyle(0x0a0a1a, 1); g.fillRect(0, 0, 32, 15);
      g.fillStyle(0xEE1111, 1);
      g.beginPath(); g.arc(16, 16, 14, Math.PI, 0); g.fillPath();
      g.fillStyle(0xff4444, 0.5); g.fillCircle(10, 10, 4);
      g.fillStyle(0x222222, 1); g.fillRect(2, 14, 28, 4);
      g.fillStyle(0xffffff, 1); g.fillCircle(16, 16, 5);
      g.fillStyle(0xcccccc, 1); g.fillCircle(16, 16, 3);
      g.fillStyle(0xffffff, 0.8); g.fillCircle(15, 15, 1.5);
      g.lineStyle(2, 0x222222, 1); g.strokeCircle(16, 16, 14);
      g.generateTexture('cryptosphere', 32, 32); g.destroy();
    })();
  }

  _generateItemSprites() {
    // Potion
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x7C4DFF, 1); g.fillRoundedRect(10, 12, 12, 16, 4);
      g.fillStyle(0xB388FF, 0.7); g.fillRoundedRect(12, 14, 8, 12, 3);
      g.fillStyle(0x9575CD, 1); g.fillRect(12, 8, 8, 6);
      g.fillStyle(0x8D6E63, 1); g.fillRoundedRect(13, 5, 6, 5, 2);
      g.fillStyle(0xffffff, 0.8); g.fillRect(12, 18, 8, 4);
      g.fillStyle(0xff0000, 1); g.fillRect(14, 19, 4, 2); g.fillRect(15, 18, 2, 4);
      g.fillStyle(0xffffff, 0.3); g.fillRect(12, 12, 2, 8);
      g.generateTexture('potion', 32, 32); g.destroy();
    })();

    // Revive
    (() => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFFD700, 1);
      g.fillTriangle(16, 4, 6, 18, 26, 18);
      g.fillTriangle(16, 28, 6, 18, 26, 18);
      g.fillStyle(0xFFF176, 0.7);
      g.fillTriangle(16, 8, 10, 18, 22, 18);
      g.fillTriangle(16, 24, 10, 18, 22, 18);
      g.fillStyle(0xffffff, 0.8); g.fillCircle(16, 16, 3);
      g.generateTexture('revive', 32, 32); g.destroy();
    })();
  }
}
