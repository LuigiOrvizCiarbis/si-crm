import { Skeleton } from "@/components/ui/skeleton"

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-[#1e2533]">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-10 w-full max-w-4xl mx-auto" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
