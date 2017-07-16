import '../css/main.css';

const SCREEN_WIDTH = document.body.clientWidth;
const SCREEN_HEIGHT = document.body.clientHeight;
const SCALE = (SCREEN_WIDTH > SCREEN_HEIGHT) ? SCREEN_HEIGHT : SCREEN_WIDTH;

const pingAudio = new Audio('../sounds/ping.ogg');
const pongAudio = new Audio('../sounds/pong.ogg');

class Vec {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  get len() {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
  }
  set len(value) {
    const f = value / this.len;
    this.x *= f;
    this.y *= f;
  }
}

class Rect {
  constructor(x = 0, y = 0) {
    this.pos = new Vec(0, 0);
    this.size = new Vec(x, y);
  }
  get left() {
    return this.pos.x - (this.size.x / 2);
  }
  get right() {
    return this.pos.x + (this.size.x / 2);
  }
  get top() {
    return this.pos.y - (this.size.y / 2);
  }
  get bottom() {
    return this.pos.y + (this.size.y / 2);
  }
}

class Ball extends Rect {
  constructor() {
    super(SCALE * 0.04, SCALE * 0.04);
    this.vel = new Vec();
  }
}

class Player extends Rect {
  constructor() {
    super(SCALE * 0.04, SCALE * 0.2);
    this.vel = new Vec();
    this.score = 0;

    this.lastPos = new Vec();
  }
  update(dt) {
    this.vel.y = (this.pos.y - this.lastPos.y) / dt;
    this.lastPos.y = this.pos.y;
  }
}

class Pong {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    this.initialSpeed = 600;

    this.ball = new Ball();

    this.players = [
      new Player(),
      new Player(),
    ];

    this.players[0].pos.x = 40;
    this.players[1].pos.x = this.canvas.width - 40;
    this.players.forEach(p => p.pos.y = this.canvas.height / 2);

    let lastTime = null;
    this.frameCallback = (millis) => {
      if (lastTime !== null) {
        const diff = millis - lastTime;
        this.update(diff / 1000);
      }
      lastTime = millis;
      requestAnimationFrame(this.frameCallback);
    };

    this.CHAR_PIXEL = SCALE * 0.025;
    this.CHARS = [
      '111101101101111',
      '010010010010010',
      '111001111100111',
      '111001111001111',
      '101101111001001',
      '111100111001111',
      '111100111101111',
      '111001001001001',
      '111101111101111',
      '111101111001111',
    ].map((str) => {
      const canvasScore = document.createElement('canvas');
      const s = this.CHAR_PIXEL;
      canvasScore.height = s * 5;
      canvasScore.width = s * 3;
      const context = canvasScore.getContext('2d');
      context.fillStyle = '#fff';
      str.split('').forEach((fill, i) => {
        if (fill === '1') {
          context.fillRect((i % 3) * s, (i / 3 | 0) * s, s, s);
        }
      });
      return canvasScore;
    });

    this.reset();
  }

  clear() {
    this.context.fillStyle = '#000';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  collide(player, ball) {
    if (player.left < ball.right && player.right > ball.left &&
            player.top < ball.bottom && player.bottom > ball.top) {
      ball.vel.x = -ball.vel.x * 1.05;
      const len = ball.vel.len;
      ball.vel.y += player.vel.y * 0.2;
      ball.vel.len = len;
      pongAudio.play();
    }
  }

  draw() {
    this.clear();

    this.drawRect(this.ball);
    this.players.forEach(player => this.drawRect(player));

    this.drawScore();
  }

  drawRect(rect) {
    this.context.fillStyle = '#fff';
    this.context.fillRect(rect.left, rect.top, rect.size.x, rect.size.y);
  }

  drawScore() {
    const align = this.canvas.width / 3;
    const cw = this.CHAR_PIXEL * 4;
    this.players.forEach((player, index) => {
      const chars = player.score.toString().split('');
      const offset = align * (index + 1) - (cw * chars.length / 2) + this.CHAR_PIXEL / 2;
      chars.forEach((char, pos) => {
        this.context.drawImage(this.CHARS[char | 0], offset + pos * cw, 20);
      });
    });
  }

  play() {
    const b = this.ball;
    if (b.vel.x === 0 && b.vel.y === 0) {
      b.vel.x = 200 * (Math.random() > 0.5 ? 1 : -1);
      b.vel.y = 200 * (Math.random() * 2 - 1);
      b.vel.len = this.initialSpeed;
    }
  }

  reset() {
    const b = this.ball;
    b.vel.x = 0;
    b.vel.y = 0;
    b.pos.x = this.canvas.width / 2;
    b.pos.y = this.canvas.height / 2;
  }

  start() {
    requestAnimationFrame(this.frameCallback);
  }

  update(dt) {
    const cvs = this.canvas;
    const ball = this.ball;
    ball.pos.x += ball.vel.x * dt;
    ball.pos.y += ball.vel.y * dt;

    if (ball.right < 0 || ball.left > cvs.width) {
      ++this.players[ball.vel.x < 0 | 0].score;
      this.reset();
    }

    if (ball.vel.y < 0 && ball.top < 0 ||
            ball.vel.y > 0 && ball.bottom > cvs.height) {
      ball.vel.y = -ball.vel.y;
      pingAudio.play();
    }

    this.players[1].pos.y = ball.pos.y;

    this.players.forEach((player) => {
      player.update(dt);
      this.collide(player, ball);
    });

    this.draw();
  }
}

const canvas = document.getElementById('pong');
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

const pong = new Pong(canvas);

canvas.addEventListener('click', () => pong.play());

canvas.addEventListener('mousemove', (event) => {
  pong.players[0].pos.y = event.offsetY;
});

pong.start();
