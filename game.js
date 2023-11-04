let trashItems = [];

const api_url = 'http://127.0.0.1:8000/api'

const currentURL = window.location.href;
const url = new URL(currentURL);
const searchParams = url.searchParams;

const game_session_id = searchParams.get("game_session_id");

let progressBar = document.getElementById("progress");

let game_detail = {};
let game_mode = "";
let time = 0;
let goal_score = 0;
let user = {}

const timerDisplay = document.getElementById('time-detail');
let timeInSeconds = 0;

// Creating trash
function createRandomTrash() {
  // Get random trash
  const randomIndex = Math.floor(Math.random() * trashItems.length);
  const trash = trashItems[randomIndex];

  // Create the trash
  const trashElement = document.createElement("img");
  trashElement.className = 'trash-queue-item';
  trashElement.src = trash.photo_url;
  trashElement.alt = trash.category;

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
  let trash_position = Math.random() * 250;
  trash_position = trash_position <= 30 ? 30 : trash_position

  // get current trash queue
  currentTrashQueue.style.left = trash_position + "px"; // Random initial position
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
          score += 5;
        } else if (
          trash.classList.contains("inorganic") &&
          trash.offsetLeft >=
          document.getElementById("inorganic-bin").offsetLeft &&
          trash.offsetLeft <=
          document.getElementById("inorganic-bin").offsetLeft +
          document.getElementById("inorganic-bin").clientWidth
        ) {
          score += 5;
        } else {
          score -= 5;
        }

        // Update score & progress bar
        score = score < 0 ? 0 : score
        progressBar.value = (score / goal_score) * 100;
        document.getElementById("score").textContent = score;
        trash.remove();

        if (user.role == 'user') {
          if (score >= goal_score) {
            finishGame()
          }
        }

        // Update currentTrash only if it matches the removed trash
        if (currentTrash === trash) {
          currentTrash = null;
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
  document.getElementById("residue-bin").style.left = binPosition + binWidth + "px";
  document.getElementById("inorganic-bin").style.left = binPosition + binWidth * 2 + "px";
  // document.getElementById("glass-bin").style.left = binPosition + binWidth * 3 + "px";
  // document.getElementById("paper-bin").style.left = binPosition + binWidth * 4 + "px";
}

document.getElementById("organic-bin").addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
  activeBin = document.getElementById("organic-bin");
});

document.getElementById("residue-bin").addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
  activeBin = document.getElementById("residue-bin");
});

document.getElementById("inorganic-bin").addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
  activeBin = document.getElementById("inorganic-bin");
});

document.getElementById("game-container").addEventListener("touchmove", (event) => {
  event.preventDefault();
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
  startCountdown();

  const newTrash = createRandomTrash();
  addTrashToCurrentQueue(newTrash)
  fillTrashQueue()

  trashElements = [];
  score = 0;
  document.getElementById("score").textContent = score;

  const gameContainer = document.getElementById("game-container");
  const trashContainer = document.getElementById("trash-container");

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
}

function finishGame() {
  const data = {
    game_session_id,
    user_id,
    score
  }

  fetch(`${api_url}/finish-game`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then((response) => {
    response.json().then((data) => {
      if (data.success) {
        clearInterval(trashInterval);
      } else {
        console.error(data.error);
      }
    }).catch((error) => {
      console.error(error);
    })
  })
}

function getGameSessionDetail() {
  fetch(`${api_url}/user-game-sessions/${game_session_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  }).then(response => {
    response.json().then((data) => {
      if (data.success) {
        game_detail = data.data.game_session
        user_id = data.data.user_id
        game_mode = game_detail.mode
        goal_score = game_detail.goal_score
        user = data.data.user

        time = game_detail.time // in minutes
        timeInSeconds = time * 60
        initTrashesAssets();
      } else {
        console.error(data);
      }
    }).finally(() => {
      handleStatusContainer()
    })
  })
}

function initTrashesAssets() {
  fetch(`${api_url}/trash?game_mode=${game_mode}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(response => {
    response.json().then((data) => {
      if (data.success) {
        trashItems = data.data
        startGame();
      } else {
        console.error(data);
      }
    }).catch((error) => {
      console.error(error);
    })
  })
}

function handleStatusContainer() {
  if (user.role == 'user') {
    document.getElementById("time-container").style.display = "none";
  } else if (user.role == 'guest')
  document.getElementById("level-container").style.display = "none";
  document.getElementById('level-detail').textContent = game_detail.level
  document.getElementById('goals-detail').textContent = game_detail.goal_score
  // document.getElementById("level").style.display = "none";
  // document.getElementById("goals").style.display = "none";
}

function updateTimer() {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  timerDisplay.textContent = `${minutesStr}:${secondsStr}`;
}

function startCountdown() {
  const timer = setInterval(function () {
    timeInSeconds--;

    if (timeInSeconds < 0) {
      clearInterval(timer);
      timerDisplay.textContent = "00:00"; // Timer reached 0
      finishGame();
    } else {
      updateTimer();
    }
  }, 1000); // Update every 1 second
}

getGameSessionDetail();