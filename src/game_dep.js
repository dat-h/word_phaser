// This file has been split into ui.js and logic.js. See those files for the current implementation.

import Phaser from 'phaser';

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
    this.welcomeLetters = [];
    const welcomeText = 'war game';
    const font = 'nokia16';
    const fontSize = 32;
    const startX = this.cameras.main.width / 2 - (welcomeText.length * fontSize) / 2 + fontSize / 2;
    for (let i = 0; i < welcomeText.length; i++) {
      const letter = this.add.bitmapText(
        startX + i * fontSize,
        40,
        font,
        welcomeText[i],
        fontSize
      ).setOrigin(0.5, 0);
      this.welcomeLetters.push(letter);
    }

    // Display the word 'start' in the center of the screen using the bitmap font
    this.startText = this.add.bitmapText(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 100,
      font,
      'start',
      fontSize
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
    if (this.welcomeLetters) this.welcomeLetters.forEach(l => l.setVisible(false));

    // Show the enter word screen
    this.showEnterWordScreen();
  }

  showEnterWordScreen() {
    // Display 'Enter word' at the top
    const font = 'nokia16';
    const fontSize = 32;
    this.enterWordTitle = this.add.bitmapText(
      this.cameras.main.width / 2,
      40,
      font,
      'Enter word',
      fontSize
    ).setOrigin(0.5, 0);

    // Display 5 underscores for the word slots
    this.enteredWord = '';
    this.letterSlots = [];
    const slotSpacing = 40;
    const slotsY = this.cameras.main.height / 2;
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

    // Example dictionary of valid words
    this.dictionary = ['apple', 'grape', 'peach', 'melon', 'lemon', 'berry', 'mango', 'plums', 'chess', 'words'];

    // Display 'upcoming word:' and a random word at the bottom
    const bottomY = this.cameras.main.height - 60;
    this.upcomingWordLabel = this.add.bitmapText(
      this.cameras.main.width / 2,
      bottomY - 50,
      font,
      'upcoming word:',
      fontSize
    ).setOrigin(0.5, 0);
    this.upcomingWord = Phaser.Utils.Array.GetRandom(this.dictionary);
    this.upcomingWordText = this.add.bitmapText(
      this.cameras.main.width / 2,
      bottomY + 36 - 50,
      font,
      this.upcomingWord,
      fontSize
    ).setOrigin(0.5, 0); 
    // Focus invisible input for keyboard capture
    if (window.focusInvisibleInput) {
      window.focusInvisibleInput();
    }

    // Listen for keyboard input
    this.input.keyboard.on('keydown', this.handleWordInput, this);

  }

  // When leaving EnterWordScreen (e.g., after valid/invalid entry or moving to next screen)
  showWavyWordScreen(word) {
    // Hide enter word UI
    if (this.enterWordTitle) this.enterWordTitle.setVisible(false);
    if (this.letterSlots) this.letterSlots.forEach(l => l.setVisible(false));

    // Display the entered word in a wavy pattern in the center
    this.wavyLetters = [];
    const font = 'nokia16';
    const fontSize = 32;
    const startX = this.cameras.main.width / 2 - (word.length * fontSize) / 2 + fontSize / 2;
    for (let i = 0; i < word.length; i++) {
      const letter = this.add.bitmapText(
        startX + i * fontSize,
        this.cameras.main.height / 2,
        font,
        word[i],
        fontSize
      ).setOrigin(0.5);
      this.wavyLetters.push(letter);
    }
    this.wavyWordActive = true;

    // Blur invisible input
    if (window.blurInvisibleInput) {
      window.blurInvisibleInput();
    }
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
      this.showWavyWordScreen(this.enteredWord);
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

const config = {
  type: Phaser.AUTO,
  width: 320,
  height: 600,
  backgroundColor: '#222',
  parent: 'app',
  scene: MainScene
};

new Phaser.Game(config);
