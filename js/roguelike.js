// Set up the map object
let mapWidth = 50;
let mapHeight = 50;
let map = document.getElementById("map");
let numRooms = 10;
let minRoomSize = 5;
let maxRoomSize = 15;
let rooms = [];
let corridors = [];
let visualRange = Math.floor((maxRoomSize/2) - (minRoomSize/2)) < minRoomSize ? minRoomSize : Math.floor((maxRoomSize/2) - (minRoomSize/2));
let playerLoc = [];
let stairsLoc = [];

// info
let mapTotal = 0;
let mapActivity = 0;
let steps = 0;
let layer = 1;
let layerSpan = document.getElementById("layer");

// Create the initial map with empty tiles
for (let x = 0; x < mapWidth; x++) {
  let tr = document.createElement("tr");
  for (let y = 0; y < mapHeight; y++) {
    let td = document.createElement("td");
    td.style.visibility = "hidden";
    tr.appendChild(td);
  }
  map.appendChild(tr);
}

/** Returns the DOM at that location */
const mapLoc = (x, y) => map.children[y].children[x];

// Define some helper functions for working with tiles
const isWall = (x, y) => mapLoc(x, y).classList.contains("wall");
const isFloor = (x, y) => mapLoc(x, y).classList.contains("floor");
const isCorridor = (x, y) => mapLoc(x, y).classList.contains("corridor");
const isStairs = (x, y) => mapLoc(x, y).classList.contains("stairs");
const isOutOfBounds = (x, y) => x < 0 || y < 0 || x >= mapWidth || y >= mapHeight;

/** Create a function to check if two rooms overlap */
const doRoomsOverlap = (room1, room2) => {
  return (
    room1.x < room2.x + room2.width &&
    room1.x + room1.width > room2.x &&
    room1.y < room2.y + room2.height &&
    room1.y + room1.height > room2.y
  );
};


/** Create a function to randomly generate the map */
const generateMap = () => {
  // Start by filling the entire map with walls
  for (let x = 0; x < mapWidth; x++) {
    for (let y = 0; y < mapHeight; y++) {
      mapLoc(x, y).classList.add("wall");
    }
  }

  // Add some randomly placed rooms
  for (let i = 0; i < numRooms; i++) {
    const roomWidth = Math.floor(Math.random() * (maxRoomSize - minRoomSize)+1) + minRoomSize;
    const roomHeight = Math.floor(Math.random() * (maxRoomSize - minRoomSize)+1) + minRoomSize;
    const x = Math.floor(Math.random() * (mapWidth - roomWidth));
    const y = Math.floor(Math.random() * (mapHeight - roomHeight));

    // Make sure the room doesn't overlap with any existing rooms
    const newRoom = { x, y, width: roomWidth, height: roomHeight };
    let overlapping = false;
    for (let j = 0; j < rooms.length; j++) {
      if (doRoomsOverlap(newRoom, rooms[j])) {
        overlapping = true;
        break;
      }
    }

    if (!overlapping) {
      rooms.push(newRoom);
      for (let xx = x + 1; xx < x + roomWidth - 1; xx++) {
        for (let yy = y + 1; yy < y + roomHeight - 1; yy++) {
          mapTotal++;
          mapLoc(xx, yy).classList.remove("wall");
          mapLoc(xx, yy).classList.add("floor");
          mapLoc(xx, yy).classList.add(rooms.length-1);
        }
      }
    }
  }

  // Connect the rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    const { x: x1, y: y1, width: w1, height: h1 } = rooms[i];
    const { x: x2, y: y2, width: w2, height: h2 } = rooms[i + 1];

    // Start at the center of each room and connect with a straight line
    const centerX1 = Math.floor(x1 + w1 / 2);
    const centerY1 = Math.floor(y1 + h1 / 2);
    const centerX2 = Math.floor(x2 + w2 / 2);
    const centerY2 = Math.floor(y2 + h2 / 2);

    for (let x = Math.min(centerX1, centerX2); x <= Math.max(centerX1, centerX2); x++) {
      if (isOutOfBounds(x, centerY1) || isFloor(x, centerY1) || isCorridor(x, centerY1)) continue;
      mapTotal++;
      mapLoc(x, centerY1).classList.remove("wall");
      mapLoc(x, centerY1).classList.add("corridor");
    }

    for (let y = Math.min(centerY1, centerY2); y <= Math.max(centerY1, centerY2); y++) {
      if (isOutOfBounds(centerX2, y) || isFloor(centerX2, y) || isCorridor(centerX2, y)) continue;
      mapTotal++;
      mapLoc(centerX2, y).classList.remove("wall");
      mapLoc(centerX2, y).classList.add("corridor");
    }
  }
  playerLoc = [
    Math.floor(rooms[0].x + rooms[0].width / 2), 
    Math.floor(rooms[0].y + rooms[0].height / 2)
  ];
  
  let stairsRoom = rooms[Math.floor(Math.random() * rooms.length)]
  
  stairsLoc = [
    Math.floor(
      Math.random() * (stairsRoom.width-2)
    ) + stairsRoom.x+1,
    
    Math.floor(
      Math.random() * (stairsRoom.height-2)
    ) + stairsRoom.y+1
  ]
};

