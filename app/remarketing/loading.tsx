import { CrmSidebar } from "@/components/crm-sidebar"

export default function RemarketingLoading() {
  return (
    <div className="flex h-screen bg-background">
      <CrmSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
