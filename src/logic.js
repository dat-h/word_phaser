// Game logic classes and functions

function isVowel(char) {
  return 'aeiou'.includes(char.toLowerCase());
}

export class BattleEngine {
  constructor(playerBattleWord, enemyBattleWord, debugText, {
    onAttack, onBuff, onWordWin, delayFn, delayMs = 400
  } = {}) {
    this.playerBattleWord = playerBattleWord;
    this.enemyBattleWord = enemyBattleWord;
    this.debugText = debugText;
    this.onAttack = onAttack;
    this.onBuff = onBuff;
    this.onWordWin = onWordWin;
    this.delayFn = delayFn;
    this.delayMs = delayMs;
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

  // Helper: get action for a letter (default: consonants heal neighbors)
  static getLetterAction(letter, word) {
    if (!letter || !letter.char) return null;
    if (!isVowel(letter.char)) {
      // Consonant: heal neighbors by 10
      return {
        type: 'heal',
        value: 10,
        targets: BattleEngine.getLivingNeighbors(letter, word)
      };
    }
    // No action for vowels by default
    return {
        type: 'none',
        value: 0,
        targets: null
    };
  }

  // Helper: get living neighbors (left/right) for a letter in a word
  static getLivingNeighbors(letter, word) {
    const idx = letter.index;
    const neighbors = [];
    if (idx > 0 && word.letters[idx - 1].health > 0) neighbors.push(word.letters[idx - 1]);
    if (idx < word.letters.length - 1 && word.letters[idx + 1].health > 0) neighbors.push(word.letters[idx + 1]);
    return neighbors;
  }

  _stepLoop() {
    if (!this._running) return;
    const attackerWord = this.isPlayerTurn ? this.playerBattleWord : this.enemyBattleWord;
    const defenderWord = this.isPlayerTurn ? this.enemyBattleWord : this.playerBattleWord;
    const livingAttackers = attackerWord.letters.filter(l => l.health > 0);
    const livingDefenders = () => defenderWord.letters.filter(l => l.health > 0);

    // --- Actions Phase ---
    const defenders = livingDefenders();

    let actionIdx = 0;
    const doNextAction = () => {
        if (!this._running) return;
        console.log("count: " + actionIdx + ": " + defenders.length );

        if (actionIdx >= defenders.length) {
            // All actions done, proceed to attacks phase
            // Making this call here so the phases proceed sequentially
            if (this.delayFn) {
                this.delayFn(() => {
                    doNextAttack()
                }, this.delayMs);
            }        
            return;
        }
        const letter = defenders[actionIdx];
        const action = BattleEngine.getLetterAction(letter, defenderWord);

        if ( action.type == 'heal' ) { 
            action.targets.forEach( target => {
                if (this.onBuff) {
                    const onHealDone = () => {
                        target.healDamage(10);
                    }                
                    this.onBuff(letter, target, onHealDone);
                }
            });
        }

        actionIdx++;
        if (this.delayFn) {
            this.delayFn(() => {
                console.log('Timer has completed!');
                doNextAction()
            }, 500);
        }

        // doNextAction()
        return;
    };

    // --- Attacks Phase (unchanged) ---
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

    doNextAction();
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
