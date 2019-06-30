import Phaser from "phaser";
import { makeGroups } from "./problems";

class Mounting {
  constructor(scene, x, y) {
    this.x = x;
    this.y = y;
    this.text = scene.add.text(x, y, "", {
      fontFamily: "Courier",
      fontSize: "36px",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 1
    });
    this.answerDisplay = scene.add.dynamicBitmapText(
      x,
      y + 28,
      "azo-fire",
      "0",
      30
    );
    this.answerDisplay.setOrigin(0.5, 0);
    this.deselect();
    this.setAnswer(0);
    this.built = true;
  }

  select() {
    if (this.built && this.group) {
      this.answerDisplay.setVisible(true);
      this.group.select();
    }
  }

  deselect() {
    this.answerDisplay.setVisible(false);
    if (this.group) {
      this.group.deselect();
    }
  }

  setAnswer(answer) {
    this.answer = answer;
    this.answerDisplay.setText(this.answer.toString(10));
    return this;
  }

  addDigit(digit) {
    this.setAnswer(10 * this.answer + digit);
  }

  deleteDigit() {
    this.setAnswer(Math.floor(this.answer / 10));
  }

  disable() {
    this.group = null;
    this.text.setVisible(false);
    this.deselect();
  }

  destroy() {
    this.disable();
    this.built = false;
  }

  setGroup(group) {
    if (this.group === null) {
      this.text.setVisible(true);
    }
    this.group = group;
    this.text.setFill(`#${group.color.toString(16).padStart(6, "0")}`);
    this.text.setText(Phaser.Math.RND.pick(group.problem.challenges));
    // I don't see how to do this more elegantly. Align: center only works for multiple lines, and setOrigin doesn't work the way I expect
    this.text.x = this.x - this.text.width / 2;
    if (this.answerDisplay.visible)
      // which should mean this is selected
      this.group.select();
    return this;
  }
}

class EnemyGroup {
  constructor(sceneGroup, level, problem, spriteData, color, scale, x, y) {
    this.sceneGroup = sceneGroup;
    this.level = level;
    this.active = true; // is this still a problem to be solved
    this.selected = false;
    this.problem = problem;
    this.spriteData = spriteData;
    this.sprites = [];
    this.color = color;
    this.deselectedColor = Phaser.Display.Color.ValueToColor(color).darken(
      40
    ).color;
    this.scale = scale;
    this.initialX = x;
    this.initialY = y;
    this.width = this.spacedWidth = 0;
    // make Enemy sprites
    const spriteName = spriteData.name + "1.png";
    for (let count = 0; count <= level; count++) {
      const effectiveX =
        this.initialX + this.spacedWidth + (spriteData.width / 2) * this.scale;
      const sprite = this.sceneGroup
        .create(effectiveX, y, "sprites", spriteName)
        .setScale(scale)
        .setTint(this.deselectedColor)
        .play(spriteData.name);
      sprite.body.onWorldBounds = true;
      this.sprites.push(sprite);
      this.width = this.spacedWidth + spriteData.width * this.scale;
      this.spacedWidth = this.width + 3 * this.scale;
    }
  }

  select() {
    this.selected = true;
    this.sprites.forEach(e => e.setTint(this.color));
  }
  deselect() {
    this.selected = false;
    this.sprites.forEach(e => e.setTint(this.deselectedColor));
  }
  defeat() {
    this.active = false;
    this.sprites.forEach(enemy => {
      enemy.destroy();
    });
  }
}

class Enemies {
  // XXX this should not be a class. Revert to function or method
  constructor(
    sceneGroup,
    targetWidth,
    startX,
    startY,
    rowHeight,
    displayLevel,
    level,
    stage,
    scale,
    problems,
    colors,
    sprites
  ) {
    this.sceneGroup = sceneGroup;
    this.targetWidth = targetWidth;
    this.startX = startX;
    this.startY = startY;
    this.rowHeight = rowHeight;
    this.scale = scale;
    this.displayLevel = displayLevel;
    this.level = level;
    this.stage = stage;
    this.count = 8 + this.stage * 2 - Math.round(level * 0.66);
    this.problems = problems;
    this.colors = colors;
    this.sprites = sprites;
    this.groups = [];
    this._generateLines();
  }

