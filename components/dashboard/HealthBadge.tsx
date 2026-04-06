import { Badge } from '@/components/ui/badge'

interface HealthBadgeProps {
  health: 'green' | 'yellow' | 'red'
}

export function HealthBadge({ health }: HealthBadgeProps) {
  const config = {
    green: { color: 'bg-emerald-500', text: 'On Track' },
    yellow: { color: 'bg-amber-500', text: 'At Risk' },
    red: { color: 'bg-rose-500', text: 'Off Track' },
  }

  const { color, text } = config[health]

  return (
    <div className="flex items-center gap-1.5">
      <span className={`block h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-gray-600">{text}</span>
    </div>
  )
}

export function StatusBadge({ status }: { status: 'planning' | 'active' | 'completed' | 'on-hold' }) {
  const statusStyles = {
    planning: 'bg-slate-100 text-slate-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    'on-hold': 'bg-orange-100 text-orange-700'
  }

  const statusLabels = {
    planning: 'Planning',
    active: 'Active',
    completed: 'Completed',
    'on-hold': 'On Hold'
  }

  return (
    <Badge variant="outline" className={`font-normal border-none ${statusStyles[status]}`}>
      {statusLabels[status]}
    </Badge>
  )
}
