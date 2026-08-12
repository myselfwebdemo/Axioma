import UI from './Game.module.css'

import React, { Fragment, useEffect, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction, type UIEvent } from 'react'
import { v7 as uuidv7 } from 'uuid';
import ThemeList from '../components/theme-list';
import Modal from '../components/modal-window';

// Action
type CMProps = {
  field: Field,
  setField: FieldDispatch,
  setWaiting: BooleanDispatch,
  setSelection: BooleanDispatch,
  selectedCells: Cell[],
  gameData: GameData,
  setGameData: SetGDDispatch,
  hasMadeMove: boolean
  setHasMadeMove: BooleanDispatch
}
const completeMove = async (
  rule: 'xrule' | 'twinrule',
  { field, setField, setWaiting, setSelection, selectedCells: [C1, C2],
    gameData, setGameData, hasMadeMove, setHasMadeMove,
  }: CMProps
) => {
  setWaiting(true)
  if (!hasMadeMove) setHasMadeMove(true)
  
  const updatedField: Field = field.map(row => 
    row.map(cell => {
      return cell.id === C1.id || cell.id === C2.id 
        ? { ...cell, isCrossed: true, isSelected: false, isClickedAndMatched: true } : cell
    })
  ) as unknown as Field

  const selectedAreEqual = C1.value == C2.value
  
  const baseScore = selectedAreEqual ? 8 : 18
  const dScore = baseScore + (findDistanceBetween(field, [C1, C2]) * 2)
  const totalncount = gameData.totalncount + 2

  const newGameData: GameData = {
    ...gameData,
    trueScore: gameData.trueScore + dScore,
    moves: gameData.moves + 1,
    totalncount: totalncount,
    distribution: {...gameData.distribution},
    [rule]: gameData[rule] + 1,
  }

  if (selectedAreEqual) {
    newGameData.distribution[C1.value] = gameData.distribution[C1.value] + 2
  } else {
    newGameData.distribution[C1.value] = gameData.distribution[C1.value] + 1
    newGameData.distribution[C2.value] = gameData.distribution[C2.value] + 1
  }
  
  setField(updatedField);
  resetChoices(setField, setSelection)
  setWaiting(false)
  setGameData(newGameData)
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
  setSelection: BooleanDispatch,
  gameData: GameData,
  setGameData: SetGDDispatch,
  hasMadeMove: boolean,
  setHasMadeMove: BooleanDispatch,
) => {
  const hdir = areFollowing(field, selectedCells)
  const vdir = verticallyAligned(field, selectedCells)
  const cmProps = {
    field,
    setField,
    setWaiting,
    setSelection,
    selectedCells,
    gameData,
    setGameData,
    hasMadeMove,
    setHasMadeMove,
  }

  if (hdir.valid) {
    completeMove(hdir.rule as 'xrule' | 'twinrule', cmProps)
  } else if (vdir.valid) {
    completeMove(vdir.rule as 'xrule' | 'twinrule', cmProps)
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

const deal = ({
  field,
  setField,
  hasEverDealt,
  setHasEverDealt,
  gameData,
  setGameData,
  isGameActive,
  setGameActive,
}: DealProps ) => {
  if (!isGameActive) setGameActive(true);
  if (!hasEverDealt) setHasEverDealt(true);

  const flatField = field.flat()
  const activeNumbers: Cell[] = flatField.filter(cell => !cell.isCrossed)
  
  if (activeNumbers.length === 0) return;

  const dealtCells: Cell[] = [...flatField, ...activeNumbers];
  const freshField: Cell[][] = [];
  let removedRows = 0;

  for (let i=0; i < dealtCells.length; i += colsPerRow) {
    const row = dealtCells.slice(i, i + colsPerRow).map(cell => ({
      ...cell, id: uuidv7(), isSelected: false, isClickedAndMatched: false,
    }));
    
    if (row.some(cell => !cell.isCrossed)) freshField.push(row); else removedRows++;
  }

  const grew = freshField.length > field.length
  let dScore = 0
  const nCost = 10
  const rowReward = 100

  if (grew) {
    dScore -= (freshField.slice(field.length).flat().length * nCost)
  }
  dScore += removedRows * rowReward

  setField(freshField);
  setGameData({
    ...gameData,
    trueScore: Math.max(gameData.trueScore + dScore, 0),
    deals: gameData.deals + 1,
    rows: freshField.length,
    maxrows: Math.max(freshField.length, gameData.maxrows),
  })
}

// const previewDeal = (field: Field, setField: FieldDispatch, isGameActive: boolean, setGameActive: BooleanDispatch) => {
//   if (!isGameActive) setGameActive(true);

//   const flatField = field.flat()
//   const activeNumbers: Cell[] = flatField.filter(cell => !cell.isCrossed)
  
//   if (activeNumbers.length === 0) return;

//   setField(flat2Field([...flatField, ...activeNumbers], (row, col) => ({id: uuidv7(), isSelected: false, isClickedAndMatched: false, isPreview: row+col>flatField.length-1})));
// }

// const nodeDist = (parent: DOMRect, child: DOMRect, d: 'x' | 'y'): number => {
//   return Math.round(Math.abs(parent[d] - child[d]))
// }

const smoothScale = (dist: number, scrollLength: number) => {
  const progress = Math.min(dist / scrollLength, 1);
  const minScale = 0.6
  return minScale + (1 - minScale) * Math.pow(1 - progress, 2);
};

const themeListScroll = (e: UIEvent, currentTheme: string, scheduleTheme: Dispatch<SetStateAction<string>>) => {
  const parent = e.currentTarget as HTMLDivElement;

  console.log(parent.dataset.scrolltop)

  requestAnimationFrame(() => {
    const parentRect = parent.getBoundingClientRect();

    parent.childNodes.forEach((childNode: any) => {
      const childRect = childNode.getBoundingClientRect() as DOMRect;
      const dist = Math.round(parentRect.y + parentRect.height/2 - childRect.y - childRect.height/2);
      childNode.style.transform = `
        scale(${smoothScale(Math.abs(dist), parent.clientHeight)})
        rotateX(${Math.max(Math.min(dist/1.5, 90), -90)}deg)
        translateY(${dist/5}px)
      `;
        
      const theme = childNode.children[0].textContent.split(' ').join('_');
      if (Math.abs(dist) <= 10 && theme !== currentTheme) scheduleTheme(theme);
    })
  });
};

// const footerDivScroll = (e: UIEvent, firstDivRef: DivRef, lastDivRef: DivRef) => {
//   if (!firstDivRef || !lastDivRef) return;

//   const parent = e.currentTarget as HTMLDivElement;

//   requestAnimationFrame(() => {
//     const parentRect = parent.getBoundingClientRect();

//     const dist1 = nodeDist(parentRect, firstDivRef.getBoundingClientRect(), 'y');
//     const dist2 = nodeDist(parentRect, lastDivRef.getBoundingClientRect(), 'y');

//     firstDivRef.style.transform = `scale(${smoothScale(dist1, parent.clientHeight)})`;
//     lastDivRef.style.transform = `scale(${smoothScale(dist2, parent.clientHeight)})`;
//   });
// };

// const actorListScroll = (
//   e: UIEvent,
//   setActorPreviewColor: Dispatch<SetStateAction<Actor | null>>,
//   setSelectActor: Dispatch<SetStateAction<(() => void) | null>>,
//   setPlayerActor: Dispatch<SetStateAction<string | null>>,
//   setActorDisplay: BooleanDispatch,
// ) => {
//   const parent = e.currentTarget as HTMLDivElement;

//   requestAnimationFrame(() => {
//     const parentRect = parent.getBoundingClientRect();

//     for (const child of parent.children) {
//       const dist = Math.round(Math.abs(parentRect.x + parent.clientWidth/2 - child.getBoundingClientRect().x - child.clientWidth/2))
//       const scale = 1 - Math.min(dist / parent.clientWidth, 1);
//       (child as HTMLElement).style.transform = `scale(${scale})`;

//       if (dist <= 10) {
//         const obj = ACTORS[(child.children[0] as HTMLElement).dataset.actorid as any]
//         console.log(obj)
//         setActorPreviewColor(obj)
//         setSelectActor(() => () => {setPlayerActor(obj.source); setActorDisplay(true)})
//       }
//     }
//   });
// };

// Selection
const isSelectionOverflow = (field: Field, checkExact?: boolean) => {
  const selected = field.flat().filter(cell => cell.isSelected).length
  return checkExact ? selected === 2 : selected >= 2
}

const checkTwinXRules = (C1: Cell, C2: Cell): ruleCheckResult => {
  if (C1.value == C2.value) {
    return {valid: true, rule: 'twinrule'}
  } else if (C1.value + C2.value == 10) {
    return {valid: true, rule: 'xrule'}
  }
  return {valid: false, rule: ''}
}

const areFollowing = (field: Field, [C1, C2]: Cell[]): ruleCheckResult => {
  const flatField = field.flat()
  const idx1 = flatField.findIndex(cell => cell.id === C1.id);
  const idx2 = flatField.findIndex(cell => cell.id === C2.id);
  
  for (let i = idx1+1; i<idx2; i++) {
    if (!flatField[i].isCrossed) return {valid: false, rule: ''};
  }

  return checkTwinXRules(C1, C2)
}

const verticallyAligned = (field: Field, [C1, C2]: Cell[]): ruleCheckResult => {
  const flatField = field.flat()
  const idx1 = flatField.findIndex(cell => cell.id === C1.id);
  const idx2 = flatField.findIndex(cell => cell.id === C2.id);
  const colidx = idx1%colsPerRow
  const rowidx1 = Math.floor(idx1/colsPerRow)
  const rowidx2 = Math.floor(idx2/colsPerRow)

  if (colidx != idx2%colsPerRow) return {valid: false, rule: ''};
  
  if (rowidx2 - rowidx1 != 1) {
    for (let i = rowidx1+1; i<rowidx2; i++) {
      if (!field[i][colidx].isCrossed) return {valid: false, rule: ''};
    }
  }

  return checkTwinXRules(C1, C2)
}

// Utility
const genfield = (DEFAULT_NUMBER_SET: number[], colsPerRow: number): Field => {
  const field = []
  for (let row=1; row<20; row+=colsPerRow) {
    const rarr = []
    while (rarr.length < colsPerRow) {
      const cell = gencell(uuidv7(), DEFAULT_NUMBER_SET[(row-1)+rarr.length])
      rarr.push(cell)
    }
    field.push(rarr)
  }
  return field
}

// const genrandfield = (DEFAULT_NS: number[], colsPerRow: number): Field => {
//   const field = []
//   const RANDOM_NS = DEFAULT_NS

//   for (let n=0; n<RANDOM_NS.length; n++) {
//     let randn = n
    
//     while (randn == n) randn = Math.min(Math.round(Math.random() * RANDOM_NS.length), 26);

//     console.log(randn);

//     [RANDOM_NS[n], RANDOM_NS[randn]] = [RANDOM_NS[randn], RANDOM_NS[n]];
//   }

  
//   for (let row=1; row<20; row+=colsPerRow) {
//     const rarr = []
//     while (rarr.length < colsPerRow) {
//       const cell = gencell(uuidv7(), RANDOM_NS[(row-1)+rarr.length])
//       rarr.push(cell)
//     }
//     field.push(rarr)
//   }
//   return field
// }

const gencell = (id: string, value: number): Cell => {
  return {
    id: id,
    value: value,
    isCrossed: false,
    isSelected: false,
    isClickedAndMatched: false,
    isPreview: false
  }
}

const isTelegramApp = (): boolean => {
  return Boolean(window.Telegram?.WebApp?.initData)
}

function getIsValidMobileContext(): boolean {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
  const isTelegram = isTelegramApp();

  return isMobile && (isStandalone || isTelegram);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const saveGame = (field?: Field, gameData?: GameData, time?: number) => {
  localStorage.setItem("field", JSON.stringify(field));
  localStorage.setItem("gdt", JSON.stringify(gameData));
  localStorage.setItem("gtime", JSON.stringify(time));
}

const reboot = () => {
  window.location.href = window.location.href;
}

const fetchLocalStorage = (key: string, fallbackData: any) => {
  const saved = localStorage.getItem(key);

  if (!saved) return fallbackData;

  try {
    const parsed = JSON.parse(saved);

    if (
      typeof fallbackData === "object" &&
      fallbackData !== null &&
      !Array.isArray(fallbackData)
    ) {
      return {
        ...fallbackData,
        ...parsed,
        distribution: {
          ...fallbackData.distribution,
          ...(parsed.distribution ?? {}),
        },
      };
    }

    return parsed;
  } catch {
    return fallbackData;
  }
};

const selectedCells = (field: Field): Cell[] => {
  const selected: Cell[] = [];

  for (const row of field) {
    for (const cell of row) {
      if (cell.isSelected) {
        selected.push(cell);

        if (selected.length === 2) {
          return selected;
        }
      }
    }
  }

  return selected;
};

const findDistanceBetween = (field: Field, [C1, C2]: Cell[]) => {
  const flatField = field.flat()
  const idx1 = flatField.findIndex(cell => cell.id === C1.id);
  const idx2 = flatField.findIndex(cell => cell.id === C2.id);
  const colidx1 = idx1%colsPerRow
  const colidx2 = idx2%colsPerRow
  const rowidx1 = Math.floor(idx1/colsPerRow)
  const rowidx2 = Math.floor(idx2/colsPerRow)

  if (colidx1 != colidx2) return idx2 - idx1;
  return rowidx2 - rowidx1;
}

const avgGain = (gameData: GameData) => {
  const weighted_gain = Math.floor(gameData.trueScore / gameData.moves)

  if (!isNaN(weighted_gain)) return weighted_gain
  return 'N/A'
}

const trackOrientation = (setPortraitMode: BooleanDispatch) => {
  const orientation = window.screen.orientation.type
  if (orientation == 'portrait-primary') {
    reboot()
  } else {
    setPortraitMode(false)
  }
}

const timeString = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${String(mins).padStart(2,'0')}:${String(remainingSeconds).padStart(2,'0')}`;
}

const scoreColorLevels = [
  { score: 0, color: "#9a9a9a" },
  { score: 200, color: "#87e18d" },
  { score: 400, color: "#56E35E" },
  { score: 700, color: "#4790F9" },
  { score: 1500, color: "#ffe435" },
  { score: 2800, color: "#ff524c" },
  { score: 4500, color: "#c61e18" },
  { score: 6500, color: "#b94fff" },
  { score: 9000, color: "#ff2baa" },
]

// const hexToRgb = (hex: string) => {
//   const n = parseInt(hex.slice(1), 16);
//   return {r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255}
// }

const scoreColor = (score: number) => {
  const levels = scoreColorLevels;

  if (score <= levels[0].score) return levels[0].color;
  if (score >= levels.at(-1)!.score) return levels.at(-1)!.color;

  for (let i = 0; i < levels.length - 1; i++) {
    const a = levels[i];
    const b = levels[i + 1];

    if (score <= b.score) {
      // const t = (score - a.score) / (b.score - a.score);
      // const c1 = hexToRgb(a.color);
      // const c2 = hexToRgb(b.color);
      // const r = Math.round(c1.r + (c2.r - c1.r) * t);
      // const g = Math.round(c1.g + (c2.g - c1.g) * t);
      // const bch = Math.round(c1.b + (c2.b - c1.b) * t);
      // return `rgb(${r}, ${g}, ${bch})`;

      return a.color
    }
  }

  return levels.at(-1)!.color;
}

const scoreRank = (score: number) => {
  for (let i = scoreColorLevels.length - 1; i >= 0; i--) {
    if (score >= scoreColorLevels[i].score) return i + 1;
  }
  return 1;
};

// const Actor = (
//   source: string,
//   about: string,
//   skillDescription: string,
//   color: string,
//   name?: string
// ): Actor => {
//   return {
//     'source': source,
//     'name': name ? name : source, 
//     'about': about,
//     'skillDescription': skillDescription,
//     'color': color
//   }
// }

const tickScore = (gd: GameData, setGD: Dispatch<SetStateAction<GameData>>) => {
  const remaining = gd.trueScore - gd.falsyScore;
  
  if (remaining === 0) return null;

  const direction = Math.sign(remaining);

  return setInterval(() => {
    setGD(prev => {
      const next = prev.falsyScore + direction;

      if (
        (direction > 0 && next >= prev.trueScore) ||
        (direction < 0 && next <= prev.trueScore)
      ) return {...prev, falsyScore: prev.trueScore}

      return {...prev, falsyScore: next}
    })
  }, 20);
};

let shiftX = 0;
let rotX = 0;
let rotY = 0;
let rotZ = 0;
const requestGyro = async () => {
  const norm = (n: number, lim: number = 40) => Math.min(Math.max(n, -lim), lim);

  const collectMotion = (event: DeviceMotionEvent) => {
    shiftX += (event.rotationRate?.beta ?? 0) / 100;
    shiftX = norm(shiftX);
    document.documentElement.style.setProperty("--gyro-shift-x", `${shiftX}px`);
    
    rotX += (event.rotationRate?.beta ?? 0) / 50;
    rotY += (event.rotationRate?.gamma ?? 0) / 50;
    rotZ += (event.rotationRate?.alpha ?? 0) / 50;
    rotX = norm(rotX);
    rotY = norm(rotY);
    rotZ = norm(rotZ);
    document.documentElement.style.setProperty("--gyro-rot-x", `${rotX}deg`);
    document.documentElement.style.setProperty("--gyro-rot-y", `${rotY}deg`);
    document.documentElement.style.setProperty("--gyro-rot-z", `${rotZ}deg`);
  };

  if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
    const permission = await (DeviceMotionEvent as any).requestPermission();

    if (permission === 'granted') {
        window.addEventListener('devicemotion', collectMotion);
    }

  } else {
    window.addEventListener('devicemotion', collectMotion);
  }
}

// const flat2Field = (
//   flatField: Cell[],
//   extraProps?: Partial<Cell> | ((row: number, col: number) => Partial<Cell>)
// ): Field => {
//   const newField: Cell[][] = []

//   for (let row=0; row < flatField.length; row += colsPerRow) newField.push(
//     flatField.slice(row, row+colsPerRow).map((cell, col) => ({
//       ...cell,
//       ...(typeof extraProps === 'function' ? extraProps(row, col) : extraProps)
//     }))
//   );

//   return newField
// }

// Configurational constants
const Folders = {
  'images': `/images`,
  'icons': `/icons`,
}
const colsPerRow = 9
const DEFAULT_NUMBER_SET =[1,2,3,4,5,6,7,8,9,1,1,1,2,1,3,1,4,1,5,1,6,1,7,1,8,1,9]
const INITIAL_GAME_DATA: GameData= {
  trueScore: 0,
  falsyScore: 0,
  gain: 0,
  moves: 0,
  deals: 0,
  rows: 3,
  maxrows: 3,
  xrule: 0,
  twinrule: 0,
  totalncount: 0,
  distribution: {
    1: 0, 2: 0, 3: 0,
    4: 0, 5: 0, 6: 0,
    7: 0, 8: 0, 9: 0,
  }
}
const rankBaseSize = 30
const scoreRanksDims: Record<number, number> = {
  1: rankBaseSize,
  2: rankBaseSize,
  3: rankBaseSize*1.25,
  4: rankBaseSize*1.25,
  5: rankBaseSize*1.29,
  6: rankBaseSize*1.33,
  7: rankBaseSize*1.5,
  8: rankBaseSize*1.58,
  9: rankBaseSize*1.71
}
// const ACTORS = [
//   Actor('1','','','#6F2BC5'),
//   Actor('2','','','#173BE8'),
//   Actor('3','','','#7BF3F1'),
//   Actor('4','','','#C7345F'),
//   Actor('5','','','#1B4439'),
//   Actor('6','','','#A22217'),
//   Actor('7','','','#9E2335'),
//   Actor('8','','','#0A2071'), // Olf guy, give ability to aim with gyro (floating cross) and shoot (cross out numbers). Create overlay with shoot btn on bottom, floating cross — floating, and N-shots left on top as big number in the middle.
//   Actor('9','','','#A7D955'),
// ]
const FIELD: Field = genfield(DEFAULT_NUMBER_SET, colsPerRow)
const sysThemes = [
  'vortex',
  'halo',
  'vortex_teal',
  'vortex_iris',
  'halo_iris',
  'forest',
  'crimson_supernova',
  'void_teal',
  'void_forest',
  'void_iris',
  'void_neon_violet'
];
const dynamicSysThemes = ['vortex','halo']
const isMobile = window.innerWidth < window.innerHeight
const isValidMobileContext = getIsValidMobileContext()
let requestPermission = window.isSecureContext;

// React components
function Tap({x, y}: Record<string, string>) {
  return (
    <span className={UI.word_tap}>
      Tap
      <img style={{'top': y, 'left': x}} src={`${Folders.icons}/not-standalone-case/tap.svg`} alt="tap icon" />
    </span>
  )
}

// localStorage.clear()

function Game() {
  const [field, setField] = useState<Field>(() => fetchLocalStorage('field', FIELD))
  const [gameData, setGameData] = useState<GameData>(() => fetchLocalStorage('gdt', INITIAL_GAME_DATA))
  const [time, setTime] = useState<number>(() => fetchLocalStorage('gtime', 0))
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('color-theme') ?? 'vortex')
  const [__, setPlayerActor] = useState<string | null>(null)
  const [actorPreview, _] = useState<Actor | null> (null)
  // const [selectActor, setSelectActor] = useState<(() => void) | null>(null)
  
  const fieldWrapperRef = useRef<DivRef>(null)
  const fssFirstDivRef = useRef<DivRef>(null)
  // const fssLastDivRef = useRef<DivRef>(null)
  
  const [hasMadeMove, setHasMadeMove] = useState(field.flat().some(cell => cell.isCrossed))
  const [hasEverDealt, setHasEverDealt] = useState(false)
  const [areWrongChoices, setAreWrongChoices] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [isSelection, setSelection] = useState(false)
  const [isResetting, setResetting] = useState(false)
  const [portraitMode, setPortraitMode] = useState(true)
  const [isGameActive, setGameActive] = useState(false)
  const [showAllStats, setShowAllStats] = useState(false)
  const [hasOpenedStats, setHasOpenedStats] = useState(false)
  const [showModal1, setShowModal1] = useState(false)
  const [showModal2, setShowModal2] = useState(false)
  const [showModal3, setShowModal3] = useState(requestPermission)
  // const [_, setActorDisplay] = useState(false)
  const [notifyBeforeReset, setNotifyBeforeReset] = useState(true)
  const [headerControlSectionOpen, setHeaderControlSectionOpen] = useState(false)

  const currentRank = scoreRank(gameData.falsyScore);
  const currentRankMinBoundary = scoreColorLevels[Math.max(currentRank-1, 0)].score
  const currentRankMaxBoundary = scoreColorLevels[Math.min(currentRank, scoreColorLevels.length-1)].score

  const cellClick = async (cell: Cell) => {
    if (waiting || cell.isSelected || isSelectionOverflow(field)) return
    if (!isGameActive) setGameActive(true)
  
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
        setSelection,
        gameData,
        setGameData,
        hasMadeMove,
        setHasMadeMove
      )
    }
  }

  const resetGame = () => {
    setResetting(true)
    setGameActive(false)
    setShowAllStats(false)
    setTime(0)
    setPlayerActor(null)
    setHasMadeMove(false)
    
    setField(FIELD)
    setGameData(INITIAL_GAME_DATA as unknown as GameData)
  }
  const setRulesBookState = () => {return}

  const dealProps = {
    field,
    setField,
    hasEverDealt,
    setHasEverDealt,
    gameData,
    setGameData,
    isGameActive,
    setGameActive,
  }

  // Deal "Enter" press event (re)set
  useEffect(() => {
    const press = (ev: KeyboardEvent) => {if (ev.key === "Enter") deal(dealProps)};

    document.body.addEventListener("keydown", press);
    return () => document.body.removeEventListener("keydown", press);
  }, [field]);

  // Game duration timer
  useEffect(() => {
    let timeInterval = null
    if (isGameActive) timeInterval = setInterval(() => {
      setTime((time) => time+1)
    }, 1000);

    return () => {if (timeInterval) clearInterval(timeInterval);}
    
  }, [isGameActive])

  // Auto-save
  useEffect(() => {
    saveGame(
      field,
      gameData,
      time,
    )
  }, [field,gameData,time])

  // Animate Score 
  useEffect(() => {
    const interval = tickScore(gameData, setGameData);
    return () => { if (interval) clearInterval(interval) }
  }, [gameData.trueScore]);
  
  // Theme 
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('color-theme', theme)
  }, [theme])

  // On DOMContentLoaded, load appropriate CSS, add event listeners, etc.
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); }
    
    if (!fieldWrapperRef.current) return

    fieldWrapperRef.current.style.setProperty('--gap', isMobile ? '0px' : '8px')
    fieldWrapperRef.current.style.setProperty('--cell-size', isMobile ? '40px' : '70px')
    fieldWrapperRef.current.style.setProperty('--font-size', isMobile ? '13px' : '22px')

    const onOrientation = () => trackOrientation(setPortraitMode)
    if (window.screen.orientation) window.screen.orientation.addEventListener("change", onOrientation);

    return () => {
      window.screen.orientation.removeEventListener('change', onOrientation);
    }    
  }, [])

  return (
    <Fragment>
      {!isMobile || isValidMobileContext ? (isMobile && !portraitMode ? (<>
          <div className={UI.portrait_mode_error}>
            <img src={`${Folders.icons}/portrait.rotate.svg`} alt="rotate your phone please" />
          </div>
        </>) : (
        (<>
          {showModal1 && (<Modal
            currentOpen={setShowModal1}
            title='just making sure'
            rawText='You are about to reset the game. / This action will reset the game completely erasing your current progress.'
            resultText='confirm'
            resultAction={resetGame}
            themeColor='#ff0800'
            silenceOption={true}
            notifyInFuture={setNotifyBeforeReset}
          ></Modal>)}

          {showModal2 && (<Modal
            currentOpen={setShowModal2}
            title='a refracted core'
            rawText='Every axiom stands as a foundation and no foundation is absolute. / Actors bend the rules without breaking the puzzle. / Master new ways to think, uncover unexpected strategies, and find the one that resonates with you.'
            resultText='ok'
            resultAction={() => {}}
            themeColor={actorPreview!.color}
            hideCancel={true}
          ></Modal>)}

          {requestPermission && showModal3 && (<Modal
            currentOpen={setShowModal3}
            title='permission request'
            rawText='Adding Gyroscope will boost gaming experience.'
            hint='This permission is required for the game.'
            resultText='Consent'
            resultAction={async () => { await requestGyro(); requestPermission=false; }}
            themeColor={'#646cff'}
            hideCancel={true}
            noskip={true}
          ></Modal>)}

          <div className={UI.app_immersion} style={dynamicSysThemes.includes(theme) ? {'--sys-accent-color': scoreColor(gameData.falsyScore)} as CSSProperties : {}}></div>

          <div className={UI.game_wrapper}>
            <div className={UI.header}>
              <div className={UI.score_display} style={{
                '--score-color': scoreColor(gameData.falsyScore), // THIS,
                '--score-level': Math.min(gameData.falsyScore / scoreColorLevels[scoreColorLevels.length-1].score, 1),
                '--progress':`${
                  (gameData.falsyScore - currentRankMinBoundary) / (currentRankMaxBoundary - currentRankMinBoundary)*100}%`,
                '--next-color': scoreColorLevels[Math.min(currentRank-1, scoreColorLevels.length-1)].color // AND THIS ARE TECHNICALLY THE SAME
              } as React.CSSProperties}>
                <div>
                  <p>{gameData.falsyScore}</p>
                </div>
                <div>
                  <img 
                    className={UI.score_rank} 
                    src={`${Folders.images}/ranks/rank${currentRank}.png`} 
                    width={scoreRanksDims[currentRank]} height={scoreRanksDims[currentRank]} />
                  <p>R{currentRank}</p>
                  {/* <p className={UI.rank_progress}>up</p> */}
                </div>
              </div>
              
              <div className={`${UI.controls} ${headerControlSectionOpen ? UI.open_controls : ''}`}>
                <div className={`${UI.controls_img_wrapper} ${UI.section_state_btn}`}>
                  <img
                    src={`${Folders.icons}/arrow.down.left.svg`}
                    style={headerControlSectionOpen ? {'transform':'rotate(90deg)'} : {}}
                    onClick={() => setHeaderControlSectionOpen(!headerControlSectionOpen)} />
                </div>

                <div className={UI.game_controls}>
                  <div className={UI.controls_img_wrapper}>
                    <img
                      className={`${isResetting && UI.animreset}`}
                      src={`${Folders.icons}/reset.svg`}
                      alt="Start new game"
                      onClick={() => hasMadeMove && (notifyBeforeReset ? setShowModal1(true) : resetGame())}
                      onAnimationEnd={() => setResetting(false)} />
                  </div>
                </div>

                <div className={UI.system_controls}>
                  <div className={UI.controls_img_wrapper}>
                    <img src={`${Folders.icons}/dial.low.fill.svg`} />
                  </div>
                  <div className={`${UI.controls_img_wrapper} ${UI.theme_switch}`}>
                    <img src={`${Folders.icons}/environments.fill.svg`} />
                  </div>
                  
                  <ThemeList sysOptions={sysThemes} currentTheme={theme} setTheme={setTheme} scrollEvent={themeListScroll} />
                </div>
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
                            {cell.isClickedAndMatched && 
                              <img id={UI.source_img} src={`${Folders.images}/shapes/${cell.value}-selected.png`} />}
                            <img id={cell.isClickedAndMatched ? UI.target_img : ''}
                              src={`${Folders.images}/shapes/${cell.value}-distorted.png`} />
                          </div>
                        ) : (
                          <div
                            className={UI.cell}
                            style={cell.isPreview ? {filter: 'brightness(30%)'} : {}}
                            onClick={() => !cell.isPreview && cellClick(cell)}
                          >
                            <img src={`${Folders.images}/shapes/${cell.value}${cell.isSelected ? (areWrongChoices ? '-err' : '-selected') : ''}.png`} />
                            <p>{cell.value}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className={UI.footer} style={dynamicSysThemes.includes(theme) ? {'--sys-accent-color': scoreColor(gameData.falsyScore)} as CSSProperties : {}}>
            <div className={`${UI.footer_bg} ${showAllStats ? UI.open_footer : ''}`}></div>

            {/* <div className={`${UI.actor_display}
              ${!actorDisplay && UI.actor_display_hidden}`}
              onClick={() => !actorDisplay && setActorDisplay(!actorDisplay)}
            >
              {actorDisplay && <img src={`${Folders.icons}/arrow.down.secondary.svg`} onClick={() => setActorDisplay(!actorDisplay)}></img>}
              {playerActor && <img src={`${Folders.images}/actors/${playerActor}.png`} alt='selected actor' />}
              {!actorDisplay && <img src={`${Folders.icons}/arrow.up.secondary.svg`} />}
            </div> */}

            <div className={UI.footer_scrollable_section}>
              <div ref={fssFirstDivRef} className={`${UI.footer_section} ${UI.dashboard}`}>
                <h1>dashboard</h1>

                <div className={UI.dashboard_stats}>
                  <div className={UI.dashstat}>
                    <p>{gameData.gain}</p>
                    <p>gain</p>
                  </div>

                  <div className={UI.dashstat}>
                    <p>{timeString(time)}</p>
                  </div>
                  <div className={UI.dashstat}>
                    <p>{gameData.moves}</p>
                    <p>moves</p>
                  </div>
                  <div className={UI.dashstat}>
                    <p>{gameData.deals}</p>
                    <p>deals</p>
                  </div>
                </div>

                <h1 className={`${showAllStats ? UI.h1_pressed : ''}`} onClick={() => {
                  setHasOpenedStats(true)
                  setShowAllStats(!showAllStats)
                }}>{!showAllStats ? 'see more' : 'see less'}</h1>
              </div>

              {/* <div ref={fssLastDivRef} className={`${UI.footer_section} ${UI.actors_selection_wrapper}`} style={!playerActor ? ({'--actor-theme': actorPreview?.color} as any) : {}}>
                {!playerActor ? (<>
                  <h1>{actorPreview?.name}<img src={`${Folders.icons}/qmark.svg`} onClick={() => setShowModal2(true)} /></h1>

                  <div className={UI.actors_selection}>
                    <div className={UI.actors_list} onScroll={(e) => {actorListScroll(e, setActorPreview, setSelectActor, setPlayerActor, setActorDisplay)}}>
                      {ACTORS.map((obj, i) => (
                        <div key={obj.source}>
                          <img 
                            src={`${Folders.images}/actors/${obj.source}.png`}
                            style={{'--shadow-color': obj.color} as React.CSSProperties}
                            data-actorid={i}
                          ></img>
                        </div>
                      ))}
                    </div>

                    <div className={UI.actors_selection_actions}>
                      <p onClick={() => selectActor!()}>select</p>
                      <p onClick={() => {}}>info</p>
                    </div>
                  </div>
                </>) : (<>
                  <h1>actor management</h1>
                  <div></div>
                </>)}

              </div> */}
            </div>

            <div className={`${UI.footer_section} ${UI.footer_btns}`}>
              {/* <div className={UI.skill_btns}>
                {'>>skill button<<'}
              </div> */}

              {/* <button className={UI.deal_preview} onClick={() => isGameActive && previewDeal(field, setField, isGameActive, setGameActive)}>
                <img src={`${Folders.icons}/eyes.svg`} alt="" />
              </button> */}

              <button className={UI.deal_btn} onClick={() => {hasMadeMove && deal(dealProps)}}>
                {/* <p>deal</p> */}
                <img src={`${Folders.icons}/plus.square.svg`} />
              </button>

              <div className={UI.footer_controls_row}>
                <div className={UI.footer_btn_wrapper} onClick={setRulesBookState}>
                  <img src={`${Folders.icons}/book.svg`} alt="see rules" />
                </div>
                <div className={UI.footer_btn_wrapper} onClick={reboot}>
                  <img src={`${Folders.icons}/exclamark.restart.svg`} alt="reboot" />
                </div>
              </div>
            </div>

            {/* Turn into a component? */}
            <div className={`${UI.all_stats} ${hasOpenedStats && (showAllStats ? UI.all_stats_window_enter : UI.all_stats_window_leave)}`}>
              <div className={UI.all_stats_section}>
                <h1>statistics</h1>

                <div className={UI.stat}>
                  <p>score</p>
                  <p>{gameData.falsyScore}</p>
                </div>
                <div className={UI.stat}>
                  <p>duration</p>
                  <p>{timeString(time)}</p>
                </div>
                <div className={UI.stat}>
                  <p>avg. gain</p>
                  <p>{avgGain(gameData)}</p>
                </div>
                <div className={UI.stat}>
                  <p>moves</p>
                  <p>{gameData.moves}</p>
                </div>
                <div className={UI.stat}>
                  <p>deals</p>
                  <p>{gameData.deals}</p>
                </div>
                <div className={UI.stat}>
                  <p>sum 10 rule</p>
                  <p>{gameData.xrule}</p>
                </div>
                <div className={UI.stat}>
                  <p>twin rule</p>
                  <p>{gameData.twinrule}</p>
                </div>
                <div className={UI.stat}>
                  <p>rows</p>
                  <p>{gameData.rows}</p>
                </div>
                <div className={UI.stat}>
                  <p>max. rows</p>
                  <p>{gameData.maxrows == 3 && '(def.) '}{gameData.maxrows}</p>
                </div>
              </div>
              <div className={UI.all_stats_section}>
                <h1>spread</h1>

                <div className={UI.cells_stats}>
                  {Object.entries(gameData.distribution).sort(([,a],[,b]) => b-a).map(([key,value]) => (
                    <div key={key} className={UI.cell_stat}>
                      <img src={`${Folders.images}/shapes/${key}.png`}></img>
                      <p>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>)
      )) : (<>
        <div className={UI.header}>
          <div className={UI.logo_wrapper}>
            <p>axioma</p>
            <img src={`${Folders.icons}/not-standalone-case/install.svg`} alt="icon" />
          </div>
        </div>

        <div className={UI.not_standalone_case}>
          <div className={UI.nsc_title}>
            <div className={UI.nsc_title_add}>
              <img src={`${Folders.icons}/not-standalone-case/app.svg`} alt="icon" />
              <p>add</p>
            </div>
            <h1>to <br />Home Screen</h1>
          </div>
          
          <p className={UI.nsc_short_text}>
            Launch as an app for <mark>immersive play</mark> experience.<br />
            Built for total <mark>gameplay integrity</mark> and <mark>maximum screen space</mark>.<br />
          </p>

          <details>
            <summary>How?</summary>

            <div className={UI.details_content}>
              <p id={UI.hint}><i>*Tap the highlighted red boxes on your phone to complete each step</i></p>
              <h1>1</h1>
              <div className={UI.d_section}>
                <p><Tap x='70vw' y='27px' /> and Open the <mark>browser menu</mark>.</p>
                <img style={{'width': 'auto'}} src={`${Folders.images}/nsc/step1.png`} alt='Step 1'/>
              </div>
              <h1>2</h1>
              <div className={`${UI.d_section} ${UI.d_row}`}>
                <p><Tap x='60vw' y='-8px' /> the Share button and Open the <mark>share menu</mark>.</p>
                <img src={`${Folders.images}/nsc/step2.png`} alt='Step 2'/>
              </div>
              <h1>3</h1>
              <div className={`${UI.d_section} ${UI.d_row}`}>
                <p>Scroll down and <Tap x='38vw' y='237px' /> <mark>"Add to Home Screen"</mark>.</p>
                <img src={`${Folders.images}/nsc/step3.png`} alt='Step 3'/>
              </div>
              <h1>4</h1>
              <div className={UI.d_section}>
                <p><mark>Name</mark> the shortcut link as shown below.</p>
                <img src={`${Folders.images}/nsc/step4.jpeg`} alt='Step 4'/>
              </div>
              <h1>5</h1>
              <div className={UI.d_section}>
                <p>Ensure "Open as Web App" is <mark>enabled</mark>.</p>
                <img src={`${Folders.images}/nsc/step5.jpeg`} alt='Step 5'/>
              </div>
              <h1>6</h1>
              <div className={UI.d_section}>
                <p><Tap x='74vw' y='36px' /> <mark>"Add"</mark> to <mark>Save&Finish</mark> installation to your Home Screen.</p>
                <img src={`${Folders.images}/nsc/step6.png`} alt='Step 6'/>
              </div>
              <div className={`${UI.d_section} ${UI.d_row}`}>
                <p>
                  <span><img id={UI.installation_complete} src={`${Folders.icons}/not-standalone-case/party.popper.svg`} /></span>
                  <mark id={UI.installation_complete_text}>Ready to play!</mark><br />
                  Open the App from your Home Screen for a <mark>completely immersive experience</mark>.
                </p>
                <img src={`${Folders.images}/nsc/result.jpeg`} alt='Step 6'/>
              </div>
            </div>
          </details>
        </div>
      </>)}
    </Fragment>
  )
}

export default Game;