  _generateLines() {
    let lines = [];
    let [x, y] = [this.startX, this.startY];
    const makeLine = () => {
      const line = { members: [], width: 0 };
      lines.push(line);
      return line;
    };
    let line = makeLine();
    for (let i = 0; i < this.count; i++) {
      const level = choose(4, this.level, 2);
      const group = new EnemyGroup(
        this.sceneGroup,
        level,
        this.problems[level].next().value,
        this.sprites.next().value,
        this.colors[level],
        this.scale,
        x,
        y
      );
      this.groups.push(group);
      line.members.push(group);
      if (x + group.spacedWidth - this.startX > this.targetWidth) {
        line.width += group.width;
        y += this.scale * this.rowHeight;
        x = this.startX;
        line = makeLine();
      } else {
        line.width += group.spacedWidth;
        x += group.spacedWidth;
      }
      // XXX rearrange aliens to be centered? That's what the lines are there for...
    }
  }
}

class Invaders extends Phaser.Scene {
  constructor() {
    super("invaders");
  }

  preload() {
    this.load.atlas({
      key: "sprites",
      textureURL: "../assets/images/sprites.png",
      atlasURL: "../assets/images/sprites.json"
    });
    this.load.image(
      "background",
      "../assets/images/space-invaders-backdrop2.jpg"
    );
    this.load.bitmapFont(
      "azo-fire",
      "../assets/fonts/azo-fire.png",
      "../assets/fonts/azo-fire.xml"
    );
  }

  create(config) {
    // constants and configuration
    const { width, height } = this.sys.game.config;
    [this.width, this.height] = [width, height];
    this.xBounds = [50, width - 50];
    this.yBounds = [100, height - 50];
    this.physics.world.setBounds(
      this.xBounds[0],
      0,
      this.xBounds[1] - this.xBounds[0],
      this.yBounds[1] - 50
    );
    this.cameras.main.setViewport(0, 0, width, height);
    this.rowHeight = 20;
    this.scale = 1.7;
    this.speed = 50;
    this.levels = [
      // displayLevel, problem level (0-4), problem count level (0-2)
      [1, 0, 0],
      [2, 0, 1],
      [3, 1, 0],
      [4, 0, 2],
      [5, 1, 1],
      [6, 2, 0],
      [7, 1, 2],
      [8, 2, 1],
      [9, 3, 0],
      [10, 2, 2],
      [11, 3, 1],
      [12, 4, 0],
      [13, 3, 2],
      [14, 4, 1],
      [15, 4, 2]
    ][Symbol.iterator]();
    // background image
    this.background = this.add.image(0, 0, "background").setOrigin(0, 0);
    // problems
    this.problemData = makeGroups();
    this.problemGenerators = this.problemData.map(problems =>
      forever(() => Phaser.Utils.Array.Shuffle([...problems]))
    );
    // enemies
    this.enemyColors = [0x00ff00, 0x00ffff, 0xffff00, 0xffa500, 0xff0000];
    this.enemyData = [
      { width: 17, name: "crab" },
      { width: 23, name: "mon" },
      { width: 24, name: "sir" }
    ];
    this.enemyChooser = forever(() => this.enemyData);
    this.enemyData.forEach(data => this.makeEnemyAnim(data.name));
    this.enemyGroup = this.physics.add.group({ collideWorldBounds: true });
    this.physics.world.on("worldbounds", body => this.onWorldBounds(body));
    this.markerEnemy = this.enemyGroup
      .create(this.width / 2, this.yBounds[0], "sprites", "crab1.png")
      .setVisible(false);
    this.markerEnemy.body.onWorldBounds = false;
    this.yGoal = null;
    // score
    this.score = 0;
    this.scoreDisplay = this.add.dynamicBitmapText(25, 25, "azo-fire", "0", 40);
    // mountings (the places where the spaceship can shoot, where the math problems display)
    let boundsWidth = this.xBounds[1] - this.xBounds[0];
    let y = this.yBounds[1] - 20;
    let xDelta = boundsWidth / 6;
    this.mountings = [
      new Mounting(this, this.xBounds[0] + xDelta, y),
      new Mounting(this, width / 2, y),
      new Mounting(this, width / 2 + 2 * xDelta, y)
    ];
    // spaceship
    this.ship = {
      sprite: this.physics.add
        .sprite(this.mountings[0].x, y - 30, "sprites", "gun.png")
        .setScale(this.scale)
        .setImmovable(),
      mounting: 0
    };
    this.physics.add.collider(this.ship.sprite, this.enemyGroup, () =>
      this.endGame()
    );
    this.input.keyboard.on("keydown", e => this.onKeyDown(e));
    // Level message
    this.levelText = {
      timer: null,
      x: this.width / 2,
      field: this.add
        .text(this.width / 2, this.height / 5, "", {
          align: "center",
          fontFamily: "Courier",
          fontSize: "42px",
          fontStyle: "bold",
          stroke: "#000",
          strokeThickness: 1,
          shadow: {
            offsetX: 10,
            offsetY: 10,
            color: "#333",
            blur: 1,
            stroke: false,
            fill: false
          }
        })
        .setDepth(1000)
        .setWordWrapWidth((3 * this.width) / 4, true)
    };
    // Help message
    this.helpText = {
      timer: null,
      x: this.width / 2,
      field: this.add
        .text(this.width / 2, (2 * this.height) / 5, "", {
          align: "center",
          fontFamily: "Courier",
          fontSize: "28px",
          fontStyle: "bold",
          stroke: "#f00",
          color: "#ff5",
          strokeThickness: 3,
          shadow: {
            offsetX: 10,
            offsetY: 10,
            color: "#333",
            blur: 1,
            stroke: false,
            fill: false
          }
        })
        .setDepth(1000)
        .setWordWrapWidth((3 * this.width) / 4, true)
    };
    // Power bar
    this.powerBar = {
      graphics: this.add.graphics().setDepth(1),
      box: this.add.graphics().setDepth(0),
      width: 25,
      height: height / 3,
      x: width - 40,
      y: height / 3,
      level: 9,
      maxLevel: 9
    };
    this.powerBar.unitSize = this.powerBar.height / this.powerBar.maxLevel;
    this.powerBar.box
      .fillStyle(0x222222, 0.8)
      .fillRect(
        this.powerBar.x - 7,
        this.powerBar.y - 7,
        this.powerBar.width + 14,
        this.powerBar.height + 14
      );
    // Bonus message
    this.bonusText = {
      timer: null,
      x: this.powerBar.x + this.powerBar.width / 2,
      field: this.add
        .text(this.powerBar.x, this.powerBar.y - 45, "", {
          align: "center",
          fontFamily: "Courier",
          fontSize: "24px",
          fontStyle: "bold",
          color: "#f00"
        })
        .setDepth(1000)
    };
    // Laser beam
    this.laser = { timer: null, graphics: this.add.graphics() };
    // Different levels have different levels of enemies/problems
    this.createLevel(this.levels.next().value);
  }