const nextLayer = () => {
  let isNextLayer = confirm("다음층으로?");
  if (!isNextLayer) {
    return;
  }
  
  rooms = [];
  corridors = [];
  layer++;
  layerSpan.innerText = layer;
  mapTotal = 0;
  mapActivity = 0;
  steps = 0;

  mapWidth += 5;
  mapWidth = mapWidth >= 100 ? 100 : mapWidth;
  mapHeight += 5;
  mapHeight = mapHeight >= 100 ? 100 : mapHeight;
  numRooms++;
  maxRoomSize++;
  maxRoomSize = maxRoomSize >= 25 ? 25 : maxRoomSize;

  map.innerHTML = "";
  for (let x = 0; x < mapWidth; x++) {
    let tr = document.createElement("tr");
    for (let y = 0; y < mapHeight; y++) {
      let td = document.createElement("td");
      td.style.visibility = "hidden";
      tr.appendChild(td);
    }
    map.appendChild(tr);
  }

  generateMap();
  play();
}

// play
generateMap();

/** Activate the map when the player first enters a room or corridor */
const mapping = () => {
  let x = playerLoc[0];
  let y = playerLoc[1];

  for (let xx = x-visualRange; xx < x+visualRange; xx++) {
    for (let yy = y-visualRange; yy < y+visualRange; yy++) {
      if (isOutOfBounds(xx, yy)) {
        continue;
      }
      if ((isFloor(xx, yy) || isCorridor(xx, yy) || isStairs(xx, yy)) && mapLoc(xx, yy).style.visibility == "hidden") {
        mapActivity++;
        mapLoc(xx, yy).style.visibility = "";
      }
    }
  }

  let achievementRateSpan = document.getElementById("achievementRate");
  let achievementRate = (100 / mapTotal) * mapActivity;

  achievementRateSpan.innerText = achievementRate.toFixed(2);

}

/** 
 * Functions that move the player   
 * direction = 0:up, 1:right, 2:down, 3:left 
 * */
const movePlayer = (direction) => {
  switch(direction) {
    case 0:
      if (isOutOfBounds(playerLoc[0], playerLoc[1]-1) || isWall(playerLoc[0], playerLoc[1]-1)) {
        return;
      }
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("floor");
      mapLoc(playerLoc[0], playerLoc[1]--).classList.remove("player");
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("player");
      break;
    case 1:
      if (isOutOfBounds(playerLoc[0]+1, playerLoc[1]) || isWall(playerLoc[0]+1, playerLoc[1])) {
        return;
      }
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("floor");
      mapLoc(playerLoc[0]++, playerLoc[1]).classList.remove("player");
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("player");
      break;
    case 2:
      if (isOutOfBounds(playerLoc[0], playerLoc[1]+1) || isWall(playerLoc[0], playerLoc[1]+1)) {
        return;
      }
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("floor");
      mapLoc(playerLoc[0], playerLoc[1]++).classList.remove("player");
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("player");
      break;
    case 3:
      if (isOutOfBounds(playerLoc[0]-1, playerLoc[1]) || isWall(playerLoc[0]-1, playerLoc[1])) {
        return;
      }
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("floor");
      mapLoc(playerLoc[0]--, playerLoc[1]).classList.remove("player");
      mapLoc(playerLoc[0], playerLoc[1]).classList.add("player");
      break;
  }
  steps++;
  let stepsSpan = document.getElementById("steps");
  stepsSpan.innerText = steps;

  mapping();

  if ((playerLoc[0] == stairsLoc[0]) && (playerLoc[1] == stairsLoc[1])) {
    nextLayer();
  }
}

let btnUp = document.getElementById("btnUp");
let btnRight = document.getElementById("btnRight");
let btnDown = document.getElementById("btnDown");
let btnLeft = document.getElementById("btnLeft");

btnUp.onclick = () => movePlayer(0);
btnRight.onclick = () => movePlayer(1);
btnDown.onclick = () => movePlayer(2);
btnLeft.onclick = () => movePlayer(3);

document.addEventListener("keydown", function(event) {
  if (event.key === "w" || event.key === "ArrowUp") {
    movePlayer(0);
  } else if (event.key === "d" || event.key === "ArrowRight") {
    movePlayer(1);
  } else if (event.key === "s" || event.key === "ArrowDown") {
    movePlayer(2);
  } else if (event.key === "a" || event.key === "ArrowLeft") {
    movePlayer(3);
  }
});

/** start game */
const play = () => {
  mapping();

  // player
  mapLoc(playerLoc[0], playerLoc[1]).classList.remove("floor");
  mapLoc(playerLoc[0], playerLoc[1]).classList.add("player");

  //stairs
  mapLoc(stairsLoc[0], stairsLoc[1]).classList.remove("floor");
  mapLoc(stairsLoc[0], stairsLoc[1]).classList.add("stairs");
}


// main
play();