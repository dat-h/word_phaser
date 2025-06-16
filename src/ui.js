import Phaser from 'phaser';
import { BattleEngine } from './logic.js';
import { BattleWord } from './battleWord.js';
import { LoadingScene } from './loadingScene.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // Load the bitmap font (using a placeholder PNG, user should replace with their own)
    // this.load.bitmapFont('nokia16', 'nokia16.png', 'nokia16.xml');
    this.font = 'nokia16';
    this.fontSize = 32;

    // Load sound effects
    // this.load.audio('attack', 'assets/sfx/attack.mp3');
    // this.load.audio('damage', 'assets/sfx/damage.mp3');
    // this.load.audio('explode', 'assets/sfx/explode.mp3');
    // // Load background music
    // this.load.audio('bgm', 'assets/music/bg.mp3');
  }

  create() {
    // Starfield background
    this.createStarfield();
    this.showMainMenu();
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
    // Play background music if not already playing
    if (!this.bgm) {
      this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
      this.bgm.play();
    }

    if (this.playerBattleWord) this.playerBattleWord.destroy();
    if (this.enemyBattleWord) this.enemyBattleWord.destroy();
    if (this.winText) this.winText.destroy();
    // Show the enter word screen
    this.showEnterWordScreen();
  }

  clearScreen() {
    // Hide start and welcome text
    if (this.startText) this.startText.setVisible(false);
    if (this.gameTitle) this.gameTitle.setVisible(false);

        // Hide enter word UI        
    if (this.enterWordTitle) this.enterWordTitle.setVisible(false);
    if (this.upcomingWordLabel) this.upcomingWordLabel.setVisible(false);
    if (this.letterSlots) this.letterSlots.forEach(l => l.setVisible(false));
    if (this.letterSlotOverlay) this.letterSlotOverlay.setVisible(false);
    if (this.upcomingWordText) this.upcomingWordText.setVisible(false);

    if (this.playerBattleWord) this.playerBattleWord.setVisible(false);
    if (this.enemyBattleWord) this.enemyBattleWord.setVisible(false);
  }

  showMainMenu() {
    // Hide all elements
    this.clearScreen()

    // display some debugging text
    this.debugText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 20,
      'debugging text',
      { font: '10px Courier New', fill: '#fff' }
    ).setOrigin(0.5);


    // Display 'welcome' at the top center as BattleWord
    const welcomeText = 'war dle';
    const startX = this.cameras.main.width / 2;
    this.gameTitle = this.add.battleWord(
      startX,
      80,
      this.font,
      welcomeText,
      this.fontSize
    ).setOrigin(0.5, 0);

    // Display the word 'start' in the center of the screen using the bitmap font
    this.startText = this.add.bitmapText(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 150,
      this.font,
      'play',
      this.fontSize + 10
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startText.on('pointerdown', () => {
      this.startMainGame();
    });

    const bottomY = this.cameras.main.height - 60;
    this.versionText = this.add.bitmapText(
      this.cameras.main.width / 2,
      bottomY,
      this.font,
      'v 1.0 a5',
      this.fontSize - 10
    ).setOrigin(0.5, 0);
  }

  showEnterWordScreen() {
    this.clearScreen()
    this.debugText.setText( "enter word");
    // Example dictionary of valid words
    this.dictionary = ['apple', 'grape', 'peach', 'melon', 'lemon', 'berry', 'mango', 'plums', 'chess', 'words'];

    // Display 'upcoming word:' and a random word at the top
    const bottomY = this.cameras.main.height - 60;
    const topY = 50;     
    this.upcomingWordLabel = this.add.bitmapText(
      this.cameras.main.width / 2,
      topY,
      this.font,
      'upcoming word:',
      this.fontSize
    ).setOrigin(0.5, 0);

    const upcomingWord = Phaser.Utils.Array.GetRandom(this.dictionary);
    this.enemyWord = upcomingWord;
    const upcomingStartX = this.cameras.main.width / 2;
    this.upcomingWordText = this.add.battleWord(
      upcomingStartX,
      topY + 36,
      this.font,
      upcomingWord,
      this.fontSize
    ).setOrigin(0.5, 0); 

    // Focus invisible input for keyboard capture
    if (window.focusInvisibleInput) {
      window.focusInvisibleInput();
    }

    const slotsY = this.cameras.main.height / 2;
    this.enterWordTitle = this.add.bitmapText(
      this.cameras.main.width / 2,
      slotsY - 60,
      this.font,
      'Enter word',
      this.fontSize
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
        this.font,
        '_',
        this.fontSize
      ).setOrigin(0.5);
      this.letterSlots.push(slot);
    }

    // Add invisible clickable box overlay over the letter slots
    const overlayWidth = slotSpacing * 5;
    const overlayHeight = this.fontSize + 16;
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
  showBattleScreen() {
    // Hide enter word UI
    this.clearScreen()

    // Display the entered word and enemy word as BattleWords
    const centerX = this.cameras.main.width / 2;
    const playerY = this.cameras.main.height / 2 + 80;
    const enemyY = this.cameras.main.height / 2 - 80;
    this.playerBattleWord = this.add.battleWord(centerX, playerY, this.font, this.battleWord.toString(), this.fontSize).setOrigin(0.5);
    this.enemyBattleWord = this.add.battleWord(centerX, enemyY, this.font, this.enemyWord.toString(), this.fontSize).setOrigin(0.5);

    // Start the battle
    this.startBattle(this.playerBattleWord, this.enemyBattleWord);

    // Blur invisible input
    if (window.blurInvisibleInput) {
      window.blurInvisibleInput();
    }
  }

  startBattle(playerBattleWord, enemyBattleWord) {
    this.battleEngine = new BattleEngine(playerBattleWord, enemyBattleWord, this.debugText, {
      onAttack: (attacker, defender, next) => {
        this.animateAttack( attacker, defender, next);
      },
      onBuff: (caster, target, next) => {
        this.animateBuff( caster, target, next);
      },      
      onWordWin: (isPlayerSide) => this.showBattleResult(isPlayerSide),
      delayFn: (fn, ms) => this.time.delayedCall(ms, fn)
    });
    this.battleEngine.start();
  }
