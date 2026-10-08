export interface Cell {
    id: string
    value: number
    isCrossed: boolean
    isSelected: boolean
    isClickedAndMatched: boolean
    isPreview: boolean
}

export type Field = Cell[][];

type Distribution = Record<string, number>;

export interface GameData {
    duration: number
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
}

export interface GameState {
    field: Field
    data: GameData
    isStarted: boolean
    isWaiting: boolean
    isActive: boolean
    isMismatch: boolean
}

export interface Actor {
    source: string
    name: string
    // about: string
    // skillDescription: string 
    color: string 
}

type Action = 
    | { act: 'START' }
    | { act: 'RESUME' }
    | { act: 'UPDATE', field?: Field, data?: Partial<GameData> }
    | { act: 'PAIR_MISMATCH' }
    | { act: 'CLEAR_MISMATCH' }
    | { act: 'RESET_SELECTION' }
    | { act: 'WAIT' }
    | { act: 'TICK' }
    | { act: 'CLEAR_WAIT' }
    | { act: 'RESET_GAME', state: GameState }
    | { act: 'name'; id: string }

export function gameReducer(state: GameState, action: Action): GameState {
    switch (action.act) {
        case 'START':
            return { ...state, isStarted: true }

        case 'RESUME':
            return { ...state, isActive: true }

        case 'UPDATE':
            return { ...state, field: action.field ?? state.field, data: action.data ? { ...state.data, ...action.data } : state.data }

        case 'PAIR_MISMATCH':
            return { ...state, isMismatch: true }

        case 'CLEAR_MISMATCH':
            return { ...state, isMismatch: false }

        case 'RESET_SELECTION':
            return { ...state, field: state.field.map(row => row.map(cell => ({ ...cell, isSelected: false }))) }

        case 'WAIT':
            return { ...state, isWaiting: true }

        case 'CLEAR_WAIT':
            return { ...state, isWaiting: false }
    
        case 'RESET_GAME':
            return action.state

        case 'TICK':
            return { ...state, data: { ...state.data, duration: state.data.duration + 1 } }

        default:
            return state;
    }
}