const http = require(`http`)
const WebSocket = require(`ws`)
const step = require(`./step`)

const server = http.createServer((req, res) => {
    if (req.url == '') {
        res.end()
    }
})

const diceRoll = () => {
    return Math.floor(Math.random() * 6) + 1
}

const iskilled = (ox, oy) => (ox - 7) * (ox - 7) + (oy - 7) * (oy - 7) == 98

//this function returns true if user is in its final home lane and if its previous roll does not result in a win
function isInFinalLane(message, prevDiceRoll) {
    if (message.color == 'blue' && message.coordinates[0] == 7 && message.coordinates[1] > 0 && message.coordinates[1] < 7 && prevDiceRoll > (6 - message.coordinates[1])) {
        return true
    } else if (message.color == 'red' && message.coordinates[1] == 7 && message.coordinates[0] > 0 && message.coordinates[0] < 7 && prevDiceRoll > (6 - message.coordinates[0])) {
        return true
    } else if (message.color == 'green' && message.coordinates[0] == 7 && message.coordinates[1] > 8 && message.coordinates[1] < 14 && prevDiceRoll > (6 - message.coordinates[1])) {
        return true
    } else if (message.color == 'yellow' && message.coordinates[1] == 7 && message.coordinates[0] > 8 && message.coordinates[0] < 14 && prevDiceRoll > (6 - message.coordinates[0])) {
        return true
    }
    return false
}

function isSafeSpot(coordinates) {
    safeSpots = [
        [6, 1],
        [8, 2],
        [2, 6],
        [1, 8],
        [6, 12],
        [8, 13],
        [13, 6],
        [12, 8]
    ]

    let isEqual = false
    safeSpots.forEach(safeSpot => {
        if (safeSpot[0] == coordinates[0] && safeSpot[1] == coordinates[1]) {
            isEqual = true
        }
    })
    return isEqual
}

server.listen(8000)

//this is port 8080, not 8000
wss = new WebSocket.Server({ port: 8080 })
let availableColors = ['blue', 'red', 'green', 'yellow']
let turns = []
let prevDiceRolls = {
    'blue': 0,
    'red': 0,
    'green': 0,
    'yellow': 0
}
let gameOver = 'no'

//sending initial state
let state = [
    [
        ['blue', 'blue', 'blue', 'blue'],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        ['red', 'red', 'red', 'red']
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ],
    [
        ['yellow', 'yellow', 'yellow', 'yellow'],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        ['green', 'green', 'green', 'green']
    ]
]


