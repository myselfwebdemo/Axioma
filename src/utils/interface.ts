type InterfaceContext = Record<
    | 'isMobile'
    | 'isValidMobileContext'
    | 'isTelegramApp'
    | 'isValidPortraitMode'
    , boolean>

type InterfaceTheme =
    | 'vortex' 
    | 'halo' 
    | 'vortex_teal' 
    | 'vortex_iris' 
    | 'halo_iris' 
    | 'forest' 
    | 'deep_ocean' 
    | 'photic_ocean' 
    | 'crimson_supernova' 
    | 'void_teal' 
    | 'void_forest' 
    | 'void_iris' 
    | 'void_neon_violet'

type InterfacePopups = Record<
    | 'fullStats'
    | 'gameResetConfirmation'
    | 'aboutActors'
    | 'gyroscopePermissionRequest'
    | 'headerFullControls'
    , boolean>

type InterfacePreferences = Record<
    | 'notifyBeforeReset'
    | 'footerAccentSpinner', boolean>

export interface InterfaceState {
    context: InterfaceContext
    interfaceTheme: InterfaceTheme
    popups: InterfacePopups
    preferences: InterfacePreferences
}

type Action = 
    | { act: 'ENTER_LANDSCAPE' }
    | { act: 'SET_INTERFACE_THEME', theme: InterfaceTheme }
    | { act: 'SET_POPUP', popup: keyof InterfacePopups, show: boolean }
    | { act: 'SET_PREFERENCES', preferences: Partial<InterfacePreferences> }

export function interfaceReducer(state: InterfaceState, action: Action): InterfaceState {
    switch (action.act) {
        case 'ENTER_LANDSCAPE':
            return { ...state, context: { ...state.context, isValidPortraitMode: false }}

        case 'SET_INTERFACE_THEME':
            return { ...state, interfaceTheme: action.theme }

        case 'SET_POPUP':
            return { ...state, popups: { ...state.popups, [action.popup]: action.show }}

        case 'SET_PREFERENCES':
            return { ...state, preferences: { ...state.preferences, ...action.preferences }}

        default:
            return state;
    }
}