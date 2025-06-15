// Game logic classes and functions

export class LetterCharacter {
  constructor(char, health = 100, attack = 10) {
    this.char = char;
    this.health = char.charCodeAt(0);
    this.attack = isVowel(char) ? 100 : 5;
  }
}

export class WordNode {
  constructor(letterCharacter) {
    this.letterCharacter = letterCharacter;
    this.next = null;
  }
}

export class Word {
  constructor(wordString) {
    this.head = null;
    this.tail = null;
    this.length = 0;
    for (const char of wordString) {
      this.append(new LetterCharacter(char));
    }
  }

  append(letterCharacter) {
    const node = new WordNode(letterCharacter);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  toString() {
    let str = '';
    let current = this.head;
    while (current) {
      str += current.letterCharacter.char;
      current = current.next;
    }
    return str;
  }

  *[Symbol.iterator]() {
    let current = this.head;
    while (current) {
      yield current.letterCharacter;
      current = current.next;
    }
  }
}

function isVowel(char) {
  return 'aeiou'.includes(char.toLowerCase());
}

// export class BattleEngine {
//   constructor(battleWord, enemyWord, {
//     onAttack, onLetterDestroyed, onWordWin, delayFn, delayMs = 700
//   } = {}) {
//     this.battleWord = battleWord;
//     this.enemyWord = enemyWord;
//     this.onAttack = onAttack;
//     this.onLetterDestroyed = onLetterDestroyed;
//     this.onWordWin = onWordWin;
//     this.delayFn = delayFn; // (fn, ms) => void
//     this.delayMs = delayMs;
//     this.turn = 'battle'; // 'battle' or 'enemy'
//     this._running = false;
//   }

//   start() {
//     this._running = true;
//     this._stepLoop();
//   }

//   stop() {
//     this._running = false;
//   }

//   _stepLoop() {
//     if (!this._running) return;
//     // Get first living letter from each word
//     let battleNode = this.battleWord.head;
//     let enemyNode = this.enemyWord.head;
//     if (!battleNode || !enemyNode) return;
//     let attacker, defender, attackerWord, defenderWord, attackerNode, defenderNode;
//     if (this.turn === 'battle') {
//       attackerNode = battleNode;
//       defenderNode = enemyNode;
//       attackerWord = this.battleWord;
//       defenderWord = this.enemyWord;
//     } else {
//       attackerNode = enemyNode;
//       defenderNode = battleNode;
//       attackerWord = this.enemyWord;
//       defenderWord = this.battleWord;
//     }
//     attacker = attackerNode.letterCharacter;
//     defender = defenderNode.letterCharacter;
//     // UI callback for attack
//     if (this.onAttack) {
//       this.onAttack(attacker, defender, this.turn, () => {
//         // After animation, apply damage and continue
//         defender.health -= attacker.attack;
//         let destroyed = false;
//         if (defender.health <= 0) {
//           this.removeFirstLetter(defenderWord);
//           destroyed = true;
//           if (this.onLetterDestroyed) this.onLetterDestroyed(defender, defenderWord === this.battleWord ? 'battle' : 'enemy');
//           if (!defenderWord.head) {
//             if (this.onWordWin) this.onWordWin(attackerWord === this.battleWord ? 'battle' : 'enemy');
//             this._running = false;
//             return;
//           }
//         }
//         // Next turn
//         this.turn = this.turn === 'battle' ? 'enemy' : 'battle';
//         if (this._running && this.delayFn) {
//           this.delayFn(() => this._stepLoop(), this.delayMs);
//         }
//       });
//     } else {
//       // No animation, just run logic
//       defender.health -= attacker.attack;
//       if (defender.health <= 0) {
//         this.removeFirstLetter(defenderWord);
//         if (this.onLetterDestroyed) this.onLetterDestroyed(defender, defenderWord === this.battleWord ? 'battle' : 'enemy');
//         if (!defenderWord.head) {
//           if (this.onWordWin) this.onWordWin(attackerWord === this.battleWord ? 'battle' : 'enemy');
//           this._running = false;
//           return;
//         }
//       }
//       this.turn = this.turn === 'battle' ? 'enemy' : 'battle';
//       if (this._running && this.delayFn) {
//         this.delayFn(() => this._stepLoop(), this.delayMs);
//       }
//     }
//   }

//   removeFirstLetter(word) {
//     if (!word.head) return;
//     word.head = word.head.next;
//     if (!word.head) word.tail = null;
//     word.length--;
//   }
// }


export class BattleEngine {
  constructor(playerBattleWord, enemyBattleWord, {
    onAttack, onLetterDestroyed, onWordWin, delayFn, delayMs = 700
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
