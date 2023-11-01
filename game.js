const trashItems = [
  { name: "News Paper", type: "organic" },
  { name: "Plastic Bottle", type: "non-organic" },
  { name: "Pizza Box", type: "organic" },
  { name: "Soda Can", type: "non-organic" },
  // Add more trash items as needed
];

// Creating trash
function createRandomTrash() {
  // Get random trash
  const randomIndex = Math.floor(Math.random() * trashItems.length);
  const trash = trashItems[randomIndex];

  // Create the trash
  const trashElement = document.createElement("img");
  trashElement.className = 'trash-queue-item';
  trashElement.src = "/assets/" + trash.name.toLowerCase().replace(" ", "_") + ".png";
  trashElement.alt = trash.type;

  return trashElement;
}

let trashQueues = [];
let currentTrashQueue = null;

let trashElements = [];
let currentTrash = null;
let score = 0;

function addTrashToQueue(newTrash) {
  trashQueues.push(newTrash);
  const trashQueue = document.getElementById("trash-queue");
  trashQueue.appendChild(newTrash);
}

function addTrashToCurrentQueue(newTrash) {
  currentTrashQueue = newTrash;
  const trashCurrent = document.getElementById("trash-current");
  trashCurrent.replaceChildren(newTrash);
}

function fillTrashQueue() {
  for (let i = 0; i < 3; i++) {
    const newTrash = createRandomTrash();
    addTrashToQueue(newTrash);
  }
}

function updateTrashQueue() {
  const firstTrashQueue = trashQueues.shift();
  addTrashToCurrentQueue(firstTrashQueue);

  const newTrash = createRandomTrash();
  addTrashToQueue(newTrash);
}

function createTrashElement() {
  // get current trash queue
  currentTrashQueue.style.left = Math.random() * 250 + "px"; // Random initial position
  currentTrashQueue.className = "trash " + currentTrashQueue.alt;
  currentTrashQueue.style.objectFit = "contain";
  currentTrashQueue.style.background = "none";

  trashElements.push(currentTrashQueue);
  document.getElementById("trash-container").appendChild(currentTrashQueue);
  currentTrash = currentTrashQueue;
  updateTrashQueue();
}

function removeTrashElement(trashElement) {
  const index = trashElements.indexOf(trashElement);
  if (index > -1) {
    trashElements.splice(index, 1);
  }
}

function moveTrash() {
  createTrashElement();

  const trashSpeed = 1; // Make the trash fall slower

  const trashInterval = setInterval(() => {
    trashElements.forEach((trash) => {
      let position = parseInt(trash.style.top) || 0;
      position += trashSpeed;
      trash.style.top = position + "px";

      // Check if the trash item has reached the bottom
      if (position >= document.getElementById("game-container").clientHeight - trash.clientHeight - 180) {
        clearInterval(trashInterval);
        removeTrashElement(trash);

        // Check if it was sorted correctly
        if (
          trash.classList.contains("organic") &&
          trash.offsetLeft >=
          document.getElementById("organic-bin").offsetLeft &&
          trash.offsetLeft <=
          document.getElementById("organic-bin").offsetLeft +
          document.getElementById("organic-bin").clientWidth
        ) {
          score += 1;
        } else if (
          trash.classList.contains("non-organic") &&
          trash.offsetLeft >=
          document.getElementById("non-organic-bin").offsetLeft &&
          trash.offsetLeft <=
          document.getElementById("non-organic-bin").offsetLeft +
          document.getElementById("non-organic-bin").clientWidth
        ) {
          score += 1;
        } else {
          score -= 1;
        }

        document.getElementById("score").textContent = score;
        trash.remove();

        // Update currentTrash only if it matches the removed trash
        if (currentTrash === trash) {
          currentTrash = null;
        }

        if (score >= 5) {
          finishGame();
        }
      }
    });
  }, 10);
}

let binPosition = 0; // Initial position of the bins
const binWidth = document.getElementById("organic-bin").clientWidth;
const gameContainerWidth = document.getElementById("game-container").clientWidth - 250;
const scrollSensitivity = 5; // Adjust this value to control scroll sensitivity
const maxOutOfBounds = 300; // The maximum out-of-bounds value

let touchStartX = 0;
let activeBin = null;
let trashInterval;

function updateBinPosition() {
  document.getElementById("organic-bin").style.left = binPosition + "px";
  document.getElementById("metal-bin").style.left = binPosition + binWidth + "px";
  document.getElementById("non-organic-bin").style.left = binPosition + binWidth * 2 + "px";
}

