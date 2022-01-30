// @ts-check

function smallScreen(width, height) {
    if (width.matches || height.matches) { // If media query matches
      alert("Browser window is too small to properly enjoy the game.")
    }
}

let width = window.matchMedia("(max-width: 1366px)");
let height = window.matchMedia("(max-height: 768px)");
width.addEventListener("change", (event) => smallScreen(event, height));
height.addEventListener("change", (event) => smallScreen(width, event));

smallScreen(width, height);

// Open the overlay
function openOverlay() {
  document.getElementById("youtube").setAttribute("src", "https://www.youtube.com/embed/ylZBRUJi3UQ?autoplay=1&showinfo=0&controls=0");
  document.getElementById("overlay").style.display = "flex";
}

// Close the overlay
function closeOverlay() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("youtube").setAttribute("src", "");
}

document.getElementById("rules").addEventListener("click", openOverlay);
document.getElementById("overlay").addEventListener("click", closeOverlay);