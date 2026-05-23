// Set up intro dialog element
const introDialog = document.getElementById("intro-dialog");
const dialogCloseButton = document.querySelector(".dialog-close-button");
const instructionButton = document.getElementById("instruction");
const settingsButton = document.getElementById("settings");
const instructionPanel = document.getElementById("instruction-panel");
const settingsPanel = document.getElementById("settings-panel");

const helpButton = document.getElementById("help-button");
helpButton.addEventListener("click", function() {
    paused = true;
    introDialog.showModal();
})

// Set up canvas element and 2D drawing context
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const shapeToggle = document.getElementById("shape-toggle");
let randomShapeMode = false;

shapeToggle.addEventListener("click", () => {
    randomShapeMode = !randomShapeMode;
    shapeToggle.classList.toggle("active");
    if (randomShapeMode) {
        shapeToggle.textContent = "ON";
    }else{
        shapeToggle.textContent = "OFF";
    }
})

// show modal on page load
introDialog.showModal();

dialogCloseButton.addEventListener("click", () => {
    paused = false;
    introDialog.close();
});

instructionButton.addEventListener("click", () => {
    instructionButton.classList.add("active-tab");
    settingsButton.classList.remove("active-tab");
    instructionPanel.classList.remove("hidden");
    settingsPanel.classList.add("hidden");
})

settingsButton.addEventListener("click", () => {
    settingsButton.classList.add("active-tab");
    instructionButton.classList.remove("active-tab");
    settingsPanel.classList.remove("hidden");
    instructionPanel.classList.add("hidden");
})


// Arrays to store rings and particles
let rings = [];
let particles = [];

// State to track whether the user is currently holding mouse. And due to user just land in the page, they don't have
// any actual movement yet, so the state is false.
let inhaling = false;
let  paused = false;

// Store current mouse cursor position
let mouseX = 0;
let mouseY = 0;

// I want to control the speed of generating new rings, so set up a timer.
let ringTimer = 0;
// Used for independent control, give each set of particles a batch.
let currentBatch = 0;

// Ring class definition
// position, radius, state (expanding)
class Ring{
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.growing = true;
        this.randomOffsets = [];
        for (let i = 0; i < 140; i++) {
            let offset =
                Math.sin(i * 0.34) * 7 +
                Math.sin(i * 0.12) * 6 +
                (Math.random() * 2 - 1);

            this.randomOffsets.push(offset);
        }
    }
// expanding, update ring size
    update(){

        let growthSpeed = 1.5;

        if(randomShapeMode){
            growthSpeed = 1.2;
        }

        if(this.growing){
            this.radius += growthSpeed;
        }
    }
// Draw ring on canvas
    draw(){
        ctx.beginPath();
        for (let i = 0; i<= this.randomOffsets.length; i++){
            let angle = (i / this.randomOffsets.length) * Math.PI * 2;
            let radius = this.radius;
            if(randomShapeMode){
                radius += this.randomOffsets[i % this.randomOffsets.length];
            }
            let x = this.x + Math.cos(angle) * radius;
            let y = this.y + Math.sin(angle) * radius;
            if(i === 0){
                ctx.moveTo(x, y);
            }else{
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        // Simple stroke keeps visual minimal and focuses on motion rather than detail
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Mouse Interaction
// Track mouse movement, and this is the center point for rings.
canvas.addEventListener("mousemove", e=>{
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// When user press mouse, they start to inhale.
canvas.addEventListener("mousedown", ()=>{
    inhaling = true;
});

// When user release mouse, they stop inhaling, and convert rings into particles.
canvas.addEventListener("mouseup", ()=>{
    inhaling = false;
// Stop expanding rings
    rings.forEach(r=>{
        r.growing = false;
    });

// Create a new batch ID for this release
    currentBatch++;

// Convert each ring into particles
// This part was so tricky for me, so I have to seek help from ChatGPT. I asked it to give me some ways to solve
// this part, and asked it to explain the ways it gave me.
    rings.forEach(r=>{
        for(let angle = 0; angle < Math.PI*2; angle += 0.2) {
            let radius = r.radius;
            let index = Math.floor(
                angle / (Math.PI * 2) * r.randomOffsets.length
            );
            if (randomShapeMode) {
                radius += r.randomOffsets[index];
            }
            let x = r.x + Math.cos(angle) * radius;
            let y = r.y + Math.sin(angle) * radius;

            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 0.3,
                vy: Math.sin(angle) * 0.3,
                moving: true,
                batch: currentBatch,
                locked: false,
            });
        }
    });
// Clear rings after converting, prepare for next one set of rings
    rings = [];
});

// Keyboard controls
window.addEventListener("keydown", (e)=>{

// Press "R" to clean the canvas
    if(e.key === "r" || e.key === "R"){
        rings = [];
        particles = [];
        currentBatch = 0;
        ctx.clearRect(0,0,canvas.width,canvas.height);
    }

// Press "SPACE" to pause movement of current batch only (lock), and press it again for continuing movement (unlock)
    if(e.code === "Space"){
        particles.forEach(p=>{
            if(p.batch === currentBatch && !p.locked){
                p.moving = !p.moving;
            }
        });
    }

// Press "Q" to permanently freeze all particles movement
    if(e.key === "q" || e.key === "Q"){
        particles.forEach(p=>{
            p.moving = false;
            p.locked = true;
        });
    }

// Press "TAB" to pause everything and reopen intro dialog
    if(e.key === "Tab"){
        e.preventDefault();

        paused = !paused;

        if(paused){
            introDialog.showModal();
        }else{
            introDialog.close();
        }
    }

});

function animate(){

// Clear canvas every frame
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(inhaling && !paused){
        ringTimer++;
        // Create a new ring every 15 frames
        // Instead of creating a ring every frame, or it would be too fast and overwhelming,
        // this allows rings to appear at a consistent interval, creating a breathing-like visual pacing.
        if(ringTimer % 45 === 0){
            rings.push(new Ring(mouseX,mouseY));
        }
    }
// Update and Draw rings and particles
    rings.forEach(r=>{
        if(!paused){
            r.update();
        }
        r.draw();
    });

    particles.forEach(p=>{

// Move particle if it's allowed
        if(p.moving && !p.locked && !paused){
            p.x += p.vx;
            p.y += p.vy;
        }
// Draw particles as small dot
        ctx.beginPath();
        ctx.arc(p.x,p.y,2,0,Math.PI*2);
        ctx.fillStyle = "white";
        ctx.fill();
    });
// Loop animation
    requestAnimationFrame(animate);
}

// Start animation loop
animate();

// When I tested my tool, I found out the size of the web page wouldn't change if I resize the browser.
// To make canvas always fill the screen when user resize their browser
function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize canvas size
resizeCanvas();
// Add an eventListener
window.addEventListener("resize", resizeCanvas);

// At first, I didn't implement batches, and some parts of the code were written incorrectly, which caused this feature
// to fail in certain situations.
// I added a freeze all motion by pressing "Q" so that users can still pause the scene even if they miss the timing to
// pause.

// I used ChatGPT to debug the pressing "SPACE" to pause movement part.


