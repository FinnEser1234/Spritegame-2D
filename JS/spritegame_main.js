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

// Scale the surface to xx% of the screen width
GAME_SCREEN.surface.style.transform =
  "scale(" +
  (parseFloat(GAME_SCREEN.surfaceScale) / 100) *
    (window.innerWidth / GAME_SCREEN.surface.clientWidth) +
  ")";

/***********************************
 * GAME CONFIG
 ***********************************/
let GAME_CONFIG = {
  gameSpeed: 35, // fps
  characterSpeed: 4, // px per step
};

let startMenu = document.getElementById("startMenu");
let gameGrid = document.getElementById("gameGrid");
let aufruesten = new Audio("../SOUNDS/aufruesten.mp3");


/***********************************
 * START GAME
 ***********************************/
function startGame() {
  startMenu.style.opacity = 0;
  startMenu.style.zIndex = -1;

  gameGrid.style.opacity = 1;
  gameGrid.style.zIndex = 1000;

  PLAYER.box.style.left = "100px"; //Startposition X
  PLAYER.box.style.top = "220px"; //Startposition Y
  PLAYER.box.style.opacity = 1; //Spieler sichtbar machen
  PLAYER.spriteImg.style.right = "0px"; //Startposition Sprite

  GAME_SCREEN.startButton.style.display = "none";
  GAME_SCREEN.startButton.removeAttribute("onclick");

  generateNewCoin();
  gameLoop();
}

/***********************************
 * GAME LOOP
 ***********************************/
function gameLoop() {
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

  // hier kannst du später Collision mit dem Portal einbauen
  // if (isColliding(PLAYER.box, GAME_SCREEN.redBox, 0)) { ... }

  if (PLAYER.helmetCount > 5 && PLAYER.harnischCount > 5 && PLAYER.skirtCount > 5 && PLAYER.shoesCount > 5) {
    GAME_SCREEN.debug_output.innerHTML = `<h2>You win!</h2><p>Refresh the page to play again.</p>`;
    return; 
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
