"use client"

import { useState, useEffect } from "react"
import { TRAITS, type MixedTrait, type CustomTrait, type TraitName, createCustomTrait, getPredefinedTrait, isValidCustomTraitName, saveMixedTraits, loadMixedTraits, saveCustomTraits, loadCustomTraits, isPredefinedTrait } from "@/lib/traits"
import TraitCard from "./TraitCard"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { X, ChevronDown, ChevronUp } from "lucide-react"

const predefinedTraitNames = Object.keys(TRAITS) as TraitName[]

export default function VoiceTraitSelector({ 
  onChange, 
  suggestedTraits = [],
  showSuggestions = false,
  onToggleSuggestions
}: { 
  onChange?: (traits: string[]) => void
  suggestedTraits?: string[]
  showSuggestions?: boolean
  onToggleSuggestions?: () => void
}) {
  const [selectedTraits, setSelectedTraits] = useState<MixedTrait[]>([])
  const [customTraits, setCustomTraits] = useState<CustomTrait[]>([])
  const [customTraitInput, setCustomTraitInput] = useState("")
  const [validationError, setValidationError] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set())

  // Load from localStorage on mount
  useEffect(() => {
    const loadedCustomTraits = loadCustomTraits()
    const loadedSelectedTraits = loadMixedTraits()
    
    setCustomTraits(loadedCustomTraits)
    setSelectedTraits(loadedSelectedTraits)
  }, [])

  // Save to localStorage and notify parent when traits change
  useEffect(() => {
    saveMixedTraits(selectedTraits)
    saveCustomTraits(customTraits)
    
    // Convert to string array for backwards compatibility
    const traitNames = selectedTraits.map(trait => 
      isPredefinedTrait(trait) ? trait.name : trait.name
    )
    onChange?.(traitNames)
  }, [selectedTraits, customTraits, onChange])

  const togglePredefinedTrait = (name: TraitName) => {
    const isSelected = selectedTraits.some(t => isPredefinedTrait(t) && t.name === name)
    
    if (isSelected) {
      // Remove trait
      setSelectedTraits(prev => prev.filter(t => !(isPredefinedTrait(t) && t.name === name)))
      // Collapse when removed
      setExpandedTraits(prev => {
        const newSet = new Set(prev)
        newSet.delete(name)
        return newSet
      })
    } else if (selectedTraits.length < 3) {
      // Add trait (don't auto-expand - keep closed by default)
      const predefinedTrait = getPredefinedTrait(name)
      setSelectedTraits(prev => [predefinedTrait, ...prev])
    }
  }

  const removeCustomTrait = (traitId: string) => {
    // Remove from selected traits
    setSelectedTraits(prev => prev.filter(t => !(t.isCustom && t.id === traitId)))
    // Remove from custom traits list
    setCustomTraits(prev => prev.filter(t => t.id !== traitId))
  }

  const addCustomTrait = () => {
    const trimmedName = customTraitInput.trim()
    
    // Clear previous error
    setValidationError("")
    
    // Validate trait name
    if (!isValidCustomTraitName(trimmedName)) {
      if (trimmedName.length === 0) {
        setValidationError("Trait name cannot be empty")
      } else if (trimmedName.length > 20) {
        setValidationError("Trait name must be 20 characters or less")
      } else if (predefinedTraitNames.map(n => n.toLowerCase()).includes(trimmedName.toLowerCase())) {
        setValidationError("This trait already exists in our predefined list")
      } else {
        setValidationError("Only letters, numbers, spaces, and hyphens allowed")
      }
      return
    }

    // Check for duplicate custom traits
    if (customTraits.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      setValidationError("You've already added this custom trait")
      return
    }

    // Check trait limit
    if (selectedTraits.length >= 3) {
      setValidationError("Maximum 3 traits allowed. Remove one first.")
      return
    }

    // Create and add custom trait
    const newCustomTrait = createCustomTrait(trimmedName)
    setCustomTraits(prev => [...prev, newCustomTrait])
    setSelectedTraits(prev => [newCustomTrait, ...prev])
    
    // Reset input
    setCustomTraitInput("")
    setShowCustomInput(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCustomTrait()
    } else if (e.key === 'Escape') {
      setCustomTraitInput("")
      setValidationError("")
      setShowCustomInput(false)
    }
  }

  const isPredefinedTraitSelected = (name: TraitName) => {
    return selectedTraits.some(t => isPredefinedTrait(t) && t.name === name)
  }

  const isPredefinedTraitDisabled = (name: TraitName) => {
    return selectedTraits.length >= 3 && !isPredefinedTraitSelected(name)
  }

  return (
    <div className="space-y-6">
      {/* Predefined trait pills */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {predefinedTraitNames.map((name) => {
            const isSuggested = suggestedTraits.includes(name)
            const isSelected = isPredefinedTraitSelected(name)
            const hoverSummary = TRAITS[name].hoverSummary
            return (
              <button
                key={name}
                onClick={() => togglePredefinedTrait(name)}
                disabled={isPredefinedTraitDisabled(name)}
                type="button"
                className={`rounded-full px-4 py-2 text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 relative w-full whitespace-nowrap flex items-center justify-center ${
                  isSelected
                    ? "bg-black text-white border-black hover:bg-gray-800 focus:ring-gray-400"
                    : isPredefinedTraitDisabled(name)
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : isSuggested && showSuggestions
                    ? "bg-blue-50 text-blue-700 border-blue-400 border-2 border-dashed hover:bg-blue-100 hover:border-solid focus:ring-blue-300 active:scale-95"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-300 active:scale-95"
                }`}
                title={isSelected ? `Click to remove: ${hoverSummary}` : isSuggested && showSuggestions ? `AI suggestion: ${hoverSummary}` : hoverSummary}
              >
                {name}
                {isSuggested && showSuggestions && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border border-white" 
                        aria-label="AI suggestion" />
                )}
              </button>
            )
          })}
          {/* "+ custom" button to balance mobile layout */}
          <button
            onClick={() => setShowCustomInput(true)}
            disabled={selectedTraits.length >= 3}
            type="button"
            className={`rounded-full px-4 py-2 text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 relative w-full whitespace-nowrap flex items-center justify-center font-semibold sm:col-span-3 ${
              selectedTraits.length >= 3
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-300 active:scale-95"
            }`}
            title="Add Custom Trait"
          >
            + Custom
          </button>
        </div>
      </div>

      {/* Custom traits section */}
      <div>
        {/* Custom trait pills */}
        {customTraits.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customTraits.map((trait) => {
              const isSelected = selectedTraits.some(t => t.isCustom && t.id === trait.id)
              return (
                <div
                  key={trait.id}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm border transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  <span>{trait.name}</span>
                  <button
                    onClick={() => removeCustomTrait(trait.id)}
                    className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-300 active:scale-90"
                    type="button"
                    title="Remove custom trait"
                  >
                    <X size={12} className="text-gray-500 hover:text-red-600" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add custom trait input */}
        {showCustomInput ? (
          <div className="space-y-2 mb-3">
            <div className="flex gap-2">
              <Input
                value={customTraitInput}
                onChange={(e) => setCustomTraitInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter custom trait name"
                className="flex-1 focus:ring-2 focus:ring-blue-300"
                maxLength={20}
                autoFocus
              />
              <Button
                onClick={addCustomTrait}
                disabled={selectedTraits.length >= 3}
                size="sm"
                type="button"
                className="hover:scale-105 active:scale-95 transition-transform duration-150"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowCustomInput(false)
                  setCustomTraitInput("")
                  setValidationError("")
                }}
                variant="outline"
                size="sm"
                type="button"
                className="hover:scale-105 active:scale-95 transition-transform duration-150"
              >
                Cancel
              </Button>
            </div>
            {validationError && (
              <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">{validationError}</p>
            )}
          </div>
        ) : null}

        {/* Counter */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{selectedTraits.length}/3</span>
          {suggestedTraits.length > 0 && onToggleSuggestions && (
            <button
              type="button"
              onClick={onToggleSuggestions}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>AI suggestions</span>
              <div className={`relative w-9 h-5 rounded-full transition-colors ${
                showSuggestions ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  showSuggestions ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* DISABLED: Selected traits section - kept for future use
          This section shows expandable cards with trait details when traits are selected.
          Currently disabled but preserved in case we want to re-enable it later.
      */}
      {false && selectedTraits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Selected traits</h4>
            <button
              type="button"
              onClick={() => {
                if (expandedTraits.size === selectedTraits.length) {
                  setExpandedTraits(new Set())
                } else {
                  const allTraitIds = selectedTraits.map(t => isPredefinedTrait(t) ? t.name : t.id)
                  setExpandedTraits(new Set(allTraitIds))
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedTraits.size === selectedTraits.length ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          {selectedTraits.map((trait) => {
            const traitId = isPredefinedTrait(trait) ? trait.name : trait.id
            const isExpanded = expandedTraits.has(traitId)
            
            if (isPredefinedTrait(trait)) {
              return (
                <div key={trait.name} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const newExpanded = new Set(expandedTraits)
                      if (isExpanded) {
                        newExpanded.delete(trait.name)
                      } else {
                        newExpanded.add(trait.name)
                      }
                      setExpandedTraits(newExpanded)
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{trait.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-100">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
                          Sample
                        </span>
                      </div>
                      <TraitCard traitName={trait.name} />
                    </div>
                  )}
                </div>
              )
            } else {
              // Custom trait display - no description card
              return (
                <div key={trait.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-blue-900 mb-1">{trait.name}</h3>
                  <p className="text-sm text-blue-700">
                    We'll create a description that fits your brand perfectly.
                  </p>
                </div>
              )
            }
          })}
        </div>
      )}
    </div>
  )
} 