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

export class BattleEngine {
  constructor(battleWord, enemyWord, { onLetterDestroyed, onWordWin } = {}) {
    this.battleWord = battleWord;
    this.enemyWord = enemyWord;
    this.onLetterDestroyed = onLetterDestroyed;
    this.onWordWin = onWordWin;
    this.turn = 'battle'; // 'battle' or 'enemy'
  }

  step() {
    // Get first living letter from each word
    let battleNode = this.battleWord.head;
    let enemyNode = this.enemyWord.head;
    if (!battleNode || !enemyNode) return;
    let attacker, defender, attackerWord, defenderWord, attackerNode, defenderNode;
    if (this.turn === 'battle') {
      attackerNode = battleNode;
      defenderNode = enemyNode;
      attackerWord = this.battleWord;
      defenderWord = this.enemyWord;
    } else {
      attackerNode = enemyNode;
      defenderNode = battleNode;
      attackerWord = this.enemyWord;
      defenderWord = this.battleWord;
    }
    attacker = attackerNode.letterCharacter;
    defender = defenderNode.letterCharacter;
    defender.health -= attacker.attack;
    if (defender.health <= 0) {
      // Remove destroyed letter from word
      this.removeFirstLetter(defenderWord);
      if (this.onLetterDestroyed) this.onLetterDestroyed(defender, defenderWord === this.battleWord ? 'battle' : 'enemy');
      // Check for win
      if (!defenderWord.head) {
        if (this.onWordWin) this.onWordWin(attackerWord === this.battleWord ? 'battle' : 'enemy');
        return;
      }
    }
    // Next turn
    this.turn = this.turn === 'battle' ? 'enemy' : 'battle';
  }

  removeFirstLetter(word) {
    if (!word.head) return;
    word.head = word.head.next;
    if (!word.head) word.tail = null;
    word.length--;
  }
}

// Add any additional game logic functions here
