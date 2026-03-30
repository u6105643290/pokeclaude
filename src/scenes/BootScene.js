// BootScene - Loads/generates all placeholder assets

import { CREATURES } from '../characters/creatures.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading bar
    const w = this.scale.width;
    const h = this.scale.height;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(w / 2 - 160, h / 2 - 25, 320, 50);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(w / 2, h / 2 - 50, 'Loading...', {
      fontSize: '16px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    const percentText = this.add.text(w / 2, h / 2, '0%', {
      fontSize: '14px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(w / 2 - 150, h / 2 - 15, 300 * value, 30);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // We generate assets programmatically, but load a tiny dummy to trigger the loading bar
    // Create a 1x1 pixel so the load system has something
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    this.textures.addCanvas('_dummy', canvas);
  }

  create() {
    this._generateCreatureSprites();
    this._generateTileSprites();
    this._generateUISprites();
    this._generateItemSprites();

    // Transition to menu with a fade
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  _generateCreatureSprites() {
    // Generate a sprite for each creature using colored shapes
    Object.values(CREATURES).forEach(creature => {
      const g = this.make.graphics({ add: false });
      const color = Phaser.Display.Color.HexStringToColor(creature.spriteColor).color;

      // Body (rounded rect)
      g.fillStyle(color, 1);
      g.fillRoundedRect(8, 12, 48, 44, 8);

      // Eyes
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(22, 28, 6);
      g.fillCircle(42, 28, 6);
      g.fillStyle(0x000000, 1);
      g.fillCircle(24, 28, 3);
      g.fillCircle(44, 28, 3);

      // Mouth
      g.lineStyle(2, 0x000000, 1);
      g.beginPath();
      g.moveTo(24, 42);
      g.lineTo(32, 46);
      g.lineTo(40, 42);
      g.strokePath();

      // Type indicator (small colored dot on top)
      const typeColors = {
        DeFi: 0x627EEA, AI: 0x9B59B6, Meme: 0xFFD700, Layer1: 0xF7931A,
        NFT: 0xFF6B35, Privacy: 0xFF6600, Oracle: 0x375BD2, Gaming: 0x00BFFF,
      };
      g.fillStyle(typeColors[creature.type] || 0xFFFFFF, 1);
      g.fillCircle(32, 8, 5);

      // Rarity glow for rare/legendary
      if (creature.rarity === 'legendary') {
        g.lineStyle(2, 0xFFD700, 0.8);
        g.strokeRoundedRect(4, 8, 56, 52, 10);
        g.lineStyle(1, 0xFFD700, 0.4);
        g.strokeRoundedRect(2, 6, 60, 56, 12);
      } else if (creature.rarity === 'rare') {
        g.lineStyle(2, 0x9966FF, 0.6);
        g.strokeRoundedRect(4, 8, 56, 52, 10);
      }

      g.generateTexture(creature.id, 64, 64);
      g.destroy();
    });
  }

  _generateTileSprites() {
    const tileSize = 32;
    const tiles = {
      grass: { color: 0x4CAF50, detail: 'dots' },
      tallgrass: { color: 0x2E7D32, detail: 'blades' },
      path: { color: 0xD2B48C, detail: 'none' },
      water: { color: 0x2196F3, detail: 'waves' },
      wall: { color: 0x757575, detail: 'bricks' },
      tree: { color: 0x1B5E20, detail: 'tree' },
      building: { color: 0x8D6E63, detail: 'door' },
      sand: { color: 0xFFE082, detail: 'dots' },
      mountain: { color: 0x5D4037, detail: 'peak' },
      lab_floor: { color: 0xE0E0E0, detail: 'grid' },
      sign: { color: 0xA1887F, detail: 'sign' },
    };

    Object.entries(tiles).forEach(([key, { color, detail }]) => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(color, 1);
      g.fillRect(0, 0, tileSize, tileSize);

      // Add detail
      switch (detail) {
        case 'dots':
          g.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color, 0.5);
          g.fillCircle(8, 8, 2);
          g.fillCircle(24, 20, 2);
          g.fillCircle(16, 28, 2);
          break;
        case 'blades':
          g.fillStyle(0x1B5E20, 0.7);
          for (let i = 0; i < 5; i++) {
            const x = 4 + i * 6;
            g.fillTriangle(x, tileSize - 2, x + 3, tileSize - 14, x + 6, tileSize - 2);
          }
          break;
        case 'waves':
          g.lineStyle(1, 0x64B5F6, 0.6);
          for (let y = 8; y < tileSize; y += 10) {
            g.beginPath();
            g.moveTo(0, y);
            g.lineTo(8, y - 3);
            g.lineTo(16, y);
            g.lineTo(24, y - 3);
            g.lineTo(32, y);
            g.strokePath();
          }
          break;
        case 'bricks':
          g.lineStyle(1, 0x616161, 0.5);
          g.strokeRect(0, 0, 16, 16);
          g.strokeRect(16, 0, 16, 16);
          g.strokeRect(8, 16, 16, 16);
          g.strokeRect(24, 16, 16, 16);
          break;
        case 'tree':
          g.fillStyle(0x4E342E, 1);
          g.fillRect(12, 18, 8, 14);
          g.fillStyle(0x2E7D32, 1);
          g.fillCircle(16, 12, 12);
          break;
        case 'door':
          g.lineStyle(1, 0x5D4037, 1);
          g.strokeRect(1, 1, 30, 30);
          g.fillStyle(0xFFEB3B, 1);
          g.fillRect(10, 12, 12, 18);
          g.fillStyle(0xFFC107, 1);
          g.fillCircle(18, 22, 2);
          break;
        case 'peak':
          g.fillStyle(0x795548, 1);
          g.fillTriangle(16, 2, 0, 30, 32, 30);
          g.fillStyle(0xEEEEEE, 1);
          g.fillTriangle(16, 2, 10, 12, 22, 12);
          break;
        case 'grid':
          g.lineStyle(1, 0xBDBDBD, 0.3);
          for (let i = 0; i < tileSize; i += 8) {
            g.lineBetween(i, 0, i, tileSize);
            g.lineBetween(0, i, tileSize, i);
          }
          break;
        case 'sign':
          g.fillStyle(0x5D4037, 1);
          g.fillRect(14, 16, 4, 16);
          g.fillStyle(0xFFCC80, 1);
          g.fillRect(4, 4, 24, 14);
          g.lineStyle(1, 0x3E2723, 1);
          g.strokeRect(4, 4, 24, 14);
          break;
      }

      // Grid outline for all tiles
      g.lineStyle(1, 0x000000, 0.1);
      g.strokeRect(0, 0, tileSize, tileSize);

      g.generateTexture(`tile_${key}`, tileSize, tileSize);
      g.destroy();
    });

    // Player sprite
    const pg = this.make.graphics({ add: false });
    pg.fillStyle(0xFF5722, 1);
    pg.fillRoundedRect(4, 4, 24, 24, 4);
    pg.fillStyle(0xFFCCBC, 1);
    pg.fillCircle(16, 10, 6);
    pg.fillStyle(0x000000, 1);
    pg.fillCircle(13, 9, 1.5);
    pg.fillCircle(19, 9, 1.5);
    pg.fillStyle(0x3E2723, 1);
    pg.fillRect(10, 2, 12, 5);
    pg.generateTexture('player', 32, 32);
    pg.destroy();

    // NPC sprite
    const ng = this.make.graphics({ add: false });
    ng.fillStyle(0x3F51B5, 1);
    ng.fillRoundedRect(4, 4, 24, 24, 4);
    ng.fillStyle(0xFFCCBC, 1);
    ng.fillCircle(16, 10, 6);
    ng.fillStyle(0x000000, 1);
    ng.fillCircle(13, 9, 1.5);
    ng.fillCircle(19, 9, 1.5);
    ng.fillStyle(0x1A237E, 1);
    ng.fillRect(10, 2, 12, 5);
    ng.generateTexture('npc', 32, 32);
    ng.destroy();
  }

  _generateUISprites() {
    // Battle background
    const bg = this.make.graphics({ add: false });
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
    bg.fillRect(0, 0, 800, 600);
    // Ground
    bg.fillStyle(0x2d5016, 1);
    bg.fillRect(0, 350, 800, 250);
    bg.fillStyle(0x3a6b1e, 1);
    bg.fillRect(0, 350, 800, 5);
    bg.generateTexture('battle_bg', 800, 600);
    bg.destroy();

    // HP bar background
    const hpBg = this.make.graphics({ add: false });
    hpBg.fillStyle(0x333333, 1);
    hpBg.fillRoundedRect(0, 0, 200, 60, 6);
    hpBg.lineStyle(2, 0xFFFFFF, 1);
    hpBg.strokeRoundedRect(0, 0, 200, 60, 6);
    hpBg.generateTexture('hp_bar_bg', 200, 60);
    hpBg.destroy();

    // Menu panel
    const mp = this.make.graphics({ add: false });
    mp.fillStyle(0x1a1a2e, 0.95);
    mp.fillRoundedRect(0, 0, 400, 150, 8);
    mp.lineStyle(3, 0xFFFFFF, 1);
    mp.strokeRoundedRect(0, 0, 400, 150, 8);
    mp.generateTexture('menu_panel', 400, 150);
    mp.destroy();

    // Button
    const btn = this.make.graphics({ add: false });
    btn.fillStyle(0x2196F3, 1);
    btn.fillRoundedRect(0, 0, 180, 40, 6);
    btn.lineStyle(2, 0x64B5F6, 1);
    btn.strokeRoundedRect(0, 0, 180, 40, 6);
    btn.generateTexture('button', 180, 40);
    btn.destroy();

    // Button hover
    const btnH = this.make.graphics({ add: false });
    btnH.fillStyle(0x1976D2, 1);
    btnH.fillRoundedRect(0, 0, 180, 40, 6);
    btnH.lineStyle(2, 0x90CAF9, 1);
    btnH.strokeRoundedRect(0, 0, 180, 40, 6);
    btnH.generateTexture('button_hover', 180, 40);
    btnH.destroy();

    // CryptoSphere
    const cs = this.make.graphics({ add: false });
    cs.fillStyle(0xFF0000, 1);
    cs.fillCircle(16, 16, 14);
    cs.fillStyle(0xFFFFFF, 1);
    cs.fillCircle(16, 16, 5);
    cs.lineStyle(3, 0x333333, 1);
    cs.lineBetween(2, 16, 30, 16);
    cs.lineStyle(2, 0x333333, 1);
    cs.strokeCircle(16, 16, 14);
    cs.generateTexture('cryptosphere', 32, 32);
    cs.destroy();
  }

  _generateItemSprites() {
    // Potion
    const pot = this.make.graphics({ add: false });
    pot.fillStyle(0x7C4DFF, 1);
    pot.fillRoundedRect(8, 10, 16, 20, 4);
    pot.fillStyle(0xB388FF, 1);
    pot.fillRect(10, 6, 12, 8);
    pot.fillStyle(0xFFFFFF, 0.5);
    pot.fillRect(12, 14, 4, 8);
    pot.generateTexture('potion', 32, 32);
    pot.destroy();

    // Revive
    const rev = this.make.graphics({ add: false });
    rev.fillStyle(0xFFEB3B, 1);
    rev.fillTriangle(16, 4, 4, 28, 28, 28);
    rev.fillStyle(0xFFF176, 1);
    rev.fillTriangle(16, 10, 10, 24, 22, 24);
    rev.generateTexture('revive', 32, 32);
    rev.destroy();
  }
}
