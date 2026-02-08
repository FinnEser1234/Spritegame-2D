/***********************************
 * GAME SCREEN
 ***********************************/
let GAME_SCREEN = {
  surface: document.getElementById("surface"),
  surfaceScale: 60,
  redBox: document.getElementById("redBox"),
  startButton: document.getElementById("startButton"),
  debug_output: document.getElementById("debug_output"),
  currentCoinType: 0,
};

// Scale the surface to fit the screen
function resizeGame() {
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;
  const surfaceWidth = 800; // Original width
  const surfaceHeight = 600; // Original height
  const dashboardWidth = 250; // Width of the dashboard
  const gap = 50; // Gap between surface and dashboard
  const padding = 40; // Safety padding

  // Width available for the surface (Total - Dashboard - Gap - Padding)
  const availableWidth = containerWidth - dashboardWidth - gap - padding * 2;
  // Height available (Total - Padding)
  const availableHeight = containerHeight - padding * 2;

  // Calculate scale to fit both dimensions
  let scale = Math.min(
    availableWidth / surfaceWidth,
    availableHeight / surfaceHeight
  );

  // Limit minimum scale
  if (scale < 0.3) scale = 0.3;

  GAME_SCREEN.surface.style.transform = `scale(${scale})`;
  
  // Adjust margins to remove whitespace caused by scaling (centering)
  const marginH = (surfaceWidth * (scale - 1)) / 2;
  const marginV = (surfaceHeight * (scale - 1)) / 2;

  GAME_SCREEN.surface.style.marginLeft = `${marginH}px`;
  GAME_SCREEN.surface.style.marginRight = `${marginH}px`;
  GAME_SCREEN.surface.style.marginTop = `${marginV}px`;
  GAME_SCREEN.surface.style.marginBottom = `${marginV}px`;
}

// Initial call
resizeGame();
// Adjust on window resize
window.addEventListener('resize', resizeGame);

/***********************************
 * GAME CONFIG
 ***********************************/
let GAME_CONFIG = {
  gameSpeed: 35, // fps
  characterSpeed: 4, // px per step
};

let gameRunning = false;
let health = 100;
let startMenu = document.getElementById("startMenu");
let gameGrid = document.getElementById("gameGrid");
let aufruesten = new Audio("./SOUNDS/aufruesten.mp3"); // Start with user's existing, corrected path if it was wrong
let bgMusic = new Audio("./SOUNDS/backgroundMusic.mp3");
let doorSound = new Audio("./SOUNDS/door.mp3");
bgMusic.loop = true;

let shopMenu = document.getElementById("shopMenu");

let shieldBuff = document.getElementById("shieldBuff");
let lifeBuff = document.getElementById("lifeBuff");
let damageBuff = document.getElementById("damageBuff");
let speedBuff = document.getElementById("speedBuff");
/***********************************
 * START GAME
 ***********************************/
function startGame() {
  // Reset Scores
  PLAYER.helmetCount = 0;
  PLAYER.harnischCount = 0;
  PLAYER.skirtCount = 0;
  PLAYER.shoesCount = 0;
  updateScoreDisplay();

  // Hide menu immediately
  startMenu.style.opacity = 0;
  startMenu.style.zIndex = -1;
  GAME_SCREEN.startButton.style.display = "none";
  GAME_SCREEN.startButton.removeAttribute("onclick");

  // Make screen black
  document.body.style.backgroundImage = "none";
  document.body.style.backgroundColor = "black";

  // Play door sound first
  doorSound.playbackRate = 1.6; 
  doorSound.play().catch((err) => {
    console.log("Door audio play failed:", err);
    revealGame();
  });
  
  doorSound.onended = function() {
    revealGame();
  };
}

function mainMenu() {
  gameRunning = false;
  bgMusic.pause();
  bgMusic.currentTime = 0;

  document.body.style.backgroundImage = "url('./IMG/mainBackground.png')";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundColor = "";

  startMenu.style.opacity = 1;
  startMenu.style.zIndex = 1000;
  startMenu.style.display = "block";

  GAME_SCREEN.startButton.style.display = "block";
  GAME_SCREEN.startButton.setAttribute("onclick", "startGame()");

  gameGrid.style.opacity = 0;
  gameGrid.style.zIndex = -1;
}

