import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChevronIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Direction of the chevron arrow
   * - 'left': Points left (<)
   * - 'right': Points right (>)
   */
  direction: 'left' | 'right'
  
  /**
   * Size of the chevron icon in pixels
   * @default 20
   */
  size?: number
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Whether the chevron is clickable
   * @default false
   */
  clickable?: boolean
  
  /**
   * Click handler for the chevron
   */
  onClick?: () => void
  
  /**
   * Keyboard event handler
   */
  onKeyDown?: (event: React.KeyboardEvent) => void
  
  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string
}

/**
 * ChevronIcon component with smooth rotation animation
 */
const ChevronIcon = React.forwardRef<HTMLDivElement, ChevronIconProps>(
  ({ 
    direction, 
    size = 20, 
    className, 
    clickable = false,
    onClick,
    onKeyDown,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    
    const handleKeyDown = (event: React.KeyboardEvent) => {
      // Handle Enter and Space key presses for accessibility
      if (clickable && onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        onClick()
      }
      
      // Call custom onKeyDown handler if provided
      onKeyDown?.(event)
    }

    const ChevronComponent = direction === 'left' ? ChevronLeft : ChevronRight

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          // Animation and transition
          "transition-all duration-300 ease-in-out",
          // Clickable styles
          clickable && [
            "cursor-pointer",
            "hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:ring-offset-2",
            "active:scale-95"
          ],
          className
        )}
        onClick={clickable ? onClick : undefined}
        onKeyDown={clickable ? handleKeyDown : undefined}
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? "button" : undefined}
        aria-label={ariaLabel || (clickable ? `${direction === 'left' ? 'Collapse' : 'Expand'} sidebar` : undefined)}
        {...props}
      >
        <ChevronComponent 
          size={size}
          className={cn(
            // Smooth rotation animation
            "transition-transform duration-300 ease-in-out",
            // Ensure proper color inheritance
            "text-current"
          )}
        />
      </div>
    )
  }
)

ChevronIcon.displayName = "ChevronIcon"

export { ChevronIcon }