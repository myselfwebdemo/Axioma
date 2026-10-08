import { useReducer } from "react";
import { interfaceReducer, type InterfaceState } from "../utils/interface";
import { getFromLS, getIsValidMobileContext, launchLS } from "../utils/functions";
import { LS_SCHEME } from "../constants";
import OrientationError from "./orientation-error";
import InstallationRequiredScreen from "./mobile-installation";
import Game from "./game";

screen.width < screen.height && screen.orientation.type == 'landscape-primary'
let requestPermission = window.isSecureContext && screen.orientation.type !== 'landscape-primary';

export function App() {
    launchLS();

    const INTERFACE_STATE: InterfaceState = {
        context: {
            isMobile: window.innerWidth < window.innerHeight,
            isValidMobileContext: getIsValidMobileContext(),
            isTelegramApp: Boolean(window.Telegram?.WebApp?.initData),
            isValidPortraitMode: screen.orientation.type.includes('portrait') || screen.width < screen.height && screen.orientation.type == 'landscape-primary',
        },
        interfaceTheme: getFromLS(LS_SCHEME.interfaceColorTheme, 'vortex'),
        popups: {
            headerFullControls: false,
            fullStats: false,
            gameResetConfirmation: false,
            aboutActors: false,
            gyroscopePermissionRequest: requestPermission,
        },
        preferences: {
            notifyBeforeReset: true,
            footerAccentSpinner: true,
        }
    }

    const [interfaceState, interfaceDispatch] = useReducer(interfaceReducer, INTERFACE_STATE);
    
    if (!interfaceState.context.isMobile || interfaceState.context.isValidMobileContext) {
        if (interfaceState.context.isMobile && !interfaceState.context.isValidPortraitMode) 
            return <OrientationError />;

        return <Game type='CLASSIC' interfaceState={interfaceState} interfaceDispatch={interfaceDispatch} />
    }

    return <InstallationRequiredScreen />
}