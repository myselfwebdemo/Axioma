import UI from './index.module.css'
import React, { useEffect, useRef } from 'react'

type TModal = {
    currentOpen: BooleanDispatch
    title: string
    rawText: string
    hint?: string
    resultText: string
    resultAction: () => void
    themeColor: string
    hideCancel?: boolean
    silenceOption?: boolean
    notifyInFuture?: BooleanDispatch
    noskip?: boolean
}

const Modal = ({
    currentOpen,
    title,
    rawText,
    hint='To close this window simply click elsewhere.',
    resultText,
    resultAction,
    themeColor,
    hideCancel=false,
    silenceOption=false,
    notifyInFuture,
    noskip,
}: TModal) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const ref1 = useRef<HTMLDivElement | null>(null)
    const silenceOptionRef = useRef<HTMLInputElement | null>(null)
    
    useEffect(() => {
        const handler = (e: MouseEvent) => {if (!noskip && !ref1.current?.contains(e.target as Node)) currentOpen(false)}
        ref.current?.addEventListener('click', handler)
        return () => ref.current?.removeEventListener('click', handler)
    }, [])
    
    const finishEvent = () => {
        resultAction();
        currentOpen(false);
        if (notifyInFuture && silenceOptionRef?.current!.checked) notifyInFuture(false);
    }

    const text = rawText.split('/');

    return (
        <div ref={ref} className={UI.overlay} style={{'--theme-color': themeColor} as React.CSSProperties}>
            <div ref={ref1} className={UI.message}>
                <h1>{title}</h1>
                {text.length > 1 ? text.map(frag => (<><p>{frag}</p></>)) : (<p>{text[0]}</p>)}
                <h3>{hint}</h3>

                {silenceOption && <div className={UI.silence_option}>
                    <input ref={silenceOptionRef as any} type="checkbox" id="silenceChoice" />
                    <label htmlFor="silenceChoice">Silence future alerts</label>
                </div>}
                
                <div className={UI.actions}>
                    {!hideCancel && <button className={UI.cancel_btn} onClick={() => currentOpen(false)}>cancel</button>}
                    <button onClick={finishEvent}>{resultText}</button>
                </div>
            </div>
        </div>
    )
}

export default Modal;
