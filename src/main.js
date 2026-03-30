// PokeClaude - Main game entry point

import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorldScene from './scenes/WorldScene.js';
import BattleScene from './scenes/BattleScene.js';
import InventoryScene from './scenes/InventoryScene.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
  },
  scene: [BootScene, MenuScene, WorldScene, BattleScene, InventoryScene],
};

const game = new Phaser.Game(config);

// Expose game instance globally for wallet integration
window.__pokeClaudeGame = game;

// Signal that the game has been created
window.addEventListener('load', () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('gameReady'));
  }, 1500);
});

export default game;
