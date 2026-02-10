/**
 * @jest-environment node
 */

jest.mock('@/lib/request-context', () => ({
  requestStorage: { run: jest.fn((_c: any, fn: () => any) => fn()), getStore: jest.fn() },
  getRequestContext: jest.fn(),
  incrementQueryCount: jest.fn(),
  createRequestId: jest.fn(() => 'test-req'),
  logRequestStart: jest.fn(),
  logRequestEnd: jest.fn(),
}))

jest.mock('@/lib/providers/email.provider', () => ({
  emailProvider: {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'email-msg-1' }),
    isConfigured: jest.fn(() => true),
  },
}))

jest.mock('@/lib/providers/push.provider', () => ({
  pushProvider: {
    send: jest.fn().mockResolvedValue({ success: true }),
    isConfigured: jest.fn(() => true),
  },
}))

jest.mock('@/lib/providers/sms.provider', () => ({
  smsProvider: {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'sms-msg-1' }),
    isConfigured: jest.fn(() => true),
  },
}))

jest.mock('@/lib/providers/whatsapp.provider', () => ({
  whatsAppProvider: {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'wa-msg-1' }),
    isConfigured: jest.fn(() => true),
  },
}))

jest.mock('@/lib/utils/hebrew-date-utils', () => ({
  getHebrewDateString: jest.fn(() => "ט\"ו בשבט תשפ\"ו"),
  getFullHebrewDate: jest.fn(() => "ט\"ו בשבט תשפ\"ו"),
  getHebrewDayOfWeek: jest.fn(() => 'יום שלישי'),
}))

jest.mock('@/lib/utils/email-templates', () => ({
  buildEmailHtml: jest.fn(() => '<html>test</html>'),
  buildEventReminderHtml: jest.fn(() => '<html>reminder</html>'),
  buildWelcomeEmailHtml: jest.fn(() => '<html>welcome</html>'),
}))

jest.mock('@/lib/prisma', () => {
  const deliveryAttempts: any[] = []

  return {
    prisma: {
      $use: jest.fn(),
      announcement: {
        findUnique: jest.fn(),
      },
      membership: {
        findMany: jest.fn(),
      },
      deliveryAttempt: {
        create: jest.fn().mockImplementation(({ data }) => {
          const attempt = { id: `attempt-${deliveryAttempts.length + 1}`, ...data }
          deliveryAttempts.push(attempt)
          return Promise.resolve(attempt)
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const attempt = deliveryAttempts.find((a) => a.id === where.id)
          if (attempt) Object.assign(attempt, data)
          return Promise.resolve(attempt)
        }),
      },
    },
    _deliveryAttempts: deliveryAttempts,
  }
})

import { DispatchService } from '@/lib/dispatch/dispatch.service'
import { prisma } from '@/lib/prisma'
import { emailProvider } from '@/lib/providers/email.provider'
import { whatsAppProvider } from '@/lib/providers/whatsapp.provider'

const mockAnnouncementFindUnique = prisma.announcement.findUnique as jest.Mock
const mockMembershipFindMany = prisma.membership.findMany as jest.Mock
const mockDeliveryCreate = prisma.deliveryAttempt.create as jest.Mock
const mockDeliveryUpdate = prisma.deliveryAttempt.update as jest.Mock

