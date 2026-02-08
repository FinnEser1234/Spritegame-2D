
/***********************************
 * PLAYER
 ***********************************/
let PLAYER = {
    box: document.getElementById('player'),
    spriteImg: document.getElementById('spriteImg'),
    spriteImgNumber: 0, // current animation frame of sprite image
    spriteDirection: 1,
    helmetCount: 0,
    harnischCount: 0,
    skirtCount: 0,
    shoesCount: 0,
    animationCounter: 0 // Counter für langsamere Animation
}

const SIZE = 2;

/***********************************
 * PLAYER CONFIGURATION
 ***********************************/
let PLAYER_CONFIG = {
    SCALE: 2.0,             // Skalierung des Spielers
    WIDTH: 18.5,            // Breite der Hitbox / des sichtbaren Bereichs
    HEIGHT: 24,             // Höhe der Hitbox / des sichtbaren Bereichs
    ANIMATION_STEP: 17.475, // Pixel pro Frame in der Animation
    MAX_FRAME: 11           // Letzter Frame-Index
};

function applyPlayerConfig() {
    PLAYER.box.style.width = `${PLAYER_CONFIG.WIDTH}px`;
    PLAYER.box.style.height = `${PLAYER_CONFIG.HEIGHT}px`;
    let dir = PLAYER.spriteDirection || 1;
    PLAYER.box.style.transform = `scaleX(${dir * PLAYER_CONFIG.SCALE}) scaleY(${PLAYER_CONFIG.SCALE})`;
}

applyPlayerConfig();

/**
 * Update configuration for specific sprite
 * @param {Object} newConfig - Partial or full config object
 */

function updatePlayerConfig(newConfig) {
    PLAYER_CONFIG = { ...PLAYER_CONFIG, ...newConfig };
    applyPlayerConfig();
}

/***********************************
 * MOVE
 * **********************************/
/**
 * @param {number} dx - player x move offset in pixel
 * @param {number} dy - player y move offset in pixel
 * @param {number} dr - player heading direction (-1: look left || 1: look right)
 */
function movePlayer(dx, dy, dr) {
    // save original position
    let originalX = parseFloat(PLAYER.box.style.left);
    let originalY = parseFloat(PLAYER.box.style.top);

    // calculate new position
    let newX = originalX + dx;
    let newY = originalY + dy;

    // Surface Grenzen (800x600)
    const SURFACE_WIDTH = 800;
    const SURFACE_HEIGHT = 600;
    
    // Config Values using
    const PLAYER_WIDTH = PLAYER_CONFIG.WIDTH;
    const PLAYER_HEIGHT = PLAYER_CONFIG.HEIGHT;

    // Grenzen-Überprüfung
    if (newX < 0) {
        newX = 0;
    }

    if (newX + PLAYER_WIDTH > SURFACE_WIDTH) {
        newX = SURFACE_WIDTH - PLAYER_WIDTH;
    }

    if (newY < 0) {
        newY = 0;
    }
    
    if (newY + PLAYER_HEIGHT > SURFACE_HEIGHT) {
        newY = SURFACE_HEIGHT - PLAYER_HEIGHT;
    }

    // Neue Position setzen
    PLAYER.box.style.left = newX + 'px';
    PLAYER.box.style.top = newY + 'px';

    // update sprite direction if needed
    if (dr != 0 && dr != PLAYER.spriteDirection) {
        PLAYER.spriteDirection = dr;
        PLAYER.box.style.transform = `scaleX(${dr * PLAYER_CONFIG.SCALE}) scaleY(${PLAYER_CONFIG.SCALE})`;
    }

    // output in debugger box
    updateScoreDisplay();
}

function updateScoreDisplay() {
    GAME_SCREEN.debug_output.innerHTML = `<p>Helmet: ${PLAYER.helmetCount} <img src="../IMG/rustung1.png" alt=""></p><p>Harnisch: ${PLAYER.harnischCount} <img src="../IMG/rustung4.png" alt=""></p><p>Skirt: ${PLAYER.skirtCount} <img src="../IMG/rustung2.png" alt=""></p><p>Shoes: ${PLAYER.shoesCount} <img src="../IMG/rustung3.png" alt=""></p>`;
}



/***********************************
 * ANIMATE PLAYER
 * **********************************/
function animatePlayer() {
    // Ensure style.right is initialized
    if (!PLAYER.spriteImg.style.right) {
        PLAYER.spriteImg.style.right = "0px";
    }

    if (PLAYER.spriteImgNumber < PLAYER_CONFIG.MAX_FRAME) { // switch to next sprite position
        PLAYER.spriteImgNumber++;
        let x = parseFloat(PLAYER.spriteImg.style.right);
        if (isNaN(x)) x = 0;
        x += PLAYER_CONFIG.ANIMATION_STEP; 
        PLAYER.spriteImg.style.right = x + "px";
    } else { // animation loop finished: back to start animation
        PLAYER.spriteImg.style.right = "0px";
        PLAYER.spriteImgNumber = 0;
    }
}

