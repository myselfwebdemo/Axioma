import UI from './index.module.css'
import MCSS from '../../game/Game.module.css'
import { useState, type Dispatch, type SetStateAction } from 'react'

type TList = {
    sysOptions: string[]
    currentTheme: string
    setTheme: Dispatch<SetStateAction<string>>
    scrollEvent: Function
}

const ThemeList = ({sysOptions, currentTheme, setTheme, scrollEvent}: TList) => {
    const [scheduledTheme, scheduleTheme] = useState(currentTheme);

    return (
        <div className={MCSS.list}>
            <h1>system theme</h1>

            <div className={UI.scroll_wrapper}>
                <div
                    className={UI.scroll_content}
                    onScroll={(e) => scrollEvent(e, currentTheme, scheduleTheme, false)}
                    onScrollEnd={() => setTheme(scheduledTheme)}
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
        </div>
    )
}

export default ThemeList
