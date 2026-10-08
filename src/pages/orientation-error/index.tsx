import { FOLDERS } from '../../constants';
import UI from './index.module.css';

function OrientationError() {
    return (
        <div className={UI.wrapper}>
            <img src={`${FOLDERS.icons}/portrait.rotate.svg`} alt="rotate your phone please" />
        </div>
    )
}

export default OrientationError;