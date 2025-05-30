import React from 'react';
import {createRoot} from "react-dom/client"
import './index.css';
import { SquareProps, SquareState, SelectionGrade, GameState, ControlsProps, PromptProps, BoardProps, Result, History, Side, PromptState, Record, AnalyticsProps } from './types.js';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Area, CartesianGrid, Label } from "recharts"
import JSConfetti from 'js-confetti'

class Square extends React.Component<SquareProps, SquareState> {

  constructor(props: any) {
    super(props)
    this.state = {
      grade: null
    }
  }

  render() {
    return (
      <button 
        className = "square" 
        data-grade = {this.state.grade} 
        data-square-col = {this.props.col}
        data-square-row = {this.props.row}
        onClick = {() => {
          let grade = this.props.onSelection([this.props.col, this.props.row])
          this.setState({grade: grade})
          setTimeout(() => {this.setState({grade: null})}, 200)
        }}
      > 
        <div className = "row-label">{this.props.row}</div>
        <div className = "col-label">{numberToLetter(this.props.col)}</div>
      </button>
    )
  }
}

class Board extends React.Component<BoardProps, {}> {

  
  renderRow(r: number) {
    var nums = [1, 2, 3, 4, 5, 6, 7, 8]
    if (this.props.perspective == "black") {
      nums = nums.reverse()
    }

    return (
      <div className = "row">
        {nums.map(c => <Square row = {r} col = {c} onSelection = {this.props.onSelection}/>)}
      </div>
    )
  }

  render() {
    var nums = [1, 2, 3, 4, 5, 6, 7, 8]
    if (this.props.perspective == "white") {
      nums = nums.reverse()
    }

    return (
      <div id = "board">
        {nums.map(r => this.renderRow(r))}
      </div>
    )
  }
}

class Prompt extends React.Component<PromptProps, PromptState> {

  constructor(props: any) {
    super(props)
    this.state = {
      showing: true
    }
  }

  componentDidUpdate(prevProps: PromptProps, prevState: PromptState) {
    if (prevProps.prompt != this.props.prompt) {
      this.setState({
        showing: true
      })
  
      setTimeout(() => {
        this.setState({
          showing: false
        })
      }, 300)
    }
  }

  render() {
    return (
      <div id = "prompt" className = {this.state.showing ? "showing" : "hiding"}> {squareName(this.props.prompt)} </div>
    )
  }
}

class Controls extends React.Component<ControlsProps, {}> {

