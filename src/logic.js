// Game logic classes and functions

function isVowel(char) {
  return 'aeiou'.includes(char.toLowerCase());
}

export class BattleEngine {
  constructor(playerBattleWord, enemyBattleWord, {
    onAttack, onLetterDestroyed, onWordWin, delayFn, delayMs = 400
  } = {}) {
    this.playerBattleWord = playerBattleWord;
    this.enemyBattleWord = enemyBattleWord;
    this.onAttack = onAttack;
    this.onLetterDestroyed = onLetterDestroyed;
    this.onWordWin = onWordWin;
    this.delayFn = delayFn;
    this.delayMs = delayMs;
    this.turn = 'player'; // 'player' or 'enemy'
    this._running = false;
  }

  start() {
    this._running = true;
    this._stepLoop();
  }

  stop() {
    this._running = false;
  }

  _stepLoop() {
    if (!this._running) return;
    let playerLetter = this.playerBattleWord.getFirstLivingLetter();
    let enemyLetter = this.enemyBattleWord.getFirstLivingLetter();
    if (!playerLetter || !enemyLetter) return;
    let attacker, defender, attackerWord, defenderWord, attackerIdx, defenderIdx;
    if (this.turn === 'player') {
      attackerWord = this.playerBattleWord;
      defenderWord = this.enemyBattleWord;
      attacker = playerLetter;
      defender = enemyLetter;
      attackerIdx = attackerWord.letters.indexOf(attacker);
      defenderIdx = defenderWord.letters.indexOf(defender);
    } else {
      attackerWord = this.enemyBattleWord;
      defenderWord = this.playerBattleWord;
      attacker = enemyLetter;
      defender = playerLetter;
      attackerIdx = attackerWord.letters.indexOf(attacker);
      defenderIdx = defenderWord.letters.indexOf(defender);
    }
    // UI callback for attack
    if (this.onAttack) {
      this.onAttack(attacker, defender, attackerWord, defenderWord, this.turn, () => {
        defender.takeDamage(attacker.attack);
        if (defender.health <= 0) {
          defenderWord.removeLetter(defenderIdx);
          if (this.onLetterDestroyed) this.onLetterDestroyed(defender, defenderWord === this.playerBattleWord ? 'player' : 'enemy');
          if (!defenderWord.getFirstLivingLetter()) {
            if (this.onWordWin) this.onWordWin(attackerWord === this.playerBattleWord ? 'player' : 'enemy');
            this._running = false;
            return;
          }
        }
        // Next turn
        this.turn = this.turn === 'player' ? 'enemy' : 'player';
        if (this._running && this.delayFn) {
          this.delayFn(() => this._stepLoop(), this.delayMs);
        }
      });
    } else {
      // No animation, just run logic
      defender.takeDamage(attacker.attack);
      if (defender.health <= 0) {
        defenderWord.removeLetter(defenderIdx);
        if (this.onLetterDestroyed) this.onLetterDestroyed(defender, defenderWord === this.playerBattleWord ? 'player' : 'enemy');
        if (!defenderWord.getFirstLivingLetter()) {
          if (this.onWordWin) this.onWordWin(attackerWord === this.playerBattleWord ? 'player' : 'enemy');
          this._running = false;
          return;
        }
      }
      this.turn = this.turn === 'player' ? 'enemy' : 'player';
      if (this._running && this.delayFn) {
        this.delayFn(() => this._stepLoop(), this.delayMs);
      }
    }
  }
}


// Add any additional game logic functions here
