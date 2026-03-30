// InventoryScene - Party management and creature collection viewer

import { CREATURES } from '../characters/creatures.js';
import { MOVES } from '../characters/moves.js';

const TYPE_COLORS = {
  DeFi: 0x627EEA,
  AI: 0x00D1B2,
  Meme: 0xFFD700,
  Layer1: 0xF7931A,
  NFT: 0x9B59B6,
  Privacy: 0x2C3E50,
  Oracle: 0x00BFFF,
  Gaming: 0xFF6B35,
};

const TYPE_COLOR_HEX = {
  DeFi: '#627EEA',
  AI: '#00D1B2',
  Meme: '#FFD700',
  Layer1: '#F7931A',
  NFT: '#9B59B6',
  Privacy: '#2C3E50',
  Oracle: '#00BFFF',
  Gaming: '#FF6B35',
};

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data) {
    this.playerData = data.playerData;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const w = this.scale.width;
    const h = this.scale.height;

    this.currentTab = 'party'; // party, storage, items
    this.selectedIndex = 0;
    this.selectedCreature = null;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e);
    bg.fillRect(0, 0, w, h);

    // Header
    this._drawHeader(w);

    // Tabs
    this._drawTabs(w);

    // Content area
    this.contentContainer = this.add.container(0, 0);
    this.detailContainer = this.add.container(0, 0);

    // Draw initial content
    this._drawPartyList();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
  }

  _drawHeader(w) {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x111122, 0.95);
    headerBg.fillRect(0, 0, w, 40);
    headerBg.lineStyle(2, 0x627EEA, 0.5);
    headerBg.lineBetween(0, 40, w, 40);

    this.add.text(20, 12, 'INVENTORY', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#F7931A',
    });

    this.add.text(w - 20, 12, 'X: Close  TAB: Switch', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
    }).setOrigin(1, 0);
  }

  _drawTabs(w) {
    this.tabContainer = this.add.container(0, 0);
    const tabs = ['PARTY', 'STORAGE', 'ITEMS'];
    const tabWidth = w / 3;

    this.tabTexts = [];
    tabs.forEach((label, i) => {
      const isActive = (i === 0 && this.currentTab === 'party') ||
        (i === 1 && this.currentTab === 'storage') ||
        (i === 2 && this.currentTab === 'items');

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isActive ? 0x222244 : 0x111122, 1);
      tabBg.fillRect(i * tabWidth, 42, tabWidth, 28);
      if (isActive) {
        tabBg.lineStyle(2, 0x627EEA, 1);
        tabBg.lineBetween(i * tabWidth, 70, (i + 1) * tabWidth, 70);
      }
      this.tabContainer.add(tabBg);

      const text = this.add.text(i * tabWidth + tabWidth / 2, 56, label, {
        fontSize: '9px', fontFamily: '"Press Start 2P", monospace',
        color: isActive ? '#ffffff' : '#666666',
      }).setOrigin(0.5);
      this.tabContainer.add(text);
      this.tabTexts.push(text);
    });
  }

  _clearContent() {
    this.contentContainer.removeAll(true);
    this.detailContainer.removeAll(true);
  }

  _drawPartyList() {
    this._clearContent();
    const w = this.scale.width;
    const party = this.playerData.party || [];

    if (party.length === 0) {
      const emptyText = this.add.text(w / 2, 200, 'No creatures in party!', {
        fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
      }).setOrigin(0.5);
      this.contentContainer.add(emptyText);
      return;
    }

    this.slotGraphics = [];

    party.forEach((creature, i) => {
      const slotY = 80 + i * 78;
      const isSelected = i === this.selectedIndex;

      // Slot background
      const slotBg = this.add.graphics();
      const bgColor = isSelected ? 0x222244 : 0x151528;
      slotBg.fillStyle(bgColor, 0.95);
      slotBg.fillRoundedRect(15, slotY, w - 30, 70, 8);

      if (isSelected) {
        slotBg.lineStyle(2, TYPE_COLORS[creature.type] || 0x888888, 0.8);
        slotBg.strokeRoundedRect(15, slotY, w - 30, 70, 8);
      }
      this.contentContainer.add(slotBg);
      this.slotGraphics.push(slotBg);

      // Creature sprite (colored square)
      const spriteColor = creature.spriteColor
        ? parseInt(creature.spriteColor.replace('#', ''), 16)
        : (TYPE_COLORS[creature.type] || 0x888888);

      const sprite = this.add.graphics();
      sprite.fillStyle(spriteColor, 1);
      sprite.fillRoundedRect(30, slotY + 10, 50, 50, 6);
      sprite.lineStyle(1, 0xffffff, 0.2);
      sprite.strokeRoundedRect(30, slotY + 10, 50, 50, 6);
      // Eyes
      sprite.fillStyle(0xffffff, 1);
      sprite.fillCircle(45, slotY + 28, 4);
      sprite.fillCircle(65, slotY + 28, 4);
      sprite.fillStyle(0x111111, 1);
      sprite.fillCircle(46, slotY + 29, 2);
      sprite.fillCircle(66, slotY + 29, 2);
      this.contentContainer.add(sprite);

      // Name
      const nameText = this.add.text(95, slotY + 10, creature.name, {
        fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
      });
      this.contentContainer.add(nameText);

      // Level
      const levelText = this.add.text(95, slotY + 28, `Lv.${creature.level || 5}`, {
        fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa',
      });
      this.contentContainer.add(levelText);

      // Type badge
      const typeColor = TYPE_COLORS[creature.type] || 0x888888;
      const typeBg = this.add.graphics();
      typeBg.fillStyle(typeColor, 0.7);
      typeBg.fillRoundedRect(160, slotY + 27, 55, 14, 3);
      this.contentContainer.add(typeBg);

      const typeText = this.add.text(187, slotY + 34, creature.type || '???', {
        fontSize: '6px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
      }).setOrigin(0.5);
      this.contentContainer.add(typeText);

      // HP bar
      const hpBarX = 95;
      const hpBarY = slotY + 46;
      const hpBarW = 200;

      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x333333, 1);
      hpBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, 8, 3);
      this.contentContainer.add(hpBg);

      const currentHp = creature.currentHp || 0;
      const maxHp = creature.stats?.hp || 1;
      const hpRatio = Math.max(0, currentHp / maxHp);
      const hpColor = hpRatio > 0.5 ? 0x00cc44 : hpRatio > 0.2 ? 0xcccc00 : 0xcc2222;

      const hpFill = this.add.graphics();
      hpFill.fillStyle(hpColor, 1);
      hpFill.fillRoundedRect(hpBarX, hpBarY, hpBarW * hpRatio, 8, 3);
      this.contentContainer.add(hpFill);

      const hpText = this.add.text(hpBarX + hpBarW + 10, hpBarY - 1, `${currentHp}/${maxHp}`, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#888888',
      });
      this.contentContainer.add(hpText);

      // Selection cursor
      if (isSelected) {
        const cursor = this.add.text(5, slotY + 25, '\u25B6', {
          fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#F7931A',
        });
        this.contentContainer.add(cursor);
        this.selectionCursor = cursor;
      }
    });

    // Show details of selected creature
    if (party[this.selectedIndex]) {
      this._drawCreatureDetail(party[this.selectedIndex]);
    }
  }

  _drawCreatureDetail(creature) {
    this.detailContainer.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;

    // Only show detail panel if screen is wide enough (otherwise it overlaps)
    // For 800px width, show stats on the right side
    const detailX = w - 280;
    const detailY = 80;

    // If list takes too much space, show detail below
    const party = this.playerData.party || [];
    if (party.length > 3) return; // Skip detail for large parties to avoid overlap

    const detailBg = this.add.graphics();
    detailBg.fillStyle(0x111122, 0.95);
    detailBg.fillRoundedRect(detailX, detailY, 265, 300, 8);
    detailBg.lineStyle(1, 0x333366, 0.8);
    detailBg.strokeRoundedRect(detailX, detailY, 265, 300, 8);
    this.detailContainer.add(detailBg);

    // Stats title
    const statsTitle = this.add.text(detailX + 15, detailY + 10, 'STATS', {
      fontSize: '9px', fontFamily: '"Press Start 2P", monospace', color: '#F7931A',
    });
    this.detailContainer.add(statsTitle);

    // Stats
    const stats = creature.stats || {};
    const statNames = [
      { key: 'hp', label: 'HP', color: '#ff4444' },
      { key: 'attack', label: 'ATK', color: '#ff8844' },
      { key: 'defense', label: 'DEF', color: '#ffcc44' },
      { key: 'specialAttack', label: 'SP.A', color: '#44aaff' },
      { key: 'specialDefense', label: 'SP.D', color: '#44ff88' },
      { key: 'speed', label: 'SPD', color: '#ff44ff' },
    ];

    statNames.forEach((stat, i) => {
      const y = detailY + 35 + i * 22;
      const value = stats[stat.key] || 0;
      const maxBar = 150;
      const barWidth = Math.min(maxBar, (value / 120) * maxBar);

      // Label
      const label = this.add.text(detailX + 15, y, stat.label, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa',
      });
      this.detailContainer.add(label);

      // Bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0x222222, 1);
      barBg.fillRoundedRect(detailX + 65, y + 1, maxBar, 10, 3);
      this.detailContainer.add(barBg);

      // Bar fill
      const barFill = this.add.graphics();
      const color = parseInt(stat.color.replace('#', ''), 16);
      barFill.fillStyle(color, 0.8);
      barFill.fillRoundedRect(detailX + 65, y + 1, barWidth, 10, 3);
      this.detailContainer.add(barFill);

      // Value
      const valueText = this.add.text(detailX + 220, y, String(value), {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: stat.color,
      });
      this.detailContainer.add(valueText);
    });

    // Moves
    const movesTitle = this.add.text(detailX + 15, detailY + 175, 'MOVES', {
      fontSize: '9px', fontFamily: '"Press Start 2P", monospace', color: '#627EEA',
    });
    this.detailContainer.add(movesTitle);

    const moves = creature.moves || [];
    moves.forEach((moveId, i) => {
      const id = typeof moveId === 'string' ? moveId : moveId?.id;
      const moveData = id ? MOVES[id] : null;
      if (!moveData) return;

      const y = detailY + 195 + i * 22;

      // Type indicator
      const typeColor = TYPE_COLORS[moveData.type] || 0x888888;
      const typeDot = this.add.graphics();
      typeDot.fillStyle(typeColor, 1);
      typeDot.fillCircle(detailX + 22, y + 5, 4);
      this.detailContainer.add(typeDot);

      // Move name
      const moveText = this.add.text(detailX + 32, y, moveData.name, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#cccccc',
      });
      this.detailContainer.add(moveText);

      // Power
      const powerText = this.add.text(detailX + 200, y,
        moveData.power > 0 ? `P:${moveData.power}` : 'STATUS', {
          fontSize: '6px', fontFamily: '"Press Start 2P", monospace',
          color: moveData.power > 0 ? '#ff8844' : '#44ccff',
        });
      this.detailContainer.add(powerText);
    });

    // Description/Lore
    if (creature.lore || creature.description) {
      const loreText = this.add.text(detailX + 15, detailY + 280,
        creature.description || creature.lore || '', {
          fontSize: '6px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
          wordWrap: { width: 235 },
        });
      this.detailContainer.add(loreText);
    }
  }

  _drawStorageList() {
    this._clearContent();
    const w = this.scale.width;
    const storage = this.playerData.storage || [];

    if (storage.length === 0) {
      const emptyText = this.add.text(w / 2, 200, 'Storage is empty!', {
        fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
      }).setOrigin(0.5);
      this.contentContainer.add(emptyText);

      const hintText = this.add.text(w / 2, 230, 'Capture creatures to fill it up.', {
        fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color: '#444444',
      }).setOrigin(0.5);
      this.contentContainer.add(hintText);
      return;
    }

    storage.forEach((creature, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = 30 + col * 150;
      const y = 85 + row * 80;

      const spriteColor = creature.spriteColor
        ? parseInt(creature.spriteColor.replace('#', ''), 16)
        : 0x888888;

      const isSelected = i === this.selectedIndex;

      const box = this.add.graphics();
      box.fillStyle(isSelected ? 0x222244 : 0x151528, 0.9);
      box.fillRoundedRect(x, y, 135, 70, 6);
      if (isSelected) {
        box.lineStyle(2, TYPE_COLORS[creature.type] || 0x888888, 0.8);
        box.strokeRoundedRect(x, y, 135, 70, 6);
      }
      this.contentContainer.add(box);

      const sprite = this.add.graphics();
      sprite.fillStyle(spriteColor, 1);
      sprite.fillRoundedRect(x + 8, y + 10, 40, 40, 4);
      this.contentContainer.add(sprite);

      const name = this.add.text(x + 55, y + 12, creature.name, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
      });
      this.contentContainer.add(name);

      const level = this.add.text(x + 55, y + 28, `Lv.${creature.level || 5}`, {
        fontSize: '6px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa',
      });
      this.contentContainer.add(level);

      const type = this.add.text(x + 55, y + 42, creature.type, {
        fontSize: '6px', fontFamily: '"Press Start 2P", monospace',
        color: TYPE_COLOR_HEX[creature.type] || '#888888',
      });
      this.contentContainer.add(type);
    });
  }

  _drawItemsList() {
    this._clearContent();
    const w = this.scale.width;

    const items = this.playerData.items || {
      cryptospheres: 5,
      premiumSpheres: 1,
      potions: 3,
      superPotions: 1,
      revives: 1,
    };

    const itemList = [
      { key: 'cryptospheres', name: 'CryptoSphere', desc: 'Captures wild creatures', color: '#00ccff', icon: '\u25CF' },
      { key: 'premiumSpheres', name: 'Premium Sphere', desc: '1.5x capture rate', color: '#FFD700', icon: '\u25CF' },
      { key: 'ultraSpheres', name: 'Ultra Sphere', desc: '2x capture rate', color: '#9B59B6', icon: '\u25CF' },
      { key: 'potions', name: 'Potion', desc: 'Restores 20 HP', color: '#00cc44', icon: '\u2665' },
      { key: 'superPotions', name: 'Super Potion', desc: 'Restores 50 HP', color: '#00ff66', icon: '\u2665' },
      { key: 'revives', name: 'Revive', desc: 'Revives fainted creature to 50% HP', color: '#ffaa00', icon: '\u2606' },
    ];

    itemList.forEach((item, i) => {
      const y = 85 + i * 58;
      const count = items[item.key] || 0;
      const isSelected = i === this.selectedIndex;

      const slotBg = this.add.graphics();
      slotBg.fillStyle(isSelected ? 0x222244 : 0x151528, 0.95);
      slotBg.fillRoundedRect(15, y, w - 30, 50, 6);
      if (isSelected) {
        slotBg.lineStyle(2, parseInt(item.color.replace('#', ''), 16), 0.6);
        slotBg.strokeRoundedRect(15, y, w - 30, 50, 6);
      }
      this.contentContainer.add(slotBg);

      // Icon
      const icon = this.add.text(35, y + 12, item.icon, {
        fontSize: '18px', fontFamily: '"Press Start 2P", monospace', color: item.color,
      });
      this.contentContainer.add(icon);

      // Name
      const name = this.add.text(70, y + 10, item.name, {
        fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
      });
      this.contentContainer.add(name);

      // Description
      const desc = this.add.text(70, y + 28, item.desc, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#888888',
      });
      this.contentContainer.add(desc);

      // Count
      const countText = this.add.text(w - 60, y + 15, `x${count}`, {
        fontSize: '12px', fontFamily: '"Press Start 2P", monospace',
        color: count > 0 ? '#ffffff' : '#444444',
      });
      this.contentContainer.add(countText);

      if (isSelected) {
        const cursor = this.add.text(5, y + 15, '\u25B6', {
          fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#F7931A',
        });
        this.contentContainer.add(cursor);
      }
    });
  }

  // === UPDATE ===

  update() {
    const justDown = (key) => Phaser.Input.Keyboard.JustDown(key);

    // Close inventory
    if (justDown(this.keyX) || justDown(this.keyEsc) || justDown(this.keyI)) {
      this._close();
      return;
    }

    // Switch tabs
    if (justDown(this.keyTab)) {
      const tabs = ['party', 'storage', 'items'];
      const currentIndex = tabs.indexOf(this.currentTab);
      this.currentTab = tabs[(currentIndex + 1) % tabs.length];
      this.selectedIndex = 0;
      this._refreshTabs();
      this._refreshContent();
      return;
    }

    // Navigate list
    if (justDown(this.cursors.up)) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this._refreshContent();
    } else if (justDown(this.cursors.down)) {
      this.selectedIndex++;
      this._clampIndex();
      this._refreshContent();
    }

    if (this.currentTab === 'storage') {
      if (justDown(this.cursors.left)) {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this._refreshContent();
      } else if (justDown(this.cursors.right)) {
        this.selectedIndex++;
        this._clampIndex();
        this._refreshContent();
      }
    }
  }

  _clampIndex() {
    let maxIndex = 0;
    if (this.currentTab === 'party') {
      maxIndex = Math.max(0, (this.playerData.party || []).length - 1);
    } else if (this.currentTab === 'storage') {
      maxIndex = Math.max(0, (this.playerData.storage || []).length - 1);
    } else {
      maxIndex = 5; // 6 item types
    }
    this.selectedIndex = Math.min(this.selectedIndex, maxIndex);
  }

  _refreshTabs() {
    this.tabContainer.removeAll(true);
    this.tabTexts = [];
    this._drawTabs(this.scale.width);
  }

  _refreshContent() {
    switch (this.currentTab) {
      case 'party':
        this._drawPartyList();
        break;
      case 'storage':
        this._drawStorageList();
        break;
      case 'items':
        this._drawItemsList();
        break;
    }
  }

  _close() {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(250, () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
    });
  }
}