animateBuff(caster, target, onComplete) {
    const start = caster.getWorldTransformMatrix().transformPoint(0, 0);
    const end = target.getWorldTransformMatrix().transformPoint(0, 0);

    // Create a glowing blue particle (circle) that travels from caster to target
    const particle = this.add.circle(start.x, start.y, 8, 0x00bfff, 0.8);
    particle.setStrokeStyle(2, 0xffffff, 0.7);

    // Tween the particle to the target
    this.tweens.add({
        targets: particle,
        x: end.x,
        y: end.y,
        scale: { from: 1, to: 1.3 },
        alpha: { from: 0.8, to: 1 },
        duration: 350,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            particle.destroy();

            // Glowing blue light effect on the target
            const glow = this.add.circle(end.x, end.y, 22, 0x00bfff, 0.5)
                .setDepth(50)
                .setAlpha(0.7);
            glow.setBlendMode(Phaser.BlendModes.ADD);

            this.tweens.add({
                targets: glow,
                scale: { from: 1, to: 1.7 },
                alpha: { from: 0.7, to: 0 },
                duration: 400,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    glow.destroy();
                    this.time.delayedCall(150, onComplete);
                }
            });
        }
    });
}


  animateAttack( attackerLetter, defenderLetter, onComplete) {
    const start = attackerLetter.getWorldTransformMatrix().transformPoint(0, 0);
    const end = defenderLetter.getWorldTransformMatrix().transformPoint(0, 0);
    // Play attack sound
    this.sound.play('attack', { volume: 0.5 });
    // Particle (projectile) instead of laser
    const particle = this.add.circle(start.x, start.y, 6, 0xff0000, 1);
    this.tweens.add({
      targets: particle,
      x: end.x,
      y: end.y,
      duration: 300,
      onComplete: () => {
        particle.destroy();
        // Play damage sound
        this.sound.play('damage', { volume: 0.5 });
        // defenderLetter.showDamage(attackerLetter.attack);
        this.time.delayedCall(200, onComplete);
      }
    });
  }

  showBattleResult(isPlayerSide) {
    this.battleInProgress = false;
    this.winText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      isPlayerSide ? 'You Win!' : 'Enemy Wins!',
      { font: '32px Arial', fill: '#fff' }
    ).setOrigin(0.5);

    if (this.startText) this.startText.setVisible(true);
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
    //   const data = await res.json();
      if (!res.ok) {
        this.flashRedOverlay();
        this.enteredWord = '';
        for (let i = 0; i < this.letterSlots.length; i++) {
          this.letterSlots[i].setText('_');
        }
        return;
      }
      this.input.keyboard.off('keydown', this.handleWordInput, this);
      this.battleWord = this.enteredWord;
      this.showBattleScreen();
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
  scene: [LoadingScene, MainScene]
};

new Phaser.Game(config);
