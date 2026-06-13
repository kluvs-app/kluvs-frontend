interface Props {
  label: string
  compact?: boolean
}

export default function KluvsReadRibbon({ label, compact }: Props) {
  return (
    <span
      title={label}
      aria-label={label}
      className={`kluvs-read-ribbon absolute top-0 z-10 ${compact ? 'right-2 w-5 h-[35px]' : 'right-3.5 w-[30px] h-[52px]'}`}
    />
  )
}
