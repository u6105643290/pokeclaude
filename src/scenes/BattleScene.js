// BattleScene - Turn-based battle UI (classic Pokemon style)
// Supports wild encounters and trainer battles with multi-creature parties

import BattleManager from '../battle/BattleManager.js';
import { MOVES } from '../characters/moves.js';
import { CREATURES, createCreatureInstance } from '../characters/creatures.js';

const TYPE_COLORS = {
  DeFi: 0x627EEA, AI: 0x00D1B2, Meme: 0xFFD700, Layer1: 0xF7931A,
  NFT: 0x9B59B6, Privacy: 0x2C3E50, Oracle: 0x00BFFF, Gaming: 0xFF6B35,
};

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.playerCreature = data.playerCreature;
    this.enemyCreature = data.enemyCreature;
    this.isWild = data.isWild !== false;
    this.playerData = data.playerData;
    this.trainerId = data.trainerId || null;
    this.trainerName = data.trainerName || null;
    this.enemyParty = data.enemyParty || [data.enemyCreature];
    this.currentEnemyIndex = 0;
    this.evolved = false;
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const w = this.scale.width;
    const h = this.scale.height;

    this.battleManager = new BattleManager();
    this.battleManager.startBattle(this.playerCreature, this.enemyCreature, this.isWild);

    this.battleState = 'intro';
    this.messageQueue = [];

    this._drawBackground(w, h);
    this._drawCreatures(w, h);
    this._drawEnemyInfo(w, h);
    this._drawPlayerInfo(w, h);
    this._createActionMenu(w, h);
    this._createMoveMenu(w, h);
    this._createMessageBox(w, h);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.selectedAction = 0;
    this.selectedMove = 0;

    this._introAnimation();
  }

  // === DRAWING ===

  _drawBackground(w, h) {
    if (this.textures.exists('battle_bg')) {
      this.add.image(w / 2, h * 0.325, 'battle_bg')
        .setDisplaySize(w, h * 0.65).setOrigin(0.5, 0.5);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4CAF50, 0x4CAF50);
      bg.fillRect(0, 0, w, h * 0.65);
    }

    const platforms = this.add.graphics();
    platforms.fillStyle(0x66BB6A, 1);
    platforms.fillEllipse(w * 0.25, h * 0.52, 280, 60);
    platforms.fillStyle(0x4CAF50, 1);
    platforms.fillEllipse(w * 0.25, h * 0.515, 260, 48);
    platforms.fillStyle(0x66BB6A, 1);
    platforms.fillEllipse(w * 0.75, h * 0.32, 240, 50);
    platforms.fillStyle(0x4CAF50, 1);
    platforms.fillEllipse(w * 0.75, h * 0.315, 220, 40);
    platforms.fillStyle(0x111111, 1);
    platforms.fillRect(0, h * 0.65, w, h * 0.35);
    platforms.lineStyle(2, 0x333333, 1);
    platforms.lineBetween(0, h * 0.65, w, h * 0.65);
  }

  _drawCreatures(w, h) {
    const pId = this.playerCreature.id;
    const eId = this.enemyCreature.id;

    const pBackKey = this.textures.exists(`${pId}_back`) ? `${pId}_back` : pId;
    this.playerSprite = this.add.image(170, h * 0.46, pBackKey)
      .setScale(2.5).setDepth(5).setOrigin(0.5, 1);

    this.playerNameLabel = this.add.text(170, h * 0.48, this.playerCreature.name, {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(5);

    const eFrontKey = this.textures.exists(`${eId}_front`) ? `${eId}_front` : eId;
    this.enemySprite = this.add.image(600, h * 0.28, eFrontKey)
      .setScale(2).setDepth(5).setOrigin(0.5, 1);

    this.playerSprite.x = -100;
    this.enemySprite.x = w + 100;
  }

  _drawEnemyInfo(w, h) {
    const infoX = 30, infoY = 30;

    this.enemyInfoBg = this.add.graphics();
    this.enemyInfoBg.fillStyle(0x222222, 0.9);
    this.enemyInfoBg.fillRoundedRect(infoX, infoY, 280, 75, 8);
    this.enemyInfoBg.lineStyle(2, TYPE_COLORS[this.enemyCreature.type] || 0x888888, 0.8);
    this.enemyInfoBg.strokeRoundedRect(infoX, infoY, 280, 75, 8);
    this.enemyInfoBg.setDepth(10);

    // Show trainer name if trainer battle
    if (!this.isWild && this.trainerName) {
      this.trainerNameText = this.add.text(infoX + 15, infoY - 18,
        `Trainer: ${this.trainerName}`, {
          fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color: '#FF6B35',
        }).setDepth(11);
    }

    // Enemy party indicator for trainer battles
    if (!this.isWild && this.enemyParty.length > 1) {
      this.enemyPartyDots = this.add.graphics().setDepth(11);
      this._drawEnemyPartyDots(infoX, infoY);
    }

    this.enemyNameText = this.add.text(infoX + 15, infoY + 10, this.enemyCreature.name, {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setDepth(11);

    this.enemyLevelText = this.add.text(infoX + 220, infoY + 10, `Lv${this.enemyCreature.level || 5}`, {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa',
    }).setDepth(11);

    const typeColor = TYPE_COLORS[this.enemyCreature.type] || 0x888888;
    this.enemyTypeBadge = this.add.graphics();
    this.enemyTypeBadge.fillStyle(typeColor, 0.8);
    this.enemyTypeBadge.fillRoundedRect(infoX + 15, infoY + 30, 60, 14, 3);
    this.enemyTypeBadge.setDepth(11);
    this.enemyTypeText = this.add.text(infoX + 45, infoY + 37, this.enemyCreature.type, {
      fontSize: '6px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(12);

    this.enemyHpBarBg = this.add.graphics();
    this.enemyHpBarBg.fillStyle(0x333333, 1);
    this.enemyHpBarBg.fillRoundedRect(infoX + 85, infoY + 34, 180, 10, 3);
    this.enemyHpBarBg.setDepth(11);

    this.enemyHpBar = this.add.graphics().setDepth(12);
    this._updateEnemyHpBar();

    this.add.text(infoX + 86, infoY + 48, 'HP', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
    }).setDepth(11);

    this.enemyHpText = this.add.text(infoX + 265, infoY + 48,
      `${this.enemyCreature.currentHp}/${this.enemyCreature.stats.hp}`, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#888888',
      }).setOrigin(1, 0).setDepth(11);

    this.enemyInfoBg.alpha = 0;
  }

  _drawEnemyPartyDots(infoX, infoY) {
    if (!this.enemyPartyDots) return;
    this.enemyPartyDots.clear();
    for (let i = 0; i < this.enemyParty.length; i++) {
      const alive = this.enemyParty[i].currentHp > 0;
      this.enemyPartyDots.fillStyle(alive ? 0x44FF44 : 0x444444, 1);
      this.enemyPartyDots.fillCircle(infoX + 200 + i * 16, infoY + 62, 5);
    }
  }

  _drawPlayerInfo(w, h) {
    const infoX = w - 310, infoY = h * 0.65 - 90;

    this.playerInfoBg = this.add.graphics();
    this.playerInfoBg.fillStyle(0x222222, 0.9);
    this.playerInfoBg.fillRoundedRect(infoX, infoY, 280, 80, 8);
    this.playerInfoBg.lineStyle(2, TYPE_COLORS[this.playerCreature.type] || 0x888888, 0.8);
    this.playerInfoBg.strokeRoundedRect(infoX, infoY, 280, 80, 8);
    this.playerInfoBg.setDepth(10);

    this.playerNameText = this.add.text(infoX + 15, infoY + 10, this.playerCreature.name, {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setDepth(11);

    this.playerLevelText = this.add.text(infoX + 220, infoY + 10, `Lv${this.playerCreature.level || 5}`, {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa',
    }).setDepth(11);

    const typeColor = TYPE_COLORS[this.playerCreature.type] || 0x888888;
    this.playerTypeBadge = this.add.graphics();
    this.playerTypeBadge.fillStyle(typeColor, 0.8);
    this.playerTypeBadge.fillRoundedRect(infoX + 15, infoY + 30, 60, 14, 3);
    this.playerTypeBadge.setDepth(11);
    this.add.text(infoX + 45, infoY + 37, this.playerCreature.type, {
      fontSize: '6px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(12);

    this.playerHpBarBg = this.add.graphics();
    this.playerHpBarBg.fillStyle(0x333333, 1);
    this.playerHpBarBg.fillRoundedRect(infoX + 85, infoY + 34, 180, 10, 3);
    this.playerHpBarBg.setDepth(11);

    this.playerHpBar = this.add.graphics().setDepth(12);
    this._updatePlayerHpBar();

    this.add.text(infoX + 86, infoY + 48, 'HP', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
    }).setDepth(11);

    this.playerHpText = this.add.text(infoX + 265, infoY + 48,
      `${this.playerCreature.currentHp}/${this.playerCreature.stats.hp}`, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#888888',
      }).setOrigin(1, 0).setDepth(11);

    const xpBarY = infoY + 62;
    this.playerXpBarBg = this.add.graphics();
    this.playerXpBarBg.fillStyle(0x222244, 1);
    this.playerXpBarBg.fillRoundedRect(infoX + 85, xpBarY, 180, 6, 2);
    this.playerXpBarBg.setDepth(11);

    this.playerXpBar = this.add.graphics().setDepth(12);
    this._updateXpBar();

    this.add.text(infoX + 86, xpBarY + 1, 'XP', {
      fontSize: '5px', fontFamily: '"Press Start 2P", monospace', color: '#4444aa',
    }).setDepth(11);

    this.playerInfoBg.alpha = 0;
  }

  _updateEnemyHpBar() {
    this.enemyHpBar.clear();
    const ratio = Math.max(0, this.enemyCreature.currentHp / this.enemyCreature.stats.hp);
    const color = ratio > 0.5 ? 0x00cc44 : ratio > 0.2 ? 0xcccc00 : 0xcc2222;
    this.enemyHpBar.fillStyle(color, 1);
    this.enemyHpBar.fillRoundedRect(30 + 85, 30 + 34, 180 * ratio, 10, 3);
    if (this.enemyHpText) {
      this.enemyHpText.setText(`${this.enemyCreature.currentHp}/${this.enemyCreature.stats.hp}`);
    }
  }

  _updatePlayerHpBar() {
    this.playerHpBar.clear();
    const w = this.scale.width, h = this.scale.height;
    const infoX = w - 310, infoY = h * 0.65 - 90;
    const ratio = Math.max(0, this.playerCreature.currentHp / this.playerCreature.stats.hp);
    const color = ratio > 0.5 ? 0x00cc44 : ratio > 0.2 ? 0xcccc00 : 0xcc2222;
    this.playerHpBar.fillStyle(color, 1);
    this.playerHpBar.fillRoundedRect(infoX + 85, infoY + 34, 180 * ratio, 10, 3);
    if (this.playerHpText) {
      this.playerHpText.setText(`${this.playerCreature.currentHp}/${this.playerCreature.stats.hp}`);
    }
  }

  _updateXpBar() {
    this.playerXpBar.clear();
    const w = this.scale.width, h = this.scale.height;
    const infoX = w - 310, infoY = h * 0.65 - 90;
    const xpBarY = infoY + 62;
    const xp = this.playerCreature.xp || 0;
    const xpToNext = this.playerCreature.xpToNext || 100;
    const ratio = Math.min(1, xp / xpToNext);
    this.playerXpBar.fillStyle(0x4444ff, 1);
    this.playerXpBar.fillRoundedRect(infoX + 85, xpBarY, 180 * ratio, 6, 2);
  }

  // === MENUS ===

  _createMessageBox(w, h) {
    const boxY = h * 0.65 + 5;
    this.msgBoxBg = this.add.graphics();
    this.msgBoxBg.fillStyle(0x1a1a2e, 0.95);
    this.msgBoxBg.fillRoundedRect(10, boxY, w - 20, h * 0.35 - 15, 8);
    this.msgBoxBg.lineStyle(2, 0x627EEA, 0.6);
    this.msgBoxBg.strokeRoundedRect(10, boxY, w - 20, h * 0.35 - 15, 8);
    this.msgBoxBg.setDepth(20);

    this.messageText = this.add.text(30, boxY + 20, '', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
      wordWrap: { width: w - 80 }, lineSpacing: 8,
    }).setDepth(21);

    this.continueIndicator = this.add.text(w - 40, h - 25, '\u25BC', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#627EEA',
    }).setDepth(22).setAlpha(0);

    this.tweens.add({
      targets: this.continueIndicator,
      alpha: { from: 0, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  _createActionMenu(w, h) {
    const menuX = w - 250, menuY = h * 0.65 + 10;
    const menuW = 230, menuH = h * 0.35 - 25;

    this.actionMenuContainer = this.add.container(0, 0).setDepth(25).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(menuX, menuY, menuW, menuH, 8);
    bg.lineStyle(2, 0xF7931A, 0.6);
    bg.strokeRoundedRect(menuX, menuY, menuW, menuH, 8);
    this.actionMenuContainer.add(bg);

    this.actionLabels = [];
    const actions = this.isWild
      ? ['FIGHT', 'CAPTURE', 'PARTY', 'RUN']
      : ['FIGHT', '---', 'PARTY', 'RUN'];
    const actionColors = ['#ff4444', this.isWild ? '#00ccff' : '#444444', '#44ff44', '#ffcc00'];

    actions.forEach((label, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const tx = menuX + 25 + col * 110, ty = menuY + 20 + row * 45;
      const text = this.add.text(tx, ty, label, {
        fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: actionColors[i],
      }).setDepth(26);
      this.actionMenuContainer.add(text);
      this.actionLabels.push(text);
    });

    this.actionCursor = this.add.text(0, 0, '\u25B6', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setDepth(27);
    this.actionMenuContainer.add(this.actionCursor);
  }

  _createMoveMenu(w, h) {
    const menuY = h * 0.65 + 10, menuH = h * 0.35 - 25;

    this.moveMenuContainer = this.add.container(0, 0).setDepth(25).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(10, menuY, w - 20, menuH, 8);
    bg.lineStyle(2, 0xff4444, 0.6);
    bg.strokeRoundedRect(10, menuY, w - 20, menuH, 8);
    this.moveMenuContainer.add(bg);

    this.moveLabels = [];
    this.movePpTexts = [];

    const moves = this.playerCreature.moves || [];
    for (let i = 0; i < 4; i++) {
      const moveId = typeof moves[i] === 'string' ? moves[i] : (moves[i] && moves[i].id);
      const moveData = moveId ? MOVES[moveId] : null;

      const col = i % 2, row = Math.floor(i / 2);
      const tx = 40 + col * 370, ty = menuY + 20 + row * 45;

      const displayName = moveData ? moveData.name : '---';
      const displayType = moveData ? moveData.type : '';
      const typeColor = TYPE_COLORS[displayType] || 0x888888;

      const nameText = this.add.text(tx, ty, displayName, {
        fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
      }).setDepth(26);
      this.moveMenuContainer.add(nameText);
      this.moveLabels.push(nameText);

      const pp = moveData ? `${moveData.pp}/${moveData.maxPp}` : '';
      const ppText = this.add.text(tx + 200, ty + 16, pp, {
        fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#888888',
      }).setDepth(26);
      this.moveMenuContainer.add(ppText);
      this.movePpTexts.push(ppText);

      if (moveData) {
        const typeBg = this.add.graphics();
        typeBg.fillStyle(typeColor, 0.6);
        typeBg.fillRoundedRect(tx, ty + 15, 50, 12, 3);
        this.moveMenuContainer.add(typeBg);
        const typeText = this.add.text(tx + 25, ty + 21, displayType, {
          fontSize: '5px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
        }).setOrigin(0.5).setDepth(27);
        this.moveMenuContainer.add(typeText);
      }
    }

    this.moveCursor = this.add.text(0, 0, '\u25B6', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
    }).setDepth(27);
    this.moveMenuContainer.add(this.moveCursor);

    const backText = this.add.text(w - 100, menuY + menuH - 20, 'X:Back', {
      fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
    }).setDepth(26);
    this.moveMenuContainer.add(backText);
  }

  // === ANIMATIONS ===

  _introAnimation() {
    const w = this.scale.width;

    this.tweens.add({
      targets: this.enemySprite, x: 600, duration: 800, ease: 'Back.easeOut', delay: 200,
    });
    this.tweens.add({
      targets: this.playerSprite, x: 170, duration: 800, ease: 'Back.easeOut', delay: 400,
    });
    this.tweens.add({
      targets: [this.enemyInfoBg, this.playerInfoBg], alpha: 1, duration: 500, delay: 900,
    });

    this.time.delayedCall(1200, () => {
      const prefix = this.isWild ? 'A wild' : `${this.trainerName || 'Enemy'}'s`;
      this._showMessage(`${prefix} ${this.enemyCreature.name} appeared!`, () => {
        this._showMessage(`Go, ${this.playerCreature.name}!`, () => {
          this._showActionMenu();
        });
      });
    });
  }

  _showMessage(text, onComplete) {
    this.battleState = 'message';
    this.actionMenuContainer.setVisible(false);
    this.moveMenuContainer.setVisible(false);
    this.msgBoxBg.setVisible(true);
    this.messageText.setText('');
    this.continueIndicator.setAlpha(0);

    this.input.keyboard.removeAllListeners('keydown-Z');
    this.input.keyboard.removeAllListeners('keydown-SPACE');

    let typingDone = false;
    let charIndex = 0;

    const finishTyping = () => {
      if (typingDone) return;
      typingDone = true;
      if (typeTimer) typeTimer.destroy();
      this.messageText.setText(text);
      this.continueIndicator.setAlpha(1);
      this.time.delayedCall(150, () => {
        this._waitForInput(() => {
          if (onComplete) onComplete();
        });
      });
    };

    const typeTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        charIndex++;
        this.messageText.setText(text.substring(0, charIndex));
        if (charIndex >= text.length) finishTyping();
      },
      repeat: text.length - 1,
    });

    this.input.keyboard.once('keydown-Z', () => { if (!typingDone) finishTyping(); });
    this.input.keyboard.once('keydown-SPACE', () => { if (!typingDone) finishTyping(); });
  }

  _waitForInput(callback) {
    this.input.keyboard.removeAllListeners('keydown-Z');
    this.input.keyboard.removeAllListeners('keydown-SPACE');
    const handler = () => {
      this.input.keyboard.removeAllListeners('keydown-Z');
      this.input.keyboard.removeAllListeners('keydown-SPACE');
      callback();
    };
    this.input.keyboard.once('keydown-Z', handler);
    this.input.keyboard.once('keydown-SPACE', handler);
  }

  _showActionMenu() {
    this.battleState = 'menu';
    this.selectedAction = 0;
    this.actionMenuContainer.setVisible(true);
    this.moveMenuContainer.setVisible(false);
    this.messageText.setText('What will you do?');
    this.continueIndicator.setAlpha(0);
    this._updateActionCursor();
  }

  _showMoveMenu() {
    this.battleState = 'move_select';
    this.selectedMove = 0;
    this.actionMenuContainer.setVisible(false);
    this.moveMenuContainer.setVisible(true);
    this._updateMoveCursor();
  }

  _updateActionCursor() {
    const w = this.scale.width, h = this.scale.height;
    const menuX = w - 250, menuY = h * 0.65 + 10;
    const col = this.selectedAction % 2, row = Math.floor(this.selectedAction / 2);
    this.actionCursor.setPosition(menuX + 10 + col * 110, menuY + 20 + row * 45);
  }

  _updateMoveCursor() {
    const h = this.scale.height;
    const menuY = h * 0.65 + 10;
    const col = this.selectedMove % 2, row = Math.floor(this.selectedMove / 2);
    this.moveCursor.setPosition(25 + col * 370, menuY + 20 + row * 45);
  }

  // === UPDATE ===

  update() {
    if (this.battleState === 'menu') this._handleActionInput();
    else if (this.battleState === 'move_select') this._handleMoveInput();
  }

  _handleActionInput() {
    const justDown = (key) => Phaser.Input.Keyboard.JustDown(key);
    if (justDown(this.cursors.left)) { if (this.selectedAction % 2 === 1) this.selectedAction--; this._updateActionCursor(); }
    else if (justDown(this.cursors.right)) { if (this.selectedAction % 2 === 0) this.selectedAction++; this._updateActionCursor(); }
    else if (justDown(this.cursors.up)) { if (this.selectedAction >= 2) this.selectedAction -= 2; this._updateActionCursor(); }
    else if (justDown(this.cursors.down)) { if (this.selectedAction < 2) this.selectedAction += 2; this._updateActionCursor(); }
    if (justDown(this.keyZ) || justDown(this.keySpace)) this._selectAction(this.selectedAction);
  }

  _handleMoveInput() {
    const justDown = (key) => Phaser.Input.Keyboard.JustDown(key);
    const moves = this.playerCreature.moves || [];
    const maxMoves = Math.min(4, moves.length);
    if (justDown(this.cursors.left)) { if (this.selectedMove % 2 === 1) this.selectedMove--; this._updateMoveCursor(); }
    else if (justDown(this.cursors.right)) { if (this.selectedMove % 2 === 0 && this.selectedMove + 1 < maxMoves) this.selectedMove++; this._updateMoveCursor(); }
    else if (justDown(this.cursors.up)) { if (this.selectedMove >= 2) this.selectedMove -= 2; this._updateMoveCursor(); }
    else if (justDown(this.cursors.down)) { if (this.selectedMove + 2 < maxMoves) this.selectedMove += 2; this._updateMoveCursor(); }
    if (justDown(this.keyZ) || justDown(this.keySpace)) this._selectMove(this.selectedMove);
    if (justDown(this.keyX)) this._showActionMenu();
  }

  // === ACTION HANDLING ===

  _selectAction(index) {
    switch (index) {
      case 0: this._showMoveMenu(); break;
      case 1:
        if (this.isWild) this._attemptCapture();
        else this._showMessage("Can't capture a trainer's creature!", () => this._showActionMenu());
        break;
      case 2: this._showMessage('Party switching coming soon!', () => this._showActionMenu()); break;
      case 3: this._attemptRun(); break;
    }
  }

  _selectMove(index) {
    const moves = this.playerCreature.moves || [];
    const moveId = typeof moves[index] === 'string' ? moves[index] : (moves[index] && moves[index].id);
    if (!moveId || !MOVES[moveId]) {
      this._showMessage('No move in that slot!', () => this._showMoveMenu());
      return;
    }
    this.battleState = 'animating';
    this.actionMenuContainer.setVisible(false);
    this.moveMenuContainer.setVisible(false);
    const turnLog = this.battleManager.executeTurn(moveId);
    this._processBattleLog(turnLog);
  }

  _processBattleLog(logEntries) {
    if (logEntries.length === 0) {
      if (this.battleManager.battleOver) {
        this._handleBattleEnd();
      } else {
        this._showActionMenu();
      }
      return;
    }
    const entry = logEntries.shift();
    this._animateLogEntry(entry, () => this._processBattleLog(logEntries));
  }

  _animateLogEntry(entry, onComplete) {
    switch (entry.type) {
      case 'action':
        this._showMessage(entry.message, onComplete);
        break;

      case 'damage': {
        const isEnemy = entry.side === 'enemy';
        const sprite = isEnemy ? this.enemySprite : this.playerSprite;
        this.tweens.add({ targets: sprite, alpha: 0.2, duration: 80, yoyo: true, repeat: 3 });
        this.tweens.add({ targets: sprite, x: sprite.x + (isEnemy ? -8 : 8), duration: 50, yoyo: true, repeat: 2 });
        this.time.delayedCall(300, () => {
          if (isEnemy) this._updateEnemyHpBar();
          else this._updatePlayerHpBar();
          this._showMessage(entry.message, onComplete);
        });
        break;
      }

      case 'heal':
      case 'recoil': {
        const isEnemy = entry.side === 'enemy';
        if (isEnemy) this._updateEnemyHpBar();
        else this._updatePlayerHpBar();
        this._showMessage(entry.message, onComplete);
        break;
      }

      case 'ko': {
        const isEnemy = entry.side === 'enemy';
        const sprite = isEnemy ? this.enemySprite : this.playerSprite;
        this.tweens.add({
          targets: sprite, y: sprite.y + 80, alpha: 0, duration: 600, ease: 'Power2',
          onComplete: () => this._showMessage(entry.message, onComplete),
        });
        break;
      }

      default:
        this._showMessage(entry.message || '...', onComplete);
        break;
    }
  }

  _attemptCapture() {
    if (!this.isWild) {
      this._showMessage("Can't capture a trainer's creature!", () => this._showActionMenu());
      return;
    }
    this.battleState = 'animating';
    this.actionMenuContainer.setVisible(false);

    const spheres = this.playerData.inventory?.cryptospheres || 0;
    if (spheres <= 0) {
      this._showMessage("No CryptoSpheres left!", () => this._showActionMenu());
      return;
    }
    if (this.playerData.inventory) {
      this.playerData.inventory.cryptospheres = Math.max(0, (this.playerData.inventory.cryptospheres || 0) - 1);
    }

    const result = this.battleManager.attemptCapture('standard');
    this._processBattleLog(result.log);

    if (result.success) {
      this.time.delayedCall(2000, () => {
        if (this.playerData.party.length < 6) {
          this.playerData.party.push(result.creature);
        } else {
          this.playerData.box = this.playerData.box || [];
          this.playerData.box.push(result.creature);
        }
      });
    }
  }

  _attemptRun() {
    if (!this.isWild) {
      this._showMessage("Can't run from a trainer battle!", () => this._showActionMenu());
      return;
    }
    this.battleState = 'animating';
    this.actionMenuContainer.setVisible(false);
    const result = this.battleManager.attemptRun();
    this._showMessage(result.message, () => {
      if (result.success) {
        this._exitBattle();
      } else {
        const enemyMove = this.battleManager._getRandomEnemyMove();
        const log = this.battleManager._executeMove(
          this.enemyCreature, this.playerCreature, enemyMove, 'enemy', 'player'
        );
        this._processBattleLog(log);
      }
    });
  }

  // === BATTLE END ===

  _handleBattleEnd() {
    const winner = this.battleManager.winner;

    if (winner === 'player') {
      // Check if trainer has more creatures
      if (!this.isWild && this.enemyParty.length > 1) {
        this.currentEnemyIndex++;
        if (this.currentEnemyIndex < this.enemyParty.length) {
          this._sendNextEnemyCreature();
          return;
        }
      }

      // Victory - XP gain
      const xpGain = this.battleManager.calculateXpGain(this.enemyCreature);
      // Trainer battles give 50% more XP
      const finalXp = this.isWild ? xpGain : Math.floor(xpGain * 1.5);
      const results = this.battleManager.applyXp(this.playerCreature, finalXp);

      // Check for evolution in results
      for (const r of results) {
        if (r.type === 'evolution_ready') this.evolved = true;
      }

      this._processResultLog(results, () => {
        this._updatePlayerHpBar();
        this._updateXpBar();
        this.playerLevelText.setText(`Lv${this.playerCreature.level}`);

        const winMsg = this.isWild
          ? 'You won the battle!'
          : `You defeated ${this.trainerName || 'the trainer'}!`;

        this._showMessage(winMsg, () => {
          if (!this.isWild && this.trainerId) {
            // Trainer battle gives bonus coins
            const coinReward = Math.floor(50 + this.enemyParty.length * 30);
            this.playerData.coins += coinReward;
            this._showMessage(`You earned ${coinReward} coins!`, () => {
              this._exitBattle({ trainerDefeated: this.trainerId });
            });
          } else {
            this._exitBattle();
          }
        });
      });
    } else {
      this._showMessage(`${this.playerCreature.name} fainted...`, () => {
        this.playerCreature.currentHp = Math.floor(this.playerCreature.stats.hp * 0.5);
        this.playerData.x = 25;
        this.playerData.y = 45;
        if (!this.isWild && this.trainerId) {
          this._exitBattle({ trainerLost: this.trainerId });
        } else {
          this._exitBattle();
        }
      });
    }
  }

  _sendNextEnemyCreature() {
    const nextCreature = this.enemyParty[this.currentEnemyIndex];

    this._showMessage(
      `${this.trainerName || 'The trainer'} sends out ${nextCreature.name}!`,
      () => {
        // Update enemy creature reference
        this.enemyCreature = nextCreature;
        this.battleManager.startBattle(this.playerCreature, this.enemyCreature, false);

        // Update enemy info
        this.enemyNameText.setText(this.enemyCreature.name);
        this.enemyLevelText.setText(`Lv${this.enemyCreature.level || 5}`);
        this.enemyTypeText.setText(this.enemyCreature.type);

        // Redraw type badge
        const typeColor = TYPE_COLORS[this.enemyCreature.type] || 0x888888;
        this.enemyTypeBadge.clear();
        this.enemyTypeBadge.fillStyle(typeColor, 0.8);
        this.enemyTypeBadge.fillRoundedRect(30 + 15, 30 + 30, 60, 14, 3);

        this._updateEnemyHpBar();
        this._drawEnemyPartyDots(30, 30);

        // New sprite
        const eId = this.enemyCreature.id;
        const eFrontKey = this.textures.exists(`${eId}_front`) ? `${eId}_front` : eId;
        this.enemySprite.setTexture(eFrontKey);
        this.enemySprite.setAlpha(1);
        this.enemySprite.x = this.scale.width + 100;
        this.enemySprite.y = this.scale.height * 0.28;

        // Slide in
        this.tweens.add({
          targets: this.enemySprite,
          x: 600,
          duration: 600,
          ease: 'Back.easeOut',
          onComplete: () => this._showActionMenu(),
        });
      }
    );
  }

  _processResultLog(results, onComplete) {
    if (results.length === 0) { onComplete(); return; }
    const entry = results.shift();
    if (entry.type === 'evolution_ready') {
      this._handleEvolution(entry, () => this._processResultLog(results, onComplete));
    } else {
      this._showMessage(entry.message, () => {
        if (entry.type === 'levelup') {
          this._updateXpBar();
          this.playerLevelText.setText(`Lv${this.playerCreature.level}`);
        }
        this._processResultLog(results, onComplete);
      });
    }
  }

  _handleEvolution(entry, onComplete) {
    const evolvedData = CREATURES[entry.evolvesTo];
    if (!evolvedData) { onComplete(); return; }

    this.evolved = true;

    this._showMessage(`${this.playerCreature.name} is evolving!`, () => {
      this.cameras.main.flash(1000, 255, 255, 255);
      this.time.delayedCall(1000, () => {
        const oldName = this.playerCreature.name;
        this.playerCreature.name = evolvedData.name;
        this.playerCreature.id = evolvedData.id;
        this.playerCreature.type = evolvedData.type;
        this.playerCreature.spriteColor = evolvedData.spriteColor;
        this.playerCreature.baseStats = { ...evolvedData.baseStats };
        this.playerCreature.moves = [...evolvedData.moves];
        this.playerCreature.evolution = evolvedData.evolution;
        this.playerCreature.rarity = evolvedData.rarity;
        this.playerCreature.description = evolvedData.description;

        for (const stat in this.playerCreature.baseStats) {
          if (stat === 'hp') {
            this.playerCreature.stats.hp = Math.floor(
              ((2 * this.playerCreature.baseStats.hp * this.playerCreature.level) / 100) +
              this.playerCreature.level + 10
            );
          } else {
            this.playerCreature.stats[stat] = Math.floor(
              ((2 * this.playerCreature.baseStats[stat] * this.playerCreature.level) / 100) + 5
            );
          }
        }
        this.playerCreature.currentHp = this.playerCreature.stats.hp;

        this._showMessage(`${oldName} evolved into ${evolvedData.name}!`, onComplete);
      });
    });
  }

  _exitBattle(extraData = {}) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.stop();
      this.scene.wake('WorldScene', {
        playerData: this.playerData,
        captured: extraData.captured || null,
        evolved: this.evolved,
        trainerDefeated: extraData.trainerDefeated || null,
        trainerLost: extraData.trainerLost || null,
      });
    });
  }
}
