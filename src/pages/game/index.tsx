import UI from './index.module.css'

import React, { Fragment, useEffect, useReducer, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction, type UIEvent } from 'react'
import { v7 as uuidv7 } from 'uuid';
import ThemeList from '../../components/theme-list';
import Modal from '../../components/modal-window';
import { gameReducer, type Actor, type Cell, type Field, type GameData, type GameState } from '../../utils/game';
import type { InterfaceState } from '../../utils/interface';
import { getFromLS, reboot } from '../../utils/functions';
import { CGAME, FOLDERS, isDeployPush, LS_SCHEME } from '../../constants';

const generateField = (type: string = 'CLASSIC'): Field => {
  const field = []
  const digitSource = CGAME.def_ns;

  if (type === 'RANDOM') {
    for (let n = 0; n < digitSource.length; n++) {
      let randn = n
      while (randn == n) randn = Math.min(Math.round(Math.random() * digitSource.length), 26);
      [digitSource[n], digitSource[randn]] = [digitSource[randn], digitSource[n]];
    }
  }

  for (let row = 1; row < 20; row += CGAME.cpr) {
    const rarr = []

    while (rarr.length < CGAME.cpr) rarr.push({
      id: uuidv7(),
      value: digitSource[(row-1)+rarr.length],
      isCrossed: false,
      isSelected: false,
      isClickedAndMatched: false,
      isPreview: false
    });

    field.push(rarr)
  }

  return field;
}

const processSelection = (field: Field, selectedCells: Cell[], gameState: GameState, gameDispatch: Dispatch<any>, resetGame: Function) => {
  if (!canMatch(field, selectedCells)) {
    pairMismatch(gameDispatch);
    return;
  }

  const [C1, C2] = selectedCells;
  const selectedAreEqual = C1.value == C2.value;
  const rule = selectedAreEqual ? 'twinrule' : 'xrule';
  const baseScore = selectedAreEqual ? 8 : 18;
  const flatField = field.flat()
  const idx1 = flatField.findIndex(cell => cell.id === C1.id);
  const idx2 = flatField.findIndex(cell => cell.id === C2.id);
  const distance = idx1 % CGAME.cpr != idx2 % CGAME.cpr ? (idx2 - idx1) : (Math.floor(idx2 / CGAME.cpr) - Math.floor(idx1 / CGAME.cpr));
  const dScore = baseScore + (distance * 2);
  const totalncount = gameState.data.totalncount + 2;
  const newDistribution = { ...gameState.data.distribution }
  const updatedField: Field = field.map(row => row.map(cell => cell.id === C1.id || cell.id === C2.id ? {
    ...cell,
    isCrossed: true,
    isSelected: false,
    isClickedAndMatched: true,
  } : cell)) as unknown as Field;

  if (selectedAreEqual) {
    newDistribution[C1.value] = (newDistribution[C1.value] ?? 0) + 2;
  } else {
    newDistribution[C1.value] = (newDistribution[C1.value] ?? 0) + 1;
    newDistribution[C2.value] = (newDistribution[C2.value] ?? 0) + 1;
  }

  gameDispatch({ act: 'UPDATE', field: updatedField })
  gameDispatch({ act: 'CLEAR_WAIT' })
  gameDispatch({ act: 'UPDATE', data: {
    trueScore: (gameState.data.trueScore ?? 0) + dScore,
    moves: (gameState.data.moves ?? 0) + 1,
    totalncount: totalncount,
    distribution: newDistribution,
    [rule]: (gameState.data[rule] ?? 0) + 1,
  } })
  
  // WIN case
  for (const row of updatedField) for (const cell of row) if (!cell.isCrossed) return;
  
  const resultGameData: GameData = {
    ...gameState.data,
    trueScore: (gameState.data.trueScore ?? 0) + dScore,
    moves: (gameState.data.moves ?? 0) + 1,
    totalncount: totalncount,
    distribution: newDistribution,
    [rule]: (gameState.data[rule] ?? 0) + 1,
  }

  alert(
    'You win, congratulations!'+
    '\nStats:'+
    `\n  Score: ${resultGameData.trueScore}`+
    `\n  Avg. Gain: ${calcAvgGain(resultGameData)}`+
    `\n  Moves: ${resultGameData.moves}`+
    `\n  Deals: ${resultGameData.deals}`+
    `\n  Sum 10 Rule: ${resultGameData.xrule}`+
    `\n  Twin Rule: ${resultGameData.twinrule}`+
    `\n  Rows: ${resultGameData.rows}`+
    `\n  Max. Rows: ${resultGameData.maxrows}`
  );

  resetGame();
}

