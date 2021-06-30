import './App.css';
import {useState} from 'react'

const ws = new WebSocket("ws://localhost:8080")

const spriteClicked = (message) => {
    ws.send(message)
  }
  
  function getString(pre,post) {
    return pre+post.toString();
  }
  
  function generateForteen(boardState, colorValue, start) {
    if(boardState.length===0) {
      return <div></div>;
    }
    //the purpose of start is unique key generation
    let list = []
    const row = boardState[start]
    for(let i=0;i<15;i++) {
      if(row[i].length===0) {
        //if there are no sprites in this cell
        list.push(<div className={`cell${getString(start.toString(),i)}`} key={start+i}></div>)
      } 
      else {
        //if there are sprites in this cell
        let minilist = []
        //we will store the sprite divs in this minilist
        for(let j=0;j<row[i].length;j++) {
          if (row[i][j]==colorValue) {
            minilist.push(<div className={row[i][j]} onClick={
              () => {
                const message = JSON.stringify({
                  'type':'move',
                  'color':row[i][j],
                  'coordinates':[start,i]
                })
                spriteClicked(message)
              }
            }></div>)
          //the class name is equal to blue of 'blue' is stored in this cell in the 2D array
          } else {
            minilist.push(<div className={row[i][j]} onClick={()=>{alert("This is not your color")}}></div>)
          }
        }
        list.push(
        <div className={`cell${getString(start.toString(),i)}`} key={start+i}>
          {minilist}
        </div>
        )
      }
    }
    return list
  }



const Ludo = () => {
  const [boardState, boardStateChange] = useState([])
  const [diceValue, diceValueChange] = useState(0)
  const [colorValue,colorValueChange] = useState('')
  const [messageValue,messageValueChange] = useState('')
  
  ws.onmessage = event => {
    const data = JSON.parse(event.data)
    if(data.type==='state') {
      const state = data.state
      boardStateChange(state)
    } else if (data.type==='dice') {
      const value = data.value
      diceValueChange(value)
    } else if (data.type==='color') {
      const value = data.value
      colorValueChange(value)
    } else if (data.type==='message') {
      const value = data.value
      messageValueChange(value)
    }
  }

  let megalist = []
  //megalist contains 14 lists, each list containing 14 divs
  for(let i=0;i<15;i++) {
    megalist.push(generateForteen(boardState, colorValue, i))
  }

  return(<div>
  <div>
    {
      megalist.map((list)=>{
        return <div>{list}</div>
      })
    }
  </div>
  <div className="dice">
    {diceValue}
  </div>
  <div className={"color "+colorValue}></div>
  <div className="text_box">{messageValue}</div>
  </div>)
}

function App() {
  
  return(
  <div>
    <Ludo />
  </div>)
   
}

export default App;