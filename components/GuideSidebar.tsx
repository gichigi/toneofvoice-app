"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Lock, Sparkles, ChevronsUpDown, User, CreditCard, LogOut, Plus } from "lucide-react"
import { StyleGuideSection, Tier, STYLE_GUIDE_SECTIONS } from "@/lib/content-parser"
import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/AuthProvider"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface GuideSidebarProps {
  sections: StyleGuideSection[]
  activeSectionId: string
  onSectionSelect: (id: string) => void
  subscriptionTier: Tier
  brandName: string
  onUpgrade: () => void
  onAddSection?: (title: string) => void
}

export function GuideSidebar({
  sections,
  activeSectionId,
  onSectionSelect,
  subscriptionTier,
  brandName,
  onUpgrade,
  onAddSection,
}: GuideSidebarProps) {
  const { setOpenMobile } = useSidebar()
  const { user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const getUserInitials = (email?: string) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  // Calculate progress
  // Starter (free) tier can access starter sections.
  // 'pro'/'agency' can access everything.
  const totalSections = sections.length
  // unlocked count: sections where minTier is 'starter' OR user tier >= minTier
  // Tier hierarchy: starter < pro < agency
  const isUnlocked = (minTier?: Tier) => {
    if (!minTier || minTier === 'starter') return true
    if (subscriptionTier === 'starter') return false
    if (subscriptionTier === 'pro' && minTier === 'agency') return false
    return true
  }

  const unlockedCount = sections.filter(s => isUnlocked(s.minTier)).length
  const progress = Math.round((unlockedCount / Math.max(totalSections, 1)) * 100)

  // Questions (contact) always last in sidebar to match guide content order
  const sectionsForMenu = (() => {
    const rest = sections.filter((s) => s.id !== "contact")
    const contact = sections.find((s) => s.id === "contact")
    return contact ? [...rest, contact] : rest
  })()

  // Custom section input state
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const addSectionInputRef = useRef<HTMLInputElement>(null)
  const canAddSection = subscriptionTier !== 'starter'
  const customCount = sections.filter(s => !STYLE_GUIDE_SECTIONS.some(c => c.matchHeading.test(s.title))).length
  const atLimit = customCount >= 5

  // Show hint animation for paid users who haven't used this yet
  const [showHint, setShowHint] = useState(false)
  useEffect(() => {
    if (canAddSection && typeof window !== 'undefined') {
      const seen = localStorage.getItem('customSectionHintSeen')
      if (!seen) setShowHint(true)
    }
  }, [canAddSection])

  useEffect(() => {
    if (isAddingSection && addSectionInputRef.current) {
      addSectionInputRef.current.focus()
    }
  }, [isAddingSection])

  const handleAddSectionConfirm = () => {
    const trimmed = newSectionTitle.trim()
    if (trimmed && onAddSection) {
      onAddSection(trimmed)
      if (showHint) {
        localStorage.setItem('customSectionHintSeen', 'true')
        setShowHint(false)
      }
    }
    setNewSectionTitle("")
    setIsAddingSection(false)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-100 bg-white/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
      <SidebarHeader className="p-4 pt-6 border-b border-gray-50/50">
        <div className="flex items-center gap-2 px-2 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex-1 truncate group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold text-gray-900 truncate tracking-tight">{brandName}</h2>
            <p className="text-xs text-gray-500 truncate">Tone of Voice Guidelines</p>
          </div>
          {/* Brand initial in icon mode */}
          <div className="hidden group-data-[collapsible=icon]:flex w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm items-center justify-center shrink-0">
            {brandName.charAt(0).toUpperCase()}
          </div>
          {subscriptionTier !== 'starter' && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-blue-50 text-blue-700 border-blue-100 group-data-[collapsible=icon]:hidden">
              {subscriptionTier.toUpperCase()}
            </Badge>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sectionsForMenu.map((section) => {
                const isActive = activeSectionId === section.id
                const locked = !isUnlocked(section.minTier)
                const Icon = section.icon || Sparkles

                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        onSectionSelect(section.id)
                        setOpenMobile(false)
                      }}
                      isActive={isActive}
                      tooltip={section.title}
                      className={cn(
                        "h-10 transition-all duration-300 ease-out",
                        isActive 
                          ? "bg-gray-100 font-medium text-gray-900 shadow-sm scale-[1.02]" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 hover:scale-[1.01]",
                        locked && "opacity-70"
                      )}
                    >
                      <div className="relative flex items-center justify-center">
                        <Icon className={cn(
                          "size-4 transition-all duration-300",
                          isActive ? "text-blue-600 scale-110" : "text-gray-500 group-hover:scale-105"
                        )} />
                        {isActive && (
                          <div className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full animate-in slide-in-from-left-2 duration-300" />
                        )}
                      </div>
                      
                      <span className="flex-1 truncate transition-all duration-300">{section.title}</span>
                      {locked && (
                        <Lock className="size-3.5 shrink-0 text-gray-400" aria-hidden />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              {/* Add Section button */}
              <SidebarMenuItem>
                {isAddingSection ? (
                  <div className="px-2 py-1">
                    <input
                      ref={addSectionInputRef}
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value.slice(0, 60))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSectionConfirm()
                        if (e.key === 'Escape') {
                          setNewSectionTitle("")
                          setIsAddingSection(false)
                        }
                      }}
                      onBlur={handleAddSectionConfirm}
                      placeholder="Section name..."
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <SidebarMenuButton
                    onClick={() => {
                      if (!canAddSection) {
                        onUpgrade()
                        return
                      }
                      if (atLimit) return
                      setIsAddingSection(true)
                    }}
                    tooltip={!canAddSection ? "Upgrade to add custom sections" : atLimit ? "Maximum 5 custom sections" : "Add a new section"}
                    className={cn(
                      "h-10 transition-all duration-300",
                      canAddSection && !atLimit
                        ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 border border-dashed border-gray-200 hover:border-gray-300"
                        : "text-gray-400 opacity-60",
                      showHint && "animate-pulse"
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      {canAddSection ? (
                        <Plus className="size-4 text-gray-400" />
                      ) : (
                        <Lock className="size-3.5 text-gray-400" />
                      )}
                    </div>
                    <span className="flex-1 truncate">Add section</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-50/50 bg-white/50">
        <div className="group-data-[collapsible=icon]:hidden space-y-4">
          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-2 h-auto py-2 hover:bg-gray-100"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pricing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Progress Indicator (only if not fully unlocked) */}
          {subscriptionTier === 'starter' && (
            <div className="space-y-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
              <div className="flex items-center justify-between text-xs text-gray-500 transition-all duration-300">
                <span className="font-medium">{unlockedCount} of {totalSections} sections included</span>
                <span className="font-semibold text-gray-700">{progress}%</span>
              </div>
              <div className="relative overflow-hidden rounded-full">
                <Progress 
                  value={progress} 
                  className="h-1.5 bg-gray-100" 
                  indicatorClassName="bg-gray-800 transition-all duration-500 ease-out"
                />
              </div>
              <p className="text-[10px] text-gray-400">Upgrade to access all sections</p>
            </div>
          )}

          <div className="grid gap-2">
            {subscriptionTier === 'starter' && (
              <Button 
                onClick={onUpgrade} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                size="sm"
              >
                <Lock className="mr-2 size-3.5 transition-transform duration-300 group-hover:scale-110" />
                Unlock Full Guide
              </Button>
            )}
          </div>
        </div>
        
        {/* Icon-only mode footer */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col gap-2 items-center">
           {subscriptionTier === 'starter' && (
             <Button size="icon" variant="ghost" onClick={onUpgrade} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
               <Lock className="size-4" />
             </Button>
           )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
