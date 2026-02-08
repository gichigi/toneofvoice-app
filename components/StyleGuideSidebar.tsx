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
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Lock, CreditCard, Sparkles } from "lucide-react"
import { StyleGuideSection, Tier } from "@/lib/content-parser"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StyleGuideSidebarProps {
  sections: StyleGuideSection[]
  activeSectionId: string
  onSectionSelect: (id: string) => void
  subscriptionTier: Tier
  brandName: string
  onUpgrade: () => void
}

export function StyleGuideSidebar({
  sections,
  activeSectionId,
  onSectionSelect,
  subscriptionTier,
  brandName,
  onUpgrade,
}: StyleGuideSidebarProps) {
  const { setOpenMobile } = useSidebar()

  // Calculate progress
  // Assuming 'free' tier can access 'free' sections.
  // 'pro'/'team' can access everything.
  const totalSections = sections.length
  // unlocked count: sections where minTier is 'free' OR user tier >= minTier
  // Tier hierarchy: free < pro < team
  const isUnlocked = (minTier?: Tier) => {
    if (!minTier || minTier === 'free') return true
    if (subscriptionTier === 'free') return false
    if (subscriptionTier === 'pro' && minTier === 'team') return false
    return true
  }

  const unlockedCount = sections.filter(s => isUnlocked(s.minTier)).length
  const progress = Math.round((unlockedCount / Math.max(totalSections, 1)) * 100)

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-100 bg-white/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
      <SidebarHeader className="p-4 pt-6 border-b border-gray-50/50">
        <div className="flex items-center gap-2 px-2 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex-1 truncate group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold text-gray-900 truncate tracking-tight">{brandName}</h2>
            <p className="text-xs text-gray-500 truncate">Style Guide</p>
          </div>
          {/* Brand initial in icon mode */}
          <div className="hidden group-data-[collapsible=icon]:flex w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm items-center justify-center shrink-0">
            {brandName.charAt(0).toUpperCase()}
          </div>
          {subscriptionTier !== 'free' && (
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
              {sections.map((section) => {
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
                        <Lock className="size-3 text-gray-400 ml-auto transition-all duration-300 group-hover:text-gray-500" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-50/50 bg-white/50">
        <div className="group-data-[collapsible=icon]:hidden space-y-4">
          {/* Progress Indicator (only if not fully unlocked) */}
          {subscriptionTier === 'free' && (
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
            {subscriptionTier === 'free' && (
              <Button 
                onClick={onUpgrade} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                size="sm"
              >
                <CreditCard className="mr-2 size-3.5 transition-transform duration-300 group-hover:scale-110" />
                Unlock Full Guide
              </Button>
            )}
          </div>
        </div>
        
        {/* Icon-only mode footer */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col gap-2 items-center">
           {subscriptionTier === 'free' && (
             <Button size="icon" variant="ghost" onClick={onUpgrade} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
               <Lock className="size-4" />
             </Button>
           )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
