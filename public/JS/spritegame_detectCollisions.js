/**
 * Checks intersection between two html elements
 * @param {HTMLElement} div1 - Reference to first html element (PLAYER)
 * @param {HTMLElement} div2 - Reference to second html element (ITEM)
 * @param {number} tolerance - Integer to change accuracy of collission (0: default, negative number: detect later, positive number: detect earlier) 
 * @returns {boolean} - true or false depending on collision
 */
function isColliding(div1, div2, tolerance = 0) {

    let d1OffsetTop = div1.offsetTop;
    let d1OffsetLeft = div1.offsetLeft; 
    let d1Height = div1.clientHeight;
    let d1Width = div1.clientWidth;
    let d1Top = d1OffsetTop + d1Height;
    let d1Left = d1OffsetLeft + d1Width;

    let d2OffsetTop = div2.offsetTop;
    let d2OffsetLeft = div2.offsetLeft; 
    let d2Height = div2.clientHeight;
    let d2Width = div2.clientWidth;
    let d2Top = d2OffsetTop + d2Height;
    let d2Left = d2OffsetLeft + d2Width;

    let distanceTop = d2OffsetTop - d1Top;
    let distanceBottom = d1OffsetTop - d2Top;
    let distanceLeft = d2OffsetLeft - d1Left;
    let distanceRight = d1OffsetLeft - d2Left;

    return !(tolerance < distanceTop || tolerance < distanceBottom || tolerance < distanceLeft || tolerance < distanceRight);
};

