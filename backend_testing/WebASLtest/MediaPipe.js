// getting elements from html and setting values of width and height for video and canvas
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const img = document.getElementById('img');
const pop = document.getElementById('popupForm');

// setting video input to not be displayed so only canvas appears onscreen
videoElement.style.display = "none";

//setting elements width and height 
videoElement.width = 500;
videoElement.height = 375;
canvasElement.width = 500;
canvasElement.height = 375;

/*  arrays for later use
    sequence: will hold the landmarks detected from the webcam using mediapipe hands detection, 
    holds the last 30 frames of landmarks each frame holds 63 landmark values
    completed: will hold the letters the user has completed correctly
    letters: holds the letters of the alphabet */
const sequence = [];
const completed = [];
const letters = ['A', 'B', 'C'];

//console.log(document.URL.includes("levelTwo"));

// loading of pre trained model into js using tensorflowjs converter
const MODEL_URL = '../backend_testing/WebASLtest/model_folder/model.json'; //location of model
const model = await tf.loadLayersModel(MODEL_URL); // loading of model

// load random letter image to start teaching user
const img_src = "../front-end/alphabet/"; // location path of letter images
let im = ""; // stores the letter to be used with .jpg attached (ex. "B.jpg")
im = letters[randomIntFromInterval(0,2)] + ".jpg" // randomly choose letter from the alphabet and attach .jpg
img.src = img_src + im; // combine path and desired letter image to create the full path for later use (ex. "../front-end/alphabet/B.jpg")

// get random number between a min and max 
function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// when a detection by mediapipe is made begin drawing onto canvas and begin sign language detection
function onResults(results) {
  // setup canvas to have the landmarks be drawn onto it
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, videoElement.width, videoElement.height);
  
  // if statement to make sure that there is a detection being made so as to not pass null values
  if (results.multiHandLandmarks) {
    // for every landmark being detected perform sign language detection and draw landmarks after 
    for (const landmarks of results.multiHandLandmarks) {
      // actual drawing of landmarks and their connectors
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
        {color: '#6CEDFC', lineWidth: 5});
      drawLandmarks(canvasCtx, landmarks, {color: '#FCA139', lineWidth: 1.5});

      // push the coordinates of landmarks to sequence
      sequence.push(keypoints(landmarks));
      // if sequence has reached a length of thirty detect the sign language from those keypoints collected
      if(sequence.slice(-30).length == 30){
        const input = tf.tensor(sequence.slice(-30)); // input holds sequence after being converted to a tensor object
        const temp = tf.expandDims(input, 0); // in order to be used by the model the shape of input must be adjusted from 30x63 to 1x30x63
        const res = model.predict(temp); // predict the the value of input using model and store in res

        // using the value of res get a letter and if it matches the first character in im and the user hasn't already completed this letter then proceed
        if(letters[findMax(res)] == im.substring(0,1) && completed.includes(im.substring(0,1)) == false){
          // obtain a new letter image path 
          im = letters[randomIntFromInterval(0,2)] + ".jpg"
          img.src = img_src + im;
          // add letter into the completed array
          completed.push(letters[findMax(res)]);
        }
        // else if the user has completed this letter and they haven't completed all letters yet then generate new letter image
        else if(completed.includes(im.substring(0,1)) == true && completed.length != letters.length){
          // while the first character of im is in completed keep generating a new letter
          while(completed.includes(im.substring(0,1)) == true){
            im = letters[randomIntFromInterval(0,2)] + ".jpg";
          }
          img.src = img_src + im;
        }
        // else if the user has completed all letters in this level then display pop up to continue
        else if (completed.length == letters.length){
          pop.style.display = 'block';
        }
      }
    }
  }
  canvasCtx.restore();
}

// grab keypoints from the mediapie landmarks, keypoints are the x, y, and z coordinates of the landmarks returns an array
function keypoints(landmarks){
  const temp = []; // holds the values to be returned

  // for each landmark push their x, y, and z values to temp array
  for (const res in landmarks) {
    temp.push(landmarks[res].x, landmarks[res].y, landmarks[res].z)
  }

  // returns an array with 63 values
  return temp;
}

// find the maximum number and it's index within an array 
function findMax(res){
  const temp = res.dataSync(); // sync the passed value to be an array
  let max = 0;
  let index = 0;
  for (const i in temp){
    if (temp[i] > max){
      max = temp[i];
      index = i;
    }
  }
  // return index of maximum number in the array
  return index;
}

// initialize the hands tracking from mediapipe
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
// settings for hands to detect two hands at a time with 50 percent as a minimum for it's confidence in tracking and detection
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

// initialize webcam recording and send each frame to the hands tracking 
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  }
});
camera.start();
