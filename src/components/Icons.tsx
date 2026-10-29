interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const IconClock = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 1.9" />
  </svg>
)

export const IconList = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconChart = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const IconSettings = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)

export const IconPlus = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconChevronLeft = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const IconChevronRight = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)

export const IconClose = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconTrash = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14M10 11v5M14 11v5" />
  </svg>
)

export const IconDownload = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
  </svg>
)

export const IconUpload = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </svg>
)

export const IconPencil = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" />
  </svg>
)

export const IconCheck = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
)
