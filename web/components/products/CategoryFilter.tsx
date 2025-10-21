'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface CategoryFilterProps {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(null)}
      >
        Todas
      </Button>

      {categories.map((category) => (
        <Badge
          key={category}
          variant={selected === category ? 'default' : 'outline'}
          className="cursor-pointer hover:bg-primary/90 px-3 py-1.5"
          onClick={() => onSelect(category)}
        >
          {category}
          {selected === category && (
            <X
              className="h-3 w-3 ml-1"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(null)
              }}
            />
          )}
        </Badge>
      ))}
    </div>
  )
}
