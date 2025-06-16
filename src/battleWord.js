import Phaser from 'phaser';

function isVowel(char) {
  return 'aeiou'.includes(char.toLowerCase());
}

export class BattleLetter extends Phaser.GameObjects.Container {
  constructor(scene, x, y, font, char, fontSize = 32, index = 0) {
    super(scene, x, y);
    scene.add.existing(this);
    this.char = char;
    this.index = index; // Track index in parent BattleWord
    this.maxhealth = char.charCodeAt(0);
    this.health = char.charCodeAt(0);
    this.attack = isVowel(char) ? 100 : 5;
    // Letter
    this.letter = scene.add.bitmapText(0, 0, font, char, fontSize).setOrigin(0.5, 0);
    // Health bar
    this.healthBar = scene.add.graphics();
    this.add([this.letter, this.healthBar]);
    this.fontSize = fontSize;
    this.updateHealthBar();
  }

  updateHealthBar() {
    if (!this.letter || !this.healthBar || this.letter.destroyed || this.healthBar.destroyed) return;
    const barWidth = 24;
    const barHeight = 5;
    const percent = Math.max(this.health / this.maxhealth, 0);
    const color = percent > 0.2 ? 0x00ff00 : 0xff0000;
    this.healthBar.clear();
    // Background
    this.healthBar.fillStyle(0x222222, 1);
    this.healthBar.fillRect(-barWidth / 2, this.letter.height + 2, barWidth, barHeight);
    // Foreground
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(-barWidth / 2, this.letter.height + 2, barWidth * percent, barHeight);
    this.healthBar.setDepth(this.depth + 1);
    // Only show if _healthBarVisible is true
    this.healthBar.setVisible(!!this._healthBarVisible);
  }

  preUpdate(time, delta) {
    this.updateHealthBar();
  }

  setX(x) {
    super.setX(x);
    return this;
  }

  setY(y) {
    super.setY(y);
    return this;
  }

  setVisible(value) {
    super.setVisible(value);
    this.letter.setVisible(value);
    this.healthBar.setVisible(value);
    return this;
  }

  healDamage(amount) {
    this.health += amount;
    this.showHealing(amount);
    this._showHealthBarBriefly();
    this.updateHealthBar();
  }

  takeDamage(amount) {
    this.health -= amount;
    this.showDamage(amount);
    this._showHealthBarBriefly();
    this.updateHealthBar();
    if (this.health <= 0) {
      this.explode();
    }
  }

  _showHealthBarBriefly() {
    this._healthBarVisible = true;
    this.updateHealthBar();
    if (this._hideHealthBarTimer) {
      this._hideHealthBarTimer.remove(false);
    }
    this._hideHealthBarTimer = this.scene.time.delayedCall(900, () => {
      if (!this.scene || this.destroyed) return;
      this._healthBarVisible = false;
      this.updateHealthBar();
    });
  }


  showHealing(amount) {
    // Use world coordinates for the damage text
    const pos = this.getWorldTransformMatrix().transformPoint(0, 0);
    const dmgText = this.scene.add.text(pos.x, pos.y - 30, `+${amount}`, { font: '20px Arial', fill: '#33ff33', fontStyle: 'bold' }).setOrigin(0.5);
    this.scene.tweens.add({
      targets: dmgText,
      y: pos.y - 50,
      alpha: 0,
      duration: 500,
      onComplete: () => dmgText.destroy()
    });
  }  

  showDamage(amount) {
    // Use world coordinates for the damage text
    const pos = this.getWorldTransformMatrix().transformPoint(0, 0);
    const dmgText = this.scene.add.text(pos.x, pos.y - 30, `-${amount}`, { font: '20px Arial', fill: '#ff3333', fontStyle: 'bold' }).setOrigin(0.5);
    this.scene.tweens.add({
      targets: dmgText,
      y: pos.y - 50,
      alpha: 0,
      duration: 500,
      onComplete: () => dmgText.destroy()
    });
  }

  explode() {
    // Play explode sound
    if (this.scene.sound) {
        this.scene.sound.play('explode', { volume: 0.8 });
    }    
    // Dazzling explosion with glowing particles in random colors (no setShadow)
    const pos = this.getWorldTransformMatrix().transformPoint(0, 0);
    const particleCount = 18;

    const emitter = this.scene.add.particles(pos.x, pos.y, 'flares', {
        frame: [ 'red', 'yellow', 'green' ],
        lifespan: 600,
        speed: { min: 150, max: 250 },
        scale: { start: 0.3, end: 0 },
        gravityY: 150,
        blendMode: 'ADD',
        emitting: false
    });
    emitter.explode(particleCount);

    // for (let i = 0; i < particleCount; i++) {
    //   const angle = (2 * Math.PI * i) / particleCount;
    //   const speed = Phaser.Math.Between(80, 160);
    //   const color = Phaser.Display.Color.RandomRGB();
    //   // Create a graphics object for a glowing particle
    //   const graphics = this.scene.add.graphics({ x: pos.x, y: pos.y });
    //   // Draw glow (large, transparent)
    //   graphics.fillStyle(color.color, 0.25);
    //   graphics.fillCircle(0, 0, Phaser.Math.Between(16, 22));
    //   // Draw core (smaller, opaque)
    //   graphics.fillStyle(color.color, 1);
    //   graphics.fillCircle(0, 0, Phaser.Math.Between(4, 7));
    //   this.scene.tweens.add({
    //     targets: graphics,
    //     x: pos.x + Math.cos(angle) * speed,
    //     y: pos.y + Math.sin(angle) * speed,
    //     alpha: 0,
    //     scale: { from: 1, to: Phaser.Math.FloatBetween(1.5, 2.2) },
    //     duration: Phaser.Math.Between(350, 600),
    //     ease: 'Cubic.easeOut',
    //     onComplete: () => graphics.destroy()
    //   });
    // }
  }

