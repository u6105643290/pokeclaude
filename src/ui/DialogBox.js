// Reusable dialog box with typewriter effect for PokeClaude

export default class DialogBox {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.x = config.x || 0;
    this.y = config.y || scene.scale.height - 150;
    this.width = config.width || scene.scale.width;
    this.height = config.height || 150;
    this.padding = config.padding || 20;
    this.textSpeed = config.textSpeed || 30; // ms per character
    this.fontSize = config.fontSize || '16px';
    this.fontFamily = config.fontFamily || '"Press Start 2P", monospace';
    this.depth = config.depth || 1000;

    this.container = null;
    this.background = null;
    this.textObject = null;
    this.nameTag = null;
    this.choiceTexts = [];
    this.continueIndicator = null;

    this.isVisible = false;
    this.isTyping = false;
    this.fullText = '';
    this.displayedText = '';
    this.charIndex = 0;
    this.typewriterTimer = null;
    this.onComplete = null;
    this.choices = null;
    this.selectedChoice = 0;
    this.onChoiceSelected = null;

    this._create();
  }

  _create() {
    this.container = this.scene.add.container(this.x, this.y).setDepth(this.depth);

    // Background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.9);
    this.background.fillRoundedRect(4, 4, this.width - 8, this.height - 8, 8);
    this.background.lineStyle(3, 0xffffff, 1);
    this.background.strokeRoundedRect(4, 4, this.width - 8, this.height - 8, 8);
    this.container.add(this.background);

    // Name tag
    this.nameTag = this.scene.add.text(this.padding + 4, 8, '', {
      fontSize: '12px',
      fontFamily: this.fontFamily,
      color: '#FFD700',
      backgroundColor: '#000000',
      padding: { x: 6, y: 4 },
    });
    this.container.add(this.nameTag);

    // Main text
    this.textObject = this.scene.add.text(
      this.padding + 4,
      this.padding + 20,
      '',
      {
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        color: '#ffffff',
        wordWrap: { width: this.width - this.padding * 2 - 16 },
        lineSpacing: 8,
      }
    );
    this.container.add(this.textObject);

    // Continue indicator (blinking triangle)
    this.continueIndicator = this.scene.add.text(
      this.width - 30,
      this.height - 25,
      '\u25BC',
      {
        fontSize: '12px',
        fontFamily: this.fontFamily,
        color: '#ffffff',
      }
    );
    this.container.add(this.continueIndicator);

    // Blink animation for continue indicator
    this.scene.tweens.add({
      targets: this.continueIndicator,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.container.setVisible(false);
    this.container.setScrollFactor(0);
  }

  show(text, speakerName = '', choices = null) {
    return new Promise((resolve) => {
      this.isVisible = true;
      this.container.setVisible(true);
      this.fullText = text;
      this.displayedText = '';
      this.charIndex = 0;
      this.isTyping = true;
      this.choices = choices;
      this.selectedChoice = 0;
      this.onComplete = resolve;
      this.continueIndicator.setVisible(false);

      // Clear old choices
      this.choiceTexts.forEach(ct => ct.destroy());
      this.choiceTexts = [];

      if (speakerName) {
        this.nameTag.setText(speakerName);
        this.nameTag.setVisible(true);
      } else {
        this.nameTag.setVisible(false);
      }

      this.textObject.setText('');
      this._startTypewriter();
    });
  }

  _startTypewriter() {
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }

    this.typewriterTimer = this.scene.time.addEvent({
      delay: this.textSpeed,
      callback: () => {
        if (this.charIndex < this.fullText.length) {
          this.displayedText += this.fullText[this.charIndex];
          this.textObject.setText(this.displayedText);
          this.charIndex++;
        } else {
          this.isTyping = false;
          this.typewriterTimer.remove();
          this._onTextComplete();
        }
      },
      loop: true,
    });
  }

  _onTextComplete() {
    if (this.choices && this.choices.length > 0) {
      this._showChoices();
    } else {
      this.continueIndicator.setVisible(true);
    }
  }

  _showChoices() {
    const startY = this.height - 15 - this.choices.length * 25;
    this.choices.forEach((choice, i) => {
      const prefix = i === this.selectedChoice ? '> ' : '  ';
      const ct = this.scene.add.text(
        this.padding + 20,
        startY + i * 25,
        prefix + choice,
        {
          fontSize: '14px',
          fontFamily: this.fontFamily,
          color: i === this.selectedChoice ? '#FFD700' : '#AAAAAA',
        }
      );
      this.choiceTexts.push(ct);
      this.container.add(ct);
    });
  }

  _updateChoiceHighlight() {
    this.choiceTexts.forEach((ct, i) => {
      const prefix = i === this.selectedChoice ? '> ' : '  ';
      ct.setText(prefix + this.choices[i]);
      ct.setColor(i === this.selectedChoice ? '#FFD700' : '#AAAAAA');
    });
  }

  handleInput(key) {
    if (!this.isVisible) return;

    if (this.isTyping) {
      // Skip to end of text
      this.displayedText = this.fullText;
      this.textObject.setText(this.displayedText);
      this.charIndex = this.fullText.length;
      this.isTyping = false;
      if (this.typewriterTimer) this.typewriterTimer.remove();
      this._onTextComplete();
      return;
    }

    if (this.choices && this.choices.length > 0) {
      if (key === 'UP') {
        this.selectedChoice = Math.max(0, this.selectedChoice - 1);
        this._updateChoiceHighlight();
      } else if (key === 'DOWN') {
        this.selectedChoice = Math.min(this.choices.length - 1, this.selectedChoice + 1);
        this._updateChoiceHighlight();
      } else if (key === 'CONFIRM') {
        this.hide();
        if (this.onComplete) this.onComplete(this.selectedChoice);
      }
    } else if (key === 'CONFIRM') {
      this.hide();
      if (this.onComplete) this.onComplete(-1);
    }
  }

  hide() {
    this.isVisible = false;
    this.container.setVisible(false);
    if (this.typewriterTimer) this.typewriterTimer.remove();
    this.choiceTexts.forEach(ct => ct.destroy());
    this.choiceTexts = [];
  }

  destroy() {
    this.hide();
    if (this.container) this.container.destroy();
  }
}