document.getElementById("organic-bin").addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
  activeBin = document.getElementById("organic-bin");
});

document.getElementById("metal-bin").addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
  activeBin = document.getElementById("metal-bin");
});

document.getElementById("non-organic-bin").addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
  activeBin = document.getElementById("non-organic-bin");
});

// Handle touchmove event to move the bins as the user drags
document.addEventListener("touchmove", (event) => {
  if (activeBin) {
    const touchX = event.touches[0].clientX;
    const deltaX = touchX - touchStartX;

    // Update the bin position based on touch movement
    binPosition += deltaX;

    // Check if bins go out of bounds on the left side
    if (binPosition < -maxOutOfBounds) {
      binPosition = gameContainerWidth - binWidth + maxOutOfBounds;
    }
    // Check if bins go out of bounds on the right side
    else if (binPosition > gameContainerWidth - binWidth + maxOutOfBounds) {
      binPosition = -maxOutOfBounds;
    }

    updateBinPosition();
    touchStartX = touchX;
  }
});

// Handle touchend event to stop dragging the bins
document.addEventListener("touchend", () => {
  activeBin = null;
});

document.addEventListener("wheel", (event) => {
  // Update the bin position based on scroll direction
  binPosition += event.deltaY / scrollSensitivity;

  // Check if bins go out of bounds on the left side
  if (binPosition < -maxOutOfBounds) {
    binPosition = gameContainerWidth - binWidth + maxOutOfBounds;
  }
  // Check if bins go out of bounds on the right side
  else if (binPosition > gameContainerWidth - binWidth + maxOutOfBounds) {
    binPosition = -maxOutOfBounds;
  }

  updateBinPosition();
});

function startGame() {
  const newTrash = createRandomTrash();
  addTrashToCurrentQueue(newTrash)
  fillTrashQueue()

  trashElements = [];
  score = 0;
  document.getElementById("score").textContent = score;

  const gameContainer = document.getElementById("game-container");
  const trashContainer = document.getElementById("trash-container");

  document.getElementById("startButton").disabled = true;
  document.getElementById("pauseButton").disabled = false;

  trashContainer.innerHTML = ""; // Clear trash container

  updateBinPosition(); // Initialize bin position

  trashContainer.addEventListener("mousedown", (event) => {
    if (event.target.classList.contains("trash")) {
      currentTrash = event.target;
      currentTrash.style.transition = "none";
      currentTrash.style.cursor = "grabbing";
      const initialX = event.clientX - currentTrash.offsetLeft;
      function moveTrash(event) {
        currentTrash.style.left =
          Math.max(
            0,
            Math.min(
              gameContainer.clientWidth - currentTrash.clientWidth,
              event.clientX - initialX
            )
          ) + "px";
      }
      function stopMovingTrash() {
        currentTrash.style.transition = "";
        currentTrash.style.cursor = "pointer";
        document.removeEventListener("mousemove", moveTrash);
        document.removeEventListener("mouseup", stopMovingTrash);
      }
      document.addEventListener("mousemove", moveTrash);
      document.addEventListener("mouseup", stopMovingTrash);
    }
  });

  trashInterval = setInterval(() => {
    moveTrash();
  }, 3000); // Make the trash fall every 3 seconds

  // Pause button functionality
  let isPaused = false;
  function togglePauseGame() {
    if (isPaused) {
      trashInterval = setInterval(() => {
        moveTrash();
      }, 3000);
      isPaused = false;
      document.getElementById("pauseButton").textContent = "Pause";
    } else {
      clearInterval(trashInterval);
      isPaused = true;
      document.getElementById("pauseButton").textContent = "Resume";
    }
  }

  document.getElementById("pauseButton").addEventListener("click", () => {
    togglePauseGame()
  });
}

function finishGame() {
  const currentURL = window.location.href;
  console.log(currentURL);
  const url = new URL(currentURL);

  // Get the query parameters
  const searchParams = url.searchParams;

  // Extract the game_session_id and user_id
  const game_session_id = searchParams.get("game_session_id");
  const user_id = searchParams.get("user_id");

  const data = {
    game_session_id,
    user_id,
    score
  }

  fetch("http://127.0.0.1:8000/api/finish-game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then((response) => {
    response.json().then((data) => {
      console.log(data);
      if (data.success) {
        clearInterval(trashInterval);
        isPaused = true;
      } else {
        console.error(data.error);
      }
    }).catch((error) => {
      console.error(error);
    })
  })
}
document.getElementById("startButton").addEventListener("click", startGame);
startGame();