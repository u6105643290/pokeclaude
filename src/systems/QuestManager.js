// QuestManager - Tracks quest progress, objectives, and triggers

import { MAIN_QUESTS, SIDE_QUESTS, QUEST_STATES, getQuestById, TRAINERS } from '../data/quests.js';
import { NPC_DATA, QUEST_NPCS } from '../data/npcs.js';

export default class QuestManager {
  constructor(savedQuestData = null) {
    // questProgress stores { questId: { state, objectives: { objId: completed } } }
    if (savedQuestData) {
      this.questProgress = savedQuestData.questProgress || {};
      this.completedQuests = savedQuestData.completedQuests || [];
      this.defeatedTrainers = savedQuestData.defeatedTrainers || [];
      this.totalCaught = savedQuestData.totalCaught || 0;
      this.totalEvolved = savedQuestData.totalEvolved || 0;
      this.notifications = [];
    } else {
      this.questProgress = {};
      this.completedQuests = [];
      this.defeatedTrainers = [];
      this.totalCaught = 0;
      this.totalEvolved = 0;
      this.notifications = [];
    }
  }

  // Initialize prologue quest
  startGame() {
    if (!this.questProgress['prologue']) {
      this._activateQuest('prologue');
    }
  }

  // Complete prologue after getting starter
  completeStarter() {
    this._completeObjective('prologue', 'get_starter');
    this._tryCompleteQuest('prologue');
  }

  // Save state for localStorage
  serialize() {
    return {
      questProgress: this.questProgress,
      completedQuests: this.completedQuests,
      defeatedTrainers: this.defeatedTrainers,
      totalCaught: this.totalCaught,
      totalEvolved: this.totalEvolved,
    };
  }

  // Check and activate any newly available quests
  checkForNewQuests() {
    // Check main quest chain
    for (const quest of MAIN_QUESTS) {
      if (this.questProgress[quest.id]) continue;
      if (this.completedQuests.includes(quest.id)) continue;

      // First quest (prologue) activates automatically
      if (quest.id === 'prologue') continue;

      // Check if previous quest in chain is complete
      const prevQuest = MAIN_QUESTS.find(q => q.nextQuest === quest.id);
      if (prevQuest && this.completedQuests.includes(prevQuest.id)) {
        this._activateQuest(quest.id);
      }
    }

    // Check side quests
    for (const quest of SIDE_QUESTS) {
      if (this.questProgress[quest.id]) continue;
      if (this.completedQuests.includes(quest.id)) continue;

      if (quest.unlockAfter && this.completedQuests.includes(quest.unlockAfter)) {
        this._activateQuest(quest.id);
      }
    }
  }

  _activateQuest(questId) {
    const quest = getQuestById(questId);
    if (!quest) return;

    this.questProgress[questId] = {
      state: QUEST_STATES.ACTIVE,
      objectives: {},
    };
    quest.objectives.forEach(obj => {
      this.questProgress[questId].objectives[obj.id] = false;
    });

    this.notifications.push({
      type: 'quest_start',
      title: quest.title,
      message: `New Quest: ${quest.title}`,
    });
  }

  _completeObjective(questId, objectiveId) {
    const progress = this.questProgress[questId];
    if (!progress || progress.state !== QUEST_STATES.ACTIVE) return;
    if (progress.objectives[objectiveId] === undefined) return;

    progress.objectives[objectiveId] = true;

    const quest = getQuestById(questId);
    const obj = quest?.objectives.find(o => o.id === objectiveId);
    if (obj) {
      this.notifications.push({
        type: 'objective_complete',
        message: `Completed: ${obj.text}`,
      });
    }
  }

  _tryCompleteQuest(questId) {
    const progress = this.questProgress[questId];
    if (!progress || progress.state !== QUEST_STATES.ACTIVE) return false;

    const allDone = Object.values(progress.objectives).every(v => v === true);
    if (!allDone) return false;

    progress.state = QUEST_STATES.COMPLETED;
    this.completedQuests.push(questId);

    const quest = getQuestById(questId);
    this.notifications.push({
      type: 'quest_complete',
      title: quest.title,
      message: `Quest Complete: ${quest.title}!`,
    });

    // Activate next quests
    this.checkForNewQuests();
    return true;
  }

  // Get rewards for a quest (called by WorldScene when turning in)
  getRewards(questId) {
    const quest = getQuestById(questId);
    return quest?.rewards || null;
  }

  // Pop all pending notifications
  popNotifications() {
    const notes = [...this.notifications];
    this.notifications = [];
    return notes;
  }

  // --- Event hooks called by WorldScene ---

  // When player talks to an NPC
  onTalkToNpc(npcId) {
    let questUpdated = false;

    for (const [questId, progress] of Object.entries(this.questProgress)) {
      if (progress.state !== QUEST_STATES.ACTIVE) continue;

      const quest = getQuestById(questId);
      if (!quest) continue;

      for (const obj of quest.objectives) {
        if (progress.objectives[obj.id]) continue; // already done

        if (obj.type === 'talk' && obj.npcId === npcId) {
          // Check if previous objectives are done (enforce order)
          if (this._previousObjectivesDone(quest, obj.id, progress)) {
            this._completeObjective(questId, obj.id);
            questUpdated = true;
          }
        }
      }
    }

    return questUpdated;
  }

