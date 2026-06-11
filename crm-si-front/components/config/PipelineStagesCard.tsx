"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { usePermission } from "@/hooks/usePermission"
import { PipelineStagesManager } from "@/components/pipeline-stages-manager"

export function PipelineStagesCard() {
  const { t } = useTranslation()
  const canView = usePermission(["pipeline_stages.view", "pipeline_stages.manage"])

  if (!canView) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-muted-foreground" />
          {t("pipeline.stages.cardTitle")}
        </CardTitle>
        <CardDescription>{t("pipeline.stages.manageDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <PipelineStagesManager />
      </CardContent>
    </Card>
  )
}
