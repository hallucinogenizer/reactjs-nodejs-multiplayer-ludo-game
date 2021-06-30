function step(color, ox, oy, steps) {
    const transform = ([ox, oy]) => ({
        'blue': [+ox, +oy],
        'green': [-ox, -oy],
        'red': [-oy, +ox],
        'yellow': [+oy, -ox]
    }[color])
    const path = ['-7,-7', '-1,-6', '-1,-5', '-1,-4', '-1,-3', '-1,-2', '-2,-1', '-3,-1', '-4,-1', '-5,-1', '-6,-1', '-7,-1', '-7,0', '-7,1', '-6,1', '-5,1', '-4,1', '-3,1', '-2,1', '-1,2', '-1,3', '-1,4', '-1,5', '-1,6', '-1,7', '0,7', '1,7', '1,6', '1,5', '1,4', '1,3', '1,2', '2,1', '3,1', '4,1', '5,1', '6,1', '7,1', '7,0', '7,-1', '6,-1', '5,-1', '4,-1', '3,-1', '2,-1', '1,-2', '1,-3', '1,-4', '1,-5', '1,-6', '1,-7', '0,-7', '0,-6', '0,-5', '0,-4', '0,-3', '0,-2', '0,-1']

    const [x, y] = transform(transform(transform(path[path.indexOf(transform([ox - 7, oy - 7]).join(',')) + steps].split(','))))
    return [x + 7, y + 7]
}

module.exports = step