  destroy(fromScene) {
    this.explode();
    this.letter.destroy();
    this.healthBar.destroy();
    super.destroy(fromScene);
  }
}

export class BattleWord extends Phaser.GameObjects.Container {
  constructor(scene, x, y, font, wordString, fontSize = 32, options = {}) {
    super(scene, x, y);
    scene.add.existing(this);
    this.timeoffset = Phaser.Math.Between(0, 100);
    this.font = font;
    this.fontSize = fontSize;
    this.spacing = options.spacing || fontSize;
    this.amplitude = options.amplitude || 10;
    this.frequency = options.frequency || 200;
    this.letters = [];
    this.wordString = wordString;
    this._originX = options.originX ?? 0.5;
    this._originY = options.originY ?? 0;
    this.setOrigin(this._originX, this._originY);
    this.createLetters(wordString);
    this.setSize(this.spacing * wordString.length, fontSize);
    this._registerWavyUpdate();
  }

  createLetters(wordString) {
    this.removeAll(true);
    this.letters = [];
    for (let i = 0; i < wordString.length; i++) {
      const letter = new BattleLetter(this.scene, i * this.spacing, 0, this.font, wordString[i], this.fontSize, i);
      this.add(letter);
      this.letters.push(letter);
    }
    this._layoutLetters();
    this._updateLetterIndices();
  }

  _layoutLetters() {
    for (let i = 0; i < this.letters.length; i++) {
      this.letters[i].x = (i - (this.letters.length - 1) / 2) * this.spacing;
    }
  }

  setOrigin(x, y) {
    return this;
  }

  setVisible(value) {
    super.setVisible(value);
    this.letters.forEach(l => l.setVisible(value));
    return this;
  }

  addLetter(char, index) {
    let letter;
    if (index === undefined || index >= this.letters.length) {
      letter = new BattleLetter(this.scene, 0, 0, this.font, char, this.fontSize, this.letters.length);
      this.letters.push(letter);
      this.add(letter);
    } else {
      letter = new BattleLetter(this.scene, 0, 0, this.font, char, this.fontSize, index);
      this.letters.splice(index, 0, letter);
      this.addAt(letter, index);
    }
    this._layoutLetters();
    this._updateLetterIndices();
    return letter;
  }

  removeLetter(index) {
    if (index >= 0 && index < this.letters.length) {
      const letter = this.letters[index];
      letter.destroy();
      this.letters.splice(index, 1);
      this._layoutLetters();
      this._updateLetterIndices();
    }
  }

  swapLetters(indexA, indexB) {
    if (indexA >= 0 && indexA < this.letters.length && indexB >= 0 && indexB < this.letters.length) {
      const temp = this.letters[indexA];
      this.letters[indexA] = this.letters[indexB];
      this.letters[indexB] = temp;
      this._layoutLetters();
      this._updateLetterIndices();
    }
  }

  _updateLetterIndices() {
    for (let i = 0; i < this.letters.length; i++) {
      this.letters[i].index = i;
    }
  }

  getFirstLivingLetter() {
    return this.letters.find(l => l.health > 0);
  }

  updateWavy(time) {
    for (let i = 0; i < this.letters.length; i++) {
      this.letters[i].y = Math.sin( (time + this.timeoffset) / this.frequency + i * 0.5) * this.amplitude;
    }
  }

  _registerWavyUpdate() {
    this._wavyUpdate = (time) => this.updateWavy(time);
    if (!this.scene._battleWordUpdaters) this.scene._battleWordUpdaters = [];
    this.scene._battleWordUpdaters.push(this._wavyUpdate);
    this.scene.events.on('destroy', () => {
      this.scene._battleWordUpdaters = this.scene._battleWordUpdaters.filter(fn => fn !== this._wavyUpdate);
    });
  }

  toString() {
    return this.letters.map(l => l.char).join('');
  }

  destroy(fromScene) {
    if (this.scene && this.scene._battleWordUpdaters) {
      this.scene._battleWordUpdaters = this.scene._battleWordUpdaters.filter(fn => fn !== this._wavyUpdate);
    }
    this.letters.forEach(l => l.destroy());
    super.destroy(fromScene);
  }
}