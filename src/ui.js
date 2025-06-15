import Phaser from 'phaser';
import { BattleEngine } from './logic.js';
import { BattleWord } from './battleWord.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // Load the bitmap font (using a placeholder PNG, user should replace with their own)
    this.load.bitmapFont('nokia16', 'nokia16.png', 'nokia16.xml');
  }

  create() {
    // Starfield background
    this.createStarfield();

    // Display 'welcome' at the top center as BattleWord
    const welcomeText = 'war game';
    const font = 'nokia16';
    const fontSize = 32;
    const startX = this.cameras.main.width / 2;
    this.gameTitle = this.add.battleWord(
      startX,
      30,
      font,
      welcomeText,
      fontSize
    ).setOrigin(0.5, 0);

    // Display the word 'start' in the center of the screen using the bitmap font
    this.startText = this.add.bitmapText(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 100,
      font,
      'start',
      fontSize + 10
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startText.on('pointerdown', () => {
      this.startMainGame();
    });

    const bottomY = this.cameras.main.height - 60;
    this.versionText = this.add.bitmapText(
      this.cameras.main.width / 2,
      bottomY,
      font,
      'v 1.0 a3',
      fontSize - 10
    ).setOrigin(0.5, 0);
  }

  createStarfield() {
    // Create a group of stars
    this.stars = [];
    const numStars = 100;
    for (let i = 0; i < numStars; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const size = Phaser.Math.FloatBetween(1, 2.5);
      const speed = Phaser.Math.FloatBetween(0.2, 1.2);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.5, 1));
      star.speed = speed;
      this.stars.push(star);
      star.setDepth(-100); // Always behind everything
    }
  }

  startMainGame() {
    // Hide start and welcome text
    if (this.startText) this.startText.setVisible(false);
    if (this.gameTitle) this.gameTitle.setVisible(false);

    // Show the enter word screen
    this.showEnterWordScreen();
  }

  showEnterWordScreen() {
    // Display 'Enter word' at the top
    const font = 'nokia16';
    const fontSize = 32;

    // Example dictionary of valid words
    this.dictionary = ['apple', 'grape', 'peach', 'melon', 'lemon', 'berry', 'mango', 'plums', 'chess', 'words'];

    // Display 'upcoming word:' and a random word at the top
    const bottomY = this.cameras.main.height - 60;
    const topY = 50;     
    this.upcomingWordLabel = this.add.bitmapText(
      this.cameras.main.width / 2,
      topY,
      font,
      'upcoming word:',
      fontSize
    ).setOrigin(0.5, 0);

    this.upcomingWord = Phaser.Utils.Array.GetRandom(this.dictionary);
    this.enemyWord = this.upcomingWord;
    const upcomingStartX = this.cameras.main.width / 2;
    this.upcomingWordText = this.add.battleWord(
      upcomingStartX,
      topY + 36,
      font,
      this.upcomingWord,
      fontSize
    ).setOrigin(0.5, 0); 


    // Focus invisible input for keyboard capture
    if (window.focusInvisibleInput) {
      window.focusInvisibleInput();
    }

    const slotsY = this.cameras.main.height / 2;
    this.enterWordTitle = this.add.bitmapText(
      this.cameras.main.width / 2,
      slotsY - 60,
      font,
      'Enter word',
      fontSize
    ).setOrigin(0.5, 0);

    // Display 5 underscores for the word slots
    this.enteredWord = '';
    this.letterSlots = [];
    const slotSpacing = 40;
    const startX = this.cameras.main.width / 2 - (slotSpacing * 2);
    for (let i = 0; i < 5; i++) {
      const slot = this.add.bitmapText(
        startX + i * slotSpacing,
        slotsY,
        font,
        '_',
        fontSize
      ).setOrigin(0.5);
      this.letterSlots.push(slot);
    }

    // Add invisible clickable box overlay over the letter slots
    const overlayWidth = slotSpacing * 5;
    const overlayHeight = fontSize + 16;
    this.letterSlotOverlay = this.add.rectangle(
      this.cameras.main.width / 2,
      slotsY,
      overlayWidth,
      overlayHeight,
      0x000000,
      0 // fully transparent
    ).setInteractive({ useHandCursor: true });
    this.letterSlotOverlay.on('pointerdown', () => {
      if (window.focusInvisibleInput) {
        window.focusInvisibleInput();
      }
    });
    this.letterSlotOverlay.setDepth(10); // ensure it's above the stars but below text

    // Listen for keyboard input
    this.input.keyboard.on('keydown', this.handleWordInput, this);

  }

  // When leaving EnterWordScreen (e.g., after valid/invalid entry or moving to next screen)
  showWavyWordScreen() {
    // Hide enter word UI
    if (this.enterWordTitle) this.enterWordTitle.setVisible(false);
    if (this.upcomingWordLabel) this.upcomingWordLabel.setVisible(false);
    if (this.letterSlots) this.letterSlots.forEach(l => l.setVisible(false));
    if (this.letterSlotOverlay) this.letterSlotOverlay.setVisible(false);
    if (this.upcomingWordText) this.upcomingWordText.setVisible(false);

    // Display the entered word and enemy word as BattleWords
    const font = 'nokia16';
    const fontSize = 32;
    const centerX = this.cameras.main.width / 2;
    const playerY = this.cameras.main.height / 2 + 80;
    const enemyY = this.cameras.main.height / 2 - 80;
    this.playerBattleWord = this.add.battleWord(centerX, playerY, font, this.battleWord.toString(), fontSize).setOrigin(0.5);
    this.enemyBattleWord = this.add.battleWord(centerX, enemyY, font, this.enemyWord.toString(), fontSize).setOrigin(0.5);

    // Start the battle
    this.startBattle(this.playerBattleWord, this.enemyBattleWord);

    // Blur invisible input
    if (window.blurInvisibleInput) {
      window.blurInvisibleInput();
    }
  }

  startBattle(playerBattleWord, enemyBattleWord) {
    this.battleEngine = new BattleEngine(playerBattleWord, enemyBattleWord, {
      onAttack: (attacker, defender, attackerWord, defenderWord, turn, next) => {
        // Find BattleWords and letter indices
        const attackerBW = attackerWord;
        const defenderBW = defenderWord;
        const attackerIdx = attackerBW.letters.indexOf(attacker);
        const defenderIdx = defenderBW.letters.indexOf(defender);
        this.animateAttack(attackerBW, defenderBW, attackerIdx, defenderIdx, attacker, defender, next);
      },
      onLetterDestroyed: (letter, side) => this.animateLetterDestroyed(letter, side),
      onWordWin: (side) => this.showBattleResult(side),
      delayFn: (fn, ms) => this.time.delayedCall(ms, fn)
    });
    this.battleEngine.start();
  }

  animateAttack(attackerBW, defenderBW, attackerIdx, defenderIdx, attacker, defender, onComplete) {
    const attackerLetter = attackerBW.letters[attackerIdx];
    const defenderLetter = defenderBW.letters[defenderIdx];
    const start = attackerLetter.getWorldTransformMatrix().transformPoint(0, 0);
    const end = defenderLetter.getWorldTransformMatrix().transformPoint(0, 0);
    // Particle (projectile) instead of laser
    const particle = this.add.circle(start.x, start.y, 6, 0xff0000, 1);
    this.tweens.add({
      targets: particle,
      x: end.x,
      y: end.y,
      duration: 300,
      onComplete: () => {
        particle.destroy();
        defenderLetter.showDamage(attacker.attack);
        this.time.delayedCall(200, onComplete);
      }
    });
  }

  animateLetterDestroyed(letter, side) {
    // Find the BattleWord and letter index
    const bw = side === 'player' ? this.playerBattleWord : this.enemyBattleWord;
    const idx = bw.letters.indexOf(letter);
    if (idx === -1) return;
    const target = bw.letters[idx];
    target.explode();
    // Remove letter from BattleWord (already handled by engine, so just visual)
  }

  showBattleResult(side) {
    this.battleInProgress = false;
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      side === 'player' ? 'You Win!' : 'Enemy Wins!',
      { font: '32px Arial', fill: '#fff' }
    ).setOrigin(0.5);
  }

  handleWordInput(event) {
    if (!this.letterSlots) return;
    const key = event.key;
    if (/^[a-zA-Z]$/.test(key) && this.enteredWord.length < 5) {
      this.enteredWord += key.toLowerCase();
      this.letterSlots[this.enteredWord.length - 1].setText(key.toLowerCase());
    } else if (key === 'Backspace' && this.enteredWord.length > 0) {
      this.letterSlots[this.enteredWord.length - 1].setText('_');
      this.enteredWord = this.enteredWord.slice(0, -1);
    } else if (key === 'Enter' && this.enteredWord.length === 5) {
      this.checkWordAndProceed();
    }
    // Auto-check when 5 letters are entered
    if (this.enteredWord.length === 5) {
      this.checkWordAndProceed();
    }
  }

  async checkWordAndProceed() {
    // Use dictionaryapi.dev to check for valid 5-letter English words
    if (this.enteredWord.length !== 5) return;
    const word = this.enteredWord.toLowerCase();
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json();
      if (data.title === 'No Definitions Found') {
        this.flashRedOverlay();
        this.enteredWord = '';
        for (let i = 0; i < this.letterSlots.length; i++) {
          this.letterSlots[i].setText('_');
        }
        return;
      }
      this.input.keyboard.off('keydown', this.handleWordInput, this);
      this.battleWord = this.enteredWord;
      this.showWavyWordScreen();
    } catch (e) {
      // On error, treat as invalid
      this.flashRedOverlay();
      this.enteredWord = '';
      for (let i = 0; i < this.letterSlots.length; i++) {
        this.letterSlots[i].setText('_');
      }
    }
  }

  flashRedOverlay() {
    if (this.redOverlay) {
      this.redOverlay.destroy();
    }
    this.redOverlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0xff0000,
      0.4
    ).setDepth(100);
    this.tweens.add({
      targets: this.redOverlay,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.redOverlay.destroy();
        this.redOverlay = null;
      }
    });
  }

  update(time) {
    // Animate starfield
    if (this.stars) {
      for (let star of this.stars) {
        star.y += star.speed;
        if (star.y > this.cameras.main.height) {
          star.y = 0;
          star.x = Phaser.Math.Between(0, this.cameras.main.width);
        }
      }
    }
    // Animate 'welcome' in a wavy pattern
    if (this.welcomeLetters) {
      for (let i = 0; i < this.welcomeLetters.length; i++) {
        const letter = this.welcomeLetters[i];
        letter.y = 40 + Math.sin(time / 200 + i * 0.5) * 10;
      }
    }
    // Animate entered word in a wavy pattern
    if (this.wavyWordActive && this.wavyLetters) {
      for (let i = 0; i < this.wavyLetters.length; i++) {
        const letter = this.wavyLetters[i];
        letter.y = this.cameras.main.height / 2 + Math.sin(time / 200 + i * 0.5) * 10;
      }
    }
  }    
}

Phaser.GameObjects.GameObjectFactory.register('battleWord', function (x, y, font, text, fontSize = 32, options = {}) {
  return new BattleWord(this.scene, x, y, font, text, fontSize, options);
});

// Patch MainScene's update to call all wavy updaters and battleword updaters
const origUpdate = MainScene.prototype.update;
MainScene.prototype.update = function (time, delta) {
  if (this._wavyWordUpdaters) {
    for (const fn of this._wavyWordUpdaters) fn(time);
  }
  if (this._battleWordUpdaters) {
    for (const fn of this._battleWordUpdaters) fn(time);
  }
  if (origUpdate) origUpdate.call(this, time, delta);
};

const config = {
  type: Phaser.AUTO,
  width: 320,
  height: 600,
  backgroundColor: '#222',
  parent: 'app',
  scene: MainScene
};

new Phaser.Game(config);
