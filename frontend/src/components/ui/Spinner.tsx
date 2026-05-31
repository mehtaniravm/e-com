interface Props {
  size?: 'default' | 'sm'
  center?: boolean
}

export default function Spinner({ size = 'default', center = false }: Props) {
  const el = <div className={`spinner${size === 'sm' ? ' spinner-sm' : ''}`} />
  return center ? <div className="loading-center">{el}</div> : el
}