const pairMismatch = (gameDispatch: Dispatch<any>) => {
  gameDispatch({ act: 'PAIR_MISMATCH' });

  setTimeout(() => {
    gameDispatch({ act: 'CLEAR_MISMATCH' });
    gameDispatch({ act: 'RESET_SELECTION' });
  }, 300);
}

const canMatch = (field: Field, [C1, C2]: Cell[]): boolean => {
  const flatField = field.flat();
  let idx1 = flatField.findIndex(cell => cell.id === C1.id);
  let idx2 = flatField.findIndex(cell => cell.id === C2.id);

  if (idx1 === -1 || idx2 === -1) return false;
  if (C1.value !== C2.value && C1.value + C2.value !== 10) return false;
  if (idx1 > idx2) [idx1, idx2] = [idx2, idx1];

  const colidx1 = idx1 % CGAME.cpr;
  const colidx2 = idx2 % CGAME.cpr;

  if (colidx1 !== colidx2) {
    for (let i = idx1 + 1; i < idx2; i++) { if (!flatField[i].isCrossed) return false; }
    return true;
  }

  for (let i = idx1 + CGAME.cpr; i < idx2; i += CGAME.cpr) if (!flatField[i].isCrossed) return false;

  return true;
};

const getSelectedCells = (field: Field): Cell[] => {
  const selected: Cell[] = [];

  for (const row of field) for (const cell of row) if (cell.isSelected) {
    selected.push(cell);
    if (selected.length === 2) return selected;
  }

  return selected;
};

const deal = (field: Field, gameState: GameState, gameDispatch: Dispatch<any>) => {
  if (!gameState.isActive) gameDispatch({ act: 'RESUME' });

  const flatField = field.flat()
  const activeNumbers: Cell[] = flatField.filter(cell => !cell.isCrossed)
  
  if (activeNumbers.length === 0) return;

  const dealtCells: Cell[] = [...flatField, ...activeNumbers];
  const freshField: Cell[][] = [];
  let removedRows = 0;

  for (let i=0; i < dealtCells.length; i += CGAME.cpr) {
    const row = dealtCells.slice(i, i + CGAME.cpr).map(cell => ({ ...cell, id: uuidv7(), isSelected: false, isClickedAndMatched: false }));
    if (row.some(cell => !cell.isCrossed)) freshField.push(row); else removedRows++;
  }

  const grew = freshField.length > field.length
  let dScore = 0
  const nCost = 10
  const rowReward = 100

  if (grew) dScore -= (freshField.slice(field.length).flat().length * nCost)
  dScore += removedRows * rowReward

  gameDispatch({ act: 'UPDATE', field: freshField })
  gameDispatch({ act: 'UPDATE', data: {
    trueScore: Math.max((gameState.data.trueScore ?? 0) + dScore, 0),
    deals: (gameState.data.deals ?? 0) + 1,
    rows: freshField.length,
    maxrows: Math.max(freshField.length, (gameState.data.maxrows ?? 0)),
  } })
}

// const previewDeal = (field: Field, setField: FieldDispatch, isGameActive: boolean, setGameActive: BooleanDispatch) => {
//   if (!isGameActive) setGameActive(true);

//   const flatField = field.flat()
//   const activeNumbers: Cell[] = flatField.filter(cell => !cell.isCrossed)
  
//   if (activeNumbers.length === 0) return;

//   setField(flat2Field([...flatField, ...activeNumbers], (row, col) => ({id: uuidv7(), isSelected: false, isClickedAndMatched: false, isPreview: row+col>flatField.length-1})));
// }

