const ball = document.getElementById('ball');
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;
let z = 0;
let r = 0;
let dx = 0;
let dy = 0;
let dz = 0;
let dr = 0;
let frameCount = 0;
let currentBlurLevel = 0;

// Parameters for the random walk
const stepSize = 5;
const stepSizeAngle = 3;
const inertia = 0.8; // How much previous velocity affects next step
const randomness = 0.4; // How much random movement to add
const zRange = 500;
const maxBlur = 8;
const blurUpdateInterval = 8;
const blurLevels = ['blur-0', 'blur-1', 'blur-2', 'blur-3', 'blur-4'];

function updatePosition() {
    frameCount++;

    // Add random movement while preserving some of the previous direction
    dx = dx * inertia + (Math.random() - 0.5) * randomness * stepSize;
    dy = dy * inertia + (Math.random() - 0.5) * randomness * stepSize;
    dz = dz * inertia + (Math.random() - 0.5) * randomness * stepSize;

    // Add random rotation
    dr = dr * inertia + (Math.random() - 0.5) * randomness * stepSizeAngle;

    // Update position
    x += dx;
    y += dy;
    z += dz;

    // Update rotation
    r += dr;

    // Bounce off walls with some energy loss
    if (x < 0 || x > window.innerWidth - 50) {
        dx *= -0.8;
        x = x < 0 ? 0 : window.innerWidth - 50;
    }
    if (y < 0 || y > window.innerHeight - 50) {
        dy *= -0.8;
        y = y < 0 ? 0 : window.innerHeight - 50;
    }
    if (z < -zRange || z > zRange) {
        dz *= -0.8;
        z = z < -zRange ? -zRange : zRange;
    }

    r = r % 360;

    // Apply the new position
    ball.style.transform = `translate(${x}px, ${y}px)`;

    // rotate randomly as well
    ball.style.transform += ` rotate(${r}deg)`;

    if (frameCount > blurUpdateInterval) {
        frameCount = 0;

        // Calculate blur based on distance from z center
        const blurAmount = (Math.abs(z) / zRange) * maxBlur;
        ball.style.filter = `blur(${blurAmount}px)`;

        // const zPercent = Math.abs(z) / zRange;
        // const newBlurLevel = Math.min(Math.floor(zPercent * blurLevels.length), blurLevels.length - 1);

        // if (newBlurLevel !== currentBlurLevel) {
        //     ball.classList.remove(blurLevels[currentBlurLevel]);
        //     ball.classList.add(blurLevels[newBlurLevel]);
        //     currentBlurLevel = newBlurLevel;
        // }
    }

    requestAnimationFrame(updatePosition);
}

// Update at 60fps
//setInterval(updatePosition, 1000/60);
requestAnimationFrame(updatePosition);