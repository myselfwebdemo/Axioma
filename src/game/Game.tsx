import UI from './Game.module.css'

import { Fragment, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { v7 as uuidv7 } from 'uuid';

// TODO
// – Iimplement hint: highlight numbers in between when cannot cross
// – Should save current selection (one cell selected)?

console.log(screen)

type Cell = {
  id: string;
  value: number;
  isCrossed: boolean;
  isSelected: boolean;
};

type Field = Cell[][]

type FieldDispatch = Dispatch<SetStateAction<Cell[][]>>
type BooleanDispatch = Dispatch<SetStateAction<boolean>>

const gencell = (id: string, value: number) => {
  return {id: id, value: value, isCrossed: false, isSelected: false}
}

// Action
const completeMove = async (
  field: Field,
  setField: FieldDispatch,
  setWaiting: BooleanDispatch,
  setSelection: BooleanDispatch,
  [C1, C2]: Cell[],
) => {
  setWaiting(true)
  
  const updatedField: Field = field.map(row => 
    row.map(cell => {
      return cell.id === C1.id || cell.id === C2.id 
        ? { ...cell, isCrossed: true, isSelecellted: false } : cell
    })
  ) as unknown as Field
  setField(updatedField);
  
  saveGame(updatedField)
  resetChoices(setField, setSelection)
  setWaiting(false)
  // updateGameData('moves', gameData['moves']+1)
}

const wrongPairSelected = async (
  setAreWrongChoices: BooleanDispatch,
  setField: FieldDispatch,
  setSelection: BooleanDispatch
) => {
  setAreWrongChoices(true)

  await sleep(300)
  resetChoices(setField, setSelection)
  setAreWrongChoices(false)
}

const checkMatch = (
  field: Field,
  setAreWrongChoices: BooleanDispatch,
  setField: FieldDispatch,
  selectedCells: Cell[],
  setWaiting: BooleanDispatch,
  setSelection: BooleanDispatch
) => {
  if (areFollowing(field, selectedCells)) {
    completeMove(field, setField, setWaiting, setSelection, selectedCells)
  } else if (verticallyAligned(field, selectedCells)) {
    completeMove(field, setField, setWaiting, setSelection, selectedCells)
  } else {
    wrongPairSelected(setAreWrongChoices, setField, setSelection)
  }
}

const resetChoices = (setField: FieldDispatch, setSelection: BooleanDispatch) => {
  setField((prevField: Field) => 
    prevField.map(row => 
      row.map(cell => ({
        ...cell,
        isSelected: false
      }))
    )
  );
  setSelection(false)
}

const deal = (
  field: Field,
  setField: FieldDispatch,
  hasEverDealt: boolean,
  setHasEverDealt: BooleanDispatch,
) => {
  if (!hasEverDealt) setHasEverDealt(true)

  const activeNumbers: Cell[] = field.flat().filter(cell => !cell.isCrossed)
  
  if (activeNumbers.length === 0) return;

  const tempFlatField: Cell[] = [...field.flat(), ...activeNumbers]
  const freshField: Cell[][] = []

  for (let row=0; row<tempFlatField.length; row+=colsPerRow) {
    const rarr = []
    while (rarr.length < colsPerRow && row+rarr.length < tempFlatField.length) {
      const cell: Cell = {...tempFlatField[row+rarr.length], id: uuidv7()}
      rarr.push(cell)
    }
    if (rarr.some(cell => !cell.isCrossed)) freshField.push(rarr);
  }

  setField(freshField);
  saveGame(freshField);
  // updateGameData('deals', gameData['deals']+1)
}

// function updateGameData(key: string, val: number) {
//   setGameData({
//     "moves": key == "moves" ? val : gameData["moves"],
//     "deals": key == "deals" ? val : gameData['deals']
//   })

//   console.log(!movesCounterRef.current || !dealsCounterRef.current)
//   if (!movesCounterRef.current || !dealsCounterRef.current) return
//   if (key === "moves") {
//     const currentSize = parseFloat(getComputedStyle(movesCounterRef.current).fontSize);
//     movesCounterRef.current.style.fontSize = `${currentSize + .2}px`;
//     return;
//   }

//   const currentSize = parseFloat(getComputedStyle(dealsCounterRef.current).fontSize);
//   dealsCounterRef.current.style.fontSize = `${currentSize + 2}px`;
// }
{}

// Selection
const isSelectionOverflow = (field: Field, checkExact?: boolean) => {
  const selected = field.flat().filter(cell => cell.isSelected).length
  return checkExact ? selected === 2 : selected >= 2
}

const checkTwinXRules = (C1: Cell, C2: Cell) => {
  if (C1.value == C2.value || C1.value + C2.value == 10) return true
  return false
}

const areFollowing = (field: Field, [C1, C2]: Cell[]) => {
  const flatField = field.flat()
  const idx1 = flatField.findIndex(cell => cell.id === C1.id);
  const idx2 = flatField.findIndex(cell => cell.id === C2.id);
  
  for (let i = idx1+1; i<idx2; i++) {
    if (!flatField[i].isCrossed) return false;
  }

  return checkTwinXRules(C1, C2)
}

const verticallyAligned = (field: Field, [C1, C2]: Cell[]) => {
  const flatField = field.flat()
  const idx1 = flatField.findIndex(cell => cell.id === C1.id);
  const idx2 = flatField.findIndex(cell => cell.id === C2.id);
  const colidx = idx1%colsPerRow
  const rowidx1 = Math.floor(idx1/colsPerRow)
  const rowidx2 = Math.floor(idx2/colsPerRow)

  if (colidx != idx2%colsPerRow) return false;
  
  if (rowidx2 - rowidx1 != 1) {
    for (let i = rowidx1+1; i<rowidx2; i++) {
      if (!field[i][colidx].isCrossed) return false;
    }
  }

  return checkTwinXRules(C1, C2)
}

// Utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const selectedCells = (field: Field): Cell[] => {
  let s1: Cell | null = null
  let s2: Cell | null = null

  field.forEach(row => {row.forEach(cell => {if (cell.isSelected) !s1 ? s1 = cell : s2 = cell; return;})})
  return [s1!, s2!]
}