describe('DispatchService.dispatchAnnouncement (integration)', () => {
  let service: DispatchService

  const FAMILY_A_ID = 'test-family-a-id'
  const ANNOUNCEMENT_ID = 'test-announcement-id'
  const ADMIN_A_ID = 'test-admin-a-id'
  const MEMBER_A_ID = 'test-member-a-id'

  beforeEach(() => {
    jest.clearAllMocks()
    const mod = require('@/lib/prisma')
    mod._deliveryAttempts.length = 0

    service = new DispatchService()

    mockAnnouncementFindUnique.mockResolvedValue({
      id: ANNOUNCEMENT_ID,
      title: 'Test Announcement',
      body: 'Test body',
      type: 'GENERAL',
      familyGroupId: FAMILY_A_ID,
      createdBy: ADMIN_A_ID,
      familyGroup: { id: FAMILY_A_ID, name: 'Family A' },
      creator: { id: ADMIN_A_ID, name: 'Admin A' },
    })

    mockMembershipFindMany.mockResolvedValue([
      {
        id: 'mem-admin',
        userId: ADMIN_A_ID,
        familyGroupId: FAMILY_A_ID,
        user: {
          id: ADMIN_A_ID,
          name: 'Admin A',
          email: 'admin@test.com',
          phone: '+972500000001',
          preferences: [
            {
              channel: 'EMAIL',
              enabled: true,
              destination: 'admin@test.com',
              verifiedAt: new Date(),
            },
            {
              channel: 'WHATSAPP',
              enabled: true,
              destination: '+972500000001',
              verifiedAt: new Date(),
            },
          ],
        },
      },
      {
        id: 'mem-member',
        userId: MEMBER_A_ID,
        familyGroupId: FAMILY_A_ID,
        user: {
          id: MEMBER_A_ID,
          name: 'Member A',
          email: 'member@test.com',
          phone: '+972500000002',
          preferences: [
            {
              channel: 'EMAIL',
              enabled: true,
              destination: 'member@test.com',
              verifiedAt: new Date(),
            },
          ],
        },
      },
    ])
  })

  it('should create DeliveryAttempt per member per enabled+verified channel', async () => {
    await service.dispatchAnnouncement({
      announcementId: ANNOUNCEMENT_ID,
      familyGroupId: FAMILY_A_ID,
    })

    expect(mockDeliveryCreate).toHaveBeenCalledTimes(3)

    const calls = mockDeliveryCreate.mock.calls.map((c: any) => c[0].data)

    const adminEmail = calls.find(
      (c: any) => c.userId === ADMIN_A_ID && c.channel === 'EMAIL'
    )
    expect(adminEmail).toBeDefined()
    expect(adminEmail.itemType).toBe('ANNOUNCEMENT')
    expect(adminEmail.itemId).toBe(ANNOUNCEMENT_ID)
    expect(adminEmail.status).toBe('QUEUED')

    const adminWhatsApp = calls.find(
      (c: any) => c.userId === ADMIN_A_ID && c.channel === 'WHATSAPP'
    )
    expect(adminWhatsApp).toBeDefined()

    const memberEmail = calls.find(
      (c: any) => c.userId === MEMBER_A_ID && c.channel === 'EMAIL'
    )
    expect(memberEmail).toBeDefined()
  })

  it('should mark attempts as SENT on provider success', async () => {
    await service.dispatchAnnouncement({
      announcementId: ANNOUNCEMENT_ID,
      familyGroupId: FAMILY_A_ID,
    })

    expect(mockDeliveryUpdate).toHaveBeenCalledTimes(3)

    const updateCalls = mockDeliveryUpdate.mock.calls.map((c: any) => c[0].data)
    updateCalls.forEach((data: any) => {
      expect(data.status).toBe('SENT')
    })
  })

  it('should mark attempt as FAILED on provider error', async () => {
    ;(emailProvider.send as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Rate limit exceeded',
    })

    await service.dispatchAnnouncement({
      announcementId: ANNOUNCEMENT_ID,
      familyGroupId: FAMILY_A_ID,
    })

    const failedUpdate = mockDeliveryUpdate.mock.calls.find(
      (c: any) => c[0].data.status === 'FAILED'
    )
    expect(failedUpdate).toBeDefined()
    expect(failedUpdate[0].data.error).toBe('Rate limit exceeded')
  })

  it('should skip unverified preferences', async () => {
    mockMembershipFindMany.mockResolvedValue([
      {
        id: 'mem-admin',
        userId: ADMIN_A_ID,
        familyGroupId: FAMILY_A_ID,
        user: {
          id: ADMIN_A_ID,
          name: 'Admin A',
          email: 'admin@test.com',
          phone: '+972500000001',
          preferences: [
            {
              channel: 'EMAIL',
              enabled: true,
              destination: 'admin@test.com',
              verifiedAt: null,
            },
          ],
        },
      },
    ])

    await service.dispatchAnnouncement({
      announcementId: ANNOUNCEMENT_ID,
      familyGroupId: FAMILY_A_ID,
    })

    expect(mockDeliveryCreate).not.toHaveBeenCalled()
  })

  it('should call correct providers with correct payloads', async () => {
    await service.dispatchAnnouncement({
      announcementId: ANNOUNCEMENT_ID,
      familyGroupId: FAMILY_A_ID,
    })

    expect(emailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@test.com',
        subject: expect.stringContaining('Test Announcement'),
      })
    )

    expect(whatsAppProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+972500000001',
        message: expect.stringContaining('Test Announcement'),
      })
    )
  })

  it('should throw when announcement not found', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null)

    await expect(
      service.dispatchAnnouncement({
        announcementId: 'nonexistent',
        familyGroupId: FAMILY_A_ID,
      })
    ).rejects.toThrow('Announcement not found')
  })
})
