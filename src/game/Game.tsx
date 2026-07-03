import UI from './Game.module.css'

import { Fragment, useEffect, useRef, useState } from 'react'

const DEFAULT_FIELD =[
  [1,2,3,4,5,6,7,8,9],
  [1,1,1,2,1,3,1,4,1],
  [5,1,6,1,7,1,8,1,9],
]

interface CellChoice {
  id: string;
  value: number;
  row: number;
  col: number;
}

function Game() {
  const [field, setField] = useState<(number | null)[][]>(() => {
    const savedData = localStorage.getItem("field");
    
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error("Error parsing saved board configuration:", e);
        alert("Error while loading saved game. Starting new game")
      }
    }
    
    return DEFAULT_FIELD;
  })
  const [choices, setChoices] = useState<CellChoice[]>([])
  const deselectBtnRef = useRef<HTMLImageElement | null>(null)
  const rulesBtnRef = useRef<HTMLImageElement | null>(null)
  const resetBtnRef = useRef<HTMLImageElement | null>(null)
  const gameWrapperRef = useRef<HTMLDivElement | null>(null)

  function saveGame(field: (number | null)[][]) {
    localStorage.setItem("field", JSON.stringify(field))
  }

  function handleCellClick(cellId: string, value: number, rowIndex: number, colIndex: number) {
    if (choices.some(choice => choice.id === cellId)) return
  
    // 2. Prevent clicks if two choices are already processing
    if (choices.length >= 2) return
  
    const newChoice = { id: cellId, value, row: rowIndex, col: colIndex }
    const updatedChoices = [...choices, newChoice]
  
    setChoices(updatedChoices)
  
    if (updatedChoices.length == 2) checkMatch(updatedChoices)
  }

  function completeMove(currentChoices: CellChoice[]) {
    const updatedField = field.map(row => [...row]);
    updatedField[currentChoices[0].row][currentChoices[0].col] = null;
    updatedField[currentChoices[1].row][currentChoices[1].col] = null;

    setField(updatedField);
    saveGame(updatedField)
    setChoices([])
  }
  
  // Rules
  function checkTwinXRules(currentChoices: CellChoice[]) {
    const c1 = currentChoices[0]
    const c2 = currentChoices[1]
    if (c1.value == c2.value || c1.value + c2.value == 10) return true
    return false
  }

  function areFollowing (currentChoices: CellChoice[]) {
    const c1 = currentChoices[0]
    const c2 = currentChoices[1]

    const isFirstC1 = c1.row < c2.row || (c1.row === c2.row && c1.col < c2.col)
    const first = isFirstC1 ? c1 : c2
    const second = isFirstC1 ? c2 : c1

    const columnsPerRow = field[0].length

    const startFlatIndex = first.row * columnsPerRow + first.col
    const endFlatIndex = second.row * columnsPerRow + second.col

    for (let i = startFlatIndex + 1; i < endFlatIndex; i++) {
      const r = Math.floor(i / columnsPerRow)
      const c = i % columnsPerRow

      if (field[r][c] !== null) return false
    }

    return checkTwinXRules(currentChoices)
  }

  function verticallyAligned (currentChoices: CellChoice[]) {
    const c1 = currentChoices[0]
    const c2 = currentChoices[1]

    if (c1.col !== c2.col) return false

    const startRow = Math.min(c1.row, c2.row)
    const endRow = Math.max(c1.row, c2.row)

    for (let r = startRow + 1; r < endRow; r++) if (field[r][c1.col] !== null) return false
    return checkTwinXRules(currentChoices)
  }

  function checkMatch (currentChoices: CellChoice[]) {
    if (areFollowing(currentChoices)) {
      completeMove(currentChoices)
    } else if (verticallyAligned(currentChoices)) {
      completeMove(currentChoices)
    }
    setChoices([])
  }

  function deal() {
    const activeNumbers = field.flat().filter((n): n is number => n !== null);

    if (activeNumbers.length === 0) return;

    const updatedFlatField = [...field.flat(), ...activeNumbers];

    const columnsPerRow = 9;
    const field2d: (number | null)[][] = [];

    for (let i = 0; i < updatedFlatField.length; i += columnsPerRow) {
      const row = updatedFlatField.slice(i, i + columnsPerRow);
      field2d.push(row);
    }

    const cleanField = field2d.filter(row => row.some(cell => cell !== null));
    setField(cleanField);
    saveGame(cleanField)
  };

  useEffect(() => {
    function press(ev: KeyboardEvent) {if (ev.key === "Enter") {
      deal();
      window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'smooth'})
    }};

    document.body.addEventListener("keydown", press);
    return () => document.body.removeEventListener("keydown", press);
  }, [field]);

  useEffect(() => {
    function clearChoices() {setChoices([])}
    function openRules() {}
    function resetGame() {setField(DEFAULT_FIELD); saveGame(DEFAULT_FIELD)}
    
    deselectBtnRef.current?.addEventListener("click", clearChoices)
    rulesBtnRef.current?.addEventListener("click", openRules)
    resetBtnRef.current?.addEventListener("click", resetGame)

    // gameWrapperRef.current?.style.setProperty("--cell-size", `${window.screen.width}`)
    
    return () => {
      deselectBtnRef.current?.removeEventListener("click", clearChoices)
      rulesBtnRef.current?.removeEventListener("click", openRules)
      resetBtnRef.current?.removeEventListener("click", resetGame)
    }
  }, [])

  return (
    <Fragment>
      <div className={UI.controls}>
        <img ref={deselectBtnRef} src="/icons/deselect.svg" alt="Deselect current choice" />
        <img ref={rulesBtnRef} src="/icons/book.svg" alt="See rules" />
        <img ref={resetBtnRef} src="/icons/reset.svg" alt="Start new game" />
      </div>
      
      <div ref={gameWrapperRef} className={UI.wrapper}>
        {field.map((row, rowIndex) => (
          <div key={rowIndex} className={UI.row}>
            {row.map((number, colIndex) => {
              const cellId = `${rowIndex}-${colIndex}`
              const isSelected = choices.some(choice => choice.id === cellId)

              return (
                <div key={cellId}>
                  {number ? (
                    <div 
                      className={`${UI.cell} ${isSelected ? UI.selected : ''}`}
                      onClick={() => handleCellClick(cellId, number, rowIndex, colIndex)}
                    >
                      {number}
                    </div>
                  ) : (
                    <div className={`${UI.cell} ${UI.crossed}`}></div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className={UI.counters}></div>
    </Fragment>
  )
}

export default Game;

