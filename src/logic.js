// Game logic classes and functions

export class LetterCharacter {
  constructor(char, health = 100, attack = 10) {
    this.char = char;
    this.health = health;
    this.attack = attack;
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

  *[Symbol.iterator]() {
    let current = this.head;
    while (current) {
      yield current.letterCharacter;
      current = current.next;
    }
  }
}

// Add any additional game logic functions here
