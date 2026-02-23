import { CommunicationChannel, DeliveryStatus, ItemType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type ChannelProgress = {
  total: number
  processed: number
  sent: number
  failed: number
  queued: number
}

export type DeliveryProgressResponse = {
  itemType: ItemType
  itemId: string
  total: number
  processed: number
  sent: number
  failed: number
  queued: number
  percentage: number
  byChannel: Record<CommunicationChannel, ChannelProgress>
  startedAt: string | null
  completedAt: string | null
  isComplete: boolean
}

const CHANNELS: CommunicationChannel[] = ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'VOICE_CALL']

export async function getDeliveryProgress(
  itemType: ItemType,
  itemId: string
): Promise<DeliveryProgressResponse> {
  const attempts = await prisma.deliveryAttempt.groupBy({
    by: ['channel', 'status'],
    where: { itemType, itemId },
    _count: { _all: true },
  })

  const boundaries = await prisma.deliveryAttempt.aggregate({
    where: { itemType, itemId },
    _min: { createdAt: true },
    _max: { updatedAt: true },
  })

  const byChannel = CHANNELS.reduce<Record<CommunicationChannel, ChannelProgress>>((acc, channel) => {
    const queued = attempts
      .filter((attempt) => attempt.channel === channel && attempt.status === DeliveryStatus.QUEUED)
      .reduce((sum, attempt) => sum + attempt._count._all, 0)

    const sent = attempts
      .filter((attempt) => attempt.channel === channel && attempt.status === DeliveryStatus.SENT)
      .reduce((sum, attempt) => sum + attempt._count._all, 0)

    const failed = attempts
      .filter((attempt) => attempt.channel === channel && attempt.status === DeliveryStatus.FAILED)
      .reduce((sum, attempt) => sum + attempt._count._all, 0)

    const processed = sent + failed
    const total = queued + processed

    acc[channel] = {
      total,
      processed,
      sent,
      failed,
      queued,
    }

    return acc
  }, {} as Record<CommunicationChannel, ChannelProgress>)

  const totals = Object.values(byChannel).reduce(
    (acc, channel) => ({
      total: acc.total + channel.total,
      processed: acc.processed + channel.processed,
      sent: acc.sent + channel.sent,
      failed: acc.failed + channel.failed,
      queued: acc.queued + channel.queued,
    }),
    { total: 0, processed: 0, sent: 0, failed: 0, queued: 0 }
  )

  const percentage = totals.total > 0 ? Math.round((totals.processed / totals.total) * 100) : 0
  const isComplete = totals.total > 0 && totals.queued === 0

  return {
    itemType,
    itemId,
    total: totals.total,
    processed: totals.processed,
    sent: totals.sent,
    failed: totals.failed,
    queued: totals.queued,
    percentage,
    byChannel,
    startedAt: boundaries._min.createdAt ? boundaries._min.createdAt.toISOString() : null,
    completedAt: isComplete && boundaries._max.updatedAt ? boundaries._max.updatedAt.toISOString() : null,
    isComplete,
  }
}