// const flat2Field = (
//   flatField: Cell[],
//   extraProps?: Partial<Cell> | ((row: number, col: number) => Partial<Cell>)
// ): Field => {
//   const newField: Cell[][] = []

//   for (let row=0; row < flatField.length; row += CGAME.cpr) newField.push(
//     flatField.slice(row, row+CGAME.cpr).map((cell, col) => ({
//       ...cell,
//       ...(typeof extraProps === 'function' ? extraProps(row, col) : extraProps)
//     }))
//   );

//   return newField
// }

const calcAvgGain = (gameData: GameData) => {
  const weighted_gain = Math.floor(gameData.trueScore / gameData.moves);
  return isNaN(weighted_gain) ? 'N/A' : weighted_gain;
}

const timeString = (seconds: number) => {
  const s = Math.floor(Number(seconds) || 0);
  const mins = Math.floor(s / 60);
  const remainingSeconds = s % 60;
  return `${String(mins).padStart(2,'0')}:${String(remainingSeconds).padStart(2,'0')}`;
}

const Actor = (
  source: string,
  // about: string,
  // skillDescription: string,
  color: string,
  name?: string
): Actor => {
  // 'about': about,
  // 'skillDescription': skillDescription,
  return {
    'source': source,
    'name': name ? name : source, 
    'color': color
  }
}

let shiftX = 0;
let rotX = 0;
let rotY = 0;
let isGyroRotationReset = false;
const requestGyro = async () => {
  const norm = (n: number, lim: number = 40) => Math.min(Math.max(n, -lim), lim);

  const gyroRotationReset = () => {
    isGyroRotationReset = true;
    
    const steps = 15;
    const rate = .7;
    let currentStep = 0;

    const smoothening = () => {
      if (currentStep >= steps) {
        rotX = 0; rotY = 0;
        isGyroRotationReset = false;
        return;
      }

      rotX *= rate; rotY *= rate;
      document.documentElement.style.setProperty("--gyro-rot-x", `${rotX}deg`);
      document.documentElement.style.setProperty("--gyro-rot-y", `${rotY}deg`);

      currentStep++;
      requestAnimationFrame(smoothening);
    };
    requestAnimationFrame(smoothening);
  };

  setInterval(gyroRotationReset, 10000);

  const collectMotion = (event: DeviceMotionEvent) => {
    if (isGyroRotationReset) return;

    shiftX += (event.rotationRate?.beta ?? 0) / 100;
    shiftX = norm(shiftX);
    document.documentElement.style.setProperty("--gyro-shift-x", `${shiftX}px`);
    
    rotX += (event.rotationRate?.alpha ?? 0) / 70;
    rotY -= (event.rotationRate?.beta ?? 0) / 70;
    rotX = norm(rotX); rotY = norm(rotY);
    document.documentElement.style.setProperty("--gyro-rot-x", `${rotX}deg`);
    document.documentElement.style.setProperty("--gyro-rot-y", `${rotY}deg`);
  };

  if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
    const permission = await (DeviceMotionEvent as any).requestPermission();

    if (permission === 'granted') {
        window.addEventListener('devicemotion', collectMotion);
        return;
    }
  }

  window.addEventListener('devicemotion', collectMotion);
}

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
    const maxRotation = 90

    parent.childNodes.forEach((childNode: any) => {
      const child = childNode as HTMLDivElement;
      const childRect = childNode.getBoundingClientRect() as DOMRect;
      const dist = Math.round(parentRect.y + parentRect.height/2 - childRect.y - childRect.height/2);
      
      const scale = Math.min(smoothScale(Math.abs(dist), parent.clientHeight), 1)
      const rotation = Math.max(Math.min(dist/1.5, maxRotation), -maxRotation);
      
      child.style.transform = `
        scale(${scale})
        rotateX(${rotation}deg)
      `;
      if (Math.abs(dist) >= 52) child.style.transform = 'scale(0)';
        
      const theme = child.children[0].textContent.split(' ').join('_');
      if (Math.abs(dist) <= 10 && theme !== currentTheme) scheduleTheme(theme);
    })
  });
};

