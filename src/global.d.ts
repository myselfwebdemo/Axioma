type Cell = {
  id: string;
  value: number;
  isCrossed: boolean;
  isSelected: boolean;
  isClickedAndMatched: boolean
  isPreview: boolean
};
type Field = Cell[][]
type Distribution = Record<string, number>;
type GameData = {
  trueScore: number
  falsyScore: number
  gain: number
  moves: number
  deals: number
  rows: number
  maxrows: number
  xrule: number
  twinrule: number
  totalncount: number
  distribution: Distribution
};
type DealProps = {
  field: Field
  setField: FieldDispatch
  hasEverDealt: boolean
  setHasEverDealt: BooleanDispatch
  gameData: GameData
  setGameData: SetGDDispatch
  isGameActive: boolean
  setGameActive: BooleanDispatch
}
type ruleCheckResult = { valid: boolean, rule: 'twinrule' | 'xrule' | '' }
type Actor = {
  source: string
  name: string
  about: string
  skillDescription: string 
  color: string 
}

type DivRef = HTMLDivElement | null

type FieldDispatch = Dispatch<SetStateAction<Cell[][]>>
type BooleanDispatch = Dispatch<SetStateAction<boolean>>
type SetGDDispatch = Dispatch<SetStateAction<GameData>>
