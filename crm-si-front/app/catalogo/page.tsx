"use client"

import { SidebarLayout } from "@/components/SidebarLayout"
import { ProductsList } from "@/components/products/ProductsList"

export default function CatalogoPage() {
  return (
    <SidebarLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-6 lg:px-8 py-6">
          <ProductsList />
        </div>
      </div>
    </SidebarLayout>
  )
}
