/* Creating var by getting elements of button by its id */
var audio = document.getElementById("bgMusic");
var mscImage = document.getElementById("mscImage");
var mscBtn = document.getElementById("mscBtn");
var audioState = localStorage.getItem("audioState");

/*Checks and control audio/image*/
function togglePlayPause() {
  if (audio.paused) {
    audio.play();
    /*Change display image of button depending on state*/
    mscImage.src = "musicOn.jpg";
    /*Use local storage to store audioState of browser 
    and assigns val for audioState */
    localStorage.setItem("audioState", "playing");
  } else {
    audio.pause();
    mscImage.src = "musicOff.jpg";
    localStorage.setItem("audioState", "paused");
  }
}

/*Retains audio from previous page by checking
value of var audioState*/
if (audioState === "playing") {
  audio.play();
  mscImage.src = "musicOn.jpg";
} else if (audioState === "paused") {
  audio.pause();
  mscImage.src = "musicOff.jpg";
}
