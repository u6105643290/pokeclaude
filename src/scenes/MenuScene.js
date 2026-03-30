// MenuScene - Title screen with animated crypto background

import walletManager from '../web3/wallet.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Animated background - dark gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e);
    bg.fillRect(0, 0, w, h);

    // Floating crypto symbols
    this.floatingSymbols = [];
    const symbols = ['\u0E3F', '\u039E', '\u00A5', '\u20BF', '\u0110', '\u039B', '\u2206', '\u03A6', '\u03A8', '\u03A3'];
    const colors = [0xF7931A, 0x627EEA, 0x00D1B2, 0xFFD700, 0x9B59B6, 0x00BFFF, 0xFF6B35, 0x00FF00];

    for (let i = 0; i < 25; i++) {
      const sym = this.add.text(
        Math.random() * w,
        Math.random() * h,
        Phaser.Utils.Array.GetRandom(symbols),
        {
          fontSize: `${12 + Math.random() * 20}px`,
          fontFamily: 'monospace',
          color: '#' + Phaser.Utils.Array.GetRandom(colors).toString(16).padStart(6, '0'),
        }
      ).setAlpha(0.15 + Math.random() * 0.2);

      this.tweens.add({
        targets: sym,
        y: sym.y - 100 - Math.random() * 200,
        alpha: 0,
        duration: 4000 + Math.random() * 6000,
        repeat: -1,
        onRepeat: () => {
          sym.setPosition(Math.random() * w, h + 20);
          sym.setAlpha(0.15 + Math.random() * 0.2);
        },
      });

      this.floatingSymbols.push(sym);
    }

    // Grid lines for cyber effect
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x333366, 0.15);
    for (let x = 0; x < w; x += 40) {
      grid.lineBetween(x, 0, x, h);
    }
    for (let y = 0; y < h; y += 40) {
      grid.lineBetween(0, y, w, y);
    }

    // Title with glow effect
    const titleShadow = this.add.text(w / 2, 140, 'PokeClaude', {
      fontSize: '48px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#6633FF',
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(w / 2, 138, 'PokeClaude', {
      fontSize: '48px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#FFD700',
    }).setOrigin(0.5);

    // Pulsing glow on title
    this.tweens.add({
      targets: titleShadow,
      alpha: 0.2,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    this.add.text(w / 2, 200, 'Crypto Creature RPG', {
      fontSize: '14px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#AAAACC',
    }).setOrigin(0.5);

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(2, 0xFFD700, 0.5);
    line.lineBetween(w / 2 - 150, 230, w / 2 + 150, 230);

    // New Game button
    this._createButton(w / 2, 310, 'New Game', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WorldScene', { newGame: true });
      });
    });

    // Continue button (disabled style if no save)
    this._createButton(w / 2, 370, 'Continue', () => {
      // Check local storage for save
      const save = localStorage.getItem('pokeclaude_save');
      if (save) {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('WorldScene', { saveData: JSON.parse(save) });
        });
      }
    }, !localStorage.getItem('pokeclaude_save'));

    // Connect Wallet button
    const walletBtn = this._createButton(w / 2, 430, 'Connect Wallet', async () => {
      try {
        const result = await walletManager.connect();
        this._updateWalletDisplay(result.address);
      } catch (e) {
        console.warn('Wallet connection failed:', e.message);
      }
    });

    // Wallet address display
    this.walletText = this.add.text(w / 2, 475, '', {
      fontSize: '8px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#00FF00',
    }).setOrigin(0.5);

    if (walletManager.connected) {
      this._updateWalletDisplay(walletManager.address);
    }

    // Version text
    this.add.text(w / 2, h - 30, 'v0.1.0 - Alpha', {
      fontSize: '10px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#555577',
    }).setOrigin(0.5);

    // "Press any key" blinker
    const pressText = this.add.text(w / 2, h - 60, '', {
      fontSize: '10px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#888888',
    }).setOrigin(0.5);
    // Not needed since we have buttons, but adds atmosphere
  }

  _createButton(x, y, text, callback, disabled = false) {
    const container = this.add.container(x, y);

    const bg = this.add.image(0, 0, 'button').setOrigin(0.5);
    const label = this.add.text(0, 0, text, {
      fontSize: '14px',
      fontFamily: '"Press Start 2P", monospace',
      color: disabled ? '#666666' : '#FFFFFF',
    }).setOrigin(0.5);

    container.add([bg, label]);

    if (disabled) {
      bg.setTint(0x666666);
      return container;
    }

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setTexture('button_hover');
      label.setColor('#FFD700');
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    bg.on('pointerout', () => {
      bg.setTexture('button');
      label.setColor('#FFFFFF');
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95, scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });

    return container;
  }

  _updateWalletDisplay(address) {
    if (this.walletText) {
      const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
      this.walletText.setText(`Connected: ${short}`);
    }
  }
}