  endGame() {
    this.mountings.forEach(m => m.disable());
    this.ship.sprite.setVisible(false);
    this.setText(this.levelText, "Game Over\n\nTry again next time");
  }

  onWorldBounds(body) {
    if (body.blocked.down) {
      this.endGame();
    }
    this.yGoal = this.markerEnemy.y + this.rowHeight * this.scale;
    if (this.powerBar.level > 0) {
      this.powerBar.level--;
      this.updatePowerBar();
    }
    this.enemyGroup.setVelocity(0, this.speed * this.scale);
  }

  addToScore(value) {
    this.score += value;
    this.scoreDisplay.setText(this.score.toString(10));
  }

  updatePowerBar() {
    const bar = this.powerBar;
    bar.graphics.clear();
    bar.graphics
      .fillStyle(0xff00ff, 1.0)
      .fillRect(
        bar.x,
        bar.y + bar.unitSize * (bar.maxLevel - bar.level),
        bar.width,
        bar.unitSize * bar.level
      );
  }

  createLevel([displayLevel, level, stage]) {
    this.powerBar.level = this.powerBar.maxLevel;
    this.updatePowerBar();
    this.markerEnemy.body.reset(this.width / 3, this.yBounds[0]);
    this.enemies = new Enemies(
      this.enemyGroup,
      (this.xBounds[1] - this.xBounds[0]) / 2,
      this.xBounds[0],
      this.yBounds[0],
      this.rowHeight,
      displayLevel,
      level,
      stage,
      this.scale,
      this.problemGenerators,
      this.enemyColors,
      this.enemyChooser
    );
    this.enemyGroup.setVelocityX(this.speed * this.scale);
    const groups = this.enemies.groups;
    this.mountings[0].setGroup(groups[0]);
    this.mountings[1].setGroup(groups[Math.round((groups.length - 1) / 2)]);
    this.mountings[2].setGroup(groups[groups.length - 1]);
    this.mountings[this.ship.mounting].select();
    this.setText(this.levelText, "Level " + displayLevel, 1000);
  }

