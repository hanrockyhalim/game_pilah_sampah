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
  trashElement.src = "/assets/" + trash.name.toLowerCase().replace(" ", "_") + ".png";
  trashElement.alt = trash.name;
  trashElement.className = "trash " + trash.type;
  trashElement.style.left = Math.random() * 250 + "px"; // Random initial position
  trashElement.style.objectFit = "contain";
  trashElement.style.background = "none";

  return trashElement;
}

let trashElements = [];
let currentTrash = null;
let score = 0;

function createTrashElement() {
  const newTrash = createRandomTrash();
  trashElements.push(newTrash);
  document.getElementById("trash-container").appendChild(newTrash);
  currentTrash = newTrash;
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
      }
    });
  }, 10);
}

let binPosition = 0; // Initial position of the bins
const binWidth = document.getElementById("organic-bin").clientWidth;
const gameContainerWidth = document.getElementById("game-container").clientWidth - 250;
const scrollSensitivity = 5; // Adjust this value to control scroll sensitivity
const maxOutOfBounds = 300; // The maximum out-of-bounds value

function updateBinPosition() {
  document.getElementById("organic-bin").style.left = binPosition + "px";
  document.getElementById("metal-bin").style.left = binPosition + binWidth + "px";
  document.getElementById("non-organic-bin").style.left = binPosition + binWidth * 2 + "px";
}

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

  let trashInterval; // Declare trashInterval using 'let' instead of 'const'
  trashInterval = setInterval(() => {
    moveTrash();
  }, 3000); // Make the trash fall every 3 seconds

  // Pause button functionality
  let isPaused = false;
  document.getElementById("pauseButton").addEventListener("click", () => {
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
  });
}

document.getElementById("startButton").addEventListener("click", startGame);