  render() {
    const history = this.props.history.map((res, i) => {
      return (
        <li key = {i} className = {res.correct ? "correct": "incorrect"}>{squareToName(res.prompt)}</li>
      )
    })


    return(
      <div className='sidebar'>
        <h1 id="sidebar-header"> Chess Square Names Trainer </h1>
        <div id="sidebar-content" data-controls-hidden = {this.props.isPlaying}>
          <div id="game-fact-container" data-display-none = {!this.props.isPlaying}>
            <div id="timer">{this.props.secondsLeft}</div>
            <div id="task-description">Find {squareToName(this.props.prompt)}</div>
            <ul id = "streak"> {history} </ul>
          </div>
          <div data-display-none = {this.props.isPlaying} > 
            <Analytics record={this.props.record} />
          </div>
        </div>
        <div id="controls-container" data-display-none = {this.props.isPlaying}>
          <div id="controls-inner-container">
            <div >Round Length: {this.props.roundLength}</div>
            <input 
              type="range"
              min="10" max="60"
              className="slider"
              id="myRange"
              value = {this.props.roundLength} 
              step="5" 
              onChange={(e) => this.props.roundLengthChanged(parseInt(e.target.value))} 
            />

            <div>Perspective:</div>
            <input 
              type="checkbox"
              name = "perspective"
              checked = {this.props.perspective == "black"}
              id="perspective"
              onChange={(e) => {this.props.sideChanged(e.target.checked ? "black" : "white")}}
            />
            <label htmlFor="perspective" data-display-none = {this.props.isPlaying}>View as black</label>
            <div id="button-background-3d">
              <button 
                id="start"
                onClick = {this.props.startGame}
              >Start!</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class Analytics extends React.Component<AnalyticsProps, {}> {
  constructor(props: any) {
    super(props)
  }

  render() {
    let previousScores = this.props.record.map( (game, i) => {
      return {gameNumber: i, score: getScoreFromHistory(game), history: this.props.record[i].map(obj => obj.correct)}
    })

    let maxScore = previousScores.length ? Math.max(...previousScores.map(s => s.score)) : 0

    console.log(previousScores)

    return (
      <div style = {{width: "90%", margin: "auto"}}>
        <h1>High Score: {maxScore} </h1>
        <div data-display-none = {previousScores.length < 1}>
          <h2>Previous Scores:</h2>
          <ResponsiveContainer height={200} width = "100%">
          <AreaChart data = {previousScores}>
            <defs>
              <linearGradient id = "color" x1="0" y1 = "0" x2 = "0" y2="1">
                <stop offset="0%" stopColor = "rgb(244, 170, 61)" stopOpacity = {0.7}></stop>
                <stop offset="75%" stopColor = "rgb(244, 170, 61)" stopOpacity = {0.2}></stop>
              </linearGradient>
            </defs>


            <Area dataKey="score" stroke = "rgb(244, 170, 61)" fill="url(#color)"></Area>
            <YAxis dataKey = "score">
            <Label
              style={{
                textAnchor: "middle",
                fontSize: "110%",
                fill: "black",
              }}
              angle={270} 
              value={"Score"}
              position='insideLeft'/>
            </ YAxis>
            <CartesianGrid vertical = {false} />
          </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }
}


class Game extends React.Component<{}, GameState> {

  constructor(props: any) {

    if (!localStorage.getItem("perspective")) {
      localStorage.setItem("perspective", "white")
    }

    if (!localStorage.getItem("record")) {
      localStorage.setItem("record", JSON.stringify([]))
    }

    super(props)
    this.state = {
      isPlaying: false,
      secondsLeft: null,
      prompt: null,
      intervalId: null,
      history: [],
      roundLength: 30,
      perspective: localStorage.getItem("perspective") as Side,
      record: JSON.parse(localStorage.getItem("record")!) as Record
    }
  }

  startGame = () => {

    if (this.state.isPlaying) {
      return
    }

    console.log("start")
    let i = window.setInterval(this.updateGame, 1000)
    this.setState({
      isPlaying: true,
      secondsLeft: this.state.roundLength,
      prompt: getRandomSquare(),
      intervalId: i
    })
  }

  updateGame = () => {
    let t = this.state.secondsLeft
    if (!t) {
      return
    } 
    
    if (t === 1) {
      this.endGame();
    } else {
      this.setState({
        secondsLeft: t - 1
      })
    }
  }

  endGame = () => {
    let i = this.state.intervalId
    var r: Record = this.state.record.slice()

    let currentScore = getScoreFromHistory(this.state.history)
    let maxScore = Math.max(...r.map(h => getScoreFromHistory(h)))

    if (currentScore > maxScore) {
      const jsConfetti = new JSConfetti()
      jsConfetti.addConfetti({
        emojis: ['♟', '♛', '♜', '♟', '♝', '♚'],
        emojiSize: 100,
        confettiNumber: 50,
      })
    }

    r.push(this.state.history)

    if (i) {
      clearInterval(i)
    }

    this.setState({
      isPlaying: false,
      secondsLeft: null,
      prompt: null,
      intervalId: null,
      record: r,
      history: []
    })

    localStorage.setItem("record", JSON.stringify(r))
  }

  processSelection = (selection: [number, number]): SelectionGrade | null => {

    if (!this.state.isPlaying) {
      return null
    }

    
    let isCorrect = selection.toString() === (this.state.prompt)?.toString()

    let selector = `button[data-square-col = '${this.state.prompt?.[0]}'][data-square-row = '${this.state.prompt?.[1]}']`
    console.log(selector)
    let missedSquare = document.querySelector(selector)
    missedSquare?.setAttribute("data-grade", "missed")
    setTimeout(() => missedSquare?.removeAttribute("data-grade"), 200)
    console.log(missedSquare)

    let newestResult: Result = {
      prompt: this.state.prompt,
      correct: isCorrect
    }

    var history: History = this.state.history.slice()
    history.push(newestResult)
    this.setState({
      history: history
    })

    this.changePrompt()

    let grade: SelectionGrade = isCorrect ? "correct" : "incorrect"
    return grade
  }

  changePrompt = () => {
    this.setState({
      prompt: getRandomSquare()
    })
  }

  roundLengthChanged = (n: number) => {
    this.setState({
      roundLength: n
    })
  }

  changePerspective = (s: Side) => {
    localStorage.setItem("perspective", s)
    this.setState({
      perspective: s
    })
  }

  render() {
    return (
      <div id = "container">
        <div id="game-container">
          <div id="game">
            <Board onSelection={this.processSelection} perspective = {this.state.perspective} />
            <Prompt prompt = {this.state.prompt} />
          </div>
        </div>
        <Controls 
          startGame={this.startGame}
          secondsLeft={this.state.secondsLeft}
          history={this.state.history} 
          roundLength = {this.state.roundLength} 
          roundLengthChanged = {this.roundLengthChanged}
          perspective = {this.state.perspective}
          sideChanged = {this.changePerspective}
          isPlaying = {this.state.isPlaying}
          record = {this.state.record}
          prompt = {this.state.prompt}
        />
      </div>
    )
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);
root.render(<Game />);

function numberToLetter(c: number): string {
  const colNames = ["a", "b", "c", "d", "e", "f", "g", "h"]
  return colNames[c-1]
}

function getRandomSquare(): [number, number] {
  return [Math.round(Math.random()*7+1), Math.round(Math.random()*7+1)]
}

function squareToName(square: [number, number] | null): string {
  if (!square) {
    return ""
  }
  return numberToLetter(square[0]) + square[1]
}

function getScoreFromHistory(h: History): number {
  let score = h.filter(p => p.correct).length
  return score
}

function squareName(coords: [number, number] | null): [string, number] | string {
  if (!coords) {
    return ""
  } else {
    return numberToLetter(coords[0]) + coords[1].toString()
  }
}