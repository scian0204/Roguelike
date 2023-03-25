class Map {
  constructor() {
    this.mapWidth = 45;
    this.mapHeight = 45;
    this.mapDom = document.getElementById("map");
    this.numRooms = 9;
    this.minRoomSize = 5;
    this.maxRoomSize = 14;
    this.rooms = [];
    this.corridors = [];
    this.mapTotal = 0;
    this.mapActivity = 0;
    this.achievementRate = 0;
    this.achievementRateDom = document.getElementById("achievementRate")
    this.layer = 0;
    this.layerDom = document.getElementById("layer");
  }

  reset() {
    this.rooms = [];
    this.corridors = [];
    this.layer++;
    this.layerDom.innerText = this.layer;
    this.mapTotal = 0;
    this.mapActivity = 0;
    this.achievementRateDom.innerText = "0";
    this.steps = 0;

    this.mapWidth += 5;
    this.mapWidth = this.mapWidth >= 100 ? 100 : this.mapWidth;
    this.mapHeight += 5;
    this.mapHeight = this.mapHeight >= 100 ? 100 : this.mapHeight;
    this.numRooms++;
    this.maxRoomSize++;
    this.maxRoomSize = this.maxRoomSize >= 25 ? 25 : this.maxRoomSize;
  
    this.mapDom.innerHTML = "";
    for (let x = 0; x < this.mapWidth; x++) {
      let tr = document.createElement("tr");
      for (let y = 0; y < this.mapHeight; y++) {
        let td = document.createElement("td");
        td.style.visibility = "hidden";
        tr.appendChild(td);
      }
      this.mapDom.appendChild(tr);
    }
  }
  
  mapLoc = (x, y) => this.mapDom.children[y].children[x];
  isWall = (x, y) => this.mapLoc(x, y).classList.contains("wall");
  isRoom   = (x, y) => this.mapLoc(x, y).classList.contains("room");
  isCorridor = (x, y) => this.mapLoc(x, y).classList.contains("corridor");
  isStairs = (x, y) => this.mapLoc(x, y).classList.contains("stairs");
  isOutOfBounds = (x, y) => x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight;

  doRoomsOverlap(room1, room2) {
    return (
      room1.x < room2.x + room2.width &&
      room1.x + room1.width > room2.x &&
      room1.y < room2.y + room2.height &&
      room1.y + room1.height > room2.y
    );
  };

  generateMap() {
    // Start by filling the entire map with walls
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        this.mapLoc(x, y).classList.add("wall");
      }
    }
  
    // Add some randomly placed rooms
    for (let i = 0; i < this.numRooms; i++) {
      const roomWidth = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize)+1) + this.minRoomSize;
      const roomHeight = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize)+1) + this.minRoomSize;
      const x = Math.floor(Math.random() * (this.mapWidth - roomWidth));
      const y = Math.floor(Math.random() * (this.mapHeight - roomHeight));
  
      // Make sure the room doesn't overlap with any existing rooms
      const newRoom = { x, y, width: roomWidth, height: roomHeight };
      let overlapping = false;
      for (let j = 0; j < this.rooms.length; j++) {
        if (this.doRoomsOverlap(newRoom, this.rooms[j])) {
          overlapping = true;
          break;
        }
      }
  
      if (!overlapping) {
        this.rooms.push(newRoom);
        for (let xx = x + 1; xx < x + roomWidth - 1; xx++) {
          for (let yy = y + 1; yy < y + roomHeight - 1; yy++) {
            this.mapTotal++;
            this.mapLoc(xx, yy).classList.remove("wall");
            this.mapLoc(xx, yy).classList.add("room");
            this.mapLoc(xx, yy).classList.add(this.rooms.length-1);
          }
        }
      }
    }
  
    // Connect the rooms with corridors
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const { x: x1, y: y1, width: w1, height: h1 } = this.rooms[i];
      const { x: x2, y: y2, width: w2, height: h2 } = this.rooms[i + 1];
  
      // Start at the center of each room and connect with a straight line
      const centerX1 = Math.floor(x1 + w1 / 2);
      const centerY1 = Math.floor(y1 + h1 / 2);
      const centerX2 = Math.floor(x2 + w2 / 2);
      const centerY2 = Math.floor(y2 + h2 / 2);
  
      for (let x = Math.min(centerX1, centerX2); x <= Math.max(centerX1, centerX2); x++) {
        if (this.isOutOfBounds(x, centerY1) || this.isRoom  (x, centerY1) || this.isCorridor(x, centerY1)) continue;
        this.mapTotal++;
        this.mapLoc(x, centerY1).classList.remove("wall");
        this.mapLoc(x, centerY1).classList.add("corridor");
      }
  
      for (let y = Math.min(centerY1, centerY2); y <= Math.max(centerY1, centerY2); y++) {
        if (this.isOutOfBounds(centerX2, y) || this.isRoom  (centerX2, y) || this.isCorridor(centerX2, y)) continue;
        this.mapTotal++;
        this.mapLoc(centerX2, y).classList.remove("wall");
        this.mapLoc(centerX2, y).classList.add("corridor");
      }
    }
  }

  mapping(x, y, visualRange) {
    for (let xx = x-visualRange; xx < x+visualRange; xx++) {
      for (let yy = y-visualRange; yy < y+visualRange; yy++) {
        if (this.isOutOfBounds(xx, yy)) {
          continue;
        }
        if ((this.isRoom  (xx, yy) || this.isCorridor(xx, yy) || this.isStairs(xx, yy)) && this.mapLoc(xx, yy).style.visibility == "hidden") {
          this.mapActivity++;
          this.mapLoc(xx, yy).style.visibility = "";
        }
      }
    }

    this.achievementRate = (100 / this.mapTotal) * this.mapActivity;
    this.achievementRateDom.innerText = this.achievementRate.toFixed(2);
  }
}

