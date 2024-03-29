let trashItems = [];

const currentURL = window.location.href;
const url = new URL(currentURL);
const searchParams = url.searchParams;
const game_session_id = searchParams.get("game_session_id");
const user_id = searchParams.get("user_id");
const game_mode = searchParams.get("game_mode");

const is_production = url.hostname != 'localhost';
const api_url = is_production ? 'https://golimbah-api.larvaacademy.id/api' : 'http://127.0.0.1:8000/api';

const trash_in_audio = new Audio('/assets/trash_in.m4a');
const soundtrack_audio = new Audio('/assets/soundtrack.m4a');

let progressBar = document.getElementById("progress");
const finishGameButton = document.getElementById('finish-game')
const timerDisplay = document.getElementById('time-detail');

let game_detail = {};
let time = 0;
let goal_score = 0;
let user = {}
let timeInSeconds = 0;
let current_time = 0;
let trashQueues = [];
let currentTrashQueue = null;
let trashElements = [];
let currentTrash = null;
let score = 0;

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
  console.log(trash.category);
  console.log(trashElement.alt);

  return trashElement;
}

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
          trash.classList.contains("residue") &&
          trash.offsetLeft >=
          document.getElementById("residue-bin").offsetLeft &&
          trash.offsetLeft <=
          document.getElementById("residue-bin").offsetLeft +
          document.getElementById("residue-bin").clientWidth
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
        } else if (
          trash.classList.contains("glass") &&
          trash.offsetLeft >=
          document.getElementById("glass-bin").offsetLeft &&
          trash.offsetLeft <=
          document.getElementById("glass-bin").offsetLeft +
          document.getElementById("glass-bin").clientWidth
        ) {
          score += 5;
        } else if (
          trash.classList.contains("paper") &&
          trash.offsetLeft >=
          document.getElementById("paper-bin").offsetLeft &&
          trash.offsetLeft <=
          document.getElementById("paper-bin").offsetLeft +
          document.getElementById("paper-bin").clientWidth
        ) {
          score += 5;
        } else {
          score -= 5;
        }

        trash_in_audio.play();

        // Update score & progress bar
        score = score < 0 ? 0 : score
        if (user.role == 'user') {
          progressBar.value = (score / goal_score) * 100
        }
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
const maxOutOfBounds = 700; // The maximum out-of-bounds value

let touchStartX = 0;
let activeBin = null;
let trashInterval;

document.getElementById("game-container").addEventListener("touchmove", (event) => {
  event.preventDefault();
});

function updateBinPosition() {
  document.getElementById("organic-bin").style.left = binPosition + "px";
  document.getElementById("residue-bin").style.left = binPosition + binWidth + "px";
  document.getElementById("inorganic-bin").style.left = binPosition + binWidth * 2 + "px";
  if (game_mode == 'hard') {
    document.getElementById("glass-bin").style.left = binPosition + binWidth * 3 + "px";
    document.getElementById("paper-bin").style.left = binPosition + binWidth * 4 + "px";
  }
}

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
  if (user.role == 'guest') {
    startCountdown();
  }

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
  clearInterval(trashInterval);

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

        // window.location.replace(`https://golimbah-web.larvaacademy.id/guest-leaderboard/${game_session_id}`);
        if (is_production) {
          if (user.role == 'guest') {
            window.location.replace(`https://golimbah-web.larvaacademy.id/guest-leaderboard/${game_session_id}`);
          } else {
            window.location.replace(`https://golimbah-web.larvaacademy.id/leaderboard`);
          }
        } else {
          if (user.role == 'guest') {
            window.location.replace(`http://127.0.0.1:5173/guest-leaderboard/${game_session_id}`);
          } else {
            window.location.replace(`http://127.0.0.1:5173/leaderboard`);
          }
        }

      } else {
        console.error(data.error);
      }
    }).catch((error) => {
      console.error(error);
    }).finally(() => {
      soundtrack_audio.pause();
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
        user = data.data.user

        if (user.role == 'user') {
          document.getElementById("time-container").style.display = "none";
          document.getElementById('level-detail').textContent = game_detail.level
          document.getElementById('goals-detail').textContent = game_detail.goal_score
          goal_score = game_detail.goal_score
        } else if (user.role == 'guest') {
          document.getElementById("level-container").style.display = "none";
          finishGameButton.style.display = 'none';
          time = game_detail.time
          timeInSeconds = time * 60
        }
        initTrashesAssets();
        initTrashBins();
      } else {
        console.error(data);
      }
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

function initTrashBins() {
  document.getElementById("glass-bin").style.display = "none";
  document.getElementById("paper-bin").style.display = "none";

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

  if (game_mode == 'hard') {
    document.getElementById("glass-bin").style.display = "block";
    document.getElementById("paper-bin").style.display = "block";

    document.getElementById("glass-bin").addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0].clientX;
      activeBin = document.getElementById("glass-bin");
    });
    document.getElementById("paper-bin").addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0].clientX;
      activeBin = document.getElementById("paper-bin");
    });
  }
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
    progressBar.value = (timeInSeconds / (time * 60)) * 100

    if (timeInSeconds < 0) {
      clearInterval(timer);
      timerDisplay.textContent = "00:00"; // Timer reached 0
      finishGame();
    } else {
      updateTimer();
    }
  }, 1000); // Update every 1 second
}

function exitGame() {
  if (is_production) {
    if (user.role == 'guest') {
      window.location.replace(`https://golimbah-web.larvaacademy.id/`);
    } else {
      window.location.replace(`https://golimbah-web.larvaacademy.id/`);
    }
  } else {
    if (user.role == 'guest') {
      window.location.replace(`http://127.0.0.1:5173/`);
    } else {
      window.location.replace(`http://127.0.0.1:5173/`);
    }
  }
}

getGameSessionDetail();
document.addEventListener('touchstart', function () {
  soundtrack_audio.play();
});

finishGameButton.onclick = () => {
  clearInterval(trashInterval);
  window.parent.postMessage("exitGame", "*");
}

window.addEventListener("message", function (event) {
  console.log(event);
  if (event.data == 'finishGame') {
    finishGame();
  }
}, false);

// import Pusher from "pusher-js";
var pusher = new Pusher("b3d4312adf3221170947", {
  cluster: "ap1",
});

var channel = pusher.subscribe("my-channel");
channel.bind("my-event", (data) => {
  if (data.message == "game-session-finished-first") {
    finishGame();
  }
});