const saveGame = (field: Field) => {
  localStorage.setItem("field", JSON.stringify(field));
}

// Configurational constants
const Ns =[1,2,3,4,5,6,7,8,9,1,1,1,2,1,3,1,4,1,5,1,6,1,7,1,8,1,9]
const isMobile = screen.width < screen.height
const colsPerRow = 9

// Initial FIELD generation
const FIELD: Field = []
for (let row=1; row<20; row+=colsPerRow) {
  const rarr = []
  while (rarr.length < colsPerRow) {
    const cell = gencell(uuidv7(), Ns[(row-1)+rarr.length])
    rarr.push(cell)
  }
  FIELD.push(rarr)
}

function Game() {
  const [field, setField] = useState<Field>(() => {
    const savedData = localStorage.getItem("field");
    
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error("Error parsing saved board configuration:", e);
        alert("Error while loading saved game. Starting new game")
      }
    }

    return FIELD;
  })
  const fieldWrapperRef = useRef<HTMLDivElement | null>(null)
  // const [gameData, setGameData] = useState<Record<string, number>>({
  //   "moves": 0, "deals": 0 })
  // const movesCounterRef = useRef<HTMLParagraphElement | null>(null)
  // const dealsCounterRef = useRef<HTMLParagraphElement | null>(null)
  
  const [hasEverDealt, setHasEverDealt] = useState<boolean>(false)
  const [areWrongChoices, setAreWrongChoices] = useState<boolean>(false)
  const [waiting, setWaiting] = useState<boolean>(false)
  const [isSelection, setSelection] = useState<boolean>(false)
  const [isResetting, setResetting] = useState<boolean>(false)

  const cellClick = async (cell: Cell) => {
    if (waiting || cell.isSelected || isSelectionOverflow(field)) return
  
    const updatedField: Field = field.map(row => 
      row.map(c => c.id === cell.id ? { ...c, isSelected: true } : c)
    ) as unknown as Field
    setField(updatedField);
    if (!isSelection) setSelection(true)

    await sleep(100)
    if (isSelectionOverflow(updatedField, true)) {
      checkMatch(
        updatedField,
        setAreWrongChoices,
        setField,
        selectedCells(updatedField),
        setWaiting,
        setSelection
      )
    }
  }

  const resetGame = () => {
    setResetting(true)
    resetChoices(setField, setSelection)
    setField(FIELD)
    saveGame(FIELD)
  }
  const clearChoices = () => {resetChoices(setField, setSelection)}
  const setRulesBookState = () => {return}

  useEffect(() => {
    function press(ev: KeyboardEvent) {if (ev.key === "Enter") deal(field, setField, hasEverDealt, setHasEverDealt)};

    document.body.addEventListener("keydown", press);
    return () => document.body.removeEventListener("keydown", press);
  }, [field]);

  useEffect(() => {
    fieldWrapperRef.current?.style.setProperty('--gap', isMobile ? '0px' : '8px')
    fieldWrapperRef.current?.style.setProperty('--cell-size', isMobile ? '40px' : '70px')
    fieldWrapperRef.current?.style.setProperty('--font-size', isMobile ? '.55em' : '1em')
  }, [])

  return (
    <Fragment>
      <div className={UI.game_wrapper}>

        <div className={UI.header}>
          <p>tx27</p>
          <div className={UI.controls}>
            <div className={UI.controls_img_wrapper}>
              <img
                className={`${isResetting ? UI.animreset : ''}`}
                src="./icons/reset.svg"
                alt="Start new game"
                onClick={resetGame}
                onAnimationEnd={() => setResetting(false)} />
            </div>
            <div className={UI.controls_img_wrapper}>
              <img src="./icons/book.svg" alt="See rules" onClick={setRulesBookState} />
            </div>
            {isSelection ? (
              <div className={UI.controls_img_wrapper}>
                <img src="./icons/xmark.svg" alt="Deselect current choice" onClick={clearChoices} />
              </div>
            ) : ('')}
          </div>
        </div>
        
        <div ref={fieldWrapperRef} className={UI.field_wrapper}>
          {field.map((row, ridx) => (
            <div key={ridx} className={UI.row}>
              {row.map((cell,_) => {
                return (
                  <div key={cell.id}>
                    {cell.isCrossed ? (
                      <div className={`${UI.cell} ${UI.crossed}`}>
                        <img id={UI.source_img} src={`/TX27/shapes/${cell.value}-selected.svg`} />
                        <img id={UI.target_img} src={`/TX27/shapes/${cell.value}-distorted.png`} />
                      </div>
                    ) : (
                      <div 
                        className={UI.cell}
                        onClick={() => cellClick(cell)}
                      >
                        <img src={`/TX27/shapes/${cell.value}${cell.isSelected ? (areWrongChoices ? '-err' : '-selected') : ''}.svg`} />
                        <p>{cell.value}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* <div className={UI.counters}>
          <div>
            <p ref={movesCounterRef}>{gameData["moves"]}</p>
            <h4>moves</h4>
          </div>
          <div>
            <p ref={dealsCounterRef}>{gameData["deals"]}</p>
            <h4>deals</h4>
          </div>
        </div> */}
      </div>

      {isMobile ? (
        <button
          className={UI.mobile_deal_btn}
          onClick={() => {deal(field, setField, hasEverDealt, setHasEverDealt)}}
        >deal</button>
      ) : (
        <Fragment>{!hasEverDealt ? (
          <div className={UI.how_to_deal__animation}>
            <div>
              <p className={UI.catch_phrase}>Out of moves?</p>
              <p>Press <strong>Enter</strong> to <i>deal</i> remaining numbers.</p>
            </div>
            <img src="/TX27/icons/arrow-down.svg" alt="arrow down" />
          </div>
        ) : ('')}</Fragment>
      )}
    </Fragment>
  )
}

export default Game;