  setText(textObj, message, delay, fadeDelay) {
    if (textObj.timer) {
      textObj.timer.remove();
      textObj.timer = null;
    }
    textObj.field.setAlpha(1).setText(message);
    if (delay !== undefined) {
      textObj.timer = this.time.delayedCall(delay, () =>
        this.add.tween({
          targets: textObj.field,
          alpha: 0,
          delay: fadeDelay === undefined ? 600 : fadeDelay,
          ease: "Power2"
        })
      );
    }
    textObj.field.x = textObj.x - textObj.field.width / 2;
  }

  onKeyDown(event) {
    const code = event.keyCode;
    const mounting = this.mountings[this.ship.mounting];
    if (
      code >= Phaser.Input.Keyboard.KeyCodes.ZERO &&
      code <= Phaser.Input.Keyboard.KeyCodes.NINE
    ) {
      mounting.addDigit(code - Phaser.Input.Keyboard.KeyCodes.ZERO);
    } else if (
      code >= Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO &&
      code <= Phaser.Input.Keyboard.KeyCodes.NUMPAD_NINE
    ) {
      mounting.addDigit(code - Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO);
    } else {
      switch (code) {
        case Phaser.Input.Keyboard.KeyCodes.BACKSPACE:
          mounting.deleteDigit();
          break;
        case Phaser.Input.Keyboard.KeyCodes.ENTER:
          this.evaluateAnswer(mounting);
          break;
        case Phaser.Input.Keyboard.KeyCodes.RIGHT:
          if (this.ship.mounting < 2) {
            this.mountings[this.ship.mounting].deselect();
            this.ship.mounting++;
            this.moveShip();
          }
          break;
        case Phaser.Input.Keyboard.KeyCodes.LEFT:
          if (this.ship.mounting > 0) {
            this.mountings[this.ship.mounting].deselect();
            this.ship.mounting--;
            this.moveShip();
          }
          break;
        default:
        // nothing
      }
    }
  }

  evaluateAnswer(mounting) {
    if (mounting.built && mounting.group !== null) {
      if (mounting.answer === mounting.group.problem.product) {
        this.addToScore((mounting.group.problem.level + 1) * 10);
        if (this.laser.timer !== null) this.laser.timer.remove();
        this.laser.graphics
          .clear()
          .lineStyle(8, 0xff00ff, 0.6)
          .beginPath()
          .moveTo(this.ship.sprite.x, this.ship.sprite.y)
          .lineTo(
            mounting.group.sprites[0].x + mounting.group.width / 2,
            mounting.group.sprites[0].y +
              mounting.group.sprites[0].displayHeight
          )
          .closePath()
          .strokePath();
        this.laser.timer = this.time.delayedCall(100, () =>
          this.laser.graphics.clear()
        );
        mounting.group.defeat();
        mounting.setAnswer(0);
        const groups = this.enemies.groups.filter(g => g.active);
        if (groups.length === 0) {
          const powerBonus = Math.pow(this.powerBar.level, 2);
          if (powerBonus) {
            this.setText(this.bonusText, "+" + powerBonus, 500);
            this.addToScore(powerBonus);
          }
          let nextLevel = this.levels.next();
          if (nextLevel.done) {
            mounting.disable();
            this.setText(this.levelText, "Congratulations!\n\nGAME OVER");
          } else {
            this.createLevel(nextLevel.value);
          }
        } else if (groups.length === 1) {
          for (let m of this.mountings) {
            if (m === mounting) {
              m.setGroup(groups[0]);
            } else {
              m.disable();
            }
          }
        } else if (groups.length === 2) {
          if (mounting === this.mountings[0]) {
            this.mountings[2].disable();
            groups.forEach((group, index) =>
              this.mountings[index].setGroup(group)
            );
          } else {
            this.mountings[0].disable();
            groups.forEach((group, index) =>
              this.mountings[index + 1].setGroup(group)
            );
          }
        } else {
          this.mountings[0].setGroup(groups[0]);
          this.mountings[1].setGroup(
            groups[Math.round((groups.length - 1) / 2)]
          );
          this.mountings[2].setGroup(groups[groups.length - 1]);
        }
      } else {
        this.setText(this.helpText, mounting.group.problem.help, 5000);
      }
    }
  }

  moveShip() {
    let shipX = this.ship.sprite.x;
    let mounting = this.mountings[this.ship.mounting];
    mounting.select();
    if (shipX < mounting.x) {
      this.ship.sprite.setVelocityX(800);
    } else if (shipX > mounting.x) {
      this.ship.sprite.setVelocityX(-800);
    }
  }

