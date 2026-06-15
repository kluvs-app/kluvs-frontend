interface Props {
  label: string
  size?: 'sm' | 'md' | 'lg'
}

export default function KluvsReadRibbon({ label, size = 'md' }: Props) {
  return (
    <span
      title={label}
      aria-label={label}
      className={`kluvs-read-ribbon kluvs-read-ribbon--${size} absolute top-0 z-10`}
    />
  )
}
