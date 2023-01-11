function roundOf(num, pos) {
    let power = 10 ** pos
    return Math.round(num * power) / power
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}