  update() {
    // handle the ship movement
    let shipX = this.ship.sprite.x;
    let shipVelocity = this.ship.sprite.body.velocity.x;
    if (shipVelocity !== 0) {
      let mounting = this.mountings[this.ship.mounting];
      if (
        (shipVelocity < 0 && shipX < mounting.x + 8) ||
        (shipVelocity > 0 && shipX > mounting.x - 8)
      ) {
        this.ship.sprite.body.reset(mounting.x, this.ship.sprite.y);
      }
    }
    // handle downward movement of the enemies
    let marker = this.markerEnemy;
    if (marker.body.velocity.y > 0 && marker.y >= this.yGoal) {
      this.enemyGroup.setVelocityY(0);
      if (marker.x < this.width / 3 + 50) {
        // 50 is fudge factor 🤷‍♂️
        this.enemyGroup.setVelocityX(this.speed * this.scale);
      } else {
        this.enemyGroup.setVelocityX(-1 * this.speed * this.scale);
      }
    }
  }

  makeEnemyAnim(name) {
    this.anims.create({
      key: name,
      frames: [
        { key: "sprites", frame: name + "1.png" },
        { key: "sprites", frame: name + "2.png" }
      ],
      frameRate: 3,
      repeat: -1
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  scene: Invaders,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  }
};

// {
//  preload: preload,
//  create: create,
//  update: update
//}

const game = new Phaser.Game(config);

// function preload() {
//   // "this" === Phaser.Scene
//   this.load.image(
//     "repeating-background",
//     "../assets/images/space-invaders-backdrop2.jpg"
//   );
//   this.load.atlas({
//     key: "sprites",
//     textureURL: "../assets/images/sprites.png",
//     atlasURL: "../assets/images/sprites.json"
//   });
// }

// function create() {
//   // You can access the game's config to read the width & height
//   const { width, height } = this.sys.game.config;

//   // Creating a repeating background sprite
//   const bg = this.add.tileSprite(0, 0, width, height, "repeating-background");
//   bg.setOrigin(0, 0);

//   // In v3, you can chain many methods, so you can create text and configure it in one "line"
//   this.add
//     .text(width / 2, height / 2, "math\ninvaders\nplay now", {
//       font: "150px monospace",
//       color: "gray"
//     })
//     .setOrigin(0.5, 0.5)
//     .setShadow(5, 5, "#00EEEE", 0, true, true);

//   // let sprite =
//   this.add.sprite(100, 200, "sprites", "crab1.png").setScale(5);
// }

// function update(time, delta) {
//   // We aren't using this in the current example, but here is where you can run logic that you need
//   // to check over time, e.g. updating a player sprite's position based on keyboard input
// }

function choose(length, center, maxStdDev) {
  const stdDevLeft = maxStdDev ? Math.min(center, maxStdDev) : center;
  const stdDevRight = maxStdDev
    ? Math.min(length - center, maxStdDev)
    : length - center;
  return Math.min(
    length,
    Math.max(
      0,
      Math.round(
        weirdNumberGen(center, (stdDevLeft * 2) / 3, (stdDevRight * 2) / 3)
      )
    )
  );
}

function weirdNumberGen(mean, std_dev_left, std_dev_right) {
  if (std_dev_right === undefined) {
    std_dev_right = std_dev_left;
  }
  let raw = gaussRandom();
  let std_dev = raw < 0 ? std_dev_left : std_dev_right;
  return mean + raw * std_dev;
}

// https://stackoverflow.com/a/196941

/*
 * Returns member of set with a given mean and standard deviation
 * mean: mean
 * standard deviation: std_dev
 */

// function createMemberInNormalDistribution(mean, std_dev) {
//   return mean + gaussRandom() * std_dev;
// }

/*
 * Returns random number in normal distribution centering on 0.
 * ~95% of numbers returned should fall between -2 and 2
 * ie within two standard deviations
 */
function gaussRandom() {
  let u = 2 * Math.random() - 1;
  let v = 2 * Math.random() - 1;
  let r = u * u + v * v;
  /*if outside interval [0,1] start over*/
  if (r === 0 || r >= 1) return gaussRandom();

  let c = Math.sqrt((-2 * Math.log(r)) / r);
  return u * c;

  /* todo: optimize this algorithm by caching (v*c)
   * and returning next time gaussRandom() is called.
   * left out for simplicity */
}

const forever = function*(generator) {
  while (true) {
    // loops forever if generator() is empty
    for (const element of generator()) {
      yield element;
    }
  }
};

const reverseArray = function*(array) {
  let l = array.length;
  while (l--) {
    yield array[l];
  }
};

// forever(() => array)
// forever(() => Phaser.Utils.Array.Shuffle([...array]))
