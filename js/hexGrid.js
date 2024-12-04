const canvas = document.getElementById("hexCanvas");

var frameCount = 0;

function fitCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function fitCanvas0() {
    canvas.width = 512;
    canvas.height = 512;
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

const ctx = canvas.getContext("2d");

// Lattice vectors
const a1 = { x: 51, y: 7 };
const a2 = { x: 14, y: 25 };

// Create and load images
const images = {
    sw: new Image(),
    lw: new Image()
};
images.sw.src = 'image/tile-ss.png';
images.lw.src = 'image/tile-l.png';

function applyBlur(sourceCtx, destCtx, blurAmount) {
    destCtx.filter = `blur(${blurAmount}px)`;
    destCtx.drawImage(sourceCtx.canvas, 0, 0);
    destCtx.filter = 'none';
}

const tileCache = new Map();

// Create a blurred version of a tile
function createBlurredTile(img, blurAmount, offset) {
    const cacheKey = `${img.src}_${blurAmount}`;
    
    if (tileCache.has(cacheKey)) {
        return tileCache.get(cacheKey);
    }

    // Create a small canvas for the individual tile
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 64 + offset * 2;
    tileCanvas.height = 64 + offset * 2;
    const tileCtx = tileCanvas.getContext('2d');

    // Draw and blur the tile
    tileCtx.filter = `blur(${blurAmount}px)`;
    tileCtx.drawImage(img, offset, offset, 64, 64);
    tileCtx.filter = 'none';

    // Create an image from the canvas
    const blurredTile = new Image();
    blurredTile.src = tileCanvas.toDataURL();

    // Cache the blurred tile
    tileCache.set(cacheKey, blurredTile);
    
    return blurredTile;
}

function inBounds(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function distanceFromRect(x, y, rect) {
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    return Math.sqrt(dx * dx + dy * dy);
}

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function hashFromPosition(x, y) {
    return Math.abs(hashCode(`${x/32},${y/32}`) % 0x7FF)/0x7FF;
}

function solveLinear(offsetx, offsety, v1, v2, determinant) {
    const n = (-offsetx * v2.y + offsety * v2.x) / determinant;
    const m = (-offsety * v1.x + offsetx * v1.y) / determinant;

    return [ n, m ];
}

function calcGridSize(center, windowRect, v1, v2) {
    // This involves the following equation:
    // 0 = offsetX + n * a1.x + m * a2.x;
    // 0 = offsetY + n * a1.y + m * a2.y;
    // and solving for n and m.
    const determinant = v1.x * v2.y - v1.y * v2.x;

    if (Math.abs(determinant) < 1e-6) {
        throw new Error('Invalid lattice vectors');
    }

    // Find coordinates of corners (in integer grid units).
    const [ n_lt, m_lt ] = solveLinear(windowRect.left - center.x,  windowRect.top - center.y,    v1, v2, determinant);
    const [ n_rb, m_rb ] = solveLinear(windowRect.right - center.x, windowRect.bottom - center.y, v1, v2, determinant);
    const [ n_rt, m_rt ] = solveLinear(windowRect.right - center.x, windowRect.top - center.y,    v1, v2, determinant);
    const [ n_lb, m_lb ] = solveLinear(windowRect.left - center.x,  windowRect.bottom - center.y, v1, v2, determinant);

    // Find the maximum values of n and m
    const n = Math.ceil(Math.max(Math.abs(n_lt), Math.abs(n_rb), Math.abs(n_rt), Math.abs(n_lb)));
    const m = Math.ceil(Math.max(Math.abs(m_lt), Math.abs(m_rb), Math.abs(m_rt), Math.abs(m_lb)));

    return { n, m };
}

function createGrid(frameCount, center, windowRect, excludeRect) {
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;

    function generateNoise(x, y, scale = 0.1) {
        const X = x * scale;
        const Y = y * scale;
        return Math.sin(X) * Math.cos(Y) +
            Math.sin(X * 0.7) * Math.cos(Y * 1.3) +
            Math.sin(X * 1.3) * Math.cos(Y * 0.7);
    }

    // Calculate grid positions
    const positions = [];

    const gridSize = calcGridSize(center, windowRect, a1, a2);

    for (let n = -gridSize.n; n <= gridSize.n; n++) {
        for (let m = -gridSize.m; m <= gridSize.m; m++) {
            const x = center.x + n * a1.x + m * a2.x;
            const y = center.y + n * a1.y + m * a2.y;

            const dx = x - center.x;
            const dy = y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 32*frameCount){
                continue;
            }

            //const probabilityMod = 0.6 - Math.sin(frameCount / 100) * 0.5;
            const probability = Math.exp(-Math.pow(distance, 1) / (maxRadius * 0.9));

            // reduce probability when near rect 
            const dist = distanceFromRect(x, y, excludeRect);
            const excludeRectSize = 0.5 * Math.min(excludeRect.width, excludeRect.height);
            const normdDist = dist < excludeRectSize ? dist / excludeRectSize : 1.0;

            //console.log(hashFromPosition(n, m), normdDist, probability);

            if(x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
                if ((hashFromPosition(n, m) < (normdDist * probability))) {
                    const noise = generateNoise(x, y + frameCount);
                    //const noise = generateNoise(x, y);
                    const tileType = noise > 0 ? 'sw' : 'lw';

                    positions.push({
                        x,
                        y,
                        type: tileType,
                        // Calculate blur based on y-distance from center
                        blur: (y - center.y) / (canvas.height * 0.25)
                    });
                }
            }
        }
    }

    const blurTop = -center.y / (canvas.height * 0.25);
    const blurBottom = (canvas.height - center.y) / (canvas.height * 0.25);
    const maxBlur = Math.max(Math.abs(blurTop), Math.abs(blurBottom));

    return [positions, maxBlur];
}

function scaleRect(rect, scale) {
    return {
        left: rect.left * scale,
        right: rect.right * scale,
        top: rect.top * scale,
        bottom: rect.bottom * scale,
        width: rect.width * scale,
        height: rect.height * scale
    };
}

function getExcludeSection(){
    // determine which of heroSection or contactForm are visible (not hidden)
    const heroSection = document.getElementById('heroSection');
    const contactForm = document.getElementById('contactSection');

    if (heroSection.classList.contains('hidden')){
        return contactForm;
    } else {
        return heroSection;
    }
}

function drawTiles() {
    // Get 'avoid' region 
    const excludeElement = getExcludeSection();
    const heroRect = excludeElement.getBoundingClientRect();

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const scaleFactor = isMobile ? 0.5 : 1.0;

    const center = {
        x: (canvas.width / 2)/scaleFactor,
        y: (canvas.height / 2)/scaleFactor
    };

    const windowRect = {
        left: 0,
        right: canvas.width,
        top: 0,
        bottom: canvas.height,
        width: canvas.width,
        height: canvas.height
    };

    [positions, maxBlur] = createGrid(frameCount, center, scaleRect(windowRect, 1/scaleFactor), scaleRect(heroRect, 1/scaleFactor));
      
    positions.sort((a, b) => a.y - b.y);

    // Group positions by blur level (rounded to nearest 0.5)
    const blurGroups = new Map();
    positions.forEach(pos => {
        const blurLevel = (Math.round(pos.blur * 4) / 4).clamp(-2.0, 2.0); // Round to nearest 0.25 and clamp to -2.0 to 2.0
        if (!blurGroups.has(blurLevel)) {
            blurGroups.set(blurLevel, []);
        }
        blurGroups.get(blurLevel).push(pos);
    });


    // set offset to maximum blur level in blurGroups
    const offset = maxBlur * 6;

    // clear canvas 
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tiles by blur group
    Array.from(blurGroups.entries())
        .sort(([blurA], [blurB]) => blurA - blurB)
        .forEach(([blur, groupPositions]) => {
            groupPositions.sort((a, b) => a.y - b.y);

            const img_sw2 = createBlurredTile(images.sw, Math.abs(blur * 3), offset);
            const img_sl2 = createBlurredTile(images.lw, Math.abs(blur * 3), offset);

            // Draw all tiles for this blur level to temp canvas
            groupPositions.forEach(pos => {
                const img = images[pos.type];
                const img2 = pos.type === 'sw' ? img_sw2 : img_sl2;

                px = (pos.x - img.width / 2) * scaleFactor;
                py = (pos.y - img.height / 2) * scaleFactor;
                size_x = (64 + 2*offset) * scaleFactor;
                size_y = (64 + 2*offset) * scaleFactor;
                
                ctx.drawImage(img2, px, py, size_x, size_y);
            });
        });
}

function drawTileAnimation() {
    drawTiles();
    frameCount++;

    if (frameCount < 100) {
        setTimeout(() => requestAnimationFrame(drawTileAnimation), 25);
    } else {
        setTimeout(() => requestAnimationFrame(drawTileAnimation), 2000);

    }
}

Promise.all([
    new Promise(resolve => images.sw.onload = resolve),
    new Promise(resolve => images.lw.onload = resolve)
]).then(() => {
    drawTileAnimation();
});

window.onresize = drawTiles;