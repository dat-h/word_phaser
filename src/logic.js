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
    const attackerWord = this.isPlayerTurn ? this.playerBattleWord : this.enemyBattleWord;
    const defenderWord = this.isPlayerTurn ? this.enemyBattleWord : this.playerBattleWord;
    const livingAttackers = attackerWord.letters.filter(l => l.health > 0);
    const livingDefenders = () => defenderWord.letters.filter(l => l.health > 0);
    let attackIndex = 0;
    const doNextAttack = () => {
      if (!this._running) return;
      // End turn if defender is already defeated
      if (livingDefenders().length === 0) {
        if (this.onWordWin) this.onWordWin(this.isPlayerTurn);
        this._running = false;
        return;
      }
      if (attackIndex >= livingAttackers.length) {
        // All attacks done, switch turn
        this.isPlayerTurn = !this.isPlayerTurn;
        if (this._running && this.delayFn) {
          this.delayFn(() => this._stepLoop(), this.delayMs);
        }
        return;
      }
      const attacker = livingAttackers[attackIndex];
      // Find defender with highest index <= attacker's index
      const defenders = livingDefenders();
      const possible = defenders.filter(d => d.index <= attacker.index);
      if (possible.length === 0) {
        // No valid defender, skip this attacker
        attackIndex++;
        doNextAttack();
        return;
      }
      // Defender with highest index <= attacker's index
      const defender = possible.reduce((a, b) => (a.index > b.index ? a : b));
      // Animate or resolve attack
      const onAttackDone = () => {
        defender.takeDamage(attacker.attack);
        if (defender.health <= 0) {
          defenderWord.removeLetter(defender.index);
          if (livingDefenders().length === 0) {
            if (this.onWordWin) this.onWordWin(this.isPlayerTurn);
            this._running = false;
            return;
          }
        }
        attackIndex++;
        doNextAttack();
      };
      if (this.onAttack) {
        this.onAttack(attacker, defender, onAttackDone);
      } else {
        onAttackDone();
      }
    };
    doNextAttack();
  }

  handleAttack( attacker, defender, attackerBW, defenderBW ) {
    defender.takeDamage(attacker.attack);
    if (defender.health <= 0) {
        defenderBW.removeLetter(defender.index);
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
