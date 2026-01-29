
// State for character selection
let selectedCharId = 0;

function openCharSelection() {
    console.log("Opening Character Selection");
    let startMenu = document.getElementById("startMenu");
    let charMenu = document.getElementById("charSelectionMenu");
    
    if (!startMenu || !charMenu) {
        console.error("Menus not found");
        return;
    }

    // Hide Start Menu
    startMenu.style.transition = "opacity 0.5s";
    startMenu.style.opacity = "0";
    startMenu.style.zIndex = "-1"; // Move behind
    
    // Show Char Menu
    // We need to ensure it's visible in layout before opacity transition
    // In CSS it's display: flex (by default class logic? No, id #charSelectionMenu has display:flex)
    // Actually in my CSS: #charSelectionMenu { display: flex; opacity: 0; pointer-events: none; }
    // So just adding 'active' class is enough.
    
    charMenu.classList.add("active");
}

function selectChar(id) {
    selectedCharId = id;
    
    // Update visuals
    let cards = document.querySelectorAll(".char-card");
    cards.forEach((card, index) => {
        if (index + 1 === id) {
            card.classList.add("selected");
        } else {
            card.classList.remove("selected");
        }
    });

    // Show input section if not already visible
    let contract = document.getElementById("contractSection");
    if (!contract.classList.contains("visible")) {
        contract.classList.add("visible");
    }
}

function submitCharacter() {
    let nameInput = document.getElementById("charNameInput");
    let name = nameInput.value.trim();
    
    if(name === "") {
        nameInput.style.borderBottom = "2px solid red";
        // wiggle effect could be added here
        return;
    }
    
    // Save to PLAYER object (Assuming PLAYER is global from spritegame_player.js)
    if (typeof PLAYER !== 'undefined') {
        PLAYER.name = name;
        PLAYER.characterId = selectedCharId;
        console.log(`Character binded: ${name} as Type ${selectedCharId}`);
        
        // Use the selected character image in game?
        // This requires rewriting the animation logic in player.js. 
        // For now, we will perform the transition to game.
        setupCharacterSprite(selectedCharId);
    }
    
    // Start Game Transition
    let charMenu = document.getElementById("charSelectionMenu");
    charMenu.classList.remove("active");
    
    // Wait for transition to finish before starting game logic
    setTimeout(() => {
        if (typeof startGame === 'function') {
            startGame();
        } else {
            console.error("startGame function not found!");
        }
    }, 500);
}

// Function to potentially swap the player sprite based on selection
function setupCharacterSprite(id) {
    // This is a placeholder for connecting the visual selection to gameplay.
    // Since the current gameplay relies on a spritesheet (Ghost1.png) and specific CSS animations,
    // swapping to the 12 individual images requires a change in game loop.
    // For now, we are just saving the preference.
    
    // If we wanted to change the static image:
    /*
    let spriteImg = document.getElementById("spriteImg");
    if(id === 1) spriteImg.src = "./IMG/Walking/001/Wraith_01_Moving Forward_000.png";
    if(id === 2) spriteImg.src = "./IMG/Walking/002/Wraith_02_Moving Forward_000.png";
    if(id === 3) spriteImg.src = "./IMG/Walking/003/Wraith_03_Moving Forward_000.png";
    */
   // But this would break the walking animation. 
}
