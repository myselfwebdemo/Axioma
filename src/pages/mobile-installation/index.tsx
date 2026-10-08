import { Tap } from '../../components/nsc-finger-pointer';
import UI from './index.module.css';

function InstallationRequiredScreen() {
    return (<>
        <div className={UI.header}>
            <div className={UI.logo_wrapper}>
                <p>axioma</p>
                <img src={'/Axioma/icons/not-standalone-case/install.svg'} alt="icon" />
            </div>
        </div>

        <div className={UI.installation_required_screen}>
            <div className={UI.irc_title}>
                <div className={UI.irc_title_add}>
                <img src={'/Axioma/icons/not-standalone-case/app.svg'} alt="icon" />
                <p>add</p>
                </div>
                <h1>to <br />Home Screen</h1>
            </div>
            
            <p className={UI.irc_short_text}>
                Launch as an app for <mark>immersive play</mark> experience.<br />
                Built for total <mark>gameplay integrity</mark> and <mark>maximum screen space</mark>.<br />
            </p>

            <details>
                <summary>How?</summary>

                <div className={UI.details_content}>
                <p id={UI.hint}><i>*Tap the highlighted red boxes on your phone to complete each step</i></p>
                <h1>1</h1>
                <div className={UI.d_section}>
                    <p><Tap x='70vw' y='27px' /> and Open the <mark>browser menu</mark>.</p>
                    <img style={{'width': 'auto'}} src={'/Axioma/images/nsc/step1.png'} alt='Step 1'/>
                </div>
                <h1>2</h1>
                <div className={`${UI.d_section} ${UI.d_row}`}>
                    <p><Tap x='60vw' y='-8px' /> the Share button and Open the <mark>share menu</mark>.</p>
                    <img src={'/Axioma/images/nsc/step2.png'} alt='Step 2'/>
                </div>
                <h1>3</h1>
                <div className={`${UI.d_section} ${UI.d_row}`}>
                    <p>Scroll down and <Tap x='38vw' y='237px' /> <mark>"Add to Home Screen"</mark>.</p>
                    <img src={'/Axioma/images/nsc/step3.png'} alt='Step 3'/>
                </div>
                <h1>4</h1>
                <div className={UI.d_section}>
                    <p><mark>Name</mark> the shortcut link as shown below.</p>
                    <img src={'/Axioma/images/nsc/step4.jpeg'} alt='Step 4'/>
                </div>
                <h1>5</h1>
                <div className={UI.d_section}>
                    <p>Ensure "Open as Web App" is <mark>enabled</mark>.</p>
                    <img src={'/Axioma/images/nsc/step5.jpeg'} alt='Step 5'/>
                </div>
                <h1>6</h1>
                <div className={UI.d_section}>
                    <p><Tap x='74vw' y='36px' /> <mark>"Add"</mark> to <mark>Save&Finish</mark> installation to your Home Screen.</p>
                    <img src={'/Axioma/images/nsc/step6.png'} alt='Step 6'/>
                </div>
                <div className={`${UI.d_section} ${UI.d_row}`}>
                    <p>
                        <span><img id={UI.installation_complete} src={'/Axioma/icons/not-standalone-case/party.popper.svg'} /></span>
                        <mark id={UI.installation_complete_text}>Ready to play!</mark><br />
                        Open the App from your Home Screen for a <mark>completely immersive experience</mark>.
                    </p>
                    <img src={'/Axioma/images/nsc/result.jpeg'} alt='Step 6'/>
                </div>
                </div>
            </details>
        </div>
    </>)
}

export default InstallationRequiredScreen;