const footerDivScroll = (e: UIEvent, firstDivRef: DivRef, lastDivRef: DivRef) => {
  if (!firstDivRef || !lastDivRef) return;

  const parent = e.currentTarget as HTMLDivElement;

  requestAnimationFrame(() => {
    const parentRect = parent.getBoundingClientRect();

    const dist1 = Math.round(Math.abs(parentRect.y - firstDivRef.getBoundingClientRect().y));
    const dist2 = Math.round(Math.abs(parentRect.y - lastDivRef.getBoundingClientRect().y));

    firstDivRef.style.transform = `scale(${smoothScale(dist1, parent.clientHeight)})`;
    lastDivRef.style.transform = `scale(${smoothScale(dist2, parent.clientHeight)})`;
  });
};

const actorListScroll = (
  e: UIEvent,
  setActorPreviewColor: Dispatch<SetStateAction<Actor | null>>,
  setSelectActor: Dispatch<SetStateAction<(() => void) | null>>,
  setPlayerActor: Dispatch<SetStateAction<string | null>>,
  setActorDisplay: BooleanDispatch,
) => {
  const parent = e.currentTarget as HTMLDivElement;

  requestAnimationFrame(() => {
    const parentRect = parent.getBoundingClientRect();

    for (const child of parent.children) {
      const dist = Math.round(Math.abs(parentRect.x + parent.clientWidth/2 - child.getBoundingClientRect().x - child.clientWidth/2))
      const scale = 1 - Math.min(dist / parent.clientWidth, 1);
      (child as HTMLElement).style.transform = `scale(${scale})`;

      if (dist <= 10) {
        const obj = ACTORS[(child.children[0] as HTMLElement).dataset.actorid as any]
        console.log(obj)
        setActorPreviewColor(obj)
        setSelectActor(() => () => {setPlayerActor(obj.source); setActorDisplay(true)})
      }
    }
  });
};

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
const INITIAL_GAME_DATA: GameData= {
  duration: 0,
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
const baseRankImgSize = 30
const scoreRankData: Record<number, { 'size':number, 'padding':number }> = {
  1: { size: baseRankImgSize, padding: 4 },
  2: { size: baseRankImgSize, padding: 4 },
  3: { size: baseRankImgSize*1.25, padding: 2 },
  4: { size: baseRankImgSize*1.25, padding: 2 },
  5: { size: baseRankImgSize*1.29, padding: 0 },
  6: { size: baseRankImgSize*1.33, padding: 0 },
  7: { size: baseRankImgSize*1.5, padding: 0 },
  8: { size: baseRankImgSize*1.58, padding: 0 },
  9: { size: baseRankImgSize*1.7, padding: 0 }
}
const ACTORS = [
  Actor('1','#6F2BC5'),
  Actor('2','#173BE8'),
  Actor('3','#7BF3F1'),
  Actor('4','#C7345F'),
  Actor('5','#1B4439'),
  Actor('6','#A22217'),
  Actor('7','#9E2335'),
  Actor('8','#0A2071'), // Olf guy, give ability to aim with gyro (floating cross) and shoot (cross out numbers). Create overlay with shoot btn on bottom, floating cross — floating, and N-shots left on top as big number in the middle.
  Actor('9','#A7D955'),
]
const interfaceThemeList = [
  'vortex',
  'halo',
  'vortex_teal',
  'vortex_iris',
  'halo_iris',
  'forest',
  'deep_ocean',
  'photic_ocean',
  'crimson_supernova',
  'void_teal',
  'void_forest',
  'void_iris',
  'void_neon_violet'
];
const dynamicSysThemes = ['vortex','halo']

interface T {
  type: 'CLASSIC'
  interfaceState: InterfaceState
  interfaceDispatch: Dispatch<any>
}

function Game({ type, interfaceState, interfaceDispatch }: T) {
  const GAME_STATE: GameState = {
    field: getFromLS(LS_SCHEME.gameField, generateField(type)),
    data: getFromLS(LS_SCHEME.gameData, INITIAL_GAME_DATA),
    isStarted: getFromLS(LS_SCHEME.gameStarted, false),
    isWaiting: false,
    isActive: false,
    isMismatch: false,
  }

  const [gameState, gameDispatch] = useReducer(gameReducer, GAME_STATE);
  
  const fieldWrapperRef = useRef<DivRef>(null);
  const fssFirstDivRef = useRef<DivRef>(null);
  const fssLastDivRef = useRef<DivRef>(null);
  
  // Actor related fields are associates with game logic => store in gameState
  const [_, setActorDisplay] = useState(false);
  const [playerActor, setPlayerActor] = useState<string | null>(null);
  const [actorPreview, setActorPreview] = useState<Actor | null> (null);
  const [selectActor, setSelectActor] = useState<(() => void) | null>(null);

  const currentRank = scoreColorLevels.findLastIndex(level => gameState.data.falsyScore >= level.score) + 1;
  const currentRankColor = scoreColorLevels.findLast(level => gameState.data.falsyScore >= level.score)?.color ?? scoreColorLevels[0].color;

  const processCellClick = (cell: Cell) => {
    if (gameState.isWaiting || cell.isSelected) return
    if (!gameState.isStarted) gameDispatch({ act: 'START' })
    if (!gameState.isActive) gameDispatch({ act: 'RESUME' })

    const updatedField: Field = gameState.field.map(row => row.map(c => c.id === cell.id ? { ...c, isSelected: true } : c)) as unknown as Field
    const selectedCells = getSelectedCells(updatedField);
    
    gameDispatch({ act: 'UPDATE', field: updatedField });

    if (selectedCells.length === 2) processSelection(updatedField, selectedCells, gameState, gameDispatch, resetGame);
  }

  const resetGame = () => {
    interfaceDispatch({ act: 'SET_POPUP', popup: 'fullStats', show: false })
    setPlayerActor(null)
    gameDispatch({act: 'RESET_GAME', state: {
      field: generateField(type),
      data: INITIAL_GAME_DATA,
      isStarted: false,
      isWaiting: false,
      isActive: false,
      isMismatch: false,
    }})
  }
  
  const setRulesBookState = () => {return}

  // Deal "Enter" press event (re)set
  useEffect(() => {
    const press = (ev: KeyboardEvent) => {if (ev.key === "Enter") deal(gameState.field, gameState, gameDispatch)};

    document.body.addEventListener("keydown", press);
    return () => document.body.removeEventListener("keydown", press);
  }, [gameState.field, gameState]);

  // Game duration timer
  useEffect(() => {
    let timeInterval: any = null
    if (gameState.isActive) timeInterval = setInterval(() => gameDispatch({ act:'TICK' }), 1000);

    return () => { if (timeInterval) clearInterval(timeInterval) }
  }, [gameState.isActive])

  // Auto-save
  useEffect(() => {
    localStorage.setItem(LS_SCHEME.gameField, JSON.stringify(gameState.field));
    localStorage.setItem(LS_SCHEME.gameData, JSON.stringify(gameState.data));
    localStorage.setItem(LS_SCHEME.gameStarted, JSON.stringify(gameState.isStarted));
  }, [gameState.field, gameState.data, gameState.isStarted])

  // Animate Score 
  useEffect(() => {
    let cur = gameState.data.falsyScore;
    const target = gameState.data.trueScore;
    if (cur === target) return;
    const direction = Math.sign(target - cur);

    const id = setInterval(() => {
      cur = cur + direction;
      const done = (direction > 0 && cur >= target) || (direction < 0 && cur <= target);
      gameDispatch({ act: 'UPDATE', data: { falsyScore: done ? target : cur } });
      if (done) clearInterval(id);
    }, 20);

    return () => { clearInterval(id) }
  }, [gameState.data.trueScore]);
  
  // Theme 
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', interfaceState.interfaceTheme);
    localStorage.setItem(LS_SCHEME.interfaceColorTheme, interfaceState.interfaceTheme)
  }, [interfaceState.interfaceTheme])

  // On DOMContentLoaded, load appropriate CSS, add event listeners, etc.
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); }
    
    if (!fieldWrapperRef.current) return

    fieldWrapperRef.current.style.setProperty('--gap', interfaceState.context.isMobile ? '0px' : '8px')
    fieldWrapperRef.current.style.setProperty('--cell-size', interfaceState.context.isMobile ? '40px' : '70px')
    fieldWrapperRef.current.style.setProperty('--font-size', interfaceState.context.isMobile ? '13px' : '22px')

    const onOrientationChange = () => !window.screen.orientation.type.includes('portrait') ? interfaceDispatch({ act: 'ENTER_LANDSCAPE' }) : reboot();

    if (window.screen.orientation) window.screen.orientation.addEventListener("change", onOrientationChange);

    return () => window.screen.orientation.removeEventListener('change', onOrientationChange);
  }, [])

  return (
    <Fragment>
      {interfaceState.popups.gameResetConfirmation && (<Modal
        interfaceName='gameResetConfirmation'
        interfaceDispatch={interfaceDispatch}
        title='just making sure'
        rawText='You are about to reset the gameState. / This action will reset the game completely erasing your current progress.'
        validateBtnText='confirm'
        onValidateAction={resetGame}
        accentColor='#ff0800'
        silenceOption={true}
        settingField='notifyBeforeReset'
      ></Modal>)}

      {interfaceState.popups.aboutActors && (<Modal
        interfaceName='aboutActors'
        interfaceDispatch={interfaceDispatch}
        title='a refracted core'
        rawText='Every axiom stands as a foundation and no foundation is absolute. / Actors bend the rules without breaking the puzzle. / Master new ways to think, uncover unexpected strategies, and find the one that resonates with you.'
        validateBtnText='ok'
        onValidateAction={() => {}}
        accentColor={actorPreview!.color}
        hideCancel={true}
      ></Modal>)}

      {interfaceState.popups.gyroscopePermissionRequest && (<Modal
        interfaceName='gyroscopePermissionRequest'
        interfaceDispatch={interfaceDispatch}
        title='permission request'
        rawText='Adding Gyroscope will boost gaming experience.'
        hint='This permission is required for the gameState.'
        validateBtnText='Consent'
        onValidateAction={async () => { await requestGyro(); }}
        accentColor={'#646cff'}
        hideCancel={true}
        noskip={true}
      ></Modal>)}

      <div className={UI.app_immersion} style={dynamicSysThemes.includes(interfaceState.interfaceTheme) ? {'--sys-accent-color': currentRankColor} as CSSProperties : {}}></div>

      <div className={`${UI.header} ${interfaceState.popups.headerFullControls ? UI.full : ''}`}
        style={dynamicSysThemes.includes(interfaceState.interfaceTheme) ? {'--sys-accent-color': currentRankColor} as CSSProperties : {}}
      >
        <div className={`${UI.controls_img_wrapper} ${UI.exit_btn}`} style={{'--image': `url('${FOLDERS.icons}/exit.svg')`} as CSSProperties}></div>

        <div className={UI.score_display} style={{
          '--score-color': currentRankColor, // THIS,
          '--score-level': Math.min(gameState.data.falsyScore / scoreColorLevels[scoreColorLevels.length-1].score, 1),
          '--progress':`${
            100 * (gameState.data.falsyScore - scoreColorLevels[Math.max(currentRank-1, 0)].score) /
            (scoreColorLevels[Math.min(currentRank, scoreColorLevels.length-1)].score - scoreColorLevels[Math.max(currentRank-1, 0)].score)
          }%`,
          '--next-color': scoreColorLevels[Math.min(currentRank-1, scoreColorLevels.length-1)].color // AND THIS ARE TECHNICALLY THE SAME
        } as React.CSSProperties}>
          <div><p>{gameState.data.falsyScore}</p></div>
          <div>
            <p>R{currentRank}</p>
            <img 
              className={UI.score_rank} 
              src={`${FOLDERS.images}/ranks/rank${currentRank}.png`} 
              width={scoreRankData[currentRank].size} height={scoreRankData[currentRank].size}
              style={{padding: `${scoreRankData[currentRank].padding}px`}} />
          </div>
        </div>
        
        <div className={UI.controls}>
          <div className={UI.controls_img_wrapper}>
            <img
              src={`${FOLDERS.icons}/arrow.down.left.svg`}
              style={interfaceState.popups.headerFullControls ? {transform:'rotate(270deg)'} : {transform: 'rotate(90deg)'}}
              onClick={() => interfaceDispatch({ act: 'SET_POPUP', popup: 'headerFullControls', show: !interfaceState.popups.headerFullControls })} />
          </div>
          <div className={UI.controls_img_wrapper}>
            <img
              src={`${FOLDERS.icons}/reset.svg`}
              alt="Start new game"
              onClick={() => gameState.isStarted && (interfaceState.preferences.notifyBeforeReset ? interfaceDispatch({ act: 'SET_POPUP', popup: 'gameResetConfirmation', show: true }) : resetGame())} />
          </div>
        </div>

        <div className={UI.system_controls}>
          <div className={UI.controls_img_wrapper}>
            <img src={`${FOLDERS.icons}/gear.svg`} />
          </div>
          <div className={`${UI.controls_img_wrapper} ${UI.theme_switch}`}>
            <img src={`${FOLDERS.icons}/brush.svg`} />
          </div>
          
          <ThemeList sysOptions={interfaceThemeList} currentTheme={interfaceState.interfaceTheme} interfaceDispatch={interfaceDispatch} scrollEvent={themeListScroll} />
        </div>
      </div>

      <div ref={fieldWrapperRef} className={UI.field_wrapper}>
        {gameState.field.map((row, ridx) => (
          <div key={ridx} className={UI.row}>
            {row.map((cell,_) => {
              return (
                <div key={cell.id}>
                  {cell.isCrossed ? (
                    <div className={`${UI.cell} ${UI.crossed}`}>
                      {cell.isClickedAndMatched && <img id={UI.source_img} src={`${FOLDERS.images}/shapes/${cell.value}-selected.png`} />}
                      <img id={cell.isClickedAndMatched ? UI.target_img : ''} src={`${FOLDERS.images}/shapes/${cell.value}-distorted.png`} />
                    </div>
                  ) : (
                    <div
                      className={UI.cell}
                      style={cell.isPreview ? {filter: 'brightness(30%)'} : {}}
                      onClick={() => !cell.isPreview && processCellClick(cell)}
                    >
                      <img src={`${FOLDERS.images}/shapes/${cell.value}${cell.isSelected ? (gameState.isMismatch ? '-err' : '-selected') : ''}.png`} />
                      <p>{cell.value}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className={UI.footer} style={dynamicSysThemes.includes(interfaceState.interfaceTheme) ? {'--sys-accent-color': currentRankColor} as CSSProperties : {}}>
        <div className={`${UI.footer_bg} ${interfaceState.popups.fullStats ? UI.open : ''}`}></div>

        {/* <div className={`${UI.actor_display}
          ${!actorDisplay && UI.actor_display_hidden}`}
          onClick={() => !actorDisplay && setActorDisplay(!actorDisplay)}
        >
          {actorDisplay && <img src={`${FOLDERS.icons}/arrow.down.secondary.svg`} onClick={() => setActorDisplay(!actorDisplay)}></img>}
          {playerActor && <img src={`${FOLDERS.images}/actors/${playerActor}.png`} alt='selected actor' />}
          {!actorDisplay && <img src={`${FOLDERS.icons}/arrow.up.secondary.svg`} />}
        </div> */}

        <div className={UI.footer_scrollable_section} onScroll={(e) => !isDeployPush && footerDivScroll(e, fssFirstDivRef.current, fssLastDivRef.current)}>
          <div ref={fssFirstDivRef} className={`${UI.footer_section} ${UI.dashboard}`}>
            <h1>dashboard</h1>

            <div className={UI.dashboard_stats}>
              <div className={UI.dashstat}>
                <p>{gameState.data.gain}</p>
                <p>gain</p>
              </div>

              <div className={UI.dashstat}>
                <p>{timeString(gameState.data.duration)}</p>
              </div>
              <div className={UI.dashstat}>
                <p>{gameState.data.moves}</p>
                <p>moves</p>
              </div>
              <div className={UI.dashstat}>
                <p>{gameState.data.deals}</p>
                <p>deals</p>
              </div>
            </div>

            <h1 className={`${interfaceState.popups.fullStats ? UI.h1_pressed : ''}`} onClick={() => interfaceDispatch({ act: 'SET_POPUP', popup: 'fullStats', show: !interfaceState.popups.fullStats })}>
              {!interfaceState.popups.fullStats ? 'see more' : 'see less'}
            </h1>
          </div>

          {!isDeployPush && <div ref={fssLastDivRef} className={`${UI.footer_section} ${UI.actors_selection_wrapper}`} style={!playerActor ? ({'--actor-theme': actorPreview?.color} as any) : {}}>
            {!playerActor ? (<>
              <h1>{actorPreview?.name}<img src={`${FOLDERS.icons}/qmark.svg`} onClick={() => interfaceDispatch({ act: 'SET_POPUP', popup: 'gameResetConfirmation', show: true })} /></h1>

              <div className={UI.actors_selection}>
                <div className={UI.actors_list} onScroll={(e) => {actorListScroll(e, setActorPreview, setSelectActor, setPlayerActor, setActorDisplay)}}>
                  {ACTORS.map((obj, i) => (
                    <div key={obj.source}>
                      <img 
                        src={`${FOLDERS.images}/actors/${obj.source}.png`}
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
          </div>}
        </div>

        <div className={`${UI.footer_section} ${UI.footer_btns}`}>
          {/* <div className={UI.skill_btns}>
            {'>>skill button<<'}
          </div> */}

          {/* <button className={UI.deal_preview} onClick={() => isGameActive && previewDeal(field, setField, isGameActive, setGameActive)}>
            <img src={`${FOLDERS.icons}/eyes.svg`} alt="" />
          </button> */}

          <button className={UI.deal_btn} onClick={() => {gameState.isStarted && deal(gameState.field, gameState, gameDispatch)}}>
            {/* <p>deal</p> */}
            <img src={`${FOLDERS.icons}/plus.square.svg`} />
          </button>

          <div className={UI.footer_controls_row}>
            <div className={UI.footer_btn_wrapper} onClick={setRulesBookState}>
              <img src={`${FOLDERS.icons}/book.svg`} alt="see rules" />
            </div>
            <div className={UI.footer_btn_wrapper} onClick={reboot}>
              <img src={`${FOLDERS.icons}/exclamark.restart.svg`} alt="reboot" />
            </div>
          </div>
        </div>

        {/* Turn into a component? */}
        <div className={`${UI.all_stats} ${interfaceState.popups.fullStats ? UI.all_stats_window_enter : UI.all_stats_window_leave}`}>
          <div className={UI.all_stats_section}>
            <h1>statistics</h1>

            <div className={UI.stat}>
              <p>score</p>
              <p>{gameState.data.falsyScore}</p>
            </div>
            <div className={UI.stat}>
              <p>duration</p>
              <p>{timeString(gameState.data.duration)}</p>
            </div>
            <div className={UI.stat}>
              <p>avg. gain</p>
              <p>{calcAvgGain(gameState.data)}</p>
            </div>
            <div className={UI.stat}>
              <p>moves</p>
              <p>{gameState.data.moves}</p>
            </div>
            <div className={UI.stat}>
              <p>deals</p>
              <p>{gameState.data.deals}</p>
            </div>
            <div className={UI.stat}>
              <p>sum 10 rule</p>
              <p>{gameState.data.xrule}</p>
            </div>
            <div className={UI.stat}>
              <p>twin rule</p>
              <p>{gameState.data.twinrule}</p>
            </div>
            <div className={UI.stat}>
              <p>rows</p>
              <p>{gameState.data.rows}</p>
            </div>
            <div className={UI.stat}>
              <p>max. rows</p>
              <p>{gameState.data.maxrows == 3 && '(def.) '}{gameState.data.maxrows}</p>
            </div>
          </div>
          <div className={UI.all_stats_section}>
            <h1>spread</h1>

            <div className={UI.cells_stats}>
              {Object.entries(gameState.data.distribution).sort(([,a],[,b]) => b-a).map(([key,value]) => (
                <div key={key} className={UI.cell_stat}>
                  <img src={`${FOLDERS.images}/shapes/${key}.png`}></img>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default Game;
