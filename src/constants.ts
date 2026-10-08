export const isDeployPush = true; // Place next to sections or features that are yet beta.

export const LS_SCHEME = {
    gameField: 'gameField',
    gameData: 'gameData',
    gameStarted: 'gameStarted',
    interfaceColorTheme: 'interfaceColorTheme',
}

export const FOLDERS = {
  'images': isDeployPush ? `/Axioma/images` : `/images`,
  'icons': isDeployPush ? `/Axioma/icons` : `/icons`,
}

export const CGAME = {
    cpr: 9,
    def_ns: [1,2,3,4,5,6,7,8,9,1,1,1,2,1,3,1,4,1,5,1,6,1,7,1,8,1,9],
}