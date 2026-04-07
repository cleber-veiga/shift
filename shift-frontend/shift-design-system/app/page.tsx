"use client"

import { useState } from "react"
import { DesignSystemHeader } from "@/components/design-system/header"
import { DesignSystemSidebar } from "@/components/design-system/sidebar"
import { ColorsSection } from "@/components/design-system/sections/colors"
import { TypographySection } from "@/components/design-system/sections/typography"
import { ButtonsSection } from "@/components/design-system/sections/buttons"
import { CardsSection } from "@/components/design-system/sections/cards"
import { GridsSection } from "@/components/design-system/sections/grids"
import { FormsSection } from "@/components/design-system/sections/forms"
import { BadgesSection } from "@/components/design-system/sections/badges"
import { TabsSection } from "@/components/design-system/sections/tabs"
import { TablesSection } from "@/components/design-system/sections/tables"
import { DataTablesSection } from "@/components/design-system/sections/datatables"
import { ChartsSection } from "@/components/design-system/sections/charts"
import { NavigationSection } from "@/components/design-system/sections/navigation"
import { FeedbackSection } from "@/components/design-system/sections/feedback"
import { IntroSection } from "@/components/design-system/sections/intro"
import { GettingStartedSection } from "@/components/design-system/sections/getting-started"
import { AuthenticationSection } from "@/components/design-system/sections/authentication"
import { SidebarsSection } from "@/components/design-system/sections/sidebars"
import { TopbarsSection } from "@/components/design-system/sections/topbars"
import { LayoutsSection } from "@/components/design-system/sections/layouts"
import { TreeViewSection } from "@/components/design-system/sections/treeview"

export default function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState("intro")

  const renderSection = () => {
    switch (activeSection) {
      case "intro":
        return <IntroSection />
      case "getting-started":
        return <GettingStartedSection />
      case "colors":
        return <ColorsSection />
      case "typography":
        return <TypographySection />
      case "buttons":
        return <ButtonsSection />
      case "cards":
        return <CardsSection />
      case "grids":
        return <GridsSection />
      case "forms":
        return <FormsSection />
      case "badges":
        return <BadgesSection />
      case "tabs":
        return <TabsSection />
      case "tables":
        return <TablesSection />
      case "datatables":
        return <DataTablesSection />
      case "charts":
        return <ChartsSection />
      case "treeview":
        return <TreeViewSection />
      case "navigation":
        return <NavigationSection />
      case "feedback":
        return <FeedbackSection />
      case "authentication":
        return <AuthenticationSection />
      case "sidebars":
        return <SidebarsSection />
      case "topbars":
        return <TopbarsSection />
      case "layouts":
        return <LayoutsSection />
      default:
        return <IntroSection />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DesignSystemHeader />
      <div className="flex">
        <DesignSystemSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 p-8 lg:p-12 ml-0 lg:ml-64">
          <div className="max-w-5xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}
