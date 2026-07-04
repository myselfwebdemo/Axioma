import UI from './Game.module.css'

import { Fragment, useEffect, useRef, useState } from 'react'

const DEFAULT_FIELD =[
  [1,2,3,4,5,6,7,8,9],
  [1,1,1,2,1,3,1,4,1],
  [5,1,6,1,7,1,8,1,9],
]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MOVE_DELAY_MS = 100; 

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
  const [crossedNs, setCrossedNs] = useState<Set<string>>(() => {
    const savedData = localStorage.getItem("crossedNs");
    if (savedData) {
      try {
        return new Set(JSON.parse(savedData));
      } catch (e) {
        console.error("Error parsing crossed numbers:", e);
      }
    }
    return new Set<string>();
  });
  const [choices, setChoices] = useState<CellChoice[]>([])
  const deselectBtnRef = useRef<HTMLImageElement | null>(null)
  const rulesBtnRef = useRef<HTMLImageElement | null>(null)
  const resetBtnRef = useRef<HTMLImageElement | null>(null)
  const gameWrapperRef = useRef<HTMLDivElement | null>(null)

  var hasEverDealt = false
  var awaitingCompleteMove = false
  const [areWrongChoices, setAreWrongChoices] = useState(false)

  function saveGame(field: (number | null)[][], crossedSet: Set<string> = new Set()) {
    localStorage.setItem("field", JSON.stringify(field));
    localStorage.setItem("crossedNs", JSON.stringify(Array.from(crossedSet)));
  }


  async function cellClick(cellId: string, value: number, rowIndex: number, colIndex: number) {
    if (awaitingCompleteMove) return
    if (choices.some(choice => choice.id === cellId)) return  
    if (choices.length >= 2) return
  
    const newChoice = { id: cellId, value, row: rowIndex, col: colIndex }
    const updatedChoices = [...choices, newChoice]
    
    setChoices(updatedChoices)
    await sleep(50)
    if (updatedChoices.length == 2) checkMatch(updatedChoices)
  }

  async function completeMove(currentChoices: CellChoice[]) {
    awaitingCompleteMove = true
    await sleep(MOVE_DELAY_MS);
    
    const id1 = currentChoices[0].id;
    const id2 = currentChoices[1].id;

    if (!crossedNs.has(id1) || !crossedNs.has(id2)) {
      const updatedCrossed = new Set(crossedNs);
      updatedCrossed.add(id1);
      updatedCrossed.add(id2);
      
      setCrossedNs(updatedCrossed);
      saveGame(field, updatedCrossed);
    }
    
    setChoices([]);  
    awaitingCompleteMove = false
  }

  async function wrongPairSelected() {
    setAreWrongChoices(true)

    await sleep(MOVE_DELAY_MS * 2)
    setChoices([])
    setAreWrongChoices(false)
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

      if (!crossedNs.has(`${r}-${c}`)) return false;
    }

    return checkTwinXRules(currentChoices)
  }

  function verticallyAligned (currentChoices: CellChoice[]) {
    const c1 = currentChoices[0]
    const c2 = currentChoices[1]

    if (c1.col !== c2.col) return false

    const startRow = Math.min(c1.row, c2.row)
    const endRow = Math.max(c1.row, c2.row)

    for (let r = startRow + 1; r < endRow; r++) if (!crossedNs.has(`${r}-${c1.col}`)) return false
    return checkTwinXRules(currentChoices)
  }

  function checkMatch (currentChoices: CellChoice[]) {
    if (areFollowing(currentChoices)) {
      completeMove(currentChoices)
    } else if (verticallyAligned(currentChoices)) {
      completeMove(currentChoices)
    } else wrongPairSelected()
  }

  function deal() {
    if (!hasEverDealt) hasEverDealt = true;
    const activeNumbers: number[] = [];
    field.forEach((row, rowIndex) => {
      row.forEach((number, colIndex) => {
        if (!crossedNs.has(`${rowIndex}-${colIndex}`) && number !== null) activeNumbers.push(number);
      });
    });

    if (activeNumbers.length === 0) return;

    const updatedFlatField = [...field.flat().filter((n): n is number => n != null), ...activeNumbers];

    const columnsPerRow = 9;
    const field2d: (number | null)[][] = [];
    for (let i = 0; i < updatedFlatField.length; i += columnsPerRow) {
      const row = updatedFlatField.slice(i, i + columnsPerRow);      
      while (row.length < columnsPerRow) row.push(null as any);
      field2d.push(row);
    }

    setField(field2d);
    saveGame(field2d, crossedNs);
  }

  useEffect(() => {
    function press(ev: KeyboardEvent) {if (ev.key === "Enter") {
      deal();
      setTimeout(() => {
        window.scrollTo({top: gameWrapperRef.current?.scrollHeight, behavior: 'smooth'})
      }, 10);
    }};

    document.body.addEventListener("keydown", press);
    return () => document.body.removeEventListener("keydown", press);
  }, [field, crossedNs]);

  useEffect(() => {
    function clearChoices() {setChoices([])}
    function openRules() {}
    function resetGame() {setField(DEFAULT_FIELD); setCrossedNs(new Set()); setChoices([]); saveGame(DEFAULT_FIELD)}
    
    deselectBtnRef.current?.addEventListener("click", clearChoices)
    rulesBtnRef.current?.addEventListener("click", openRules)
    resetBtnRef.current?.addEventListener("click", resetGame)

    return () => {
      deselectBtnRef.current?.removeEventListener("click", clearChoices)
      rulesBtnRef.current?.removeEventListener("click", openRules)
      resetBtnRef.current?.removeEventListener("click", resetGame)
    }
  }, [])

  return (
    <Fragment>
      <div className={UI.controls}>
        <img ref={deselectBtnRef} src="./icons/deselect.svg" alt="Deselect current choice" />
        <img ref={rulesBtnRef} src="./icons/book.svg" alt="See rules" />
        <img ref={resetBtnRef} src="./icons/reset.svg" alt="Start new game" />
      </div>
      
      <div ref={gameWrapperRef} className={UI.wrapper}>
        {field.map((row, rowIndex) => (
          <div key={rowIndex} className={UI.row}>
            {row.map((number, colIndex) => {
              const cellId = `${rowIndex}-${colIndex}`
              const isSelected = choices.some(choice => choice.id === cellId)
              const isCrossed = crossedNs.has(cellId)

              return (
                <div key={cellId}>
                  {!isCrossed ? number && (
                    <div 
                      className={UI.cell}
                      onClick={() => cellClick(cellId, number!, rowIndex, colIndex)}
                    >
                      <img src={`/TX27/shapes/${number}${isSelected ? (areWrongChoices ? '-err' : '-selected') : ''}.svg`} />
                      <p>{number}</p>
                    </div>
                  ) : (
                    <div className={`${UI.cell} ${UI.crossed}`}><img src={`/TX27/shapes/${number}-distorted.png`} /></div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* <div className={UI.counters}></div> */}

      {/* {screen.width > screen.height ? (
        <Fragment>{!hasEverDealt ? (
            <div className={UI.how_to_deal_animation}></div>
          ) : ('')}</Fragment>
      ) : (
        <div></div>)
      } */}
    </Fragment>
  )
}

export default Game;

