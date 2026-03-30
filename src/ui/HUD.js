// In-game HUD for PokeClaude

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(900).setScrollFactor(0);

    this.areaText = null;
    this.partyBars = [];
    this.coinText = null;
    this.miniMapBg = null;
    this.miniMapDot = null;
    this.playerData = null;

    this._create();
  }

  _create() {
    const w = this.scene.scale.width;
    const font = '"Press Start 2P", monospace';

    // Top bar background
    const topBar = this.scene.add.graphics();
    topBar.fillStyle(0x000000, 0.7);
    topBar.fillRect(0, 0, w, 36);
    this.container.add(topBar);

    // Area name
    this.areaText = this.scene.add.text(10, 8, 'Satoshi Town', {
      fontSize: '12px', fontFamily: font, color: '#FFD700',
    });
    this.container.add(this.areaText);

    // ClaudeCoin balance
    const coinIcon = this.scene.add.graphics();
    coinIcon.fillStyle(0xFFD700);
    coinIcon.fillCircle(w - 150, 18, 8);
    coinIcon.fillStyle(0x000000);
    coinIcon.fillRect(w - 153, 15, 6, 6);
    this.container.add(coinIcon);

    this.coinText = this.scene.add.text(w - 136, 8, '0 CC', {
      fontSize: '10px', fontFamily: font, color: '#FFFFFF',
    });
    this.container.add(this.coinText);

    // Mini-map (top right)
    this.miniMapBg = this.scene.add.graphics();
    this.miniMapBg.fillStyle(0x222222, 0.8);
    this.miniMapBg.fillRect(w - 80, 44, 72, 72);
    this.miniMapBg.lineStyle(2, 0xFFFFFF, 0.5);
    this.miniMapBg.strokeRect(w - 80, 44, 72, 72);
    this.container.add(this.miniMapBg);

    this.miniMapDot = this.scene.add.graphics();
    this.miniMapDot.fillStyle(0x00FF00);
    this.miniMapDot.fillCircle(0, 0, 3);
    this.miniMapDot.setPosition(w - 44, 80);
    this.container.add(this.miniMapDot);

    // Party HP bars (bottom left)
    this._createPartyBars();
  }

  _createPartyBars() {
    const font = '"Press Start 2P", monospace';
    const startY = this.scene.scale.height - 100;

    for (let i = 0; i < 6; i++) {
      const y = startY + i * 16;
      const barContainer = this.scene.add.container(8, y);

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x333333, 0.6);
      bg.fillRect(0, 0, 100, 12);
      barContainer.add(bg);

      const fill = this.scene.add.graphics();
      fill.fillStyle(0x00FF00);
      fill.fillRect(1, 1, 98, 10);
      barContainer.add(fill);

      const text = this.scene.add.text(104, -1, '', {
        fontSize: '8px', fontFamily: font, color: '#FFFFFF',
      });
      barContainer.add(text);

      barContainer.setVisible(false);
      this.container.add(barContainer);
      this.partyBars.push({ container: barContainer, bg, fill, text });
    }
  }

  update(playerData) {
    if (!playerData) return;
    this.playerData = playerData;

    // Update area name
    if (playerData.currentArea) {
      this.areaText.setText(playerData.currentArea);
    }

    // Update coin balance
    if (playerData.coins !== undefined) {
      this.coinText.setText(`${playerData.coins} CC`);
    }

    // Update party HP bars
    if (playerData.party) {
      playerData.party.forEach((creature, i) => {
        if (i >= 6) return;
        const bar = this.partyBars[i];
        bar.container.setVisible(true);

        const hpPercent = creature.currentHp / creature.stats.hp;
        const barColor = hpPercent > 0.5 ? 0x00FF00 : hpPercent > 0.2 ? 0xFFFF00 : 0xFF0000;
        const barWidth = Math.max(0, Math.floor(98 * hpPercent));

        bar.fill.clear();
        bar.fill.fillStyle(barColor);
        bar.fill.fillRect(1, 1, barWidth, 10);

        bar.text.setText(`${creature.name} ${creature.currentHp}/${creature.stats.hp}`);
      });

      // Hide unused bars
      for (let i = playerData.party.length; i < 6; i++) {
        this.partyBars[i].container.setVisible(false);
      }
    }

    // Update minimap dot based on player position in world
    if (playerData.worldX !== undefined && playerData.worldY !== undefined) {
      const w = this.scene.scale.width;
      const mapX = w - 80 + (playerData.worldX / playerData.worldWidth) * 72;
      const mapY = 44 + (playerData.worldY / playerData.worldHeight) * 72;
      this.miniMapDot.setPosition(
        Phaser.Math.Clamp(mapX, w - 78, w - 10),
        Phaser.Math.Clamp(mapY, 46, 114)
      );
    }
  }

  setArea(name) {
    this.areaText.setText(name);
  }

  destroy() {
    if (this.container) this.container.destroy();
  }
}
