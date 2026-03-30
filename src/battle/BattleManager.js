// Battle logic engine for PokeClaude

import { getEffectiveness, getEffectivenessText } from '../characters/typeChart.js';
import { MOVES } from '../characters/moves.js';
import { getXpForLevel, createCreatureInstance } from '../characters/creatures.js';

export default class BattleManager {
  constructor() {
    this.playerCreature = null;
    this.enemyCreature = null;
    this.isWild = true;
    this.turnLog = [];
    this.battleOver = false;
    this.winner = null;
    this.statModifiers = { player: {}, enemy: {} };
  }

  startBattle(playerCreature, enemyCreature, isWild = true) {
    this.playerCreature = playerCreature;
    this.enemyCreature = enemyCreature;
    this.isWild = isWild;
    this.battleOver = false;
    this.winner = null;
    this.turnLog = [];
    this.statModifiers = {
      player: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, evasion: 0, accuracy: 0 },
      enemy: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, evasion: 0, accuracy: 0 },
    };
    return { message: `A wild ${enemyCreature.name} appeared!` };
  }

  // Determine turn order and execute
  executeTurn(playerMoveId, enemyMoveId = null) {
    if (this.battleOver) return [];

    const log = [];
    const playerMove = MOVES[playerMoveId];
    const enemyMove = enemyMoveId ? MOVES[enemyMoveId] : this._getRandomEnemyMove();

    if (!playerMove || !enemyMove) {
      log.push({ type: 'error', message: 'Invalid move!' });
      return log;
    }

    // Determine who goes first based on speed + modifiers
    const playerSpeed = this._getModifiedStat(this.playerCreature, 'speed', 'player');
    const enemySpeed = this._getModifiedStat(this.enemyCreature, 'speed', 'enemy');

    const playerFirst = playerSpeed >= enemySpeed;

    if (playerFirst) {
      log.push(...this._executeMove(this.playerCreature, this.enemyCreature, playerMove, 'player', 'enemy'));
      if (!this.battleOver) {
        log.push(...this._executeMove(this.enemyCreature, this.playerCreature, enemyMove, 'enemy', 'player'));
      }
    } else {
      log.push(...this._executeMove(this.enemyCreature, this.playerCreature, enemyMove, 'enemy', 'player'));
      if (!this.battleOver) {
        log.push(...this._executeMove(this.playerCreature, this.enemyCreature, playerMove, 'player', 'enemy'));
      }
    }

    this.turnLog.push(...log);
    return log;
  }

  _executeMove(attacker, defender, move, attackerSide, defenderSide) {
    const log = [];

    log.push({
      type: 'action',
      side: attackerSide,
      message: `${attacker.name} used ${move.name}!`,
    });

    // Accuracy check
    const accuracyMod = this._getStatMultiplier(this.statModifiers[attackerSide].accuracy);
    const evasionMod = this._getStatMultiplier(this.statModifiers[defenderSide].evasion);
    const hitChance = (move.accuracy / 100) * (accuracyMod / evasionMod);

    if (Math.random() > hitChance) {
      log.push({ type: 'miss', side: attackerSide, message: `${attacker.name}'s attack missed!` });
      return log;
    }

    if (move.category === 'status') {
      log.push(...this._applyStatusEffect(move, attacker, defender, attackerSide, defenderSide));
      return log;
    }

    // Calculate damage
    const damage = this._calculateDamage(attacker, defender, move, attackerSide, defenderSide);

    // Type effectiveness
    const effectiveness = getEffectiveness(move.type, defender.type);
    const effectText = getEffectivenessText(effectiveness);

    const totalDamage = Math.max(1, Math.floor(damage * effectiveness));
    defender.currentHp = Math.max(0, defender.currentHp - totalDamage);

    log.push({
      type: 'damage',
      side: defenderSide,
      damage: totalDamage,
      message: `${defender.name} took ${totalDamage} damage!`,
      newHp: defender.currentHp,
      maxHp: defender.stats.hp,
    });

    if (effectText) {
      log.push({ type: 'effectiveness', message: effectText });
    }

    // Drain effect
    if (move.effect === 'drain') {
      const healAmount = Math.floor(totalDamage * 0.5);
      attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healAmount);
      log.push({
        type: 'heal',
        side: attackerSide,
        amount: healAmount,
        message: `${attacker.name} drained ${healAmount} HP!`,
        newHp: attacker.currentHp,
        maxHp: attacker.stats.hp,
      });
    }

    // Recoil effect
    if (move.effect === 'recoil') {
      const recoilDamage = Math.floor(totalDamage * 0.25);
      attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
      log.push({
        type: 'recoil',
        side: attackerSide,
        damage: recoilDamage,
        message: `${attacker.name} took ${recoilDamage} recoil damage!`,
        newHp: attacker.currentHp,
        maxHp: attacker.stats.hp,
      });
    }

    // Check KO
    if (defender.currentHp <= 0) {
      log.push({
        type: 'ko',
        side: defenderSide,
        message: `${defender.name} fainted!`,
      });
      this.battleOver = true;
      this.winner = attackerSide;
    }

    if (attacker.currentHp <= 0) {
      log.push({
        type: 'ko',
        side: attackerSide,
        message: `${attacker.name} fainted!`,
      });
      this.battleOver = true;
      this.winner = defenderSide;
    }

    return log;
  }

  _applyStatusEffect(move, attacker, defender, attackerSide, defenderSide) {
    const log = [];
    const effect = move.effect;

    const statEffects = {
      defUp: { target: attackerSide, stat: 'defense', stages: 1, text: 'defense rose' },
      atkDown: { target: defenderSide, stat: 'attack', stages: -1, text: 'attack fell' },
      spAtkUp: { target: attackerSide, stat: 'specialAttack', stages: 1, text: 'special attack rose' },
      spDefUp: { target: attackerSide, stat: 'specialDefense', stages: 1, text: 'special defense rose' },
      spdUp: { target: attackerSide, stat: 'speed', stages: 1, text: 'speed rose' },
      spdDown: { target: defenderSide, stat: 'speed', stages: -1, text: 'speed fell' },
      evasionUp: { target: attackerSide, stat: 'evasion', stages: 1, text: 'evasion rose' },
      accuracyUp: { target: attackerSide, stat: 'accuracy', stages: 1, text: 'accuracy rose' },
    };

    if (effect === 'heal') {
      const healAmount = Math.floor(attacker.stats.hp * 0.5);
      attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healAmount);
      log.push({
        type: 'heal',
        side: attackerSide,
        amount: healAmount,
        message: `${attacker.name} healed ${healAmount} HP!`,
        newHp: attacker.currentHp,
        maxHp: attacker.stats.hp,
      });
    } else if (effect === 'confuse') {
      log.push({
        type: 'status',
        side: defenderSide,
        message: `${defender.name} became confused!`,
      });
    } else if (statEffects[effect]) {
      const se = statEffects[effect];
      const targetName = se.target === attackerSide ? attacker.name : defender.name;
      this.statModifiers[se.target][se.stat] = Math.max(-6, Math.min(6,
        this.statModifiers[se.target][se.stat] + se.stages
      ));
      log.push({
        type: 'stat_change',
        side: se.target,
        stat: se.stat,
        stages: se.stages,
        message: `${targetName}'s ${se.text}!`,
      });
    }

    return log;
  }

  _calculateDamage(attacker, defender, move, attackerSide, defenderSide) {
    const level = attacker.level || 5;
    const power = move.power;

    let atk, def;
    if (move.category === 'physical') {
      atk = this._getModifiedStat(attacker, 'attack', attackerSide);
      def = this._getModifiedStat(defender, 'defense', defenderSide);
    } else {
      atk = this._getModifiedStat(attacker, 'specialAttack', attackerSide);
      def = this._getModifiedStat(defender, 'specialDefense', defenderSide);
    }

    // STAB (Same Type Attack Bonus)
    const stab = move.type === attacker.type ? 1.5 : 1.0;

    // Random factor
    const random = 0.85 + Math.random() * 0.15;

    // Damage formula
    const damage = (((2 * level / 5 + 2) * power * (atk / def)) / 50 + 2) * stab * random;
    return Math.max(1, Math.floor(damage));
  }

  _getModifiedStat(creature, statName, side) {
    const baseStat = creature.stats[statName] || 10;
    const stage = this.statModifiers[side][statName] || 0;
    return Math.floor(baseStat * this._getStatMultiplier(stage));
  }

  _getStatMultiplier(stage) {
    const multipliers = {
      '-6': 0.25, '-5': 0.29, '-4': 0.33, '-3': 0.40,
      '-2': 0.50, '-1': 0.67, '0': 1.0,
      '1': 1.5, '2': 2.0, '3': 2.5, '4': 3.0, '5': 3.5, '6': 4.0,
    };
    return multipliers[String(stage)] || 1.0;
  }

  _getRandomEnemyMove() {
    const moves = this.enemyCreature.moves;
    const validMoveIds = moves.filter(m => {
      const moveId = typeof m === 'string' ? m : m.id;
      return MOVES[moveId];
    });
    if (validMoveIds.length === 0) return MOVES['hash_strike']; // fallback
    const chosenId = typeof validMoveIds[0] === 'string'
      ? validMoveIds[Math.floor(Math.random() * validMoveIds.length)]
      : validMoveIds[Math.floor(Math.random() * validMoveIds.length)].id;
    return MOVES[chosenId];
  }

  // Attempt to capture a wild creature
  attemptCapture(sphereType = 'standard') {
    if (!this.isWild) {
      return { success: false, message: "Can't capture a trainer's creature!" };
    }

    const log = [];
    const hpFactor = (1 - (this.enemyCreature.currentHp / this.enemyCreature.stats.hp)) * 100;

    const sphereRates = {
      standard: 1.0,
      premium: 1.5,
      ultra: 2.0,
      master: 255, // always catches
    };

    const rate = sphereRates[sphereType] || 1.0;
    const rarityMod = { common: 1.0, uncommon: 0.7, rare: 0.4, legendary: 0.15 };
    const rMod = rarityMod[this.enemyCreature.rarity] || 1.0;

    // Capture formula: base 30% + hp_factor*0.5, modified by sphere and rarity
    const captureChance = Math.min(0.95, (0.3 + hpFactor * 0.005) * rate * rMod);

    log.push({ type: 'capture_attempt', message: `You threw a ${sphereType} CryptoSphere!` });

    // Animate 3 shakes
    const shakes = Math.random() < captureChance ? 3 : Math.floor(Math.random() * 3);

    for (let i = 0; i < shakes; i++) {
      log.push({ type: 'shake', shake: i + 1, message: '...' });
    }

    if (shakes >= 3 && Math.random() < captureChance) {
      log.push({
        type: 'capture_success',
        message: `Gotcha! ${this.enemyCreature.name} was captured!`,
        creature: this.enemyCreature,
      });
      this.battleOver = true;
      this.winner = 'player';
      return { success: true, log, creature: { ...this.enemyCreature } };
    } else {
      log.push({ type: 'capture_fail', message: `Oh no! ${this.enemyCreature.name} broke free!` });
      // Enemy gets a free attack
      const enemyMove = this._getRandomEnemyMove();
      log.push(...this._executeMove(this.enemyCreature, this.playerCreature, enemyMove, 'enemy', 'player'));
      return { success: false, log };
    }
  }

  // Calculate XP gained from defeating a creature
  calculateXpGain(defeatedCreature) {
    const baseXp = 50;
    const levelFactor = defeatedCreature.level || 5;
    const rarityBonus = { common: 1.0, uncommon: 1.5, rare: 2.0, legendary: 3.0 };
    const bonus = rarityBonus[defeatedCreature.rarity] || 1.0;
    return Math.floor(baseXp * levelFactor * bonus * 0.7);
  }

  // Apply XP and check for level up
  applyXp(creature, xpAmount) {
    const results = [];
    creature.xp = (creature.xp || 0) + xpAmount;
    results.push({ type: 'xp', message: `${creature.name} gained ${xpAmount} XP!` });

    while (creature.xp >= creature.xpToNext) {
      creature.xp -= creature.xpToNext;
      creature.level++;
      creature.xpToNext = getXpForLevel(creature.level + 1);

      // Recalculate stats
      const oldHp = creature.stats.hp;
      for (const stat in creature.baseStats) {
        if (stat === 'hp') {
          creature.stats.hp = Math.floor(((2 * creature.baseStats.hp * creature.level) / 100) + creature.level + 10);
        } else {
          creature.stats[stat] = Math.floor(((2 * creature.baseStats[stat] * creature.level) / 100) + 5);
        }
      }
      // Heal the HP difference from leveling
      const hpGain = creature.stats.hp - oldHp;
      creature.currentHp = Math.min(creature.stats.hp, creature.currentHp + hpGain);

      results.push({
        type: 'levelup',
        level: creature.level,
        message: `${creature.name} grew to level ${creature.level}!`,
      });

      // Check evolution
      if (creature.evolution && creature.level >= creature.evolution.level) {
        results.push({
          type: 'evolution_ready',
          evolvesTo: creature.evolution.evolvesTo,
          message: `${creature.name} is ready to evolve!`,
        });
      }
    }

    return results;
  }

  // Run from battle
  attemptRun() {
    if (!this.isWild) {
      return { success: false, message: "Can't run from a trainer battle!" };
    }
    const playerSpeed = this._getModifiedStat(this.playerCreature, 'speed', 'player');
    const enemySpeed = this._getModifiedStat(this.enemyCreature, 'speed', 'enemy');
    const runChance = Math.min(0.95, 0.5 + (playerSpeed - enemySpeed) * 0.02);

    if (Math.random() < runChance) {
      this.battleOver = true;
      return { success: true, message: 'Got away safely!' };
    }
    return { success: false, message: "Couldn't get away!" };
  }
}
