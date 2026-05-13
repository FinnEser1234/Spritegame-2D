import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Interfaces für saubere Typisierung
interface Player {
    id: string;
    x: number;
    y: number;
    name: string;
    direction: number;
    ready: boolean;
    health?: number;
    maxHealth?: number;
}

interface ChatMessage {
    id: string;
    name: string;
    text: string;
}

interface SharedItem {
    id: string;
    type: number; // 1-4 für verschiedene Rüstungstypen
    x: number;
    y: number;
    collected: boolean;
    collectedBy?: string;
}

interface BossState {
    hp: number;
    maxHp: number;
    difficulty: string;
    inBattle: boolean;
}

// Speicher für alle aktiven Geister
const players: Record<string, Player> = {};
let gameStarted = false;
let sharedItems: Record<string, SharedItem> = {};
let bossState: BossState = {
    hp: 0,
    maxHp: 0,
    difficulty: 'normal',
    inBattle: false
};

// Statische Dateien ausliefern
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

app.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

function generateSharedItems() {
    sharedItems = {};
    // Spawn 2x jedes Item-Typ
    const itemTypes = [1, 2, 3, 4];
    let itemId = 0;
    
    itemTypes.forEach(type => {
        for (let i = 0; i < 2; i++) {
            const randomX = Math.random() * 700 + 50;
            const randomY = Math.random() * 400 + 100;
            sharedItems[`item_${itemId}`] = {
                id: `item_${itemId}`,
                type,
                x: randomX,
                y: randomY,
                collected: false
            };
            itemId++;
        }
    });
}

function emitLobbyStatus() {
    const allPlayers = Object.values(players);
    const readyPlayers = allPlayers.filter((player) => player.ready).length;

    io.emit('lobbyStatus', {
        connectedPlayers: allPlayers.length,
        readyPlayers,
        requiredPlayers: 2,
        gameStarted
    });
}

function tryStartGame() {
    // Runde freigeben, falls die vorherige nicht mehr zwei aktive Spieler hat.
    if (gameStarted && Object.keys(players).length < 2) {
        gameStarted = false;
    }
    if (gameStarted) return;

    const readyList = Object.values(players).filter((player) => player.ready);
    if (readyList.length < 2) return;

    gameStarted = true;
    generateSharedItems();

    // Spawnpunkte fuer den Start (erste zwei an festen Positionen)
    const spawns = [
        { x: 100, y: 220 },
        { x: 650, y: 220 }
    ];

    readyList.forEach((player, index) => {
        const spawn = spawns[index] || { x: 400, y: 220 };
        player.x = spawn.x;
        player.y = spawn.y;
        player.direction = index % 2 === 0 ? 1 : -1;
        player.health = 100;
        player.maxHealth = 100;
    });

    io.emit('gameStart', {
        players,
        items: sharedItems,
        startedAt: Date.now()
    });

    emitLobbyStatus();
}

function calculateBossDifficulty() {
    // Boss-Schwierigkeit basierend auf Anzahl der Spieler
    if (Object.keys(players).length >= 2) {
        return 'hard'; // Zwei Spieler = schwieriger Boss
    }
    return 'normal';
}

