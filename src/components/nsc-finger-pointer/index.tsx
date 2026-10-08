import UI from './index.module.css';

export function Tap({x, y}: Record<string, string>) {
  return (
    <span className={UI.tap}>
      Tap
      <img style={{'top': y, 'left': x}} src={`./Axioma/icons/not-standalone-case/tap.svg`} alt="tap icon" />
    </span>
  )
}