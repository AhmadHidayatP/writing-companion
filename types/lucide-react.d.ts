declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react'

  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>

  export const AlertCircle: LucideIcon
  export const BookOpen: LucideIcon
  export const Check: LucideIcon
  export const Copy: LucideIcon
  export const RefreshCw: LucideIcon
  export const Sparkles: LucideIcon
  export const Wand2: LucideIcon
}