io.on('connection', (socket: Socket) => {
    console.log(`Geist erschienen: ${socket.id}`);

    // 1. Initialisierung
    players[socket.id] = {
        id: socket.id,
        x: 100,
        y: 220,
        name: "Unbekannter Geist",
        direction: 1,
        ready: false,
        health: 100,
        maxHealth: 100
    };

    // 2. Bestehende Spieler an den Neuen senden
    socket.emit('currentPlayers', players);

    // 3. Neuen Spieler allen anderen melden
    socket.broadcast.emit('newPlayer', players[socket.id]);
    emitLobbyStatus();

    socket.on('playerReady', (payload: { name?: string; direction?: number; difficulty?: string }) => {
        const player = players[socket.id];
        if (!player) return;

        // Falls der Server in altem Zustand haengt, aber nicht mehr 2 Spieler aktiv sind,
        // wird eine neue Runde wieder moeglich.
        if (gameStarted && Object.keys(players).length < 2) {
            gameStarted = false;
        }
        if (gameStarted) return;

        player.ready = true;
        if (payload?.name && payload.name.trim().length > 0) {
            player.name = payload.name.trim();
        }
        if (typeof payload?.direction === 'number') {
            player.direction = payload.direction;
        }
        if (payload?.difficulty) {
            bossState.difficulty = payload.difficulty;
        }

        io.emit('playerReadyUpdate', {
            id: player.id,
            ready: player.ready,
            name: player.name
        });

        emitLobbyStatus();
        tryStartGame();
    });

    // 4. Bewegung verarbeiten
    socket.on('playerMovement', (movementData: { x: number, y: number, name: string, direction: number }) => {
        const player = players[socket.id];
        if (player) {
            player.x = movementData.x;
            player.y = movementData.y;
            player.name = movementData.name;
            player.direction = movementData.direction;

            // Update an alle anderen broadcasten
            socket.broadcast.emit('playerMoved', player);
        }
    });

    // 5. Item sammeln (kooperativ)
    socket.on('itemCollected', (itemId: string) => {
        if (sharedItems[itemId] && !sharedItems[itemId].collected) {
            sharedItems[itemId].collected = true;
            sharedItems[itemId].collectedBy = players[socket.id]?.name || 'Unbekannter Geist';
            
            // Allen Spielern mitteilen, dass ein Item gesammelt wurde
            io.emit('itemTaken', {
                itemId,
                collectedBy: sharedItems[itemId].collectedBy,
                remainingItems: Object.values(sharedItems).filter(item => !item.collected).length
            });

            // Wenn alle Items gesammelt, Boss-Kampf starten
            const allItemsCollected = Object.values(sharedItems).every(item => item.collected);
            if (allItemsCollected) {
                startBossBattle();
            }
        }
    });

    // 6. Boss-Kampf starten
    function startBossBattle() {
        const diffStats = {
            normal: { hp: 200, speed: 1.0, dmg: 2, atkRate: 15 },
            hard: { hp: 500, speed: 1.3, dmg: 6, atkRate: 12 },
            ultra: { hp: 800, speed: 1.6, dmg: 8, atkRate: 8 }
        };

        const stats = diffStats[bossState.difficulty as keyof typeof diffStats] || diffStats.normal;
        bossState.hp = stats.hp;
        bossState.maxHp = stats.hp;
        bossState.inBattle = true;

        io.emit('startBossBattle', {
            bossState,
            difficulty: bossState.difficulty
        });
    }

    // 7. Schaden am Boss (von beiden Spielern)
    socket.on('damageToSharedBoss', (damage: number) => {
        if (bossState.inBattle && bossState.hp > 0) {
            bossState.hp -= damage;
            
            io.emit('bossHealthUpdate', {
                hp: Math.max(0, bossState.hp),
                maxHp: bossState.maxHp
            });

            if (bossState.hp <= 0) {
                bossState.inBattle = false;
                io.emit('bossDefeated', { winner: players[socket.id]?.name || 'Unbekannter Geist' });
            }
        }
    });

    // 8. Schaden an Spieler (vom Boss)
    socket.on('takeBossDamage', (damage: number) => {
        // Schaden wird an beide Spieler verteilt
        Object.values(players).forEach(player => {
            if (player.health !== undefined) {
                player.health = Math.max(0, player.health - damage);
            }
        });

        io.emit('playersHealthUpdate', 
            Object.fromEntries(
                Object.entries(players).map(([id, p]) => [id, { health: p.health, maxHealth: p.maxHealth }])
            )
        );

        // Prüfe ob jemand tot ist
        if (Object.values(players).some(p => p.health === 0)) {
            bossState.inBattle = false;
            io.emit('gameOver', { message: 'Der Boss hat euch besiegt!' });
        }
    });

    // 9. Chat-Nachrichten
    socket.on('chatMessage', (text: string) => {
        const player = players[socket.id];
        if (player) {
            const message: ChatMessage = {
                id: socket.id,
                name: player.name,
                text: text
            };
            io.emit('newMessage', message);
        }
    });

    // 10. Spiel zurücksetzen
    socket.on('resetGame', () => {
        gameStarted = false;
        sharedItems = {};
        bossState = {
            hp: 0,
            maxHp: 0,
            difficulty: 'normal',
            inBattle: false
        };
        Object.values(players).forEach(p => {
            p.ready = false;
            p.health = 100;
        });
        io.emit('gameReset');
        emitLobbyStatus();
    });

    // 11. Logout
    socket.on('disconnect', () => {
        console.log(`Geist verschwunden: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);

        if (Object.keys(players).length < 2) {
            gameStarted = false;
            bossState.inBattle = false;
        }
        emitLobbyStatus();
    });
});

const preferredPort = Number(process.env.PORT) || 3000;

function listenOnPort(port: number) {
    httpServer.listen(port, '0.0.0.0', () => {
        console.log(`Twilight Specter TS-Server auf Port ${port}`);
    });
}

httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        if (process.env.NO_PORT_FALLBACK === '1' || process.env.NO_PORT_FALLBACK === 'true') {
            console.error(`Port ${preferredPort} ist belegt. Bitte einen freien PORT setzen oder den blockierenden Prozess beenden.`);
            process.exit(1);
        }

        const fallbackPort = preferredPort + 1;
        console.warn(`Port ${preferredPort} belegt. Wechsle auf Port ${fallbackPort}.`);
        listenOnPort(fallbackPort);
        return;
    }

    throw err;
});

listenOnPort(preferredPort);