wss.on('connection', ws => {
    console.log("Web Socket established")

    //assign colors
    const current_user_color = availableColors.pop()
    turns.push(current_user_color)
    ws.send(JSON.stringify({ 'type': 'color', 'value': current_user_color }))
    console.log("Initial tate sent. Colors Remaining:", availableColors)

    prevDiceRolls[current_user_color] = diceRoll()
    ws.send(JSON.stringify({ 'type': 'dice', 'value': prevDiceRolls[current_user_color] }))
    ws.send(JSON.stringify({ 'type': 'message', 'value': "waiting for more players" }))

    //once all 4 players have joined
    if (availableColors.length == 0) {
        wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    //send initial board state to all of them
                    client.send(JSON.stringify({ 'type': 'state', 'state': state }))
                        //tell everyone whose turn it is
                    client.send(JSON.stringify({ 'type': 'message', 'value': "it's " + current_user_color + "'s turn" }))
                }
            })
            //and send dice value to the one whose turn it is
    }

    ws.on('message', message => {
        message = JSON.parse(message)
        if (message.type == 'move') {
            if (message.color != turns[3]) { //if it is not this user's turn
                ws.send(JSON.stringify({ 'type': 'message', 'value': "it's not your turn!" }))
            } else if (gameOver != 'no') {
                ws.send(JSON.stringify({ 'type': 'message', 'value': "The game is over. " + gameOver + " has won." }))
            } else {
                if (iskilled(message.coordinates[0], message.coordinates[1]) && prevDiceRolls[turns[3]] == 6) {
                    const newpos = step(message.color, message.coordinates[0], message.coordinates[1], 1)
                        // console.log("coordinates:", message.coordinates, "newpos:", newpos, "prevDiceRoll:", prevDiceRolls[turns[3]])

                    //removing sprite from state
                    //pos is the current position of this sprite in the cell of the 2D array, because that one cell may have many sprites in it
                    const pos = state[message.coordinates[0]][message.coordinates[1]].indexOf(message.color)

                    //we remove the specific sprite from the specific cell. It gets stored in deletedSprite so that we can insert it in its new cell
                    const deletedSprite = state[message.coordinates[0]][message.coordinates[1]].splice(pos, 1)


                    state[newpos[0]][newpos[1]].push(deletedSprite[0])
                        //send updated state back to client
                        //type indicates the type of this message
                    ws.send(JSON.stringify({ 'type': 'state', 'state': state }))
                    prevDiceRolls[turns[3]] = diceRoll()
                    ws.send(JSON.stringify({ 'type': 'dice', 'value': prevDiceRolls[turns[3]] }))
                } else if (iskilled(message.coordinates[0], message.coordinates[1]) && prevDiceRolls[turns[3]] < 6) {
                    prevDiceRolls[turns[3]] = diceRoll()
                    ws.send(JSON.stringify({ 'type': 'dice', 'value': prevDiceRolls[turns[3]] }))
                } else if (!iskilled(message.coordinates[0], message.coordinates[1])) {
                    if (isInFinalLane(message, prevDiceRolls[turns[3]])) {
                        prevDiceRolls[turns[3]] = diceRoll()
                        ws.send(JSON.stringify({ 'type': 'dice', 'value': prevDiceRolls[turns[3]] }))
                    } else {
                        const newpos = step(message.color, message.coordinates[0], message.coordinates[1], prevDiceRolls[turns[3]])
                        console.log("coordinates:", message.coordinates, "newpos:", newpos, "prevDiceRoll:", prevDiceRolls[turns[3]])

                        //removing sprite from state
                        //pos is the current position of this sprite in the cell of the 2D array, because that one cell may have many sprites in it
                        const pos = state[message.coordinates[0]][message.coordinates[1]].indexOf(message.color)

                        //we remove the specific sprite from the specific cell. It gets stored in deletedSprite so that we can insert it in its new cell
                        const deletedSprite = state[message.coordinates[0]][message.coordinates[1]].splice(pos, 1)

                        //before pushing sprite to new cell, let's make sure there's no one already in this cell. Because if there were someone already here, we would have to kill them if they have a different color
                        if (!isSafeSpot(newpos) && state[newpos[0]][newpos[1]].length != 0) {
                            console.log('here')
                            let isThereSomeoneToKill = false
                            let indexesOfSpritesToKill = []
                            state[newpos[0]][newpos[1]].forEach((sprite, index) => {
                                if (sprite != turns[3]) {
                                    isThereSomeoneToKill = true
                                    indexesOfSpritesToKill.push(index)
                                }
                            })
                            if (isThereSomeoneToKill) {
                                indexesOfSpritesToKill.forEach((index) => {
                                    //remove killed sprite from current cell
                                    const killedSprite = state[newpos[0]][newpos[1]].splice(index, 1)

                                    //and move them to their home cell as dead sprite
                                    if (killedSprite == 'blue') {
                                        state[0][0].push('blue')
                                    } else if (killedSprite == 'red') {
                                        state[0][14].push('red')
                                    } else if (killedSprite == 'green') {
                                        state[14][14].push('green')
                                    } else if (killedSprite == 'yellow') {
                                        state[14][0].push('yellow')
                                    }
                                })
                            }
                        }
                        //pushed deletedSprite to its new cell in any case (whether we kill someone or not)
                        state[newpos[0]][newpos[1]].push(deletedSprite[0])

                        //send updated state back to client
                        //type indicates the type of this message
                        ws.send(JSON.stringify({ 'type': 'state', 'state': state }))
                        prevDiceRolls[turns[3]] = diceRoll()
                        ws.send(JSON.stringify({ 'type': 'dice', 'value': prevDiceRolls[turns[3]] }))
                    }
                }
                //now that this player has taken his turn, I am changing the turn to another player
                turns = [turns.pop()].concat(turns)
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        //send initial board state to all of them
                        client.send(JSON.stringify({ 'type': 'state', 'state': state }))
                            //tell everyone whose turn it is
                        client.send(JSON.stringify({ 'type': 'message', 'value': "it's " + turns[3] + "'s turn" }))
                    }
                })

                //checking if someone has won
                let whoWon = 'no one';
                if (state[7][6].length == 4) {
                    whoWon = 'blue'
                } else if (state[7][8].length == 4) {
                    whoWon = 'green'
                } else if (state[8][7].length == 4) {
                    whoWon = 'yellow'
                } else if (state[6][7].length == 4) {
                    whoWon = 'red'
                }

                if (whoWon != 'no one') {
                    gameOver = whoWon
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            //tell everyone whose won
                            client.send(JSON.stringify({ 'type': 'message', 'value': whoWon + " has won the game!" }))
                        }
                    })
                }
            }
        }
    })
})