// BootScene - Generates all procedural pixel art assets for PokeClaude

import { CREATURES } from '../characters/creatures.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
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

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  // ─── Color Helpers ──────────────────────────────────────────────
  _hexToRgb(hex) {
    const c = Phaser.Display.Color.HexStringToColor(hex);
    return { r: c.red, g: c.green, b: c.blue };
  }

  _rgbToHex(r, g, b) {
    return (Math.min(255, Math.max(0, r)) << 16) |
           (Math.min(255, Math.max(0, g)) << 8) |
           Math.min(255, Math.max(0, b));
  }

  _brighten(hex, pct) {
    const c = Phaser.Display.Color.IntegerToColor(hex);
    return Phaser.Display.Color.GetColor(
      Math.min(255, c.red + Math.floor(255 * pct / 100)),
      Math.min(255, c.green + Math.floor(255 * pct / 100)),
      Math.min(255, c.blue + Math.floor(255 * pct / 100))
    );
  }

  _darken(hex, pct) {
    const c = Phaser.Display.Color.IntegerToColor(hex);
    return Phaser.Display.Color.GetColor(
      Math.max(0, c.red - Math.floor(255 * pct / 100)),
      Math.max(0, c.green - Math.floor(255 * pct / 100)),
      Math.max(0, c.blue - Math.floor(255 * pct / 100))
    );
  }

  _colorNum(hexStr) {
    return Phaser.Display.Color.HexStringToColor(hexStr).color;
  }

  // ─── Pixel helpers ──────────────────────────────────────────────
  _px(g, x, y, s, color, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillRect(x, y, s, s);
  }

  // Draw a filled pixel-art arc / half-circle approximation
  _drawEar(g, cx, cy, w, h, color) {
    g.fillStyle(color, 1);
    for (let dy = 0; dy < h; dy++) {
      const ratio = 1 - (dy / h);
      const halfW = Math.floor(w * 0.5 * ratio);
      g.fillRect(cx - halfW, cy + dy, halfW * 2, 1);
    }
  }

  // ─── Rarity Overlays ───────────────────────────────────────────
  _applyRarity(g, rarity) {
    if (rarity === 'legendary') {
      // Golden sparkle border with glow
      g.lineStyle(2, 0xFFD700, 1);
      g.strokeRect(1, 1, 62, 62);
      g.lineStyle(1, 0xFFD700, 0.5);
      g.strokeRect(0, 0, 64, 64);
      // Corner sparkles
      const sparkles = [[4, 4], [58, 4], [4, 58], [58, 58], [31, 2], [31, 60], [2, 31], [60, 31]];
      sparkles.forEach(([sx, sy]) => {
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillRect(sx, sy, 2, 2);
        g.fillStyle(0xFFD700, 0.6);
        g.fillRect(sx - 1, sy, 1, 2);
        g.fillRect(sx + 2, sy, 1, 2);
        g.fillRect(sx, sy - 1, 2, 1);
        g.fillRect(sx, sy + 2, 2, 1);
      });
      // Glow corners
      g.fillStyle(0xFFD700, 0.15);
      g.fillRect(0, 0, 10, 10);
      g.fillRect(54, 0, 10, 10);
      g.fillRect(0, 54, 10, 10);
      g.fillRect(54, 54, 10, 10);
    } else if (rarity === 'rare') {
      // Purple shimmer border
      g.lineStyle(2, 0x9966FF, 0.7);
      g.strokeRect(1, 1, 62, 62);
      g.fillStyle(0x9966FF, 0.08);
      g.fillRect(0, 0, 64, 64);
      // Shimmer dots
      const pts = [[6, 6], [56, 8], [8, 56], [54, 54], [32, 3], [32, 60]];
      pts.forEach(([sx, sy]) => {
        g.fillStyle(0xCC99FF, 0.5);
        g.fillRect(sx, sy, 2, 2);
      });
    }
  }

  // ─── Creature Sprites ──────────────────────────────────────────
  _generateCreatureSprites() {
    Object.values(CREATURES).forEach(creature => {
      const g = this.make.graphics({ add: false });
      const base = this._colorNum(creature.spriteColor);
      const light = this._brighten(base, 20);
      const dark = this._darken(base, 20);
      const darker = this._darken(base, 35);

      // Dispatch to specific drawing function
      const drawFn = this['_draw_' + creature.id];
      if (drawFn) {
        drawFn.call(this, g, base, light, dark, darker, creature);
      } else {
        this._drawGenericCreature(g, base, light, dark, darker, creature);
      }

      this._applyRarity(g, creature.rarity);
      g.generateTexture(creature.id, 64, 64);
      g.destroy();
    });
  }

  // ── Satoshimp: Small chimp, orange, holding tiny coin, large ears ──
  _draw_satoshimp(g, base, light, dark, darker, c) {
    // Large ears
    g.fillStyle(dark, 1);
    g.fillCircle(12, 18, 8);
    g.fillCircle(52, 18, 8);
    g.fillStyle(light, 1);
    g.fillCircle(12, 18, 5);
    g.fillCircle(52, 18, 5);
    // Body
    g.fillStyle(base, 1);
    g.fillRoundedRect(16, 28, 32, 28, 6);
    // Belly
    g.fillStyle(light, 1);
    g.fillRoundedRect(22, 34, 20, 18, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 22, 14);
    // Face plate
    g.fillStyle(0xFFDDBB, 1);
    g.fillCircle(32, 25, 8);
    // Eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 20, 4);
    g.fillCircle(38, 20, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(27, 20, 2);
    g.fillCircle(39, 20, 2);
    // Eye shine
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(28, 19, 1, 1);
    g.fillRect(40, 19, 1, 1);
    // Smile
    g.lineStyle(1, 0x000000, 1);
    g.beginPath();
    g.moveTo(28, 28);
    g.lineTo(32, 31);
    g.lineTo(36, 28);
    g.strokePath();
    // Arms
    g.fillStyle(dark, 1);
    g.fillRoundedRect(10, 32, 8, 16, 3);
    g.fillRoundedRect(46, 32, 8, 16, 3);
    // Tiny coin in right hand
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(52, 46, 4);
    g.fillStyle(0xFFF176, 1);
    g.fillCircle(52, 45, 2);
    g.lineStyle(1, 0xB8860B, 1);
    g.strokeCircle(52, 46, 4);
    // Feet
    g.fillStyle(dark, 1);
    g.fillRoundedRect(18, 54, 10, 6, 2);
    g.fillRoundedRect(36, 54, 10, 6, 2);
  }

  // ── Nakamotus: Larger ape, darker orange, muscular, chain necklace ──
  _draw_nakamotus(g, base, light, dark, darker, c) {
    // Ears
    g.fillStyle(dark, 1);
    g.fillCircle(10, 18, 7);
    g.fillCircle(54, 18, 7);
    g.fillStyle(0xFFBB99, 1);
    g.fillCircle(10, 18, 4);
    g.fillCircle(54, 18, 4);
    // Body - muscular, wider
    g.fillStyle(base, 1);
    g.fillRoundedRect(12, 26, 40, 32, 6);
    // Chest
    g.fillStyle(light, 1);
    g.fillRoundedRect(18, 32, 28, 20, 4);
    // Muscle lines
    g.lineStyle(1, dark, 0.5);
    g.lineBetween(32, 34, 32, 48);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 15);
    // Brow ridge
    g.fillStyle(darker, 1);
    g.fillRoundedRect(18, 12, 28, 4, 2);
    // Eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(25, 19, 4);
    g.fillCircle(39, 19, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 19, 2);
    g.fillCircle(40, 19, 2);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(27, 18, 1, 1);
    g.fillRect(41, 18, 1, 1);
    // Mouth
    g.fillStyle(0xFFBB99, 1);
    g.fillRoundedRect(26, 24, 12, 6, 2);
    g.lineStyle(1, 0x000000, 0.7);
    g.lineBetween(29, 28, 35, 28);
    // Chain necklace
    g.lineStyle(2, 0xC0C0C0, 1);
    g.beginPath();
    g.moveTo(18, 30);
    g.lineTo(22, 34);
    g.lineTo(26, 30);
    g.lineTo(30, 34);
    g.lineTo(34, 30);
    g.lineTo(38, 34);
    g.lineTo(42, 30);
    g.lineTo(46, 34);
    g.strokePath();
    // Pendant
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(32, 38, 3);
    // Arms
    g.fillStyle(dark, 1);
    g.fillRoundedRect(6, 28, 10, 22, 4);
    g.fillRoundedRect(48, 28, 10, 22, 4);
    // Feet
    g.fillStyle(darker, 1);
    g.fillRoundedRect(16, 56, 12, 6, 2);
    g.fillRoundedRect(36, 56, 12, 6, 2);
  }

  // ── Blockchainus: Massive gorilla, dark brown/gold, armor plates, glowing eyes ──
  _draw_blockchainus(g, base, light, dark, darker, c) {
    // Large body with armor plates
    g.fillStyle(base, 1);
    g.fillRoundedRect(8, 22, 48, 38, 8);
    // Armor plates
    g.fillStyle(0xB8860B, 0.7);
    g.fillRoundedRect(12, 26, 18, 12, 3);
    g.fillRoundedRect(34, 26, 18, 12, 3);
    g.fillRoundedRect(14, 40, 36, 14, 3);
    g.lineStyle(1, 0xDAA520, 0.8);
    g.strokeRoundedRect(12, 26, 18, 12, 3);
    g.strokeRoundedRect(34, 26, 18, 12, 3);
    // Head
    g.fillStyle(dark, 1);
    g.fillCircle(32, 18, 16);
    // Helmet crest
    g.fillStyle(0xDAA520, 1);
    g.fillTriangle(32, 0, 24, 10, 40, 10);
    g.fillRect(26, 8, 12, 4);
    // Glowing eyes
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(24, 18, 5);
    g.fillCircle(40, 18, 5);
    g.fillStyle(0xFFFF00, 1);
    g.fillCircle(24, 18, 3);
    g.fillCircle(40, 18, 3);
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(25, 17, 1);
    g.fillCircle(41, 17, 1);
    // Brow
    g.fillStyle(darker, 1);
    g.fillRoundedRect(18, 12, 28, 4, 1);
    // Jaw
    g.fillStyle(0x8B7355, 1);
    g.fillRoundedRect(24, 24, 16, 6, 2);
    g.lineStyle(1, 0x000000, 0.5);
    g.lineBetween(26, 28, 38, 28);
    // Massive arms
    g.fillStyle(base, 1);
    g.fillRoundedRect(2, 24, 12, 28, 5);
    g.fillRoundedRect(50, 24, 12, 28, 5);
    // Arm plates
    g.fillStyle(0xB8860B, 0.7);
    g.fillRoundedRect(4, 28, 8, 10, 2);
    g.fillRoundedRect(52, 28, 8, 10, 2);
    // Fists
    g.fillStyle(darker, 1);
    g.fillCircle(8, 54, 5);
    g.fillCircle(56, 54, 5);
    // Feet
    g.fillStyle(darker, 1);
    g.fillRoundedRect(14, 58, 14, 6, 2);
    g.fillRoundedRect(36, 58, 14, 6, 2);
  }

  // ── Vitapup: Cute puppy, blue/purple, floppy ears, diamond forehead mark ──
  _draw_vitapup(g, base, light, dark, darker, c) {
    // Floppy ears
    g.fillStyle(dark, 1);
    g.fillRoundedRect(6, 14, 10, 20, 4);
    g.fillRoundedRect(48, 14, 10, 20, 4);
    // Body
    g.fillStyle(base, 1);
    g.fillRoundedRect(16, 30, 32, 24, 8);
    // Belly
    g.fillStyle(light, 1);
    g.fillRoundedRect(22, 36, 20, 14, 5);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 22, 14);
    // Face
    g.fillStyle(0xFFDDCC, 1);
    g.fillCircle(32, 26, 8);
    // Diamond mark on forehead
    g.fillStyle(0xB388FF, 1);
    g.fillTriangle(32, 8, 28, 14, 36, 14);
    g.fillTriangle(32, 20, 28, 14, 36, 14);
    // Big puppy eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(25, 22, 5);
    g.fillCircle(39, 22, 5);
    g.fillStyle(0x2244AA, 1);
    g.fillCircle(26, 22, 3);
    g.fillCircle(40, 22, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(27, 22, 2);
    g.fillCircle(41, 22, 2);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(28, 21, 1, 1);
    g.fillRect(42, 21, 1, 1);
    // Nose
    g.fillStyle(0x000000, 1);
    g.fillCircle(32, 28, 2);
    // Tongue
    g.fillStyle(0xFF6699, 1);
    g.fillRoundedRect(30, 30, 5, 4, 2);
    // Tail (wagging)
    g.fillStyle(light, 1);
    g.fillRoundedRect(46, 32, 12, 4, 2);
    g.fillRoundedRect(54, 28, 4, 8, 2);
    // Paws
    g.fillStyle(dark, 1);
    g.fillCircle(20, 54, 4);
    g.fillCircle(44, 54, 4);
    g.fillCircle(26, 56, 3);
    g.fillCircle(38, 56, 3);
  }

  // ── Etherhound: Medium dog, darker blue, sharp ears, ethereal wisps ──
  _draw_etherhound(g, base, light, dark, darker, c) {
    // Sharp pointed ears
    g.fillStyle(base, 1);
    g.fillTriangle(14, 6, 8, 24, 20, 24);
    g.fillTriangle(50, 6, 44, 24, 56, 24);
    g.fillStyle(light, 1);
    g.fillTriangle(14, 10, 11, 22, 17, 22);
    g.fillTriangle(50, 10, 47, 22, 53, 22);
    // Body
    g.fillStyle(base, 1);
    g.fillRoundedRect(14, 28, 36, 28, 6);
    // Chest
    g.fillStyle(light, 1);
    g.fillRoundedRect(20, 32, 24, 18, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 22, 14);
    // Snout
    g.fillStyle(dark, 1);
    g.fillRoundedRect(26, 26, 12, 8, 3);
    g.fillStyle(0xFFDDCC, 1);
    g.fillRoundedRect(27, 27, 10, 5, 2);
    // Nose
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(29, 26, 6, 3, 1);
    // Eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(24, 20, 4);
    g.fillCircle(40, 20, 4);
    g.fillStyle(0x1133AA, 1);
    g.fillCircle(25, 20, 3);
    g.fillCircle(41, 20, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 20, 1.5);
    g.fillCircle(42, 20, 1.5);
    // Ethereal glow wisps
    g.fillStyle(0x88BBFF, 0.3);
    g.fillCircle(6, 30, 4);
    g.fillCircle(58, 30, 4);
    g.fillCircle(10, 44, 3);
    g.fillCircle(54, 44, 3);
    g.fillStyle(0xAADDFF, 0.5);
    g.fillCircle(8, 36, 2);
    g.fillCircle(56, 36, 2);
    // Legs
    g.fillStyle(dark, 1);
    g.fillRoundedRect(18, 50, 8, 12, 2);
    g.fillRoundedRect(38, 50, 8, 12, 2);
    // Tail
    g.fillStyle(base, 1);
    g.fillRoundedRect(48, 30, 4, 14, 2);
    g.fillStyle(light, 0.6);
    g.fillCircle(52, 30, 3);
  }

  // ── Smartdoge: Majestic wolf/doge, royal blue, crown ears, flowing mane ──
  _draw_smartdoge(g, base, light, dark, darker, c) {
    // Flowing mane
    g.fillStyle(light, 0.6);
    g.fillCircle(10, 20, 8);
    g.fillCircle(54, 20, 8);
    g.fillCircle(8, 32, 6);
    g.fillCircle(56, 32, 6);
    // Crown-like ears
    g.fillStyle(0xDAA520, 1);
    g.fillTriangle(14, 0, 8, 16, 20, 16);
    g.fillTriangle(50, 0, 44, 16, 56, 16);
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(14, 4, 2);
    g.fillCircle(50, 4, 2);
    // Body
    g.fillStyle(base, 1);
    g.fillRoundedRect(14, 28, 36, 28, 6);
    // Royal chest
    g.fillStyle(0xDAA520, 0.4);
    g.fillRoundedRect(20, 32, 24, 16, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 15);
    // Mane wisps on sides
    g.fillStyle(light, 0.7);
    g.fillRoundedRect(6, 16, 8, 12, 3);
    g.fillRoundedRect(50, 16, 8, 12, 3);
    // Snout
    g.fillStyle(dark, 1);
    g.fillRoundedRect(24, 26, 16, 8, 4);
    g.fillStyle(0xCCBBAA, 1);
    g.fillRoundedRect(26, 27, 12, 5, 2);
    // Nose
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(29, 26, 6, 3, 1);
    // Majestic eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(24, 18, 5);
    g.fillCircle(40, 18, 5);
    g.fillStyle(0x1122DD, 1);
    g.fillCircle(25, 18, 3);
    g.fillCircle(41, 18, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(25, 18, 1.5);
    g.fillCircle(41, 18, 1.5);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(26, 17, 2, 1);
    g.fillRect(42, 17, 2, 1);
    // Legs
    g.fillStyle(dark, 1);
    g.fillRoundedRect(16, 50, 8, 12, 2);
    g.fillRoundedRect(40, 50, 8, 12, 2);
    // Tail
    g.fillStyle(light, 1);
    g.fillRoundedRect(48, 28, 6, 4, 2);
    g.fillRoundedRect(52, 24, 6, 4, 2);
    g.fillRoundedRect(56, 20, 6, 4, 2);
  }

  // ── Elonix: Fox/rocket hybrid, gold/red, pointy ears, lightning bolt tail ──
  _draw_elonix(g, base, light, dark, darker, c) {
    // Pointy fox ears
    g.fillStyle(base, 1);
    g.fillTriangle(14, 2, 8, 20, 20, 20);
    g.fillTriangle(50, 2, 44, 20, 56, 20);
    g.fillStyle(0xFF4444, 1);
    g.fillTriangle(14, 6, 11, 18, 17, 18);
    g.fillTriangle(50, 6, 47, 18, 53, 18);
    // Body (sleek rocket shape)
    g.fillStyle(base, 1);
    g.fillRoundedRect(18, 28, 28, 28, 6);
    // Belly (white/cream)
    g.fillStyle(0xFFF8E1, 1);
    g.fillRoundedRect(22, 34, 20, 16, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 22, 13);
    // Eyes (mischievous)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(25, 20, 4);
    g.fillCircle(39, 20, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 19, 2.5);
    g.fillCircle(40, 19, 2.5);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(27, 18, 1, 1);
    g.fillRect(41, 18, 1, 1);
    // Fox nose
    g.fillStyle(0x000000, 1);
    g.fillTriangle(32, 24, 29, 27, 35, 27);
    // Smirk
    g.lineStyle(1, 0x000000, 0.8);
    g.beginPath();
    g.moveTo(29, 29);
    g.lineTo(35, 29);
    g.lineTo(37, 27);
    g.strokePath();
    // Lightning bolt tail
    g.fillStyle(0xFFFF00, 1);
    g.beginPath();
    g.moveTo(48, 30);
    g.lineTo(56, 26);
    g.lineTo(52, 34);
    g.lineTo(60, 30);
    g.lineTo(54, 40);
    g.lineTo(56, 32);
    g.lineTo(48, 36);
    g.closePath();
    g.fillPath();
    // Legs
    g.fillStyle(dark, 1);
    g.fillRoundedRect(20, 52, 8, 10, 2);
    g.fillRoundedRect(36, 52, 8, 10, 2);
    // Rocket exhaust hint at feet
    g.fillStyle(0xFF6600, 0.5);
    g.fillCircle(24, 62, 3);
    g.fillCircle(40, 62, 3);
    g.fillStyle(0xFFFF00, 0.4);
    g.fillCircle(24, 62, 2);
    g.fillCircle(40, 62, 2);
  }

  // ── Musketeer: Armored fox, darker gold, cape-like back, sword tail ──
  _draw_musketeer(g, base, light, dark, darker, c) {
    // Cape
    g.fillStyle(0x8B0000, 0.8);
    g.fillTriangle(16, 26, 48, 26, 56, 58);
    g.fillTriangle(16, 26, 8, 58, 48, 26);
    g.fillStyle(0xAA0000, 0.5);
    g.fillTriangle(20, 30, 44, 30, 50, 54);
    // Pointed ears
    g.fillStyle(base, 1);
    g.fillTriangle(16, 2, 10, 18, 22, 18);
    g.fillTriangle(48, 2, 42, 18, 54, 18);
    // Body (armored)
    g.fillStyle(base, 1);
    g.fillRoundedRect(16, 28, 32, 26, 5);
    // Armor plate
    g.fillStyle(0xC0C0C0, 0.7);
    g.fillRoundedRect(20, 30, 24, 18, 4);
    g.lineStyle(1, 0xDDDDDD, 0.5);
    g.strokeRoundedRect(20, 30, 24, 18, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 13);
    // Hat/beret
    g.fillStyle(0x8B0000, 1);
    g.fillRoundedRect(18, 6, 28, 8, 3);
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(42, 8, 3);
    // Eyes (determined)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 20, 3);
    g.fillCircle(38, 20, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(27, 20, 2);
    g.fillCircle(39, 20, 2);
    // Confident smirk
    g.lineStyle(1, 0x000000, 1);
    g.beginPath();
    g.moveTo(28, 27);
    g.lineTo(36, 27);
    g.lineTo(38, 25);
    g.strokePath();
    // Sword-shaped tail
    g.fillStyle(0xC0C0C0, 1);
    g.fillRect(50, 28, 2, 20);
    g.fillStyle(0xDAA520, 1);
    g.fillRect(48, 46, 6, 3);
    g.fillStyle(0xC0C0C0, 1);
    g.fillTriangle(51, 26, 48, 30, 54, 30);
    // Legs with boots
    g.fillStyle(dark, 1);
    g.fillRoundedRect(20, 50, 8, 12, 2);
    g.fillRoundedRect(36, 50, 8, 12, 2);
    g.fillStyle(0x4E342E, 1);
    g.fillRoundedRect(18, 56, 12, 6, 2);
    g.fillRoundedRect(34, 56, 12, 6, 2);
  }

  // ── Dogelord: Shiba inu king, gold crown, royal robe, scepter ──
  _draw_dogelord(g, base, light, dark, darker, c) {
    // Royal robe
    g.fillStyle(0x8B0000, 1);
    g.fillRoundedRect(10, 30, 44, 30, 6);
    g.fillStyle(0xAA1111, 1);
    g.fillRoundedRect(14, 34, 36, 24, 4);
    // Ermine trim
    g.fillStyle(0xFFFAF0, 1);
    g.fillRect(10, 30, 44, 4);
    g.fillStyle(0x000000, 1);
    for (let i = 12; i < 54; i += 6) {
      g.fillRect(i, 31, 2, 2);
    }
    // Body underneath
    g.fillStyle(base, 1);
    g.fillRoundedRect(18, 28, 28, 26, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 14);
    // Ears (regal, pointed up)
    g.fillStyle(dark, 1);
    g.fillTriangle(14, 6, 10, 22, 20, 20);
    g.fillTriangle(50, 6, 44, 20, 54, 22);
    // Crown
    g.fillStyle(0xFFD700, 1);
    g.fillRect(18, 4, 28, 6);
    g.fillTriangle(18, 4, 22, -2, 26, 4);
    g.fillTriangle(28, 4, 32, -3, 36, 4);
    g.fillTriangle(38, 4, 42, -2, 46, 4);
    // Crown gems
    g.fillStyle(0xFF0000, 1);
    g.fillCircle(24, 6, 2);
    g.fillStyle(0x0000FF, 1);
    g.fillCircle(32, 5, 2);
    g.fillStyle(0x00FF00, 1);
    g.fillCircle(40, 6, 2);
    // Eyes (wise, slightly half-lidded)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(25, 18, 4);
    g.fillCircle(39, 18, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 19, 2.5);
    g.fillCircle(40, 19, 2.5);
    g.fillStyle(dark, 1);
    g.fillRect(21, 15, 9, 2);
    g.fillRect(35, 15, 9, 2);
    // Snout
    g.fillStyle(0xFFDDBB, 1);
    g.fillCircle(32, 26, 6);
    g.fillStyle(0x000000, 1);
    g.fillCircle(32, 24, 2);
    // Scepter
    g.fillStyle(0xDAA520, 1);
    g.fillRect(54, 14, 3, 40);
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(55, 12, 4);
    g.fillStyle(0xFF0000, 1);
    g.fillCircle(55, 12, 2);
    // Feet
    g.fillStyle(dark, 1);
    g.fillRoundedRect(18, 56, 10, 6, 2);
    g.fillRoundedRect(36, 56, 10, 6, 2);
  }

  // ── Rugpuller: Sneaky cat, dark purple, mask, bag of coins ──
  _draw_rugpuller(g, base, light, dark, darker, c) {
    // Tail (curled)
    g.fillStyle(dark, 1);
    g.fillRoundedRect(48, 24, 4, 20, 2);
    g.fillRoundedRect(48, 22, 10, 4, 2);
    g.fillRoundedRect(54, 22, 4, 8, 2);
    // Cat ears
    g.fillStyle(base, 1);
    g.fillTriangle(14, 4, 8, 20, 20, 20);
    g.fillTriangle(50, 4, 44, 20, 56, 20);
    g.fillStyle(0xFF6699, 1);
    g.fillTriangle(14, 8, 11, 18, 17, 18);
    g.fillTriangle(50, 8, 47, 18, 53, 18);
    // Body (sleek)
    g.fillStyle(base, 1);
    g.fillRoundedRect(14, 28, 34, 26, 6);
    g.fillStyle(dark, 1);
    g.fillRoundedRect(18, 34, 26, 16, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 13);
    // Mask over eyes
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(18, 14, 28, 8, 3);
    // Eyes (sneaky, narrowed)
    g.fillStyle(0x00FF00, 1);
    g.fillCircle(25, 18, 3);
    g.fillCircle(39, 18, 3);
    g.fillStyle(0x000000, 1);
    g.fillRect(23, 17, 5, 2);
    g.fillRect(37, 17, 5, 2);
    // Smirk
    g.lineStyle(1, 0xAA5555, 1);
    g.beginPath();
    g.moveTo(28, 26);
    g.lineTo(36, 26);
    g.lineTo(38, 24);
    g.strokePath();
    // Whiskers
    g.lineStyle(1, 0xAAAAAA, 0.6);
    g.lineBetween(20, 24, 8, 22);
    g.lineBetween(20, 26, 8, 28);
    g.lineBetween(44, 24, 56, 22);
    g.lineBetween(44, 26, 56, 28);
    // Bag of coins (in hand)
    g.fillStyle(0x8B4513, 1);
    g.fillCircle(10, 46, 7);
    g.fillStyle(0x6B3410, 1);
    g.fillRect(8, 38, 5, 8);
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(8, 44, 2);
    g.fillCircle(12, 46, 2);
    g.fillCircle(10, 48, 2);
    // Legs
    g.fillStyle(dark, 1);
    g.fillRoundedRect(18, 50, 8, 12, 2);
    g.fillRoundedRect(36, 50, 8, 12, 2);
  }

  // ── SBFraud: Fallen angel, gray/dark, broken wings, sad eyes, chains ──
  _draw_sbfraud(g, base, light, dark, darker, c) {
    // Broken wings
    g.fillStyle(0x666688, 0.6);
    g.fillTriangle(4, 20, 16, 28, 12, 42);
    g.fillTriangle(60, 20, 48, 28, 52, 42);
    // Wing breaks
    g.lineStyle(1, 0x444466, 0.8);
    g.lineBetween(8, 26, 14, 36);
    g.lineBetween(56, 26, 50, 36);
    g.fillStyle(0x555577, 0.5);
    g.fillTriangle(2, 24, 12, 22, 8, 34);
    g.fillTriangle(62, 24, 52, 22, 56, 34);
    // Body
    g.fillStyle(base, 1);
    g.fillRoundedRect(18, 28, 28, 26, 6);
    // Tattered suit
    g.fillStyle(0x334466, 1);
    g.fillRoundedRect(20, 30, 24, 20, 4);
    g.fillStyle(0x222244, 1);
    g.fillRect(30, 30, 4, 20);
    // Head
    g.fillStyle(0x8899AA, 1);
    g.fillCircle(32, 22, 12);
    // Messy curly hair
    g.fillStyle(0x333333, 1);
    g.fillCircle(24, 12, 5);
    g.fillCircle(32, 10, 5);
    g.fillCircle(40, 12, 5);
    g.fillCircle(22, 16, 4);
    g.fillCircle(42, 16, 4);
    // Sad eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 22, 4);
    g.fillCircle(38, 22, 4);
    g.fillStyle(0x445566, 1);
    g.fillCircle(27, 23, 2.5);
    g.fillCircle(39, 23, 2.5);
    // Droopy eyebrows (sad)
    g.lineStyle(2, 0x333333, 1);
    g.beginPath();
    g.moveTo(22, 18);
    g.lineTo(30, 16);
    g.strokePath();
    g.beginPath();
    g.moveTo(42, 18);
    g.lineTo(34, 16);
    g.strokePath();
    // Frown
    g.lineStyle(1, 0x555555, 1);
    g.beginPath();
    g.moveTo(28, 30);
    g.lineTo(32, 28);
    g.lineTo(36, 30);
    g.strokePath();
    // Chains on wrists
    g.lineStyle(2, 0x888888, 1);
    g.beginPath();
    g.moveTo(14, 44);
    g.lineTo(18, 42);
    g.lineTo(22, 44);
    g.lineTo(26, 42);
    g.strokePath();
    g.beginPath();
    g.moveTo(38, 42);
    g.lineTo(42, 44);
    g.lineTo(46, 42);
    g.lineTo(50, 44);
    g.strokePath();
    g.fillStyle(0x777777, 1);
    g.fillCircle(14, 44, 3);
    g.fillCircle(50, 44, 3);
    // Feet
    g.fillStyle(0x333344, 1);
    g.fillRoundedRect(20, 54, 10, 6, 2);
    g.fillRoundedRect(34, 54, 10, 6, 2);
  }

  // ── Trumpunk: Bull with wild orange hair/mane, gold accessories, bold ──
  _draw_trumpunk(g, base, light, dark, darker, c) {
    // Body (stocky bull)
    g.fillStyle(base, 1);
    g.fillRoundedRect(14, 30, 36, 28, 6);
    // Suit/jacket
    g.fillStyle(0x222244, 1);
    g.fillRoundedRect(16, 34, 32, 20, 4);
    // Tie
    g.fillStyle(0xFF0000, 1);
    g.fillTriangle(32, 34, 28, 40, 36, 40);
    g.fillRect(30, 40, 4, 12);
    // Head
    g.fillStyle(0xFFCCBB, 1);
    g.fillCircle(32, 22, 13);
    // Wild orange hair/mane
    g.fillStyle(0xFF8C00, 1);
    g.fillRoundedRect(16, 4, 32, 14, 4);
    g.fillCircle(18, 10, 6);
    g.fillCircle(46, 10, 6);
    g.fillCircle(24, 6, 5);
    g.fillCircle(40, 6, 5);
    g.fillCircle(32, 4, 6);
    // Swept side
    g.fillStyle(0xFFAA33, 1);
    g.fillCircle(48, 14, 5);
    g.fillCircle(50, 10, 4);
    // Small bull horns
    g.fillStyle(0xDAA520, 1);
    g.fillTriangle(12, 14, 8, 6, 18, 14);
    g.fillTriangle(52, 14, 46, 14, 56, 6);
    // Eyes (squinted, determined)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 22, 3);
    g.fillCircle(38, 22, 3);
    g.fillStyle(0x4488CC, 1);
    g.fillCircle(26, 22, 2);
    g.fillCircle(38, 22, 2);
    g.fillStyle(0x000000, 1);
    g.fillRect(23, 20, 7, 2);
    g.fillRect(35, 20, 7, 2);
    // Pursed lips
    g.fillStyle(0xCC8888, 1);
    g.fillRoundedRect(28, 28, 8, 4, 2);
    // Gold accessories
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(16, 36, 2);
    g.fillCircle(48, 36, 2);
    // Arms in bold stance
    g.fillStyle(0x222244, 1);
    g.fillRoundedRect(8, 34, 8, 18, 3);
    g.fillRoundedRect(48, 34, 8, 18, 3);
    // Hands
    g.fillStyle(0xFFCCBB, 1);
    g.fillCircle(12, 52, 4);
    g.fillCircle(52, 52, 4);
    // Feet
    g.fillStyle(0x333333, 1);
    g.fillRoundedRect(18, 56, 10, 6, 2);
    g.fillRoundedRect(36, 56, 10, 6, 2);
  }

  // ── Wallstreetbull: Charging bull, gold/bronze, stock chart horns ──
  _draw_wallstreetbull(g, base, light, dark, darker, c) {
    // Body (muscular, leaning forward)
    g.fillStyle(base, 1);
    g.fillRoundedRect(12, 26, 40, 30, 8);
    // Muscle definition
    g.fillStyle(light, 0.4);
    g.fillRoundedRect(16, 30, 14, 10, 3);
    g.fillRoundedRect(34, 30, 14, 10, 3);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 14);
    // Stock chart horns (going up)
    g.fillStyle(0xDAA520, 1);
    // Left horn - chart going up
    g.lineStyle(3, 0xDAA520, 1);
    g.beginPath();
    g.moveTo(18, 16);
    g.lineTo(12, 12);
    g.lineTo(8, 14);
    g.lineTo(4, 4);
    g.strokePath();
    // Right horn
    g.beginPath();
    g.moveTo(46, 16);
    g.lineTo(52, 12);
    g.lineTo(56, 14);
    g.lineTo(60, 4);
    g.strokePath();
    // Green arrow tip
    g.fillStyle(0x00FF00, 1);
    g.fillTriangle(4, 4, 2, 10, 8, 8);
    g.fillTriangle(60, 4, 56, 8, 62, 10);
    // Nose ring
    g.lineStyle(2, 0xFFD700, 1);
    g.beginPath();
    g.arc(32, 28, 4, 0, Math.PI);
    g.strokePath();
    // Eyes (fierce)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(24, 18, 4);
    g.fillCircle(40, 18, 4);
    g.fillStyle(0x880000, 1);
    g.fillCircle(25, 18, 2.5);
    g.fillCircle(41, 18, 2.5);
    // Angry brows
    g.fillStyle(darker, 1);
    g.beginPath();
    g.moveTo(20, 12);
    g.lineTo(30, 14);
    g.lineTo(30, 12);
    g.lineTo(20, 10);
    g.closePath();
    g.fillPath();
    g.beginPath();
    g.moveTo(44, 12);
    g.lineTo(34, 14);
    g.lineTo(34, 12);
    g.lineTo(44, 10);
    g.closePath();
    g.fillPath();
    // Nostrils
    g.fillStyle(0x000000, 0.6);
    g.fillCircle(28, 26, 2);
    g.fillCircle(36, 26, 2);
    // Front legs (charging pose)
    g.fillStyle(dark, 1);
    g.fillRoundedRect(14, 50, 8, 12, 2);
    g.fillRoundedRect(24, 52, 8, 10, 2);
    // Hooves
    g.fillStyle(0x333333, 1);
    g.fillRect(14, 58, 8, 4);
    g.fillRect(38, 58, 8, 4);
    // Back legs
    g.fillStyle(dark, 1);
    g.fillRoundedRect(38, 50, 8, 12, 2);
    g.fillRoundedRect(48, 48, 6, 10, 2);
    // Tail
    g.lineStyle(2, dark, 1);
    g.beginPath();
    g.moveTo(52, 30);
    g.lineTo(58, 26);
    g.lineTo(60, 30);
    g.strokePath();
  }

  // ── Goldenbull: Massive golden bull, shining, diamond horns ──
  _draw_goldenbull(g, base, light, dark, darker, c) {
    // Glow aura
    g.fillStyle(0xFFD700, 0.1);
    g.fillCircle(32, 32, 30);
    g.fillStyle(0xFFD700, 0.05);
    g.fillCircle(32, 32, 32);
    // Massive body
    g.fillStyle(0xDAA520, 1);
    g.fillRoundedRect(8, 24, 48, 34, 8);
    // Gold sheen
    g.fillStyle(0xFFD700, 0.5);
    g.fillRoundedRect(12, 28, 20, 14, 4);
    g.fillStyle(0xB8860B, 0.5);
    g.fillRoundedRect(32, 36, 20, 14, 4);
    // Head
    g.fillStyle(0xDAA520, 1);
    g.fillCircle(32, 18, 16);
    g.fillStyle(0xFFD700, 0.4);
    g.fillCircle(28, 14, 6);
    // Diamond-studded horns
    g.fillStyle(0xFFD700, 1);
    g.lineStyle(3, 0xFFD700, 1);
    g.beginPath();
    g.moveTo(16, 14);
    g.lineTo(6, 4);
    g.lineTo(2, 8);
    g.strokePath();
    g.beginPath();
    g.moveTo(48, 14);
    g.lineTo(58, 4);
    g.lineTo(62, 8);
    g.strokePath();
    // Diamonds on horns
    g.fillStyle(0x88CCFF, 1);
    g.fillRect(5, 5, 3, 3);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(6, 6, 1, 1);
    g.fillStyle(0x88CCFF, 1);
    g.fillRect(57, 5, 3, 3);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(58, 6, 1, 1);
    // Eyes (powerful)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(24, 18, 5);
    g.fillCircle(40, 18, 5);
    g.fillStyle(0x990000, 1);
    g.fillCircle(25, 18, 3);
    g.fillCircle(41, 18, 3);
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(25, 17, 1);
    g.fillCircle(41, 17, 1);
    // Nose ring (diamond)
    g.lineStyle(2, 0xFFD700, 1);
    g.beginPath();
    g.arc(32, 28, 4, 0, Math.PI);
    g.strokePath();
    g.fillStyle(0x88CCFF, 1);
    g.fillRect(31, 31, 3, 3);
    // Legs
    g.fillStyle(0xB8860B, 1);
    g.fillRoundedRect(12, 52, 10, 10, 2);
    g.fillRoundedRect(42, 52, 10, 10, 2);
    g.fillRoundedRect(22, 54, 8, 8, 2);
    g.fillRoundedRect(34, 54, 8, 8, 2);
    // Golden hooves
    g.fillStyle(0xFFD700, 1);
    g.fillRect(12, 58, 10, 4);
    g.fillRect(42, 58, 10, 4);
    // Sparkle effects
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillRect(18, 28, 2, 2);
    g.fillRect(44, 32, 2, 2);
    g.fillRect(30, 42, 2, 2);
    g.fillRect(50, 26, 2, 2);
  }

  // ── Gavinite: Crystal/gem creature, polkadot pattern, geometric ──
  _draw_gavinite(g, base, light, dark, darker, c) {
    // Geometric crystal body (hexagonal feel)
    g.fillStyle(base, 1);
    g.beginPath();
    g.moveTo(32, 10);
    g.lineTo(50, 20);
    g.lineTo(50, 44);
    g.lineTo(32, 56);
    g.lineTo(14, 44);
    g.lineTo(14, 20);
    g.closePath();
    g.fillPath();
    // Facets
    g.fillStyle(light, 0.5);
    g.beginPath();
    g.moveTo(32, 10);
    g.lineTo(50, 20);
    g.lineTo(32, 32);
    g.closePath();
    g.fillPath();
    g.fillStyle(dark, 0.5);
    g.beginPath();
    g.moveTo(32, 32);
    g.lineTo(14, 44);
    g.lineTo(32, 56);
    g.closePath();
    g.fillPath();
    // Polkadot pattern
    const dotColors = [0xFF0066, 0x00CCFF, 0xFFFF00, 0x66FF66, 0xFF9900, 0xCC66FF];
    const dotPositions = [[24, 22], [40, 22], [20, 34], [44, 34], [28, 44], [36, 44], [32, 28]];
    dotPositions.forEach(([dx, dy], i) => {
      g.fillStyle(dotColors[i % dotColors.length], 0.8);
      g.fillCircle(dx, dy, 3);
      g.fillStyle(0xFFFFFF, 0.4);
      g.fillCircle(dx - 1, dy - 1, 1);
    });
    // Crystal eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 18, 4);
    g.fillCircle(38, 18, 4);
    g.fillStyle(base, 1);
    g.fillCircle(27, 18, 2);
    g.fillCircle(39, 18, 2);
    // Edge glow
    g.lineStyle(1, 0xFFFFFF, 0.3);
    g.beginPath();
    g.moveTo(32, 10);
    g.lineTo(50, 20);
    g.lineTo(50, 44);
    g.lineTo(32, 56);
    g.lineTo(14, 44);
    g.lineTo(14, 20);
    g.closePath();
    g.strokePath();
  }

  // ── Polkadroid: Robot with polkadot pattern, pink/magenta ──
  _draw_polkadroid(g, base, light, dark, darker, c) {
    // Antenna
    g.fillStyle(0xAAAAAA, 1);
    g.fillRect(30, 2, 4, 8);
    g.fillStyle(base, 1);
    g.fillCircle(32, 4, 4);
    // Robot head
    g.fillStyle(0xCCCCCC, 1);
    g.fillRoundedRect(14, 10, 36, 22, 4);
    // Face plate
    g.fillStyle(0x222222, 1);
    g.fillRoundedRect(18, 14, 28, 14, 3);
    // LED eyes
    g.fillStyle(base, 1);
    g.fillRoundedRect(20, 16, 8, 6, 2);
    g.fillRoundedRect(36, 16, 8, 6, 2);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(22, 17, 3, 3);
    g.fillRect(38, 17, 3, 3);
    // Mouth display
    g.fillStyle(base, 0.8);
    g.fillRect(24, 24, 16, 2);
    // Robot body
    g.fillStyle(0xBBBBBB, 1);
    g.fillRoundedRect(12, 32, 40, 24, 4);
    // Polkadot pattern on body
    const dots = [[20, 38], [32, 36], [44, 38], [26, 46], [38, 46]];
    dots.forEach(([dx, dy]) => {
      g.fillStyle(base, 0.8);
      g.fillCircle(dx, dy, 3);
    });
    // Body panel lines
    g.lineStyle(1, 0x888888, 0.5);
    g.lineBetween(12, 44, 52, 44);
    // Arms (mechanical)
    g.fillStyle(0x999999, 1);
    g.fillRoundedRect(4, 34, 10, 6, 2);
    g.fillRoundedRect(50, 34, 10, 6, 2);
    g.fillRect(6, 40, 6, 10);
    g.fillRect(52, 40, 6, 10);
    // Clamp hands
    g.fillStyle(0x777777, 1);
    g.fillRect(4, 48, 4, 4);
    g.fillRect(10, 48, 4, 4);
    g.fillRect(50, 48, 4, 4);
    g.fillRect(56, 48, 4, 4);
    // Legs
    g.fillStyle(0x999999, 1);
    g.fillRoundedRect(18, 54, 8, 8, 2);
    g.fillRoundedRect(38, 54, 8, 8, 2);
    // Feet treads
    g.fillStyle(0x666666, 1);
    g.fillRect(16, 58, 12, 4);
    g.fillRect(36, 58, 12, 4);
  }

  // ── CZDragon: Dragon, yellow/gold, small wings, fire breath hint ──
  _draw_czdragon(g, base, light, dark, darker, c) {
    // Small wings
    g.fillStyle(dark, 0.8);
    g.fillTriangle(6, 20, 14, 30, 6, 40);
    g.fillTriangle(58, 20, 50, 30, 58, 40);
    g.fillStyle(light, 0.5);
    g.fillTriangle(8, 24, 14, 32, 8, 38);
    g.fillTriangle(56, 24, 50, 32, 56, 38);
    // Body (dragon-like)
    g.fillStyle(base, 1);
    g.fillRoundedRect(16, 26, 32, 28, 6);
    // Belly scales
    g.fillStyle(light, 0.7);
    g.fillRoundedRect(22, 32, 20, 16, 4);
    g.lineStyle(1, dark, 0.3);
    g.lineBetween(24, 38, 40, 38);
    g.lineBetween(26, 42, 38, 42);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 14);
    // Horns
    g.fillStyle(darker, 1);
    g.fillTriangle(18, 8, 14, 2, 22, 14);
    g.fillTriangle(46, 8, 42, 14, 50, 2);
    // Fierce eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(25, 18, 4);
    g.fillCircle(39, 18, 4);
    g.fillStyle(0xFF0000, 1);
    g.fillCircle(26, 18, 2.5);
    g.fillCircle(40, 18, 2.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 18, 1.5);
    g.fillCircle(40, 18, 1.5);
    // Angry brow
    g.fillStyle(darker, 1);
    g.fillRect(20, 13, 8, 2);
    g.fillRect(36, 13, 8, 2);
    // Snout
    g.fillStyle(dark, 1);
    g.fillRoundedRect(26, 24, 12, 6, 2);
    // Nostrils (fire coming out)
    g.fillStyle(0xFF6600, 0.8);
    g.fillCircle(28, 24, 2);
    g.fillCircle(36, 24, 2);
    // Fire breath hint
    g.fillStyle(0xFF4400, 0.5);
    g.fillTriangle(36, 22, 56, 16, 48, 24);
    g.fillStyle(0xFFAA00, 0.4);
    g.fillTriangle(38, 22, 52, 18, 46, 24);
    g.fillStyle(0xFFFF00, 0.3);
    g.fillTriangle(40, 22, 48, 20, 44, 24);
    // Claws
    g.fillStyle(dark, 1);
    g.fillRoundedRect(16, 50, 10, 10, 2);
    g.fillRoundedRect(38, 50, 10, 10, 2);
    // Tail
    g.fillStyle(dark, 1);
    g.lineStyle(3, dark, 1);
    g.beginPath();
    g.moveTo(18, 48);
    g.lineTo(8, 54);
    g.lineTo(4, 50);
    g.strokePath();
    g.fillTriangle(4, 48, 2, 54, 8, 52);
  }

  // ── BNBeast: Large beast, dark gold, armored scales ──
  _draw_bnbeast(g, base, light, dark, darker, c) {
    // Large armored body
    g.fillStyle(base, 1);
    g.fillRoundedRect(8, 22, 48, 36, 8);
    // Armored scale rows
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const sx = 14 + col * 10;
        const sy = 26 + row * 10;
        g.fillStyle(dark, 0.7);
        g.fillRoundedRect(sx, sy, 9, 8, 2);
        g.fillStyle(light, 0.3);
        g.fillRect(sx + 1, sy + 1, 4, 3);
      }
    }
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 18, 14);
    // Head armor
    g.fillStyle(darker, 0.7);
    g.fillRoundedRect(20, 6, 24, 10, 3);
    // Ears/horns
    g.fillStyle(darker, 1);
    g.fillTriangle(14, 10, 10, 4, 20, 14);
    g.fillTriangle(50, 10, 44, 14, 54, 4);
    // Eyes (beast-like)
    g.fillStyle(0xFFDD00, 1);
    g.fillCircle(24, 18, 4);
    g.fillCircle(40, 18, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(23, 17, 3, 3);
    g.fillRect(39, 17, 3, 3);
    // Muzzle
    g.fillStyle(dark, 1);
    g.fillRoundedRect(24, 24, 16, 8, 3);
    // Fangs
    g.fillStyle(0xFFFFFF, 1);
    g.fillTriangle(26, 28, 28, 33, 30, 28);
    g.fillTriangle(34, 28, 36, 33, 38, 28);
    // Powerful legs
    g.fillStyle(dark, 1);
    g.fillRoundedRect(12, 52, 12, 10, 3);
    g.fillRoundedRect(40, 52, 12, 10, 3);
    // Claws
    g.fillStyle(0x333333, 1);
    g.fillRect(12, 58, 4, 4);
    g.fillRect(18, 58, 4, 4);
    g.fillRect(40, 58, 4, 4);
    g.fillRect(46, 58, 4, 4);
    // Tail
    g.fillStyle(dark, 1);
    g.fillRoundedRect(52, 36, 10, 4, 2);
    g.fillCircle(60, 38, 4);
  }

  // ── Boredchimp: Bored ape, sunglasses, cigarette, hipster ──
  _draw_boredchimp(g, base, light, dark, darker, c) {
    // Ears
    g.fillStyle(dark, 1);
    g.fillCircle(10, 20, 7);
    g.fillCircle(54, 20, 7);
    g.fillStyle(0xFFBB99, 1);
    g.fillCircle(10, 20, 4);
    g.fillCircle(54, 20, 4);
    // Body (slouchy posture)
    g.fillStyle(base, 1);
    g.fillRoundedRect(16, 30, 32, 26, 6);
    // Trendy t-shirt
    g.fillStyle(0x333333, 1);
    g.fillRoundedRect(18, 32, 28, 20, 4);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 22, 14);
    // Beanie/cap
    g.fillStyle(0x663399, 1);
    g.fillRoundedRect(18, 6, 28, 10, 4);
    g.fillStyle(0x552288, 1);
    g.fillRect(18, 12, 28, 3);
    // Sunglasses (very bored look)
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(18, 18, 12, 8, 2);
    g.fillRoundedRect(34, 18, 12, 8, 2);
    g.fillRect(30, 20, 4, 2);
    // Lens reflection
    g.fillStyle(0x4444FF, 0.3);
    g.fillRect(20, 20, 4, 3);
    g.fillRect(36, 20, 4, 3);
    // Bored mouth (flat line)
    g.lineStyle(2, 0x000000, 0.6);
    g.lineBetween(26, 30, 38, 30);
    // Cigarette
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(38, 28, 16, 2);
    g.fillStyle(0xFF6600, 1);
    g.fillRect(52, 27, 4, 4);
    // Smoke wisps
    g.fillStyle(0xCCCCCC, 0.3);
    g.fillCircle(56, 24, 2);
    g.fillCircle(58, 20, 3);
    g.fillCircle(56, 16, 2);
    // Arms (lazy, hanging)
    g.fillStyle(base, 1);
    g.fillRoundedRect(8, 34, 10, 18, 3);
    g.fillRoundedRect(46, 34, 10, 18, 3);
    // Feet
    g.fillStyle(dark, 1);
    g.fillRoundedRect(18, 54, 10, 6, 2);
    g.fillRoundedRect(36, 54, 10, 6, 2);
  }

  // ── Pepeking: Legendary frog king, green, crown, cape, smug ──
  _draw_pepeking(g, base, light, dark, darker, c) {
    // Royal cape
    g.fillStyle(0x8B0000, 0.8);
    g.fillTriangle(8, 24, 32, 22, 8, 60);
    g.fillTriangle(56, 24, 32, 22, 56, 60);
    g.fillStyle(0xAA1122, 0.5);
    g.fillTriangle(12, 28, 32, 26, 12, 56);
    g.fillTriangle(52, 28, 32, 26, 52, 56);
    // Ermine trim
    g.fillStyle(0xFFF8F0, 1);
    g.fillRect(8, 24, 48, 3);
    g.fillStyle(0x000000, 1);
    for (let i = 10; i < 56; i += 5) g.fillRect(i, 25, 1, 1);
    // Wide frog body
    g.fillStyle(base, 1);
    g.fillRoundedRect(12, 26, 40, 28, 10);
    // Belly
    g.fillStyle(0x88FF88, 1);
    g.fillRoundedRect(18, 32, 28, 18, 6);
    // Wide frog head
    g.fillStyle(base, 1);
    g.fillRoundedRect(8, 10, 48, 22, 10);
    // Crown
    g.fillStyle(0xFFD700, 1);
    g.fillRect(16, 4, 32, 8);
    g.fillTriangle(16, 4, 20, -2, 24, 4);
    g.fillTriangle(28, 4, 32, -4, 36, 4);
    g.fillTriangle(40, 4, 44, -2, 48, 4);
    // Crown jewels
    g.fillStyle(0xFF0000, 1);
    g.fillCircle(22, 6, 2);
    g.fillStyle(0x00FF00, 1);
    g.fillCircle(32, 5, 2);
    g.fillStyle(0xFF0000, 1);
    g.fillCircle(42, 6, 2);
    // Huge bulging eyes (signature Pepe)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(20, 16, 8);
    g.fillCircle(44, 16, 8);
    g.fillStyle(0x000000, 1);
    g.fillCircle(22, 17, 4);
    g.fillCircle(46, 17, 4);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(23, 15, 2, 2);
    g.fillRect(47, 15, 2, 2);
    // Smug smile (wide)
    g.lineStyle(2, 0x006600, 1);
    g.beginPath();
    g.moveTo(18, 26);
    g.lineTo(24, 28);
    g.lineTo(32, 30);
    g.lineTo(40, 28);
    g.lineTo(46, 26);
    g.strokePath();
    // Smug cheek lines
    g.lineStyle(1, 0x006600, 0.5);
    g.lineBetween(14, 22, 18, 26);
    g.lineBetween(50, 22, 46, 26);
    // Arms holding scepter
    g.fillStyle(dark, 1);
    g.fillRoundedRect(4, 28, 10, 16, 4);
    g.fillRoundedRect(50, 28, 10, 16, 4);
    // Scepter
    g.fillStyle(0xDAA520, 1);
    g.fillRect(56, 10, 3, 36);
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(57, 8, 4);
    g.fillStyle(0x00FF00, 1);
    g.fillCircle(57, 8, 2);
    // Frog feet
    g.fillStyle(dark, 1);
    g.fillRoundedRect(14, 52, 14, 8, 3);
    g.fillRoundedRect(36, 52, 14, 8, 3);
    // Toe lines
    g.lineStyle(1, darker, 0.6);
    g.lineBetween(18, 53, 18, 59);
    g.lineBetween(22, 53, 22, 59);
    g.lineBetween(40, 53, 40, 59);
    g.lineBetween(44, 53, 44, 59);
  }

  // ── Vaporware: Ghost/vapor, teal, translucent, circuit patterns ──
  _draw_vaporware(g, base, light, dark, darker, c) {
    // Translucent body (ghostly shape)
    g.fillStyle(base, 0.3);
    g.fillCircle(32, 28, 20);
    g.fillStyle(base, 0.5);
    g.fillCircle(32, 28, 16);
    g.fillStyle(base, 0.7);
    g.fillCircle(32, 28, 12);
    // Vapor tendrils at bottom
    g.fillStyle(base, 0.3);
    g.fillCircle(20, 50, 6);
    g.fillCircle(32, 52, 6);
    g.fillCircle(44, 50, 6);
    g.fillCircle(16, 46, 4);
    g.fillCircle(48, 46, 4);
    // Circuit patterns
    g.lineStyle(1, light, 0.5);
    g.lineBetween(20, 22, 20, 34);
    g.lineBetween(20, 34, 28, 34);
    g.lineBetween(36, 20, 44, 20);
    g.lineBetween(44, 20, 44, 30);
    g.lineBetween(24, 40, 40, 40);
    // Circuit nodes
    g.fillStyle(0x00FFFF, 0.7);
    g.fillCircle(20, 22, 2);
    g.fillCircle(28, 34, 2);
    g.fillCircle(36, 20, 2);
    g.fillCircle(44, 30, 2);
    // Eyes (ghostly)
    g.fillStyle(0x00FFFF, 0.9);
    g.fillCircle(26, 24, 5);
    g.fillCircle(38, 24, 5);
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 24, 3);
    g.fillCircle(38, 24, 3);
    g.fillStyle(0x00FFFF, 1);
    g.fillCircle(27, 24, 1.5);
    g.fillCircle(39, 24, 1.5);
    // Mouth (O shape, surprised)
    g.fillStyle(0x008888, 0.8);
    g.fillCircle(32, 34, 3);
    g.fillStyle(base, 0.5);
    g.fillCircle(32, 34, 1.5);
  }

  // ── Deepfaker: Shape-shifting blob, purple/teal gradient, overlapping faces ──
  _draw_deepfaker(g, base, light, dark, darker, c) {
    // Shifting blob base
    g.fillStyle(0x6644AA, 0.4);
    g.fillCircle(28, 32, 18);
    g.fillStyle(0x44AAAA, 0.4);
    g.fillCircle(38, 30, 16);
    g.fillStyle(base, 0.6);
    g.fillCircle(32, 32, 16);
    // Multiple overlapping face outlines
    // Face 1 (slightly left)
    g.lineStyle(1, 0xAA88FF, 0.4);
    g.strokeCircle(26, 28, 10);
    g.fillStyle(0xAA88FF, 0.3);
    g.fillCircle(22, 26, 2);
    g.fillCircle(30, 26, 2);
    // Face 2 (slightly right, different)
    g.lineStyle(1, 0x44DDDD, 0.4);
    g.strokeCircle(38, 28, 10);
    g.fillStyle(0x44DDDD, 0.3);
    g.fillCircle(34, 26, 2);
    g.fillCircle(42, 26, 2);
    // Main face (center, most solid)
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillCircle(28, 26, 4);
    g.fillCircle(38, 26, 4);
    g.fillStyle(base, 1);
    g.fillCircle(29, 26, 2.5);
    g.fillCircle(39, 26, 2.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(29, 26, 1.5);
    g.fillCircle(39, 26, 1.5);
    // Shifting smile
    g.lineStyle(1, 0xFFFFFF, 0.6);
    g.beginPath();
    g.moveTo(28, 34);
    g.lineTo(32, 36);
    g.lineTo(36, 34);
    g.strokePath();
    // Digital glitch lines
    g.fillStyle(0xFF00FF, 0.2);
    g.fillRect(10, 24, 44, 2);
    g.fillStyle(0x00FFFF, 0.2);
    g.fillRect(8, 36, 48, 2);
    g.fillRect(14, 42, 36, 1);
    // Tendrils/extensions
    g.fillStyle(base, 0.3);
    g.fillCircle(14, 40, 6);
    g.fillCircle(50, 40, 6);
    g.fillCircle(20, 50, 5);
    g.fillCircle(44, 50, 5);
    g.fillCircle(32, 52, 5);
    // Floating pixel fragments
    g.fillStyle(0xBB66FF, 0.5);
    g.fillRect(8, 14, 4, 4);
    g.fillRect(52, 16, 4, 4);
    g.fillRect(12, 52, 3, 3);
    g.fillRect(48, 50, 3, 3);
  }

  // ── Chainlinker: Chain link creature, blue hexagon body, antenna ──
  _draw_chainlinker(g, base, light, dark, darker, c) {
    // Antenna
    g.fillStyle(0xAAAAAA, 1);
    g.fillRect(30, 2, 4, 10);
    g.fillStyle(0x00CCFF, 1);
    g.fillCircle(32, 4, 3);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillCircle(31, 3, 1);
    // Second antenna
    g.fillStyle(0xAAAAAA, 1);
    g.fillRect(44, 6, 3, 8);
    g.fillStyle(0x00CCFF, 1);
    g.fillCircle(45, 6, 2);
    // Hexagon body
    g.fillStyle(base, 1);
    g.beginPath();
    g.moveTo(32, 12);
    g.lineTo(50, 22);
    g.lineTo(50, 42);
    g.lineTo(32, 52);
    g.lineTo(14, 42);
    g.lineTo(14, 22);
    g.closePath();
    g.fillPath();
    // Inner hexagon
    g.fillStyle(light, 0.4);
    g.beginPath();
    g.moveTo(32, 18);
    g.lineTo(44, 24);
    g.lineTo(44, 38);
    g.lineTo(32, 44);
    g.lineTo(20, 38);
    g.lineTo(20, 24);
    g.closePath();
    g.fillPath();
    // Chain links pattern
    g.lineStyle(2, 0xFFFFFF, 0.5);
    g.strokeCircle(26, 30, 4);
    g.strokeCircle(38, 30, 4);
    g.strokeCircle(32, 38, 4);
    // Connect chain links
    g.lineStyle(1, 0xFFFFFF, 0.3);
    g.lineBetween(30, 30, 34, 30);
    g.lineBetween(28, 34, 30, 36);
    g.lineBetween(36, 34, 34, 36);
    // Eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 24, 4);
    g.fillCircle(38, 24, 4);
    g.fillStyle(0x0033AA, 1);
    g.fillCircle(27, 24, 2.5);
    g.fillCircle(39, 24, 2.5);
    // Legs
    g.fillStyle(dark, 1);
    g.fillRoundedRect(18, 50, 8, 10, 2);
    g.fillRoundedRect(38, 50, 8, 10, 2);
    // Hex border
    g.lineStyle(1, light, 0.6);
    g.beginPath();
    g.moveTo(32, 12);
    g.lineTo(50, 22);
    g.lineTo(50, 42);
    g.lineTo(32, 52);
    g.lineTo(14, 42);
    g.lineTo(14, 22);
    g.closePath();
    g.strokePath();
  }

  // ── Bandoracle: Crystal ball creature, purple, mystical eye ──
  _draw_bandoracle(g, base, light, dark, darker, c) {
    // Mystical aura
    g.fillStyle(base, 0.15);
    g.fillCircle(32, 30, 28);
    g.fillStyle(base, 0.1);
    g.fillCircle(32, 30, 30);
    // Crystal ball body
    g.fillStyle(base, 0.8);
    g.fillCircle(32, 30, 20);
    // Inner glow gradient
    g.fillStyle(light, 0.4);
    g.fillCircle(28, 26, 12);
    g.fillStyle(0xFFFFFF, 0.15);
    g.fillCircle(24, 22, 8);
    // Stand/base
    g.fillStyle(0x666666, 1);
    g.fillRoundedRect(20, 48, 24, 4, 2);
    g.fillStyle(0x555555, 1);
    g.fillRoundedRect(16, 52, 32, 6, 3);
    g.fillStyle(0x777777, 1);
    g.fillRect(22, 50, 20, 2);
    // Mystical eye in center
    g.fillStyle(0xFFFFFF, 1);
    g.beginPath();
    g.moveTo(20, 30);
    g.lineTo(32, 22);
    g.lineTo(44, 30);
    g.lineTo(32, 38);
    g.closePath();
    g.fillPath();
    // Iris
    g.fillStyle(0x9933FF, 1);
    g.fillCircle(32, 30, 6);
    g.fillStyle(0x000000, 1);
    g.fillCircle(32, 30, 3);
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(30, 28, 2);
    // Sparkles around ball
    g.fillStyle(0xFFFFFF, 0.6);
    g.fillRect(10, 18, 2, 2);
    g.fillRect(52, 22, 2, 2);
    g.fillRect(14, 40, 2, 2);
    g.fillRect(48, 38, 2, 2);
    g.fillRect(32, 8, 2, 2);
    // Mystical runes
    g.lineStyle(1, 0xBB88FF, 0.4);
    g.strokeCircle(32, 30, 22);
  }

  // ── Moneroach: Cockroach, dark gray/orange, stealth markings, visor ──
  _draw_moneroach(g, base, light, dark, darker, c) {
    // Antennae
    g.lineStyle(2, 0x444444, 1);
    g.beginPath();
    g.moveTo(22, 14);
    g.lineTo(14, 2);
    g.strokePath();
    g.beginPath();
    g.moveTo(42, 14);
    g.lineTo(50, 2);
    g.strokePath();
    g.fillStyle(base, 1);
    g.fillCircle(14, 2, 2);
    g.fillCircle(50, 2, 2);
    // Shell/carapace body
    g.fillStyle(0x444444, 1);
    g.fillRoundedRect(14, 26, 36, 30, 8);
    // Stealth stripe markings
    g.fillStyle(base, 0.5);
    g.fillRect(16, 30, 32, 3);
    g.fillRect(16, 38, 32, 3);
    g.fillRect(16, 46, 32, 3);
    // Segments
    g.lineStyle(1, 0x333333, 0.5);
    g.lineBetween(14, 36, 50, 36);
    g.lineBetween(14, 44, 50, 44);
    // Head
    g.fillStyle(0x555555, 1);
    g.fillCircle(32, 18, 12);
    // Visor
    g.fillStyle(0x00FF00, 0.5);
    g.fillRoundedRect(18, 14, 28, 8, 3);
    g.fillStyle(0x00FF00, 0.8);
    g.fillRoundedRect(20, 16, 24, 4, 2);
    // Visor scan line
    g.fillStyle(0x00FF00, 0.3);
    g.fillRect(20, 17, 24, 1);
    // Eyes behind visor
    g.fillStyle(0xFF0000, 0.6);
    g.fillCircle(26, 18, 2);
    g.fillCircle(38, 18, 2);
    // Mandibles
    g.fillStyle(0x333333, 1);
    g.fillTriangle(28, 26, 26, 30, 30, 30);
    g.fillTriangle(36, 26, 34, 30, 38, 30);
    // Legs (6 cockroach legs)
    g.lineStyle(2, 0x444444, 1);
    g.lineBetween(14, 32, 4, 36);
    g.lineBetween(14, 40, 4, 44);
    g.lineBetween(14, 48, 4, 52);
    g.lineBetween(50, 32, 60, 36);
    g.lineBetween(50, 40, 60, 44);
    g.lineBetween(50, 48, 60, 52);
  }

  // ── Zcashghost: Ghost, transparent blue/white, shield symbol, ethereal ──
  _draw_zcashghost(g, base, light, dark, darker, c) {
    // Ethereal glow
    g.fillStyle(0x88BBFF, 0.1);
    g.fillCircle(32, 28, 26);
    // Ghost body (classic ghost shape)
    g.fillStyle(0xDDEEFF, 0.6);
    g.fillRoundedRect(14, 10, 36, 36, 16);
    // Ghost bottom (wavy)
    g.fillStyle(0xDDEEFF, 0.6);
    g.fillRect(14, 38, 36, 10);
    g.fillStyle(0xDDEEFF, 0.6);
    g.fillCircle(18, 50, 4);
    g.fillCircle(26, 52, 4);
    g.fillCircle(38, 52, 4);
    g.fillCircle(46, 50, 4);
    // Cut out wavy bottom
    g.fillStyle(0x000000, 0);
    // Inner body (more opaque)
    g.fillStyle(0xCCDDFF, 0.4);
    g.fillRoundedRect(18, 14, 28, 28, 12);
    // Shield symbol on body
    g.lineStyle(2, base, 0.8);
    g.beginPath();
    g.moveTo(32, 28);
    g.lineTo(40, 32);
    g.lineTo(40, 40);
    g.lineTo(32, 44);
    g.lineTo(24, 40);
    g.lineTo(24, 32);
    g.closePath();
    g.strokePath();
    // Z inside shield
    g.fillStyle(base, 0.8);
    g.fillRect(28, 32, 8, 2);
    g.beginPath();
    g.moveTo(36, 32);
    g.lineTo(28, 40);
    g.lineTo(36, 40);
    g.strokePath();
    // Ghost eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 20, 5);
    g.fillCircle(38, 20, 5);
    g.fillStyle(0x4488FF, 0.8);
    g.fillCircle(27, 20, 3);
    g.fillCircle(39, 20, 3);
    g.fillStyle(0x000000, 0.5);
    g.fillCircle(27, 21, 1.5);
    g.fillCircle(39, 21, 1.5);
    // Ghost mouth (small O)
    g.fillStyle(0xAABBDD, 0.5);
    g.fillCircle(32, 26, 2);
    // Sparkle particles
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillRect(10, 14, 2, 2);
    g.fillRect(52, 18, 2, 2);
    g.fillRect(8, 36, 2, 2);
    g.fillRect(54, 34, 2, 2);
  }

  // ── Axiebot: Small cute robot, pink/blue, round body, digital eyes ──
  _draw_axiebot(g, base, light, dark, darker, c) {
    // Antenna
    g.fillStyle(0xCCCCCC, 1);
    g.fillRect(30, 4, 4, 8);
    g.fillStyle(0xFF69B4, 1);
    g.fillCircle(32, 4, 3);
    // Round head
    g.fillStyle(base, 1);
    g.fillCircle(32, 18, 12);
    // Screen face
    g.fillStyle(0x001122, 1);
    g.fillRoundedRect(22, 12, 20, 14, 4);
    // Digital eyes (pixel style)
    g.fillStyle(0x00FF00, 1);
    g.fillRect(25, 16, 3, 4);
    g.fillRect(36, 16, 3, 4);
    // Digital smile
    g.fillStyle(0x00FF00, 1);
    g.fillRect(27, 22, 2, 1);
    g.fillRect(30, 23, 4, 1);
    g.fillRect(35, 22, 2, 1);
    // Round body
    g.fillStyle(0xFF69B4, 0.8);
    g.fillRoundedRect(16, 28, 32, 24, 10);
    g.fillStyle(base, 0.5);
    g.fillRoundedRect(20, 32, 24, 16, 6);
    // Heart on chest
    g.fillStyle(0xFF1493, 1);
    g.fillCircle(29, 38, 3);
    g.fillCircle(35, 38, 3);
    g.fillTriangle(26, 39, 38, 39, 32, 46);
    // Arms (stubby robot arms)
    g.fillStyle(0xCCCCCC, 1);
    g.fillRoundedRect(8, 32, 10, 6, 2);
    g.fillRoundedRect(46, 32, 10, 6, 2);
    // Hands (round)
    g.fillStyle(0xFF69B4, 1);
    g.fillCircle(10, 40, 4);
    g.fillCircle(54, 40, 4);
    // Legs (short stubby)
    g.fillStyle(0xCCCCCC, 1);
    g.fillRoundedRect(22, 50, 8, 8, 2);
    g.fillRoundedRect(34, 50, 8, 8, 2);
    // Feet
    g.fillStyle(base, 1);
    g.fillRoundedRect(20, 54, 12, 6, 2);
    g.fillRoundedRect(32, 54, 12, 6, 2);
  }

  // ── Claudius: Legendary AI entity, warm terracotta, wise ──
  _draw_claudius(g, base, light, dark, darker, c) {
    // Glowing aura
    g.fillStyle(base, 0.1);
    g.fillCircle(32, 30, 30);
    g.fillStyle(base, 0.15);
    g.fillCircle(32, 30, 24);
    // Flowing robe body
    g.fillStyle(0x8B6F47, 1);
    g.fillRoundedRect(14, 28, 36, 30, 6);
    g.fillStyle(0x9E7E52, 1);
    g.fillRoundedRect(18, 32, 28, 22, 4);
    // Robe folds
    g.lineStyle(1, 0x7A5F3D, 0.4);
    g.lineBetween(24, 34, 24, 56);
    g.lineBetween(32, 32, 32, 58);
    g.lineBetween(40, 34, 40, 56);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 20, 14);
    // Warm, wise face
    g.fillStyle(0xFFDDBB, 0.3);
    g.fillCircle(32, 22, 8);
    // Halo/crown of light
    g.lineStyle(2, 0xFFD700, 0.6);
    g.beginPath();
    g.arc(32, 16, 14, Math.PI + 0.3, -0.3);
    g.strokePath();
    g.fillStyle(0xFFD700, 0.3);
    g.fillCircle(18, 12, 2);
    g.fillCircle(46, 12, 2);
    g.fillCircle(32, 4, 2);
    // Wise eyes (warm, knowing)
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(26, 20, 4);
    g.fillCircle(38, 20, 4);
    g.fillStyle(0x8B6914, 1);
    g.fillCircle(27, 20, 2.5);
    g.fillCircle(39, 20, 2.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(27, 20, 1.5);
    g.fillCircle(39, 20, 1.5);
    // Eye warmth
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(28, 19, 1, 1);
    g.fillRect(40, 19, 1, 1);
    // Kind smile
    g.lineStyle(1, 0x8B6914, 0.8);
    g.beginPath();
    g.moveTo(27, 26);
    g.lineTo(30, 28);
    g.lineTo(34, 28);
    g.lineTo(37, 26);
    g.strokePath();
    // Hands holding glowing orb
    g.fillStyle(dark, 1);
    g.fillRoundedRect(10, 36, 8, 14, 3);
    g.fillRoundedRect(46, 36, 8, 14, 3);
    // Glowing orb of knowledge
    g.fillStyle(0xFFAA44, 0.5);
    g.fillCircle(32, 48, 6);
    g.fillStyle(0xFFCC66, 0.7);
    g.fillCircle(32, 48, 4);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillCircle(30, 46, 2);
    // Data streams from orb
    g.fillStyle(0xFFCC66, 0.3);
    g.fillRect(28, 42, 1, 4);
    g.fillRect(32, 40, 1, 6);
    g.fillRect(36, 42, 1, 4);
  }

  // ── Sandboxer: Voxel creature, builds worlds, blocky ──
  _draw_sandboxer(g, base, light, dark, darker, c) {
    // Blocky voxel body
    g.fillStyle(base, 1);
    g.fillRect(14, 24, 36, 32);
    // Voxel block pattern
    g.fillStyle(light, 0.5);
    g.fillRect(14, 24, 12, 10);
    g.fillRect(38, 24, 12, 10);
    g.fillRect(26, 36, 12, 10);
    g.fillStyle(dark, 0.3);
    g.fillRect(26, 24, 12, 10);
    g.fillRect(14, 36, 12, 10);
    g.fillRect(38, 36, 12, 10);
    g.fillRect(14, 48, 12, 8);
    g.fillRect(38, 48, 12, 8);
    // Grid lines
    g.lineStyle(1, darker, 0.3);
    g.lineBetween(26, 24, 26, 56);
    g.lineBetween(38, 24, 38, 56);
    g.lineBetween(14, 34, 50, 34);
    g.lineBetween(14, 46, 50, 46);
    // Square head
    g.fillStyle(base, 1);
    g.fillRect(16, 4, 32, 22);
    g.fillStyle(light, 0.4);
    g.fillRect(16, 4, 16, 11);
    // Digital eyes
    g.fillStyle(0x00FFFF, 1);
    g.fillRect(20, 10, 6, 6);
    g.fillRect(38, 10, 6, 6);
    g.fillStyle(0x000000, 1);
    g.fillRect(22, 12, 3, 3);
    g.fillRect(40, 12, 3, 3);
    // Pixel mouth
    g.fillStyle(0x000000, 1);
    g.fillRect(26, 20, 12, 2);
    // Block arms
    g.fillStyle(dark, 1);
    g.fillRect(4, 26, 10, 8);
    g.fillRect(50, 26, 10, 8);
    // Holding a tiny block
    g.fillStyle(0x00FF00, 1);
    g.fillRect(2, 34, 6, 6);
    g.fillStyle(0x00CC00, 1);
    g.fillRect(2, 34, 3, 3);
    // Legs
    g.fillStyle(dark, 1);
    g.fillRect(18, 56, 10, 6);
    g.fillRect(36, 56, 10, 6);
  }

  // ── Generic fallback for any unmatched creature ──
  _drawGenericCreature(g, base, light, dark, darker, creature) {
    // Body
    g.fillStyle(base, 1);
    g.fillRoundedRect(12, 20, 40, 36, 10);
    // Belly
    g.fillStyle(light, 0.5);
    g.fillRoundedRect(18, 28, 28, 22, 6);
    // Head
    g.fillStyle(base, 1);
    g.fillCircle(32, 18, 14);
    // Eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(24, 16, 5);
    g.fillCircle(40, 16, 5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(26, 16, 3);
    g.fillCircle(42, 16, 3);
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(27, 15, 1, 1);
    g.fillRect(43, 15, 1, 1);
    // Mouth
    g.lineStyle(1, 0x000000, 0.8);
    g.beginPath();
    g.moveTo(26, 24);
    g.lineTo(32, 27);
    g.lineTo(38, 24);
    g.strokePath();
    // Ears
    g.fillStyle(dark, 1);
    g.fillTriangle(16, 4, 12, 16, 22, 14);
    g.fillTriangle(48, 4, 42, 14, 52, 16);
    // Arms
    g.fillStyle(dark, 1);
    g.fillRoundedRect(6, 26, 8, 18, 3);
    g.fillRoundedRect(50, 26, 8, 18, 3);
    // Feet
    g.fillStyle(darker, 1);
    g.fillRoundedRect(18, 52, 10, 8, 3);
    g.fillRoundedRect(36, 52, 10, 8, 3);
    // Type indicator
    const typeColors = {
      DeFi: 0x627EEA, AI: 0x9B59B6, Meme: 0xFFD700, Layer1: 0xF7931A,
      NFT: 0xFF6B35, Privacy: 0xFF6600, Oracle: 0x375BD2, Gaming: 0x00BFFF,
    };
    g.fillStyle(typeColors[creature.type] || 0xFFFFFF, 1);
    g.fillCircle(32, 6, 4);
    g.lineStyle(1, 0xFFFFFF, 0.5);
    g.strokeCircle(32, 6, 4);
  }

  // ─── Tile Sprites ──────────────────────────────────────────────
  _generateTileSprites() {
    const S = 32;

    // --- GRASS ---
    this._makeTile('grass', (g) => {
      // Base green
      g.fillStyle(0x4CAF50, 1);
      g.fillRect(0, 0, S, S);
      // Variation patches
      g.fillStyle(0x43A047, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillRect(16, 16, 16, 16);
      g.fillStyle(0x66BB6A, 1);
      g.fillRect(16, 0, 16, 16);
      g.fillRect(0, 16, 16, 16);
      // Grass texture strands
      g.fillStyle(0x388E3C, 0.6);
      g.fillRect(4, 6, 1, 3);
      g.fillRect(12, 14, 1, 3);
      g.fillRect(24, 4, 1, 3);
      g.fillRect(20, 22, 1, 3);
      g.fillRect(8, 26, 1, 3);
      g.fillRect(28, 18, 1, 3);
      // Small flowers
      g.fillStyle(0xFFFF00, 0.7);
      g.fillRect(6, 10, 2, 2);
      g.fillStyle(0xFF88CC, 0.6);
      g.fillRect(22, 26, 2, 2);
      // Bright grass highlights
      g.fillStyle(0x81C784, 0.4);
      g.fillRect(14, 2, 2, 1);
      g.fillRect(2, 20, 2, 1);
      g.fillRect(26, 12, 2, 1);
    });

    // --- TALL GRASS ---
    this._makeTile('tallgrass', (g) => {
      g.fillStyle(0x2E7D32, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0x1B5E20, 1);
      g.fillRect(0, 0, 16, 32);
      // Dense tall grass blades
      for (let i = 0; i < 8; i++) {
        const x = 2 + i * 4;
        const shade = i % 2 === 0 ? 0x388E3C : 0x2E7D32;
        g.fillStyle(shade, 0.9);
        g.fillTriangle(x, S, x + 2, S - 18 - (i % 3) * 4, x + 4, S);
        g.fillStyle(0x43A047, 0.7);
        g.fillTriangle(x + 1, S, x + 3, S - 14 - (i % 2) * 6, x + 5, S);
      }
      // Darker base
      g.fillStyle(0x1B5E20, 0.5);
      g.fillRect(0, 26, S, 6);
      // Blade tips with highlights
      g.fillStyle(0x66BB6A, 0.5);
      g.fillRect(4, 10, 1, 2);
      g.fillRect(14, 8, 1, 2);
      g.fillRect(22, 12, 1, 2);
    });

    // --- PATH ---
    this._makeTile('path', (g) => {
      g.fillStyle(0xD2B48C, 1);
      g.fillRect(0, 0, S, S);
      // Worn texture
      g.fillStyle(0xC4A882, 1);
      g.fillRect(4, 4, 12, 8);
      g.fillRect(18, 16, 10, 10);
      // Pebble details
      g.fillStyle(0xBCAA7E, 1);
      g.fillCircle(8, 8, 2);
      g.fillCircle(22, 14, 1.5);
      g.fillCircle(14, 24, 2);
      g.fillCircle(26, 6, 1.5);
      g.fillCircle(6, 20, 1);
      // Dirt cracks
      g.lineStyle(1, 0xB89E72, 0.4);
      g.lineBetween(2, 16, 10, 18);
      g.lineBetween(20, 26, 28, 24);
      // Shadow
      g.fillStyle(0xAA9060, 0.2);
      g.fillRect(0, 28, S, 4);
    });

    // --- WATER ---
    this._makeTile('water', (g) => {
      g.fillStyle(0x1565C0, 1);
      g.fillRect(0, 0, S, S);
      // Depth variation
      g.fillStyle(0x1976D2, 1);
      g.fillRect(0, 0, S, 12);
      g.fillStyle(0x0D47A1, 1);
      g.fillRect(0, 22, S, 10);
      // Wave patterns
      g.lineStyle(1, 0x42A5F5, 0.6);
      for (let y = 4; y < S; y += 8) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(6, y - 2);
        g.lineTo(12, y);
        g.lineTo(18, y - 2);
        g.lineTo(24, y);
        g.lineTo(30, y - 2);
        g.lineTo(S, y);
        g.strokePath();
      }
      // Highlights
      g.fillStyle(0x64B5F6, 0.4);
      g.fillRect(4, 6, 4, 1);
      g.fillRect(20, 14, 6, 1);
      g.fillRect(10, 22, 4, 1);
      // Foam
      g.fillStyle(0xBBDEFB, 0.3);
      g.fillRect(2, 2, 2, 1);
      g.fillRect(16, 10, 2, 1);
      g.fillRect(26, 20, 3, 1);
    });

    // --- WALL ---
    this._makeTile('wall', (g) => {
      g.fillStyle(0x757575, 1);
      g.fillRect(0, 0, S, S);
      // Brick pattern with mortar
      g.fillStyle(0x8D8D8D, 1);
      g.fillRect(1, 1, 14, 7);
      g.fillRect(17, 1, 14, 7);
      g.fillRect(9, 9, 14, 7);
      g.fillRect(25, 9, 6, 7);
      g.fillRect(0, 9, 7, 7);
      g.fillRect(1, 17, 14, 7);
      g.fillRect(17, 17, 14, 7);
      g.fillRect(9, 25, 14, 6);
      g.fillRect(25, 25, 6, 6);
      g.fillRect(0, 25, 7, 6);
      // Mortar lines
      g.lineStyle(1, 0x616161, 0.7);
      g.lineBetween(0, 8, S, 8);
      g.lineBetween(0, 16, S, 16);
      g.lineBetween(0, 24, S, 24);
      g.lineBetween(16, 0, 16, 8);
      g.lineBetween(8, 8, 8, 16);
      g.lineBetween(16, 16, 16, 24);
      g.lineBetween(8, 24, 8, S);
      g.lineBetween(24, 8, 24, 16);
      g.lineBetween(24, 24, 24, S);
      // Depth shading
      g.fillStyle(0x999999, 0.3);
      g.fillRect(2, 2, 12, 2);
      g.fillRect(18, 2, 12, 2);
      g.fillStyle(0x555555, 0.2);
      g.fillRect(2, 6, 12, 2);
      g.fillRect(18, 6, 12, 2);
    });

    // --- TREE ---
    this._makeTile('tree', (g) => {
      // Grass underneath
      g.fillStyle(0x4CAF50, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0x43A047, 0.5);
      g.fillRect(0, 0, 16, 16);
      // Trunk with bark texture
      g.fillStyle(0x5D4037, 1);
      g.fillRect(13, 16, 7, 16);
      g.fillStyle(0x4E342E, 1);
      g.fillRect(14, 18, 2, 3);
      g.fillRect(17, 22, 2, 4);
      g.fillRect(14, 28, 2, 2);
      // Root
      g.fillStyle(0x5D4037, 1);
      g.fillRect(10, 30, 4, 2);
      g.fillRect(19, 30, 4, 2);
      // Canopy (multiple shades)
      g.fillStyle(0x2E7D32, 1);
      g.fillCircle(16, 12, 10);
      g.fillStyle(0x388E3C, 1);
      g.fillCircle(16, 10, 9);
      g.fillStyle(0x43A047, 1);
      g.fillCircle(12, 8, 6);
      g.fillCircle(20, 8, 6);
      g.fillStyle(0x4CAF50, 1);
      g.fillCircle(16, 6, 5);
      // Leaf highlights
      g.fillStyle(0x66BB6A, 0.5);
      g.fillCircle(12, 6, 3);
      g.fillCircle(18, 4, 2);
      // Shadow
      g.fillStyle(0x1B5E20, 0.3);
      g.fillCircle(16, 14, 8);
    });

    // --- BUILDING ---
    this._makeTile('building', (g) => {
      // Wall
      g.fillStyle(0x8D6E63, 1);
      g.fillRect(0, 4, S, 28);
      // Roof tiles
      g.fillStyle(0xA1887F, 1);
      g.fillRect(0, 0, S, 6);
      g.fillStyle(0x795548, 1);
      g.fillRect(0, 0, S, 2);
      g.lineStyle(1, 0x6D4C41, 0.5);
      g.lineBetween(0, 4, S, 4);
      // Window
      g.fillStyle(0x81D4FA, 1);
      g.fillRect(4, 8, 10, 10);
      g.fillStyle(0x4FC3F7, 1);
      g.fillRect(4, 8, 10, 5);
      // Window frame
      g.lineStyle(1, 0x5D4037, 1);
      g.strokeRect(4, 8, 10, 10);
      g.lineBetween(9, 8, 9, 18);
      g.lineBetween(4, 13, 14, 13);
      // Door
      g.fillStyle(0x4E342E, 1);
      g.fillRect(20, 14, 8, 18);
      g.fillStyle(0x3E2723, 1);
      g.fillRect(20, 14, 8, 2);
      // Doorknob
      g.fillStyle(0xFFD700, 1);
      g.fillCircle(26, 24, 1.5);
      // Chimney
      g.fillStyle(0x616161, 1);
      g.fillRect(24, 0, 5, 4);
      g.fillStyle(0x757575, 1);
      g.fillRect(24, 0, 5, 1);
    });

    // --- SAND ---
    this._makeTile('sand', (g) => {
      g.fillStyle(0xFFE082, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0xFFD54F, 1);
      g.fillRect(0, 16, S, 16);
      // Sand texture
      g.fillStyle(0xFFCA28, 0.4);
      g.fillRect(4, 6, 2, 1);
      g.fillRect(20, 12, 3, 1);
      g.fillRect(10, 24, 2, 1);
      g.fillRect(26, 20, 2, 1);
      // Shell details
      g.fillStyle(0xFFAB91, 0.7);
      g.fillCircle(8, 22, 2);
      g.fillStyle(0xFFF8E1, 1);
      g.fillCircle(8, 21, 1);
      g.fillStyle(0xBCAAA4, 0.6);
      g.fillCircle(24, 8, 1.5);
      // Wave-touched edge
      g.fillStyle(0xBBDEFB, 0.3);
      g.fillRect(0, 0, S, 3);
      g.fillStyle(0xE3F2FD, 0.2);
      g.fillRect(0, 0, S, 1);
    });

    // --- MOUNTAIN ---
    this._makeTile('mountain', (g) => {
      // Sky
      g.fillStyle(0x90A4AE, 1);
      g.fillRect(0, 0, S, S);
      // Rock face layers
      g.fillStyle(0x5D4037, 1);
      g.fillTriangle(16, 2, 0, S, S, S);
      g.fillStyle(0x795548, 1);
      g.fillTriangle(16, 2, 4, S, 16, S);
      g.fillStyle(0x4E342E, 1);
      g.fillTriangle(16, 2, 16, S, 28, S);
      // Rock detail lines
      g.lineStyle(1, 0x3E2723, 0.3);
      g.lineBetween(8, 18, 16, 10);
      g.lineBetween(16, 10, 24, 18);
      g.lineBetween(6, 24, 26, 24);
      // Snow cap
      g.fillStyle(0xEEEEEE, 1);
      g.fillTriangle(16, 2, 10, 12, 22, 12);
      g.fillStyle(0xFFFFFF, 1);
      g.fillTriangle(16, 2, 12, 10, 20, 10);
      // Snow sparkle
      g.fillStyle(0xFFFFFF, 0.8);
      g.fillRect(14, 6, 1, 1);
      g.fillRect(18, 4, 1, 1);
    });

    // --- LAB FLOOR ---
    this._makeTile('lab_floor', (g) => {
      g.fillStyle(0xE0E0E0, 1);
      g.fillRect(0, 0, S, S);
      // Floor tile grid
      g.fillStyle(0xEEEEEE, 1);
      g.fillRect(0, 0, 15, 15);
      g.fillRect(17, 17, 15, 15);
      g.lineStyle(1, 0xBDBDBD, 0.4);
      g.lineBetween(16, 0, 16, S);
      g.lineBetween(0, 16, S, 16);
      // Circuit patterns
      g.lineStyle(1, 0x90CAF9, 0.3);
      g.lineBetween(4, 4, 4, 12);
      g.lineBetween(4, 12, 12, 12);
      g.lineBetween(20, 20, 28, 20);
      g.lineBetween(28, 20, 28, 28);
      // Circuit nodes
      g.fillStyle(0x42A5F5, 0.4);
      g.fillCircle(4, 4, 1.5);
      g.fillCircle(12, 12, 1.5);
      g.fillCircle(20, 20, 1.5);
      g.fillCircle(28, 28, 1.5);
      // LED strip
      g.fillStyle(0x00E676, 0.3);
      g.fillRect(0, 15, S, 2);
    });

    // --- SIGN ---
    this._makeTile('sign', (g) => {
      // Grass background
      g.fillStyle(0x4CAF50, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(0x43A047, 0.5);
      g.fillRect(0, 16, S, 16);
      // Post with wood grain
      g.fillStyle(0x5D4037, 1);
      g.fillRect(14, 14, 5, 18);
      g.fillStyle(0x4E342E, 1);
      g.fillRect(15, 16, 1, 14);
      g.fillRect(17, 18, 1, 10);
      // Sign plank
      g.fillStyle(0xFFCC80, 1);
      g.fillRoundedRect(3, 2, 26, 14, 2);
      // Wood grain on plank
      g.fillStyle(0xFFB74D, 0.3);
      g.fillRect(5, 4, 22, 1);
      g.fillRect(5, 8, 22, 1);
      g.fillRect(5, 12, 22, 1);
      // Border
      g.lineStyle(1, 0x8D6E63, 1);
      g.strokeRoundedRect(3, 2, 26, 14, 2);
      // Nail dots
      g.fillStyle(0x9E9E9E, 1);
      g.fillCircle(6, 5, 1);
      g.fillCircle(26, 5, 1);
      g.fillCircle(6, 13, 1);
      g.fillCircle(26, 13, 1);
    });

    // --- Player sprite ---
    this._makeCharSprite('player', (g) => {
      // Hair (brown)
      g.fillStyle(0x5D4037, 1);
      g.fillRoundedRect(9, 1, 14, 8, 3);
      g.fillRect(8, 4, 16, 4);
      // Head/face
      g.fillStyle(0xFFCCBC, 1);
      g.fillRoundedRect(10, 6, 12, 12, 4);
      // Eyes
      g.fillStyle(0x000000, 1);
      g.fillRect(13, 10, 2, 2);
      g.fillRect(19, 10, 2, 2);
      // Mouth
      g.fillStyle(0xCC8888, 1);
      g.fillRect(14, 14, 4, 1);
      // Jacket (orange/red)
      g.fillStyle(0xFF5722, 1);
      g.fillRoundedRect(8, 16, 16, 10, 2);
      // Jacket detail (zipper)
      g.fillStyle(0xE64A19, 1);
      g.fillRect(15, 16, 2, 10);
      // Backpack straps
      g.fillStyle(0x4E342E, 1);
      g.fillRect(9, 16, 2, 6);
      g.fillRect(21, 16, 2, 6);
      // Arms
      g.fillStyle(0xFF5722, 1);
      g.fillRoundedRect(4, 17, 5, 8, 2);
      g.fillRoundedRect(23, 17, 5, 8, 2);
      // Hands
      g.fillStyle(0xFFCCBC, 1);
      g.fillRect(5, 24, 3, 2);
      g.fillRect(24, 24, 3, 2);
      // Legs (jeans)
      g.fillStyle(0x1565C0, 1);
      g.fillRect(10, 26, 5, 4);
      g.fillRect(17, 26, 5, 4);
      // Shoes
      g.fillStyle(0x333333, 1);
      g.fillRect(9, 29, 6, 3);
      g.fillRect(17, 29, 6, 3);
    });

    // --- NPC sprite ---
    this._makeCharSprite('npc', (g) => {
      // Hair (blonde/light)
      g.fillStyle(0xFFD54F, 1);
      g.fillRoundedRect(9, 1, 14, 8, 3);
      g.fillRect(8, 4, 16, 4);
      // Head/face
      g.fillStyle(0xFFCCBC, 1);
      g.fillRoundedRect(10, 6, 12, 12, 4);
      // Eyes
      g.fillStyle(0x000000, 1);
      g.fillRect(13, 10, 2, 2);
      g.fillRect(19, 10, 2, 2);
      // Smile
      g.fillStyle(0xCC8888, 1);
      g.fillRect(14, 14, 4, 1);
      g.fillRect(17, 13, 2, 1);
      // Blue outfit
      g.fillStyle(0x3F51B5, 1);
      g.fillRoundedRect(8, 16, 16, 10, 2);
      // Lapels
      g.fillStyle(0x303F9F, 1);
      g.fillTriangle(10, 16, 16, 22, 10, 22);
      g.fillTriangle(22, 16, 16, 22, 22, 22);
      // Tie
      g.fillStyle(0xFF0000, 1);
      g.fillRect(15, 17, 2, 6);
      // Arms
      g.fillStyle(0x3F51B5, 1);
      g.fillRoundedRect(4, 17, 5, 8, 2);
      g.fillRoundedRect(23, 17, 5, 8, 2);
      // Hands
      g.fillStyle(0xFFCCBC, 1);
      g.fillRect(5, 24, 3, 2);
      g.fillRect(24, 24, 3, 2);
      // Pants
      g.fillStyle(0x424242, 1);
      g.fillRect(10, 26, 5, 4);
      g.fillRect(17, 26, 5, 4);
      // Shoes
      g.fillStyle(0x212121, 1);
      g.fillRect(9, 29, 6, 3);
      g.fillRect(17, 29, 6, 3);
    });
  }

  _makeTile(key, drawFn) {
    const g = this.make.graphics({ add: false });
    drawFn(g);
    g.lineStyle(1, 0x000000, 0.08);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture(`tile_${key}`, 32, 32);
    g.destroy();
  }

  _makeCharSprite(key, drawFn) {
    const g = this.make.graphics({ add: false });
    drawFn(g);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  // ─── UI Sprites ────────────────────────────────────────────────
  _generateUISprites() {
    // === Battle background (800x600) ===
    const bg = this.make.graphics({ add: false });
    // Sky gradient (top to bottom: light blue to deeper blue)
    for (let y = 0; y < 300; y++) {
      const t = y / 300;
      const r = Math.floor(100 + (1 - t) * 80);
      const g2 = Math.floor(160 + (1 - t) * 60);
      const b = Math.floor(220 + (1 - t) * 30);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g2, b), 1);
      bg.fillRect(0, y, 800, 1);
    }
    // Clouds
    bg.fillStyle(0xFFFFFF, 0.3);
    bg.fillRoundedRect(60, 40, 120, 30, 14);
    bg.fillRoundedRect(100, 35, 80, 25, 12);
    bg.fillRoundedRect(400, 60, 140, 35, 16);
    bg.fillRoundedRect(440, 50, 100, 30, 14);
    bg.fillRoundedRect(600, 80, 100, 25, 12);
    bg.fillStyle(0xFFFFFF, 0.2);
    bg.fillRoundedRect(200, 90, 80, 20, 10);
    bg.fillRoundedRect(550, 30, 60, 18, 8);
    // Distant hills
    bg.fillStyle(0x66BB6A, 0.4);
    for (let x = 0; x < 800; x += 4) {
      const h = 280 + Math.sin(x * 0.008) * 20 + Math.sin(x * 0.02) * 10;
      bg.fillRect(x, h, 4, 320 - h);
    }
    // Ground - grass field with depth
    bg.fillStyle(0x4CAF50, 1);
    bg.fillRect(0, 300, 800, 300);
    bg.fillStyle(0x43A047, 1);
    bg.fillRect(0, 300, 800, 20);
    // Perspective lines (darker toward bottom)
    for (let y = 320; y < 600; y += 20) {
      const darken = (y - 300) / 600;
      bg.fillStyle(Phaser.Display.Color.GetColor(
        Math.floor(76 - darken * 30),
        Math.floor(175 - darken * 50),
        Math.floor(80 - darken * 30)
      ), 0.3);
      bg.fillRect(0, y, 800, 10);
    }
    // Grass texture on field
    bg.fillStyle(0x388E3C, 0.3);
    for (let i = 0; i < 40; i++) {
      const gx = (i * 47) % 800;
      const gy = 310 + (i * 31) % 280;
      bg.fillRect(gx, gy, 2, 4);
    }
    // Platform mound - player side (left)
    bg.fillStyle(0x5D4037, 1);
    bg.fillRoundedRect(30, 420, 280, 40, 16);
    bg.fillStyle(0x4CAF50, 1);
    bg.fillRoundedRect(30, 410, 280, 20, 12);
    bg.fillStyle(0x66BB6A, 0.5);
    bg.fillRoundedRect(40, 408, 260, 10, 6);
    // Platform mound - enemy side (right, higher)
    bg.fillStyle(0x5D4037, 1);
    bg.fillRoundedRect(480, 280, 280, 40, 16);
    bg.fillStyle(0x4CAF50, 1);
    bg.fillRoundedRect(480, 270, 280, 20, 12);
    bg.fillStyle(0x66BB6A, 0.5);
    bg.fillRoundedRect(490, 268, 260, 10, 6);
    bg.generateTexture('battle_bg', 800, 600);
    bg.destroy();

    // === HP bar background (200x60) ===
    const hpBg = this.make.graphics({ add: false });
    // Dark panel
    for (let y = 0; y < 60; y++) {
      const t = y / 60;
      hpBg.fillStyle(Phaser.Display.Color.GetColor(
        Math.floor(30 + t * 15),
        Math.floor(30 + t * 15),
        Math.floor(40 + t * 20)
      ), 0.95);
      hpBg.fillRect(0, y, 200, 1);
    }
    hpBg.fillRoundedRect(0, 0, 200, 60, 8);
    // Border glow
    hpBg.lineStyle(2, 0x5588FF, 0.6);
    hpBg.strokeRoundedRect(1, 1, 198, 58, 8);
    hpBg.lineStyle(1, 0x3366DD, 0.3);
    hpBg.strokeRoundedRect(0, 0, 200, 60, 8);
    hpBg.generateTexture('hp_bar_bg', 200, 60);
    hpBg.destroy();

    // === Menu panel (400x150) ===
    const mp = this.make.graphics({ add: false });
    // Dark glass background
    mp.fillStyle(0x0a0a1e, 0.92);
    mp.fillRoundedRect(0, 0, 400, 150, 10);
    // Inner darker area
    mp.fillStyle(0x060612, 0.5);
    mp.fillRoundedRect(4, 4, 392, 142, 8);
    // Neon border (cyan/blue)
    mp.lineStyle(2, 0x00CCFF, 0.8);
    mp.strokeRoundedRect(1, 1, 398, 148, 10);
    // Inner glow line
    mp.lineStyle(1, 0x0088CC, 0.3);
    mp.strokeRoundedRect(4, 4, 392, 142, 8);
    // Corner accents
    mp.fillStyle(0x00CCFF, 0.2);
    mp.fillCircle(10, 10, 4);
    mp.fillCircle(390, 10, 4);
    mp.fillCircle(10, 140, 4);
    mp.fillCircle(390, 140, 4);
    mp.generateTexture('menu_panel', 400, 150);
    mp.destroy();

    // === Button (180x40) ===
    const btn = this.make.graphics({ add: false });
    // Gradient blue
    for (let y = 0; y < 40; y++) {
      const t = y / 40;
      btn.fillStyle(Phaser.Display.Color.GetColor(
        Math.floor(25 + t * 10),
        Math.floor(118 + (1 - t) * 40),
        Math.floor(210 + (1 - t) * 30)
      ), 1);
      btn.fillRect(0, y, 180, 1);
    }
    btn.fillRoundedRect(0, 0, 180, 40, 6);
    // Top highlight
    btn.fillStyle(0xFFFFFF, 0.15);
    btn.fillRoundedRect(2, 2, 176, 16, 4);
    // Border
    btn.lineStyle(1, 0x64B5F6, 0.8);
    btn.strokeRoundedRect(0, 0, 180, 40, 6);
    // Bottom shadow
    btn.fillStyle(0x000000, 0.2);
    btn.fillRoundedRect(2, 32, 176, 6, 3);
    btn.generateTexture('button', 180, 40);
    btn.destroy();

    // === Button hover (180x40) ===
    const btnH = this.make.graphics({ add: false });
    for (let y = 0; y < 40; y++) {
      const t = y / 40;
      btnH.fillStyle(Phaser.Display.Color.GetColor(
        Math.floor(30 + t * 10),
        Math.floor(140 + (1 - t) * 50),
        Math.floor(230 + (1 - t) * 25)
      ), 1);
      btnH.fillRect(0, y, 180, 1);
    }
    btnH.fillRoundedRect(0, 0, 180, 40, 6);
    btnH.fillStyle(0xFFFFFF, 0.25);
    btnH.fillRoundedRect(2, 2, 176, 16, 4);
    btnH.lineStyle(2, 0x90CAF9, 1);
    btnH.strokeRoundedRect(0, 0, 180, 40, 6);
    // Glow effect
    btnH.fillStyle(0x90CAF9, 0.1);
    btnH.fillRoundedRect(0, 0, 180, 40, 6);
    btnH.generateTexture('button_hover', 180, 40);
    btnH.destroy();

    // === Cryptosphere (32x32) ===
    const cs = this.make.graphics({ add: false });
    // Outer glow
    cs.fillStyle(0xFF0000, 0.1);
    cs.fillCircle(16, 16, 15);
    // Top half (red)
    cs.fillStyle(0xCC0000, 1);
    cs.fillCircle(16, 16, 13);
    // Bottom half (white)
    cs.fillStyle(0xFFFFFF, 1);
    cs.fillRect(3, 16, 26, 14);
    cs.fillStyle(0xEEEEEE, 1);
    cs.fillCircle(16, 16, 13);
    // Re-apply top red
    cs.fillStyle(0xCC0000, 1);
    cs.beginPath();
    cs.arc(16, 16, 13, Math.PI, 0);
    cs.fillPath();
    // Shading on top half
    cs.fillStyle(0xFF2222, 0.4);
    cs.beginPath();
    cs.arc(16, 14, 10, Math.PI, 0);
    cs.fillPath();
    // Center band (black)
    cs.fillStyle(0x222222, 1);
    cs.fillRect(3, 14, 26, 5);
    // Center button
    cs.fillStyle(0xFFFFFF, 1);
    cs.fillCircle(16, 16, 5);
    cs.lineStyle(2, 0x222222, 1);
    cs.strokeCircle(16, 16, 5);
    // Button inner detail
    cs.fillStyle(0xDDDDDD, 1);
    cs.fillCircle(16, 16, 3);
    // Glow on button
    cs.fillStyle(0x88CCFF, 0.4);
    cs.fillCircle(15, 15, 2);
    // Outer ring
    cs.lineStyle(2, 0x111111, 1);
    cs.strokeCircle(16, 16, 13);
    // Shine highlight
    cs.fillStyle(0xFFFFFF, 0.3);
    cs.fillCircle(11, 10, 3);
    cs.generateTexture('cryptosphere', 32, 32);
    cs.destroy();
  }

  // ─── Item Sprites ──────────────────────────────────────────────
  _generateItemSprites() {
    // === Potion ===
    const pot = this.make.graphics({ add: false });
    // Bottle body
    pot.fillStyle(0x7C4DFF, 1);
    pot.fillRoundedRect(9, 12, 14, 18, 4);
    // Liquid gradient
    pot.fillStyle(0x651FFF, 1);
    pot.fillRoundedRect(9, 18, 14, 12, 4);
    pot.fillStyle(0xB388FF, 0.4);
    pot.fillRoundedRect(10, 14, 6, 8, 2);
    // Bottle neck
    pot.fillStyle(0x9575CD, 1);
    pot.fillRect(12, 6, 8, 8);
    // Cork
    pot.fillStyle(0x8D6E63, 1);
    pot.fillRoundedRect(11, 3, 10, 5, 2);
    pot.fillStyle(0xA1887F, 1);
    pot.fillRect(12, 4, 8, 1);
    // Label
    pot.fillStyle(0xFFFFFF, 0.7);
    pot.fillRoundedRect(11, 18, 10, 6, 1);
    // Plus sign on label
    pot.fillStyle(0xFF0000, 1);
    pot.fillRect(15, 19, 2, 4);
    pot.fillRect(14, 20, 4, 2);
    // Shine
    pot.fillStyle(0xFFFFFF, 0.3);
    pot.fillRect(11, 13, 2, 6);
    // Bubbles
    pot.fillStyle(0xD1C4E9, 0.5);
    pot.fillCircle(14, 26, 1.5);
    pot.fillCircle(18, 24, 1);
    pot.generateTexture('potion', 32, 32);
    pot.destroy();

    // === Revive ===
    const rev = this.make.graphics({ add: false });
    // Outer glow
    rev.fillStyle(0xFFD700, 0.15);
    rev.fillCircle(16, 16, 14);
    // Diamond shape
    rev.fillStyle(0xFFD700, 1);
    rev.beginPath();
    rev.moveTo(16, 3);
    rev.lineTo(28, 16);
    rev.lineTo(16, 29);
    rev.lineTo(4, 16);
    rev.closePath();
    rev.fillPath();
    // Facets
    rev.fillStyle(0xFFF176, 1);
    rev.beginPath();
    rev.moveTo(16, 3);
    rev.lineTo(28, 16);
    rev.lineTo(16, 16);
    rev.closePath();
    rev.fillPath();
    rev.fillStyle(0xFFB300, 1);
    rev.beginPath();
    rev.moveTo(16, 16);
    rev.lineTo(16, 29);
    rev.lineTo(4, 16);
    rev.closePath();
    rev.fillPath();
    // Inner glow
    rev.fillStyle(0xFFFFFF, 0.4);
    rev.fillCircle(14, 13, 4);
    rev.fillStyle(0xFFFFFF, 0.6);
    rev.fillCircle(13, 11, 2);
    // Border
    rev.lineStyle(1, 0xFFA000, 1);
    rev.beginPath();
    rev.moveTo(16, 3);
    rev.lineTo(28, 16);
    rev.lineTo(16, 29);
    rev.lineTo(4, 16);
    rev.closePath();
    rev.strokePath();
    // Sparkle rays
    rev.fillStyle(0xFFFFFF, 0.5);
    rev.fillRect(15, 0, 2, 3);
    rev.fillRect(15, 29, 2, 3);
    rev.fillRect(0, 15, 3, 2);
    rev.fillRect(29, 15, 3, 2);
    rev.generateTexture('revive', 32, 32);
    rev.destroy();
  }
}