class Entity {
  map;
  x;
  y;
  name = "";
  status = {
    lv: 1,
    exp: 0,
    hp: 0,
    mp: 0,
    atk: 0,
    def: 0,
    visualRange: 0,
    luck: 0,
  };
  inven = {};
  skills = {};

  constructor(map) {
    this.map = map;
  }

  moveEntity(direction) {
    let isMove = false;
    switch(direction) {
      case 0:
        if (this.map.isOutOfBounds(this.x, this.y-1) || this.map.isWall(this.x, this.y-1)) {
          return;
        }
        this.map.mapLoc(this.x, this.y).classList.add("room");
        this.map.mapLoc(this.x, this.y--).classList.remove(this.name);
        this.map.mapLoc(this.x, this.y).classList.add(this.name);
        isMove = true;
        break;
      case 1:
        if (this.map.isOutOfBounds(this.x+1, this.y) || this.map.isWall(this.x+1, this.y)) {
          return;
        }
        this.map.mapLoc(this.x, this.y).classList.add("room");
        this.map.mapLoc(this.x++, this.y).classList.remove(this.name);
        this.map.mapLoc(this.x, this.y).classList.add(this.name);
        isMove = true;
        break;
      case 2:
        if (this.map.isOutOfBounds(this.x, this.y+1) || this.map.isWall(this.x, this.y+1)) {
          return;
        }
        this.map.mapLoc(this.x, this.y).classList.add("room");
        this.map.mapLoc(this.x, this.y++).classList.remove(this.name);
        this.map.mapLoc(this.x, this.y).classList.add(this.name);
        isMove = true;
        break;
      case 3:
        if (this.map.isOutOfBounds(this.x-1, this.y) || this.map.isWall(this.x-1, this.y)) {
          return;
        }
        this.map.mapLoc(this.x, this.y).classList.add("room");
        this.map.mapLoc(this.x--, this.y).classList.remove(this.name);
        this.map.mapLoc(this.x, this.y).classList.add(this.name);
        isMove = true;
        break;
    }
    return isMove;
  }
  
  locReset() {
    this.x = 0;
    this.y = 0;
  }

  isCollision(entity) {
    return this.x == entity.x && this.y == entity.y;
  }  
}

class Player extends Entity {
  steps = 0;
  stepsDom = document.getElementById("steps");
  statusDom = {};

  constructor(...args) {
    super(...args);
    this.name = "player";
    this.status.visualRange = Math.floor((map.maxRoomSize/2) - (map.minRoomSize/2)) < map.minRoomSize ? map.minRoomSize : Math.floor((map.maxRoomSize/2) - (map.minRoomSize/2))


    for (const key in this.status) {
      this.statusDom[key] = document.getElementById(key);
      this.statusDom[key].innerText = this.status[key];
    }

  }

  locReset() {
    this.x = Math.floor(this.map.rooms[0].x + this.map.rooms[0].width / 2);
    this.y = Math.floor(map.rooms[0].y + map.rooms[0].height / 2);
  }

  moveEntity(direction) {
    let result = super.moveEntity(direction);
    this.steps++;
    this.stepsDom.innerText = this.steps;
  
    this.map.mapping(this.x, this.y, this.status.visualRange);

    return result;
  }

}

class Stairs extends Entity {
  constructor(...args) {
    super(...args);
    this.name = "stairs"
  }

  locReset() {
    let stairsRoom = this.map.rooms[Math.floor(Math.random() * this.map.rooms.length)];
    this.x = Math.floor(Math.random() * (stairsRoom.width-2)) + stairsRoom.x+1;
    this.y = Math.floor(Math.random() * (stairsRoom.height-2)) + stairsRoom.y+1;
  }
}

//main
let map = new Map();
map.reset();
map.generateMap();

let player = new Player(map)
let stairs = new Stairs(map)

const nextLayer = () => {
  if(stairs.isCollision(player)) {
    let isNextLayer = confirm("다음층으로?");
    if (!isNextLayer) {
      return;
    }
    map.reset();
    map.generateMap();
    play();
  }
}

const moveEvent = () => {
  nextLayer();
}

let btnUp = document.getElementById("btnUp");
let btnRight = document.getElementById("btnRight");
let btnDown = document.getElementById("btnDown");
let btnLeft = document.getElementById("btnLeft");
btnUp.onclick = () => player.moveEntity(0);
btnRight.onclick = () => player.moveEntity(1);
btnDown.onclick = () => player.moveEntity(2);
btnLeft.onclick = () => player.moveEntity(3);
document.addEventListener("keydown", function(event) {
  let isMove = false;
  if (event.key === "w" || event.key === "ArrowUp") {
    isMove = player.moveEntity(0);
  } else if (event.key === "d" || event.key === "ArrowRight") {
    isMove = player.moveEntity(1);
  } else if (event.key === "s" || event.key === "ArrowDown") {
    isMove = player.moveEntity(2);
  } else if (event.key === "a" || event.key === "ArrowLeft") {
    isMove = player.moveEntity(3);
  }
  if (isMove) {
    moveEvent();
  }
});

const play = () => {
  player.locReset();
  stairs.locReset();
  map.mapping(player.x, player.y, player.status.visualRange);
  map.mapLoc(player.x, player.y).classList.remove("room");
  map.mapLoc(player.x, player.y).classList.add(player.name);
  map.mapLoc(stairs.x, stairs.y).classList.remove("room");
  map.mapLoc(stairs.x, stairs.y).classList.add(stairs.name);
}

play();