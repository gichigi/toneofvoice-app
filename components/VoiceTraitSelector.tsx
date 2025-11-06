"use client"

import { useState, useEffect } from "react"
import { TRAITS, type MixedTrait, type CustomTrait, type TraitName, createCustomTrait, getPredefinedTrait, isValidCustomTraitName, saveMixedTraits, loadMixedTraits, saveCustomTraits, loadCustomTraits, isPredefinedTrait } from "@/lib/traits"
import TraitCard from "./TraitCard"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Plus, X } from "lucide-react"

const predefinedTraitNames = Object.keys(TRAITS) as TraitName[]

export default function VoiceTraitSelector({ 
  onChange, 
  suggestedTraits = [],
  showSuggestions = false
}: { 
  onChange?: (traits: string[]) => void
  suggestedTraits?: string[]
  showSuggestions?: boolean
}) {
  const [selectedTraits, setSelectedTraits] = useState<MixedTrait[]>([])
  const [customTraits, setCustomTraits] = useState<CustomTrait[]>([])
  const [customTraitInput, setCustomTraitInput] = useState("")
  const [validationError, setValidationError] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)

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
  }, [selectedTraits, customTraits])

  const togglePredefinedTrait = (name: TraitName) => {
    const isSelected = selectedTraits.some(t => isPredefinedTrait(t) && t.name === name)
    
    if (isSelected) {
      // Remove trait
      setSelectedTraits(prev => prev.filter(t => !(isPredefinedTrait(t) && t.name === name)))
    } else if (selectedTraits.length < 3) {
      // Add trait
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
            return (
              <button
                key={name}
                onClick={() => togglePredefinedTrait(name)}
                disabled={isPredefinedTraitDisabled(name)}
                type="button"
                className={`rounded-full px-4 py-2 text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 relative ${
                  isSelected
                    ? "bg-black text-white border-black hover:bg-gray-800 focus:ring-gray-400"
                    : isPredefinedTraitDisabled(name)
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : isSuggested && showSuggestions
                    ? "bg-blue-50 text-blue-700 border-blue-400 border-2 border-dashed hover:bg-blue-100 hover:border-solid focus:ring-blue-300 active:scale-95"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-300 active:scale-95"
                }`}
                title={isSelected ? "Click to remove" : isSuggested && showSuggestions ? "AI suggestion - click to select" : "Click to select"}
              >
                {name}
                {isSuggested && showSuggestions && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border border-white" 
                        aria-label="AI suggestion" />
                )}
              </button>
            )
          })}
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
        ) : (
          <Button
            onClick={() => setShowCustomInput(true)}
            disabled={selectedTraits.length >= 3}
            variant="outline"
            size="sm"
            type="button"
            className="w-full mb-3 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 disabled:hover:scale-100"
          >
            <Plus size={16} className="mr-2" />
            Add Custom Trait
          </Button>
        )}

        {/* Counter */}
        <div className="flex justify-end">
          <span className="text-xs text-gray-500">{selectedTraits.length}/3 selected</span>
        </div>
      </div>

      {/* Live rule panels */}
      {selectedTraits.map((trait) => {
        if (isPredefinedTrait(trait)) {
          return <TraitCard key={trait.name} traitName={trait.name} />
        } else {
          // Custom trait display - no description card
          return (
            <div key={trait.id} className="p-4 border border-blue-200 rounded-lg bg-blue-50 animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="font-semibold text-blue-900 mb-2">{trait.name}</h3>
              <p className="text-sm text-blue-700">
                We'll create a description that fits your brand perfectly.
              </p>
            </div>
          )
        }
      })}
    </div>
  )
} 