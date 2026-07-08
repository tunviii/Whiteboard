export function drawLine(
    ctx,
    x0,
    y0,
    x1,
    y1,
    color = "#000000",
    size = 4
) {
    ctx.beginPath();

    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);

    ctx.stroke();

    ctx.closePath();
}