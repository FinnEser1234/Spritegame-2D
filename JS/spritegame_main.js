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
let shield = 0;
let damage = 10;

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
  
  // Reset Totals for Leaderboard
  PLAYER.totalHelmets = 0;
  PLAYER.totalHarnisch = 0;
  PLAYER.totalSkirts = 0;
  PLAYER.totalShoes = 0;
  
  // Reset Stats
  health = 100;
  shield = 100;
  damage = 10;
  GAME_CONFIG.characterSpeed = 4; // Reset Speed

  updateScoreDisplay();
  updateHealthBar();
  updateShieldBar();
  updateDamageDisplay();

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
          PLAYER.totalHelmets = (PLAYER.totalHelmets || 0) + 1;
          break;
        case 2:
          PLAYER.skirtCount += 1;
          PLAYER.totalSkirts = (PLAYER.totalSkirts || 0) + 1;
          break;
        case 3:
          PLAYER.shoesCount += 1;
          PLAYER.totalShoes = (PLAYER.totalShoes || 0) + 1;
          break;
        case 4:
          PLAYER.harnischCount += 1;
          PLAYER.totalHarnisch = (PLAYER.totalHarnisch || 0) + 1;
          break;
      }

      aufruesten.play();
      updateScoreDisplay();
      generateNewCoin();
    }
  }

  if (PLAYER.helmetCount > 1 || PLAYER.harnischCount > 1 || PLAYER.skirtCount > 1 || PLAYER.shoesCount > 1) {
    openShop();
  }

  setTimeout(gameLoop, 1000 / GAME_CONFIG.gameSpeed);
}

function openShop() {
    shopMenu.style.display = "flex";
    gameRunning = false;
    updateShopUI();
}

function updateShopUI() {
    document.getElementById("shieldBuff").childNodes[0].textContent = `Shield (x${PLAYER.helmetCount}) `;
    document.getElementById("lifeBuff").childNodes[0].textContent = `Life (x${PLAYER.harnischCount}) `;
    document.getElementById("damageBuff").childNodes[0].textContent = `Damage (x${PLAYER.skirtCount}) `;
    document.getElementById("speedBuff").childNodes[0].textContent = `Speed (x${PLAYER.shoesCount}) `;
}

function buyItem(btn) {
    let type = btn.id;
    let success = false;

    if (type === "shieldBuffBtn") {
        if (PLAYER.helmetCount > 0) {
            PLAYER.helmetCount--;
            shield += 10;
            updateShieldBar();
            console.log("Bought Shield/Helmet: Defense UP");
            success = true;
        }
    } else if (type === "lifeBuffBtn") {
        if (PLAYER.harnischCount > 0) {
            PLAYER.harnischCount--;
            health += 10;
            updateHealthBar();
            console.log("Bought Life/Harnisch: Health UP");
            success = true;
        }
    } else if (type === "damageBuffBtn") {
        if (PLAYER.skirtCount > 0) {
            PLAYER.skirtCount--;
            damage += 5;
            updateDamageDisplay();
            console.log("Bought Damage/Skirt: Power UP");
             success = true;
        }
    } else if (type === "speedBuffBtn") {
        if (PLAYER.shoesCount > 0) {
            PLAYER.shoesCount--;
            GAME_CONFIG.characterSpeed += 0.2;
            console.log("Bought Speed/Shoes: Speed UP");
             success = true;
        }
    }

    if (success) {
        updateScoreDisplay(); // Update debug HUD
        updateShopUI();       // Update Shop Counts
        
        if(typeof aufruesten !== 'undefined') {
            aufruesten.currentTime = 0;
            aufruesten.play().catch(e => console.log(e));
        }

        checkShopStatus();
    }
}

function updateHealthBar() {
     let healthFill = document.getElementById("healthFill");
     if(healthFill) {
         let visualWidth = Math.min(100, health) * 2;
         healthFill.style.width = visualWidth + "px"; 
         healthFill.innerText = health;
     }
}

function updateShieldBar() {
    let shieldFill = document.getElementById("shieldFill");
    if(shieldFill) {
        // Fixierte Breite für 100%, auch wenn Wert > 100
        let visualWidth = Math.min(100, shield) * 2;
        shieldFill.style.width = visualWidth + "px"; 
        shieldFill.innerText = shield;
    }
}

function updateDamageDisplay() {
    let dmgDisplay = document.getElementById("damageDisplay");
    if(dmgDisplay) {
        dmgDisplay.innerText = "Damage: " + damage;
    }
}

