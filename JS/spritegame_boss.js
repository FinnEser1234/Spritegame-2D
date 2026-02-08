
/***********************************
 * BOSS FIGHT
 ***********************************/
let boss = {
    element: null,
    hp: 500,
    maxHp: 500,
    x: 350,
    y: 250,
    width: 100,
    height: 100,
    speed: 1.5,
    attackCooldown: 0,
    damageTakenCooldown: 0,
    damageToPlayer: 8,
    attackCooldownMax: 8
};

// Difficulty Configuration
let bossStats = {
    normal: { hp: 300, speed: 1.0, dmg: 4, atkRate: 15 },
    hard: { hp: 500, speed: 1.3, dmg: 6, atkRate: 12 },
    ultra: { hp: 800, speed: 1.6, dmg: 8, atkRate: 8 }
};

let currentDifficulty = 'normal';

function setBossDifficulty(diff) {
    if (bossStats[diff]) {
        currentDifficulty = diff;
        console.log("Boss Difficulty set to:", diff);
    }
}

function startBossFight() {
    console.log("BOSS FIGHT START [" + currentDifficulty + "]");
    gameRunning = true;
    
    // Apply Settings
    let stats = bossStats[currentDifficulty];
    boss.hp = stats.hp;
    boss.maxHp = stats.hp;
    boss.speed = stats.speed;
    boss.damageToPlayer = stats.dmg;
    boss.attackCooldownMax = stats.atkRate;

    // Hide Collection Items
    GAME_SCREEN.redBox.style.display = "none";
    
    // Setup Health Bar
    document.getElementById("bossHealthContainer").style.display = "block";
    updateBossHealthBar();

    // Setup Boss Visuals
    boss.element = document.getElementById("boss");
    boss.element.style.display = "block";
    
    // Initial Position
    boss.x = GAME_SCREEN.surface.clientWidth / 2 - 50;
    boss.y = 50;
    // boss.hp resetting done above
    
    // Visual Ambience
    let surface = document.getElementById("surface");
    surface.style.filter = "sepia(0.8) hue-rotate(320deg) contrast(1.2)";
    surface.style.border = "3px solid purple";

    bossLoop();
}

function updateBossHealthBar() {
    let bar = document.getElementById("bossHealthFill");
    let pct = (boss.hp / boss.maxHp) * 100;
    if (pct < 0) pct = 0;
    bar.style.width = pct + "%";
}

function bossLoop() {
    if (!gameRunning) return;

    // 1. Player Movement
    if (KEY_EVENTS.leftArrow) { movePlayer(-GAME_CONFIG.characterSpeed, 0, -1); animatePlayer(); }
    if (KEY_EVENTS.rightArrow) { movePlayer(GAME_CONFIG.characterSpeed, 0, 1); animatePlayer(); }
    if (KEY_EVENTS.upArrow) { movePlayer(0, -GAME_CONFIG.characterSpeed, 0); animatePlayer(); }
    if (KEY_EVENTS.downArrow) { movePlayer(0, GAME_CONFIG.characterSpeed, 0); animatePlayer(); }

    // 2. Boss Logic (Chase Player)
    moveBoss();

    // 3. Collision / Damage Logic
    // Simple: Touch Boss = Take Damage
    if (isColliding(PLAYER.box, boss.element, -30)) {
        // PLAYER TAKES DAMAGE
        if (boss.attackCooldown <= 0) {
            takeDamage(boss.damageToPlayer); // Uses difficulty setting
            boss.attackCooldown = boss.attackCooldownMax; // Uses difficulty setting
        }

        // BOSS TAKES DAMAGE (Continuous contact)
        if (boss.damageTakenCooldown <= 0) {
            // Damage calculation
            boss.hp -= (damage || 10); 
            updateBossHealthBar();
            boss.damageTakenCooldown = 15; 
            
            if (boss.hp <= 0) {
                if (typeof endGame === 'function') {
                    endGame("Win");
                } else {
                    // Fallback if main.js not loaded/updated yet
                    gameRunning = false;
                    alert("VICTORY! The curse is lifted.");
                    location.reload();
                }
            }
        }
    }
    
    if (boss.damageTakenCooldown > 0) boss.damageTakenCooldown--;
    if (boss.attackCooldown > 0) boss.attackCooldown--;

    // Loop
    setTimeout(bossLoop, 1000 / GAME_CONFIG.gameSpeed);
}

function moveBoss() {
    let playerX = parseFloat(PLAYER.box.style.left);
    let playerY = parseFloat(PLAYER.box.style.top);
    
    let dx = playerX - boss.x;
    let dy = playerY - boss.y;
    let distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance > 10) { // Stop if very close
        boss.x += (dx / distance) * boss.speed;
        boss.y += (dy / distance) * boss.speed;
    }
    
    boss.element.style.left = boss.x + "px";
    boss.element.style.top = boss.y + "px";
}

function takeDamage(amount) {
    if (shield > 0) {
        // Shield is extra fragile: takes double damage
        shield -= (amount * 2);
        
        if (shield < 0) {
             // Overflow damage goes to health
             health += shield; // shield is negative, so this reduces health
             shield = 0;
        }
    } else {
        health -= amount;
    }
    
    updateHealthBar();
    updateShieldBar();
    
    if (health <= 0) {
        if (typeof endGame === 'function') {
            endGame("Loss");
        } else {
            gameRunning = false;
            alert("GAME OVER - The Boss consumed your soul.");
            location.reload(); 
        }
    }
}
