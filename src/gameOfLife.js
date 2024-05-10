// Decide the maximum number of cells generated
let m_maxCells = 3000;

let m_velDamping = 0.9;
let m_forDamping = 0.5;
let m_startCells = 3000;
let m_timeScale = 0.01;
let m_minDistance = 40;
let m_noise = 1.1;
let m_neighborDistance = 43;
let m_lifedrain = 0.02;

let m_spawnProb = 0.1;
let m_minNeighbors = 4;
let m_maxNeighbors = 4;

let cells = [];
let spawnCells = [];

// Define variables for arrow key controls
let upKeyPressed = false;
let downKeyPressed = false;
let leftKeyPressed = false;
let rightKeyPressed = false;

// Define a variable to keep track of the current color index
let colorIndex = 0;

class Cell {
  constructor(_pos) {
    this.health = 1.0;
    this.pos = createVector(_pos.x, _pos.y);
    this.vel = createVector(0, 0);
    this.forces = createVector(0, 0);

    this.r = 16;
    this.col = getColor(colorIndex);

    this.nCount = 0;
    this.isAlive = true;
  }

  addForce(_f) {
    this.forces.add(_f);
  }

  update() {
    if (this.pos.mag() > width * 1.3) {
      let r = width * 1.3 - this.pos.mag();
      this.addForce(p5.Vector.mult(this.pos, r * 0.0004));
    }

    // Add noise
    this.addForce(createVector(random(-m_noise, m_noise), random(-m_noise, m_noise)));

    // Add turbulence
    // The noise function seems to not be perfectly in the range of [0.0-1.0],
    // subtracting 0.488 instead of 0.5 keeps particles more centered (not drift to top/left over time)
    this.addForce(
      createVector(
        noise(frameCount / 100, this.pos.x / 1024, this.pos.y / 1024) - 0.488,
        noise(this.pos.x / 1024, frameCount / 100, this.pos.y / 1024) - 0.488
      ).mult(100)
    );

    this.vel.add(p5.Vector.mult(this.forces, m_timeScale));
    this.forces = this.forces.mult(m_forDamping);

    this.pos.add(this.vel);
    this.vel.mult(m_velDamping);

    if (this.nCount < m_minNeighbors) this.health -= m_lifedrain;
    else if (this.nCount > m_maxNeighbors) this.health -= m_lifedrain * 2;
    else this.health = 1;
    if (this.health <= 0) this.isAlive = false;
  }

  draw() {
    fill(this.col); // Use the stored color for the cell

    ellipse(this.pos.x, this.pos.y, this.r); // Changed circle to ellipse
  }
}

function setup() {
  createCanvas(200, 200);
  frameRate(20);

  for (let i = 0; i < m_startCells; i++) {
    cells[i] = new Cell(createVector(random(width + 1) - width / 2, random(height + 1) - height / 4));
  }
}

function draw() {
  noStroke();

  blendMode(ADD);
  fill(255, 255, 255, 25);
  rect(0, 0, width, height);

  fill(0);

  translate(width / 2, height / 2);
  scale(0.33);
  blendMode(MULTIPLY);

  for (let i = 0; i < cells.length - 1; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      let currCell = cells[i];
      let nextCell = cells[j];
      let disti = p5.Vector.sub(currCell.pos, nextCell.pos);
      if (disti.mag() < m_minDistance) {
        currCell.addForce(p5.Vector.mult(disti, 1 - disti.mag() / m_minDistance));
        nextCell.addForce(p5.Vector.mult(disti, -1 + disti.mag() / m_minDistance));
      }

      if (disti.mag() < m_neighborDistance) {
        currCell.nCount++;
        nextCell.nCount++;
      }
    }
  }

  spawnCells = [];

  for (let i = 0; i < cells.length; i++) {
    let c = cells[i];
    c.update();
    if (m_minNeighbors <= c.nCount && c.nCount <= m_maxNeighbors) spawnCells[spawnCells.length] = createVector(c.pos.x, c.pos.y);
    c.draw();
    c.nCount = 0;
  }

  for (let i = cells.length - 1; i >= 0; i--) {
    let c = cells[i];
    if (!c.isAlive) cells.splice(i, 1);
  }

  m_spawnProb = m_maxCells / cells.length / 30;

  if (cells.length <= m_maxCells) {
    for (let i = 0; i < spawnCells.length; i++) {
      let v = spawnCells[i];
      if (random(1) < m_spawnProb) {
        cells[cells.length] = new Cell(v.add(createVector(random(-m_noise, m_noise), random(-m_noise, m_noise))));
      }
    }
  }

  updateCellVelocities();
}

function keyPressed() {
  if (keyCode === UP_ARROW) {
    upKeyPressed = true;
  } else if (keyCode === DOWN_ARROW) {
    downKeyPressed = true;
  } else if (keyCode === LEFT_ARROW) {
    leftKeyPressed = true;
  } else if (keyCode === RIGHT_ARROW) {
    rightKeyPressed = true;
  } else if (key === 'c' || key === 'C') {
    colorIndex = (colorIndex + 1) % 10;
    for (let i = 0; i < cells.length; i++) {
      let c = cells[i];
      c.col = getColor(colorIndex);
    }
  }
}

function keyReleased() {
  if (keyCode === UP_ARROW) {
    upKeyPressed = false;
  } else if (keyCode === DOWN_ARROW) {
    downKeyPressed = false;
  } else if (keyCode === LEFT_ARROW) {
    leftKeyPressed = false;
  } else if (keyCode === RIGHT_ARROW) {
    rightKeyPressed = false;
  }
}

function updateCellVelocities() {
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i];
    let cellVelocity = createVector(0, 0);

    if (upKeyPressed) {
      cellVelocity.y -= 1;
    }
    if (downKeyPressed) {
      cellVelocity.y += 1;
    }
    if (leftKeyPressed) {
      cellVelocity.x -= 1;
    }
    if (rightKeyPressed) {
      cellVelocity.x += 1;
    }

    cell.vel.add(cellVelocity);
  }
}

function getColor(index) {
  switch (index) {
    case 0:
      return color(255, 0, 0);
    case 1:
      return color(0, 255, 0);
    case 2:
      return color(0, 0, 255);
    case 3:
      return color(255, 255, 0);
    case 4:
      return color(255, 0, 255);
    case 5:
      return color(0, 255, 255);
    case 6:
      return color(0, 0, 0);
    case 7:
      return color(255, 128, 0);
    case 8:
      return color(128, 0, 255);
    case 9:
      return color(0, 128, 255);
    default:
      return color(255);
  }
}