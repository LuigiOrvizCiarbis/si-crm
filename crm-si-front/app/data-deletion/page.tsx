"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function DataDeletionContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get("code")

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center space-y-6">
        <Link href="/" className="text-2xl font-bold">
          Social Impulse
        </Link>

        <div className="bg-card border border-border rounded-xl p-8 space-y-4">
          <h1 className="text-xl font-semibold">Data Deletion Request</h1>

          {code ? (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your data deletion request has been processed. All data associated with your
                Facebook account has been removed from our systems.
              </p>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Confirmation code</p>
                <p className="text-sm font-mono font-medium mt-1">{code}</p>
              </div>
              <p className="text-muted-foreground text-xs">
                Please save this confirmation code for your records. Data deletion may take
                up to 90 days to fully propagate across all backup systems.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              No deletion request found. If you would like to request deletion of your data,
              please contact us at{" "}
              <a href="mailto:privacy@socialimpulse.com" className="text-primary underline">
                privacy@socialimpulse.com
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DataDeletionPage() {
  return (
    <Suspense fallback={null}>
      <DataDeletionContent />
    </Suspense>
  )
}