function revealGame() {
  gameRunning = true;
  bgMusic.play().catch((err) => console.log("Bg audio play failed:", err));

  document.body.style.backgroundImage = "url('./IMG/background.avif')";
  document.body.style.backgroundSize = "contain";

  gameGrid.style.opacity = 1;
  gameGrid.style.zIndex = 1000;

  PLAYER.box.style.left = "100px"; 
  PLAYER.box.style.top = "220px"; 
  PLAYER.box.style.opacity = 1; 
  PLAYER.spriteImg.style.right = "0px"; 

  generateNewCoin();
  gameLoop();
}

/***********************************
 * GAME LOOP
 ***********************************/
function gameLoop() {
  if (!gameRunning) return;

  // User Input Check
  if (KEY_EVENTS.leftArrow) {
    movePlayer(-GAME_CONFIG.characterSpeed, 0, -1);
    animatePlayer();
  }
  if (KEY_EVENTS.rightArrow) {
    movePlayer(GAME_CONFIG.characterSpeed, 0, 1);
    animatePlayer();
  }
  if (KEY_EVENTS.upArrow) {
    movePlayer(0, -GAME_CONFIG.characterSpeed, 0);
    animatePlayer();
  }
  if (KEY_EVENTS.downArrow) {
    movePlayer(0, GAME_CONFIG.characterSpeed, 0);
    animatePlayer();
  }

  if (
    KEY_EVENTS.leftArrow ||
    KEY_EVENTS.rightArrow ||
    KEY_EVENTS.upArrow ||
    KEY_EVENTS.downArrow
  ) {
    if (isColliding(PLAYER.box, redBox, -10)) {
      console.log("Eingesammelt");

      switch (GAME_SCREEN.currentCoinType) {
        case 1:
          PLAYER.helmetCount += 1;
          break;
        case 2:
          PLAYER.skirtCount += 1;
          break;
        case 3:
          PLAYER.shoesCount += 1;
          break;
        case 4:
          PLAYER.harnischCount += 1;
          break;
      }

      aufruesten.play();
      updateScoreDisplay();
      generateNewCoin();
    }
  }

  if (PLAYER.helmetCount > 1 || PLAYER.harnischCount > 1 || PLAYER.skirtCount > 1 || PLAYER.shoesCount > 1) {
    shieldBuff.innerHTML += PLAYER.helmetCount;
    lifeBuff.innerHTML += PLAYER.harnischCount;
    damageBuff.innerHTML += PLAYER.skirtCount;
    speedBuff.innerHTML += PLAYER.shoesCount;

    shopMenu.style.display = "flex";

    PLAYER.helmetCount = 0;
    PLAYER.harnischCount = 0;
    PLAYER.skirtCount = 0;
    PLAYER.shoesCount = 0;
  }

  setTimeout(gameLoop, 1000 / GAME_CONFIG.gameSpeed);
}

function generateNewCoin() {
  let xCord = Math.floor(
    Math.random() * (GAME_SCREEN.surface.clientWidth - 50),
  );
  let yCord = Math.floor(
    Math.random() * (GAME_SCREEN.surface.clientHeight - 50),
  );

  let randomItem = Math.floor(Math.random() * 4) + 1;
  GAME_SCREEN.currentCoinType = randomItem;

  GAME_SCREEN.redBox.style.backgroundImage = `url("../IMG/rustung${randomItem}.png")`;
  GAME_SCREEN.redBox.style.backgroundSize = "contain";
  GAME_SCREEN.redBox.style.backgroundRepeat = "no-repeat";
  GAME_SCREEN.redBox.style.left = xCord + "px";
  GAME_SCREEN.redBox.style.top = yCord + "px";

  return randomItem;
}

function showRules() {
  document.getElementById("startMenu").style.display = "none";
  let rulesMenu = document.getElementById("rulesMenu");
  rulesMenu.style.display = "flex";
}

function closeRules() {
  document.getElementById("rulesMenu").style.display = "none";
  document.getElementById("startMenu").style.display = "block";
}
