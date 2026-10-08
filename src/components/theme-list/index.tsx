import UI from './index.module.css'
import MCSS from '../../pages/game/index.module.css'
import { useState, type Dispatch } from 'react'

type TList = {
    sysOptions: string[]
    currentTheme: string
    interfaceDispatch: Dispatch<any>
    scrollEvent: Function
}

const ThemeList = ({sysOptions, currentTheme, interfaceDispatch, scrollEvent}: TList) => {
    const [scheduledTheme, scheduleTheme] = useState(currentTheme);

    return (
        <div className={MCSS.list}>
            <h1>color theme</h1>

            <div className={UI.scroll_wrapper}>
                <div
                    className={UI.scroll_content}
                    onScroll={(e) => scrollEvent(e, currentTheme, scheduleTheme, false)}
                    onScrollEnd={() => interfaceDispatch({ act: 'SET_INTERFACE_THEME', theme: scheduledTheme })}
                >
                    {sysOptions.map(option => (
                        <div
                            key={option}
                            className={`${UI.option} ${option == currentTheme ? UI.selected : ''}`}
                            // onClick={() => setTheme(option)}
                        >
                            <p>{option.split('_').join(' ')}</p>
                            <div className={UI.option_indicator_wrapper}>
                                <div className={`${UI.option_indicator} ${UI[option]}`}>
                                    <div><p>b</p></div>
                                    <div><p>a</p></div>
                                    <div><p>t</p></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* <div className={UI.image_drop_wrapper}>
                <input type="file" />
                <p>add your image here</p>
            </div> */}
        </div>
    )
}

export default ThemeList
