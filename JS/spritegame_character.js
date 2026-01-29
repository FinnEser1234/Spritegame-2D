let selectedCharId = 0;

function openCharSelection() {
    console.log("Opening Character Selection");
    let startMenu = document.getElementById("startMenu");
    let charMenu = document.getElementById("charSelectionMenu");
    
    if (!startMenu || !charMenu) {
        console.error("Menus not found");
        return;
    }

    startMenu.style.transition = "opacity 0.5s";
    startMenu.style.opacity = "0";
    startMenu.style.zIndex = "-1";
    
    charMenu.classList.add("active");
}

function selectChar(id) {
    selectedCharId = id;
    
    let cards = document.querySelectorAll(".char-card");
    cards.forEach((card, index) => {
        if (index + 1 === id) {
            card.classList.add("selected");
        } else {
            card.classList.remove("selected");
        }
    });

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
        return;
    }
    
    if (typeof PLAYER !== 'undefined') {
        PLAYER.name = name;
        PLAYER.characterId = selectedCharId;
        console.log(`Character binded: ${name} as Type ${selectedCharId}`);
        
        setupCharacterSprite(selectedCharId);
    }
    
    // Start Game Transition
    let charMenu = document.getElementById("charSelectionMenu");
    charMenu.classList.remove("active");
    
    setTimeout(() => {
        if (typeof startGame === 'function') {
            startGame();
        } else {
            console.error("startGame function not found!");
        }
    }, 500);
}

function setupCharacterSprite(id) {
    /*
    let spriteImg = document.getElementById("spriteImg");
    if(id === 1) {
        spriteImg.src = "./IMG/Ghost1.png";
    }

    if(id === 2) {
        spriteImg.src = "./IMG/Ghost2.png";
        Die nötigen px Anpassungen kommmen noch!!
    }

    if(id === 3) {
        spriteImg.src = "./IMG/Walking/003/Wraith_03_Moving Forward_000.png";
        Hier fehlt noch das Sprite... ist aber in Bearbeitung!!
    }    
    */
}
