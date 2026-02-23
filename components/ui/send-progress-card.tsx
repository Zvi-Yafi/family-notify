import { CommunicationChannel } from '@prisma/client'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type ChannelProgress = {
  total: number
  processed: number
  sent: number
  failed: number
  queued: number
}

export type SendProgressData = {
  total: number
  processed: number
  sent: number
  failed: number
  queued: number
  percentage: number
  byChannel: Record<CommunicationChannel, ChannelProgress>
  isComplete: boolean
}

type SendProgressCardProps = {
  titleKey:
    | 'sendingProgress.announcementTitle'
    | 'sendingProgress.eventReminderTitle'
    | 'sendingProgress.eventNotificationTitle'
  progress: SendProgressData
}

export function SendProgressCard({ titleKey, progress }: SendProgressCardProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-primary/40 bg-background shadow-xl">
        <CardHeader className="space-y-3 rounded-t-lg bg-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t(titleKey)}</CardTitle>
            <Badge variant={progress.isComplete ? 'default' : 'secondary'}>
              {progress.isComplete ? t('sendingProgress.completed') : t('sendingProgress.inProgress')}
            </Badge>
          </div>
          <CardDescription>
            {t('sendingProgress.processedOfTotal', {
              processed: progress.processed,
              total: progress.total,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-secondary/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('sendingProgress.processedOfTotal', {
                  processed: progress.processed,
                  total: progress.total,
                })}
              </span>
              <span className="text-2xl font-bold text-primary">
                {t('sendingProgress.percentageLabel', { value: progress.percentage })}
              </span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Badge variant="default" className="justify-center">
              {t('sendingProgress.sent')}: {progress.sent}
            </Badge>
            <Badge variant={progress.failed > 0 ? 'destructive' : 'secondary'} className="justify-center">
              {t('sendingProgress.failed')}: {progress.failed}
            </Badge>
            <Badge variant="secondary" className="justify-center">
              {t('sendingProgress.queued')}: {progress.queued}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(progress.byChannel) as CommunicationChannel[]).map((channel) => {
              const channelProgress = progress.byChannel[channel]
              if (channelProgress.total === 0) {
                return null
              }

              return (
                <Badge key={channel} variant="outline">
                  {t(`sendingProgress.channel.${channel}`)}: {channelProgress.processed}/
                  {channelProgress.total}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