function checkShopStatus() {
     let totalItems = PLAYER.helmetCount + PLAYER.harnischCount + PLAYER.skirtCount + PLAYER.shoesCount;
     if (totalItems <= 0) {
         shopMenu.style.display = "none";
         startBossFight();
     }
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

/***********************************
 * SETUP MENU (Difficulty)
 ***********************************/
let selectedDifficulty = 'normal';

function openSetupMenu() {
    let startMenu = document.getElementById("startMenu");
    let setupMenu = document.getElementById("setupMenu");

    if (startMenu && setupMenu) {
        startMenu.style.transition = "opacity 0.5s";
        startMenu.style.opacity = "0";
        startMenu.style.zIndex = "-1";
        
        setupMenu.classList.add("active");
        selectDifficulty(selectedDifficulty);
    }
}

function selectDifficulty(diff) {
    selectedDifficulty = diff;
    let display = document.getElementById("selectedDifficultyDisplay");
    if (display) {
        display.innerText = "Gewählt: " + diff.toUpperCase();
    }
}

function submitSetup() {
    let nameInput = document.getElementById("playerNameInput");
    let name = nameInput ? nameInput.value.trim() : "Player";
    
    if (name === "" && nameInput) {
        nameInput.style.borderBottom = "2px solid red";
        return;
    }
    
    if (typeof PLAYER !== 'undefined') {
        PLAYER.name = name;
    }
    
    // Apply difficulty
    if (typeof setBossDifficulty === 'function') {
        setBossDifficulty(selectedDifficulty);
    }

    let setupMenu = document.getElementById("setupMenu");
    if (setupMenu) {
        setupMenu.classList.remove("active");
    }
    
    setTimeout(() => {
        startGame();
    }, 500);
}

/***********************************
 * LEADERBOARD & END GAME
 ***********************************/
function saveScore(result) {
    let entry = {
        name: (typeof PLAYER !== 'undefined' && PLAYER.name) ? PLAYER.name : "Unknown",
        difficulty: selectedDifficulty,
        result: result, // "Win" or "Loss"
        items: {
            helmets: PLAYER.totalHelmets || 0,
            harnisch: PLAYER.totalHarnisch || 0,
            skirts: PLAYER.totalSkirts || 0,
            shoes: PLAYER.totalShoes || 0
        },
        date: new Date().toLocaleDateString()
    };

    let leaderboard = JSON.parse(localStorage.getItem('spriteGameLeaderboard')) || [];
    leaderboard.push(entry);
    localStorage.setItem('spriteGameLeaderboard', JSON.stringify(leaderboard));
}

function showLeaderboard() {
    let listContainer = document.getElementById("leaderboardList");
    if (!listContainer) return;

    listContainer.innerHTML = "";
    let data = JSON.parse(localStorage.getItem('spriteGameLeaderboard')) || [];
    
    // Sort by recent (reverse order of addition)
    data.reverse();

    if (data.length === 0) {
        listContainer.innerHTML = "<div style='text-align:center; padding:20px; color:#ddd;'>Noch keine Einträge.</div>";
    }

    data.forEach((entry, index) => {
        let row = document.createElement("div");
        row.className = "leaderboard-row";
        
        let statusColor = entry.result === "Win" ? "#4caf50" : "#f44336";
        
        row.innerHTML = `
            <div class="lb-rank">#${index + 1}</div>
            <div class="lb-name">${entry.name}</div>
            <div class="lb-diff">${entry.difficulty.toUpperCase()}</div>
            <div class="lb-status" style="color:${statusColor}">${entry.result}</div>
            <div class="lb-items">
                <span>🛡️${entry.items.helmets}</span>
                <span>💊${entry.items.harnisch}</span>
                <span>⚔️${entry.items.skirts}</span>
                <span>👞${entry.items.shoes}</span>
            </div>
        `;
        listContainer.appendChild(row);
    });

    let startMenu = document.getElementById("startMenu");
    let lbMenu = document.getElementById("leaderboardMenu");
    
    if(startMenu) startMenu.style.display = "none";
    if(lbMenu) lbMenu.style.display = "flex";
}

function closeLeaderboard() {
    let startMenu = document.getElementById("startMenu");
    let lbMenu = document.getElementById("leaderboardMenu");
    
    if(lbMenu) lbMenu.style.display = "none";
    if(startMenu) startMenu.style.display = "block";
}

function endGame(status) {
    gameRunning = false;
    saveScore(status);
    
    let msg = status === "Win" ? "SIEG! Der Fluch ist gebrochen." : "GAME OVER! Der Boss hat deine Seele verschlungen.";
    
    setTimeout(() => {
        alert(msg);
        location.reload(); 
    }, 100);
}
