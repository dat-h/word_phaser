// Game logic classes and functions

function isVowel(char) {
  return 'aeiou'.includes(char.toLowerCase());
}

export class BattleEngine {
  constructor(playerBattleWord, enemyBattleWord, {
    onAttack, onWordWin, delayFn, delayMs = 400
  } = {}) {
    this.playerBattleWord = playerBattleWord;
    this.enemyBattleWord = enemyBattleWord;
    this.onAttack = onAttack;
    this.onWordWin = onWordWin;
    this.delayFn = delayFn;
    this.delayMs = delayMs;
    // this.turn = 'player'; // 'player' or 'enemy'
    this.isPlayerTurn = true
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
    let attacker, defender, attackerWord, defenderWord;
    if ( this.isPlayerTurn ) {
      attackerWord = this.playerBattleWord;
      defenderWord = this.enemyBattleWord;
      attacker = playerLetter;
      defender = enemyLetter;
    } else {
      attackerWord = this.enemyBattleWord;
      defenderWord = this.playerBattleWord;
      attacker = enemyLetter;
      defender = playerLetter;
    }
    // UI callback for attack
    if (this.onAttack) {
      this.onAttack(attacker, defender, () => {
        this.handleAttack( attacker, defender, attackerWord, defenderWord );
      });
    } else {
      // No animation, just run logic
        this.handleAttack( attacker, defender, attackerWord, defenderWord );
    }
  }

  handleAttack( attacker, defender, attackerBW, defenderBW ) {
    defender.takeDamage(attacker.attack);
    if (defender.health <= 0) {
        defenderBW.removeLetter(0);
        if (!defenderBW.getFirstLivingLetter()) {
        if (this.onWordWin) this.onWordWin( this.isPlayerTurn );
        this._running = false;
        return;
        }
    }
    // Next turn
    this.isPlayerTurn = !this.isPlayerTurn;
    if (this._running && this.delayFn) {
        this.delayFn(() => this._stepLoop(), this.delayMs);
    }
  }
}


// Add any additional game logic functions here
