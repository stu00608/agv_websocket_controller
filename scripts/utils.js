function roundOf(num, pos) {
    let power = 10 ** pos
    return Math.round(num * power) / power
}