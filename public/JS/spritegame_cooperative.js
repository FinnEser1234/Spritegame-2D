/**
 * KOOPERATIVES GAMEPLAY MODULE
 * Verwaltet gemeinsame Items, Spieler-Rendering und Boss-Kampf für 2+ Spieler
 */

let sharedItems = {};
let otherPlayers = {};
let localPlayerId = null;
let currentBossDifficulty = 'normal';

// Items auf der Fläche rendern
function renderSharedItems() {
    let surface = document.getElementById("surface");
    
    // Alte Items entfernen
    document.querySelectorAll('.shared-item').forEach(el => el.remove());
    
    // Neue Items zeichnen
    Object.values(sharedItems).forEach(item => {
        if (!item.collected) {
            let itemEl = document.createElement('div');
            itemEl.className = 'shared-item';
            itemEl.style.position = 'absolute';
            itemEl.style.left = item.x + 'px';
            itemEl.style.top = item.y + 'px';
            itemEl.style.width = '40px';
            itemEl.style.height = '40px';
            itemEl.style.backgroundImage = `url("IMG/rustung${item.type}.png")`;
            itemEl.style.backgroundSize = 'contain';
            itemEl.style.backgroundRepeat = 'no-repeat';
            itemEl.style.zIndex = '100';
            itemEl.id = `item_${item.id}`;
            surface.appendChild(itemEl);
        }
    });
}

// Mehrere Spieler rendern
function renderOtherPlayers() {
    // Alte Spieler entfernen
    document.querySelectorAll('.other-player').forEach(el => el.remove());
    
    // Andere Spieler rendern
    Object.values(otherPlayers).forEach(player => {
        if (player.id !== localPlayerId) {
            let playerEl = document.createElement('div');
            playerEl.className = 'other-player';
            playerEl.style.position = 'absolute';
            playerEl.style.left = player.x + 'px';
            playerEl.style.top = player.y + 'px';
            playerEl.style.width = '50px';
            playerEl.style.height = '60px';
            playerEl.style.backgroundImage = `url("IMG/ghost_blue.png")`; // Andere Farbe
            playerEl.style.backgroundSize = 'contain';
            playerEl.style.backgroundRepeat = 'no-repeat';
            playerEl.style.zIndex = '99';
            playerEl.style.transform = player.direction === -1 ? 'scaleX(-1)' : 'scaleX(1)';
            
            let nameTag = document.createElement('div');
            nameTag.style.position = 'absolute';
            nameTag.style.top = '-20px';
            nameTag.style.left = '50%';
            nameTag.style.transform = 'translateX(-50%)';
            nameTag.style.color = '#00ff00';
            nameTag.style.fontSize = '12px';
            nameTag.style.fontFamily = 'Arial';
            nameTag.style.textShadow = '1px 1px 3px black';
            nameTag.style.whiteSpace = 'nowrap';
            nameTag.textContent = player.name;
            playerEl.appendChild(nameTag);
            
            document.getElementById("surface").appendChild(playerEl);
        }
    });
}

// Item-Sammlung prüfen
function checkSharedItemCollision() {
    if (!PLAYER.box) return;
    
    Object.values(sharedItems).forEach(item => {
        if (item.collected) return;
        
        let itemEl = document.getElementById(`item_${item.id}`);
        if (!itemEl) return;
        
        if (isColliding(PLAYER.box, itemEl, -10)) {
            // Server benachrichtigen
            if (socket && typeof socket.emit === 'function') {
                socket.emit('itemCollected', item.id);
            }
        }
    });
}

// Socket-Event-Listener für kooperatives Gameplay
function setupCooperativeSocketListeners() {
    if (!socket) return;
    
    // Items erhalten
    socket.on('gameStart', (data) => {
        sharedItems = data.items || {};
        otherPlayers = data.players || {};
        localPlayerId = socket.id;
        
        console.log('🎮 Spiel gestartet mit gemeinsamen Items!', Object.keys(sharedItems).length);
        renderSharedItems();
        renderOtherPlayers();
    });
    
    // Wenn ein Item gesammelt wird
    socket.on('itemTaken', (data) => {
        if (sharedItems[data.itemId]) {
            sharedItems[data.itemId].collected = true;
        }
        
        renderSharedItems();
        console.log(`✅ ${data.collectedBy} hat ein Item gesammelt! (${data.remainingItems} übrig)`);
        
        // Sound abspielen
        if (typeof aufruesten !== 'undefined') {
            aufruesten.play().catch(e => console.log(e));
        }
    });
    
    // Andere Spieler bewegen
    socket.on('playerMoved', (player) => {
        if (player.id !== localPlayerId) {
            otherPlayers[player.id] = player;
            renderOtherPlayers();
        }
    });
    
    // Neuer Spieler
    socket.on('newPlayer', (player) => {
        if (player.id !== localPlayerId) {
            otherPlayers[player.id] = player;
            renderOtherPlayers();
        }
    });
    
    // Spieler getrennt
    socket.on('playerDisconnected', (playerId) => {
        delete otherPlayers[playerId];
        renderOtherPlayers();
    });
    
    // Boss-Kampf startet
    socket.on('startBossBattle', (data) => {
        console.log('⚔️ Boss-Kampf startet! Schwierigkeit:', data.difficulty);
        gameRunning = true;
        startBossFight();
    });
    
    // Boss-Gesundheit aktualisiert
    socket.on('bossHealthUpdate', (data) => {
        if (typeof updateBossHealthBar === 'function') {
            boss.hp = data.hp;
            boss.maxHp = data.maxHp;
            updateBossHealthBar();
        }
    });
    
    // Spieler-Gesundheit aktualisiert (vom Boss-Schaden)
    socket.on('playersHealthUpdate', (healthData) => {
        if (healthData[localPlayerId]) {
            health = healthData[localPlayerId].health;
            updateHealthBar();
        }
    });
    
    // Boss besiegt
    socket.on('bossDefeated', (data) => {
        console.log('🏆 Boss besiegt!');
        endGame('Win');
    });
    
    // Spiel verloren
    socket.on('gameOver', (data) => {
        console.log('💀 Spiel vorbei:', data.message);
        endGame('Lose');
    });
    
    // Spiel zurückgesetzt
    socket.on('gameReset', () => {
        sharedItems = {};
        otherPlayers = {};
        mainMenu();
    });
}

// Kooperativer Boss-Kampf
let lastCoopDamageTime = 0;
function sendCoopBossDamage() {
    // Verhindere zu häufiges Senden (max 1x pro 200ms)
    let now = Date.now();
    if (now - lastCoopDamageTime < 200) return;
    lastCoopDamageTime = now;
    
    if (socket && typeof socket.emit === 'function' && damage > 0) {
        socket.emit('damageToSharedBoss', damage);
    }
}

// Kooperativer Boss-Schaden
function sendCoopBossDamageToPlayers(bossAttackDamage) {
    if (socket && typeof socket.emit === 'function') {
        socket.emit('takeBossDamage', bossAttackDamage);
    }
}