  // When player enters an area
  onEnterArea(areaName) {
    for (const [questId, progress] of Object.entries(this.questProgress)) {
      if (progress.state !== QUEST_STATES.ACTIVE) continue;

      const quest = getQuestById(questId);
      if (!quest) continue;

      for (const obj of quest.objectives) {
        if (progress.objectives[obj.id]) continue;
        if (obj.type === 'enter_area' && obj.area === areaName) {
          if (this._previousObjectivesDone(quest, obj.id, progress)) {
            this._completeObjective(questId, obj.id);
          }
        }
      }
    }
  }

  // When player defeats a trainer
  onTrainerDefeated(trainerId) {
    if (!this.defeatedTrainers.includes(trainerId)) {
      this.defeatedTrainers.push(trainerId);
    }

    for (const [questId, progress] of Object.entries(this.questProgress)) {
      if (progress.state !== QUEST_STATES.ACTIVE) continue;

      const quest = getQuestById(questId);
      if (!quest) continue;

      for (const obj of quest.objectives) {
        if (progress.objectives[obj.id]) continue;
        if (obj.type === 'beat_trainer' && obj.trainerId === trainerId) {
          if (this._previousObjectivesDone(quest, obj.id, progress)) {
            this._completeObjective(questId, obj.id);
          }
        }
      }
    }
  }

  // When player catches a creature
  onCreatureCaught(creature) {
    this.totalCaught++;

    for (const [questId, progress] of Object.entries(this.questProgress)) {
      if (progress.state !== QUEST_STATES.ACTIVE) continue;

      const quest = getQuestById(questId);
      if (!quest) continue;

      for (const obj of quest.objectives) {
        if (progress.objectives[obj.id]) continue;

        if (obj.type === 'catch_type' && creature.type === obj.creatureType) {
          this._completeObjective(questId, obj.id);
        }
        if (obj.type === 'catch_count' && this.totalCaught >= obj.count) {
          this._completeObjective(questId, obj.id);
        }
      }
    }
  }

  // When a creature evolves
  onCreatureEvolved() {
    this.totalEvolved++;

    for (const [questId, progress] of Object.entries(this.questProgress)) {
      if (progress.state !== QUEST_STATES.ACTIVE) continue;

      const quest = getQuestById(questId);
      if (!quest) continue;

      for (const obj of quest.objectives) {
        if (progress.objectives[obj.id]) continue;
        if (obj.type === 'evolve_count' && this.totalEvolved >= obj.count) {
          this._completeObjective(questId, obj.id);
        }
      }
    }
  }

  // Check if player owns creatures of N different types
  checkTypeDiversity(party, box) {
    const allCreatures = [...party, ...(box || [])];
    const types = new Set(allCreatures.map(c => c.type));

    for (const [questId, progress] of Object.entries(this.questProgress)) {
      if (progress.state !== QUEST_STATES.ACTIVE) continue;
      const quest = getQuestById(questId);
      if (!quest) continue;

      for (const obj of quest.objectives) {
        if (progress.objectives[obj.id]) continue;
        if (obj.type === 'own_types' && types.size >= obj.count) {
          this._completeObjective(questId, obj.id);
        }
      }
    }
  }

  // --- Dialog state resolution ---

