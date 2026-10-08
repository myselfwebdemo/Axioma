import UI from './index.module.css'
import React, { useEffect, useRef, type Dispatch } from 'react'

type TModal = {
    interfaceName: string
    interfaceDispatch: Dispatch<any>
    title: string
    rawText: string
    validateBtnText: string
    onValidateAction: () => void
    accentColor: string
    hint?: string
    cancelBtnText?: string
    hideCancel?: boolean
    silenceOption?: boolean
    noskip?: boolean
    settingField?: string
}

const Modal = ({
    interfaceName,
    interfaceDispatch,
    title,
    rawText,
    validateBtnText,
    onValidateAction,
    accentColor,
    hint='To close this window simply click elsewhere.',
    cancelBtnText='cancel',
    hideCancel=false,
    silenceOption=false,
    settingField,
    noskip,
}: TModal) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const ref1 = useRef<HTMLDivElement | null>(null);
    const checkBoxRef = useRef<HTMLInputElement | null>(null);
    const fragmentedText = rawText.split('/');
    
    const onCancel = () => interfaceDispatch({ act: 'SET_POPUP', popup: interfaceName, show: false })
    
    const onValidate = () => {
        if (settingField && checkBoxRef.current?.checked) interfaceDispatch({ act: 'SET_PREFERENCES', preferences: { [settingField]: false }});
        onValidateAction();
        interfaceDispatch({ act: 'SET_POPUP', popup: interfaceName, show: false });
    }
    
    useEffect(() => {
        const handler = (e: MouseEvent) => {if (!noskip && !ref1.current?.contains(e.target as Node)) interfaceDispatch({ act: 'SET_POPUP', popup: interfaceName, show: false })}
        ref.current?.addEventListener('click', handler)
        return () => ref.current?.removeEventListener('click', handler)
    }, [])

    return (
        <div ref={ref} className={UI.overlay} style={{'--theme-color': accentColor} as React.CSSProperties}>
            <div ref={ref1} className={UI.message}>
                <h1>{title}</h1>
                {fragmentedText.length > 1 ? fragmentedText.map(frag => (<p key={frag}>{frag}</p>)) : (<p key={1}>{fragmentedText[0]}</p>)}
                <h3>{hint}</h3>

                {silenceOption && <div className={UI.silence_option}>
                    <input ref={checkBoxRef} type="checkbox" id="silenceChoice" />
                    <label htmlFor="silenceChoice">Silence future alerts</label>
                </div>}
                
                <div className={UI.actions}>
                    {!hideCancel && <button className={UI.cancel_btn} onClick={onCancel}>{cancelBtnText}</button>}
                    <button onClick={onValidate}>{validateBtnText}</button>
                </div>
            </div>
        </div>
    )
}

export default Modal;
