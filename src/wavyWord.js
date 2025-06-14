import Phaser from 'phaser';

export class WavyWord extends Phaser.GameObjects.Container {
  constructor(scene, x, y, font, text, fontSize = 32, options = {}) {
    super(scene, x, y);
    scene.add.existing(this);
    this.letters = [];
    this.font = font;
    this.text = text;
    this.fontSize = fontSize;
    this.spacing = options.spacing || fontSize;
    this.amplitude = options.amplitude || 10;
    this.frequency = options.frequency || 200;
    this.baseY = 0;
    this._originX = options.originX ?? 0.5;
    this._originY = options.originY ?? 0;
    this.setOrigin(this._originX, this._originY);
    this.createLetters();
    this.setSize(this.spacing * this.text.length, fontSize);
    // Register for wavy update
    if (!scene._wavyWordUpdaters) scene._wavyWordUpdaters = [];
    scene._wavyWordUpdaters.push(this._wavyUpdate = (time) => this.updateWavy(time));
  }

  createLetters() {
    this.removeAll(true);
    this.letters = [];
    for (let i = 0; i < this.text.length; i++) {
      const letter = this.scene.add.bitmapText(
        i * this.spacing,
        0,
        this.font,
        this.text[i],
        this.fontSize
      );
      this.add(letter);
      this.letters.push(letter);
    }
  }

  setOrigin(x, y) {
    this._originX = x;
    this._originY = y;
    this.letters.forEach(l => l.setOrigin(x, y));
    return this;
  }

  setVisible(value) {
    super.setVisible(value);
    this.letters.forEach(l => l.setVisible(value));
    return this;
  }

  updateWavy(time) {
    for (let i = 0; i < this.letters.length; i++) {
      this.letters[i].y = Math.sin(time / this.frequency + i * 0.5) * this.amplitude;
    }
  }

  destroy(fromScene) {
    if (this.scene && this.scene._wavyWordUpdaters) {
      this.scene._wavyWordUpdaters = this.scene._wavyWordUpdaters.filter(fn => fn !== this._wavyUpdate);
    }
    this.letters.forEach(l => l.destroy());
    super.destroy(fromScene);
  }
}