  // Get the dialog key to use for an NPC
  getDialogStateForNpc(npcId) {
    const states = {};

    // Build a flat state map for dialog resolution
    // Check each quest's status and build appropriate keys

    for (const quest of MAIN_QUESTS) {
      const progress = this.questProgress[quest.id];

      if (this.completedQuests.includes(quest.id)) {
        states[`${quest.id}_done`] = true;
      } else if (progress && progress.state === QUEST_STATES.ACTIVE) {
        states[`${quest.id}_active`] = true;

        // Check specific objective states for more granular dialog
        const objectives = progress.objectives;
        const questDef = getQuestById(quest.id);

        // Special dialog triggers based on which objectives are done
        if (quest.id === 'forest_crisis') {
          if (!objectives.talk_kid) states['forest_crisis_rumors'] = true;
          if (objectives.beat_grunt1 && !objectives.report_prof) states['forest_crisis_report'] = true;
          if (this.completedQuests.includes('prologue') && !progress) states['prologue_done'] = true;
        }
        if (quest.id === 'meme_mayhem') {
          if (!objectives.talk_memelord) states['meme_mayhem_start'] = true;
          if (objectives.beat_grunt2 && !objectives.talk_memelord2) states['meme_mayhem_report'] = true;
        }
        if (quest.id === 'lab_breach') {
          if (!objectives.talk_neural) states['lab_breach_start'] = true;
          if ((objectives.beat_hacker1 || objectives.beat_hacker2) &&
              !(objectives.beat_hacker1 && objectives.beat_hacker2)) {
            states['lab_breach_partial'] = true;
          }
          if (objectives.beat_hacker1 && objectives.beat_hacker2 && !objectives.talk_neural2) {
            states['lab_breach_report'] = true;
          }
        }
        if (quest.id === 'mountain_mystery') {
          if (!objectives.talk_mountaineer) states['mountain_mystery_start'] = true;
          if (objectives.beat_commander && !objectives.talk_mountaineer2) states['mountain_mystery_report'] = true;
        }
      }
    }

    // Prologue done state (after starter, before forest_crisis is active)
    if (this.completedQuests.includes('prologue') && !this.questProgress['forest_crisis']) {
      states['prologue_done'] = true;
    }
    if (this.completedQuests.includes('prologue')) {
      states['prologue_done'] = true;
    }

    // Side quest states
    for (const quest of SIDE_QUESTS) {
      const progress = this.questProgress[quest.id];
      if (this.completedQuests.includes(quest.id)) {
        states[`${quest.id}_done`] = true;
      } else if (progress && progress.state === QUEST_STATES.ACTIVE) {
        states[`${quest.id}_active`] = true;

        // Shopkeeper delivery specifics
        if (quest.id === 'shopkeeper_delivery') {
          if (!progress.objectives.talk_shop) states['shopkeeper_delivery_start'] = true;
          if (progress.objectives.talk_shop && !progress.objectives.deliver) {
            states['shopkeeper_delivery_delivering'] = true;
            states['shopkeeper_delivery_receive'] = true;
          }
          if (progress.objectives.deliver && !progress.objectives.return_shop) {
            states['shopkeeper_delivery_complete'] = true;
          }
        }
        if (quest.id === 'defi_trainer_challenge') {
          states['defi_trainer_challenge_active'] = true;
        }
      }
    }

    return states;
  }

  // Which quest NPCs (enemy trainers) should appear on the map right now?
  getVisibleQuestNpcs() {
    const visible = [];

    for (const [npcId, npcData] of Object.entries(QUEST_NPCS)) {
      // Don't show if already defeated
      if (this.defeatedTrainers.includes(npcId)) continue;

      const questProgress = this.questProgress[npcData.appearsOnQuest];
      if (!questProgress || questProgress.state !== QUEST_STATES.ACTIVE) continue;

      // Show if the required objective is completed (or if it has no prerequisite)
      if (npcData.appearsOnObjective) {
        const objDone = questProgress.objectives[npcData.appearsOnObjective];
        if (objDone) {
          visible.push(npcData);
        }
      } else {
        visible.push(npcData);
      }
    }

    return visible;
  }

  // Should a particular trainer NPC trigger a fight?
  shouldTriggerFight(trainerId) {
    return !this.defeatedTrainers.includes(trainerId) && TRAINERS[trainerId];
  }

  // Try to complete any quest that has all objectives done
  tryAutoComplete() {
    for (const [questId, progress] of Object.entries(this.questProgress)) {
      if (progress.state === QUEST_STATES.ACTIVE) {
        this._tryCompleteQuest(questId);
      }
    }
  }

  // --- Helpers ---

  _previousObjectivesDone(quest, currentObjId, progress) {
    for (const obj of quest.objectives) {
      if (obj.id === currentObjId) return true;
      if (!progress.objectives[obj.id]) return false;
    }
    return true;
  }

  // Get active quest summary for HUD
  getActiveQuestSummary() {
    const activeMain = MAIN_QUESTS.find(q =>
      this.questProgress[q.id]?.state === QUEST_STATES.ACTIVE
    );

    if (!activeMain) return null;

    const progress = this.questProgress[activeMain.id];
    const nextObj = activeMain.objectives.find(o => !progress.objectives[o.id]);

    return {
      title: activeMain.title,
      currentObjective: nextObj?.text || 'Complete quest objectives',
    };
  }

  // Get all active quests for display
  getAllActiveQuests() {
    const quests = [];

    for (const quest of [...MAIN_QUESTS, ...SIDE_QUESTS]) {
      const progress = this.questProgress[quest.id];
      if (progress && progress.state === QUEST_STATES.ACTIVE) {
        const objectives = quest.objectives.map(obj => ({
          text: obj.text,
          completed: progress.objectives[obj.id] || false,
        }));
        quests.push({
          id: quest.id,
          title: quest.title,
          description: quest.description,
          objectives,
          isMain: MAIN_QUESTS.includes(quest),
        });
      }
    }

    return quests;
  }

  isQuestComplete(questId) {
    return this.completedQuests.includes(questId);
  }

  isQuestActive(questId) {
    return this.questProgress[questId]?.state === QUEST_STATES.ACTIVE;
  }

  isObjectiveDone(questId, objectiveId) {
    return this.questProgress[questId]?.objectives[objectiveId] === true;
  }
}
