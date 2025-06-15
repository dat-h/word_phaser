import Phaser from 'phaser';
import { LetterCharacter, Word, WordNode, BattleEngine } from './logic.js';
import { WavyWord } from './wavyWord.js';

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

    // Display 'welcome' at the top center as individual letters for animation
    const welcomeText = 'war game';
    const font = 'nokia16';
    const fontSize = 32;
    const startX = this.cameras.main.width / 2 - (welcomeText.length * fontSize) / 2 + fontSize / 2;

    this.gameTitle = this.add.wavyWord(
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
    this.enemyWord = new Word(this.upcomingWord);
    const upcomingStartX = this.cameras.main.width / 2 - (this.upcomingWord.length * fontSize) / 2 + fontSize / 2;
    this.upcomingWordText = this.add.wavyWord(
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

    // Display the entered word and enemy word as wavywords
    const font = 'nokia16';
    const fontSize = 32;
    const centerX = this.cameras.main.width / 2 - (5 * fontSize) / 2 + fontSize / 2;;

    const playerY = this.cameras.main.height / 2 + 80;
    const enemyY = this.cameras.main.height / 2 - 80;
    this.playerWavyWord = this.add.wavyWord(centerX, playerY, font, this.battleWord, fontSize).setOrigin(0.5);
    this.enemyWavyWord = this.add.wavyWord(centerX, enemyY, font, this.enemyWord, fontSize).setOrigin(0.5);

    // Start the battle
    this.startBattle(this.playerWavyWord.word, this.enemyWavyWord.word);

    // Blur invisible input
    if (window.blurInvisibleInput) {
      window.blurInvisibleInput();
    }
  }

  startBattle(battleWord, enemyWord) {
    // const { BattleEngine } = require('./logic.js');
    this.battleEngine = new BattleEngine(battleWord, enemyWord, {
      onLetterDestroyed: (letter, side) => this.animateLetterDestroyed(letter, side),
      onWordWin: (side) => this.showBattleResult(side)
    });
    this.battleInProgress = true;
    this.battleStep();
  }

  battleStep() {
    if (!this.battleInProgress) return;
    const engine = this.battleEngine;
    // Get attacker and defender info
    let attackerWord, defenderWord, attackerWavy, defenderWavy;
    if (engine.turn === 'battle') {
      attackerWavy = this.playerWavyWord;
      defenderWavy = this.enemyWavyWord;
    } else {
      attackerWavy = this.enemyWavyWord;
      defenderWavy = this.playerWavyWord;
    }
    // Animate laser and damage
    this.animateAttack(attackerWavy, defenderWavy, () => {
      engine.step();
      if (this.battleInProgress) {
        this.time.delayedCall(700, () => this.battleStep());
      }
    });
  }

  animateAttack(attackerWavy, defenderWavy, onComplete) {
    const attackerLetter = attackerWavy.word.head.letterCharacter;
    const defenderLetter = defenderWavy.word.head.letterCharacter;
    const attackerBitmapLetter = attackerWavy.letters[0];
    const defenderBitmapLetter = defenderWavy.letters[0];

    const start = attackerBitmapLetter.getWorldTransformMatrix().transformPoint(0, 0);
    const end = defenderBitmapLetter.getWorldTransformMatrix().transformPoint(0, 0);
    // Laser
    const laser = this.add.graphics();
    laser.lineStyle(3, 0xff0000, 1);
    laser.beginPath();
    laser.moveTo(start.x, start.y);
    laser.lineTo(end.x, end.y);
    laser.strokePath();

    // Get the correct attack value from the attacker
    let attackValue = 5;
    if (attackerLetter) {
      attackValue = attackerLetter.attack;
    }
    // Damage text
    const dmgText = this.add.text(end.x, end.y - 30, `-${attackValue}`, { font: '20px Arial', fill: '#ff3333', fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({
      targets: dmgText,
      y: end.y - 50,
      alpha: 0,
      duration: 500,
      onComplete: () => dmgText.destroy()
    });
    // Laser fade
    this.tweens.add({
      targets: laser,
      alpha: 0,
      duration: 300,
      onComplete: () => laser.destroy()
    });
    this.time.delayedCall(400, onComplete);
  }

  animateLetterDestroyed(letter, side) {
    // Find the wavyword and letter index
    const wavy = side === 'battle' ? this.playerWavyWord : this.enemyWavyWord;
    const idx = wavy.letters.findIndex(l => l.text === letter.char);
    if (idx === -1) return;
    const target = wavy.letters[idx];
    // Explosion
    const explosion = this.add.graphics();
    const pos = target.getWorldTransformMatrix().transformPoint(0, 0);
    explosion.fillStyle(0xffff00, 1);
    explosion.fillCircle(pos.x, pos.y, 10);
    this.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 2,
      duration: 400,
      onComplete: () => explosion.destroy()
    });
    // Remove letter from wavyword
    target.destroy();
    wavy.letters.splice(idx, 1);
    // // Reposition remaining letters
    // for (let i = 0; i < wavy.letters.length; i++) {
    //   this.tweens.add({
    //     targets: wavy.letters[i],
    //     x: (i - (wavy.letters.length - 1) / 2) * wavy.spacing,
    //     duration: 200
    //   });
    // }
  }

  showBattleResult(side) {
    this.battleInProgress = false;
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      side === 'battle' ? 'You Win!' : 'Enemy Wins!',
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

  checkWordAndProceed() {
    if (this.dictionary.includes(this.enteredWord)) {
      this.input.keyboard.off('keydown', this.handleWordInput, this);
      this.battleWord = new Word(this.enteredWord);
      this.showWavyWordScreen();
    } else {
      // Flash red overlay for invalid entry
      this.flashRedOverlay();
      // Clear input for new entry
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

Phaser.GameObjects.GameObjectFactory.register('wavyWord', function (x, y, font, text, fontSize = 32, options = {}) {
  return new WavyWord(this.scene, x, y, font, text, fontSize, options);
});

// Patch MainScene's update to call all wavy updaters
const origUpdate = MainScene.prototype.update;
MainScene.prototype.update = function (time, delta) {
  if (this._wavyWordUpdaters) {
    for (const fn of this._wavyWordUpdaters) fn(time);
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
