import { DispatchService } from '@/lib/dispatch/dispatch.service'
import { prismaMock } from '../utils/test-helpers'
import {
  mockAnnouncement,
  mockEvent,
  mockMembership,
  mockUser,
  mockPreference,
  mockFamilyGroup,
} from '../utils/test-helpers'

// Mock the providers
const mockEmailProvider = {
  send: jest.fn(),
}

const mockSmsProvider = {
  send: jest.fn(),
}

const mockWhatsAppProvider = {
  send: jest.fn(),
}

const mockPushProvider = {
  send: jest.fn(),
}

jest.mock('@/lib/providers/email.provider', () => ({
  emailProvider: mockEmailProvider,
}))

jest.mock('@/lib/providers/sms.provider', () => ({
  smsProvider: mockSmsProvider,
}))

jest.mock('@/lib/providers/whatsapp.provider', () => ({
  whatsAppProvider: mockWhatsAppProvider,
}))

jest.mock('@/lib/providers/push.provider', () => ({
  pushProvider: mockPushProvider,
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('DispatchService', () => {
  let dispatchService: DispatchService

  beforeEach(() => {
    jest.clearAllMocks()
    dispatchService = new DispatchService()
  })

  describe('dispatchAnnouncement', () => {
    it('should dispatch announcement to all members with enabled preferences', async () => {
      const announcement = mockAnnouncement()
      const familyGroup = mockFamilyGroup()
      const user = mockUser()
      const preference = mockPreference({ channel: 'EMAIL', enabled: true })
      const membership = {
        ...mockMembership(),
        user: {
          ...user,
          preferences: [preference],
        },
      }

      // @ts-ignore
      prismaMock.announcement.findUnique.mockResolvedValue({
        ...announcement,
        familyGroup,
        creator: user,
      })

      // @ts-ignore
      prismaMock.membership.findMany.mockResolvedValue([membership])

      // @ts-ignore
      prismaMock.deliveryAttempt.create.mockResolvedValue({
        id: 'delivery-123',
        itemType: 'ANNOUNCEMENT',
        itemId: announcement.id,
        userId: user.id,
        channel: 'EMAIL',
        status: 'QUEUED',
      })

      // @ts-ignore
      prismaMock.deliveryAttempt.update.mockResolvedValue({})

      mockEmailProvider.send.mockResolvedValue({
        success: true,
        messageId: 'email-123',
      })

      await dispatchService.dispatchAnnouncement({
        announcementId: announcement.id,
        familyGroupId: familyGroup.id,
      })

      expect(prismaMock.announcement.findUnique).toHaveBeenCalledWith({
        where: { id: announcement.id },
        include: {
          familyGroup: true,
          creator: true,
        },
      })

      expect(prismaMock.membership.findMany).toHaveBeenCalledWith({
        where: { familyGroupId: familyGroup.id },
        include: {
          user: {
            include: {
              preferences: {
                where: { enabled: true },
              },
            },
          },
        },
      })

      expect(mockEmailProvider.send).toHaveBeenCalled()
      expect(prismaMock.deliveryAttempt.create).toHaveBeenCalled()
      expect(prismaMock.deliveryAttempt.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          status: 'SENT',
          providerMessageId: 'email-123',
          error: undefined,
        },
      })
    })

    it('should skip unverified preferences', async () => {
      const announcement = mockAnnouncement()
      const familyGroup = mockFamilyGroup()
      const user = mockUser()
      const unverifiedPreference = mockPreference({
        channel: 'EMAIL',
        enabled: true,
        verifiedAt: null, // Not verified
      })
      const membership = {
        ...mockMembership(),
        user: {
          ...user,
          preferences: [unverifiedPreference],
        },
      }

      // @ts-ignore
      prismaMock.announcement.findUnique.mockResolvedValue({
        ...announcement,
        familyGroup,
        creator: user,
      })

      // @ts-ignore
      prismaMock.membership.findMany.mockResolvedValue([membership])

      await dispatchService.dispatchAnnouncement({
        announcementId: announcement.id,
        familyGroupId: familyGroup.id,
      })

      expect(mockEmailProvider.send).not.toHaveBeenCalled()
      expect(prismaMock.deliveryAttempt.create).not.toHaveBeenCalled()
    })

    it('should handle send failure', async () => {
      const announcement = mockAnnouncement()
      const familyGroup = mockFamilyGroup()
      const user = mockUser()
      const preference = mockPreference({ channel: 'EMAIL', enabled: true })
      const membership = {
        ...mockMembership(),
        user: {
          ...user,
          preferences: [preference],
        },
      }

      // @ts-ignore
      prismaMock.announcement.findUnique.mockResolvedValue({
        ...announcement,
        familyGroup,
        creator: user,
      })

      // @ts-ignore
      prismaMock.membership.findMany.mockResolvedValue([membership])

      // @ts-ignore
      prismaMock.deliveryAttempt.create.mockResolvedValue({
        id: 'delivery-123',
      })

      // @ts-ignore
      prismaMock.deliveryAttempt.update.mockResolvedValue({})

      mockEmailProvider.send.mockResolvedValue({
        success: false,
        error: 'Email send failed',
      })

      await dispatchService.dispatchAnnouncement({
        announcementId: announcement.id,
        familyGroupId: familyGroup.id,
      })

      expect(prismaMock.deliveryAttempt.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          status: 'FAILED',
          providerMessageId: undefined,
          error: 'Email send failed',
        },
      })
    })

    it('should throw error if announcement not found', async () => {
      // @ts-ignore
      prismaMock.announcement.findUnique.mockResolvedValue(null)

      await expect(
        dispatchService.dispatchAnnouncement({
          announcementId: 'non-existent',
          familyGroupId: 'family-123',
        })
      ).rejects.toThrow('Announcement not found')
    })
  })

  describe('dispatchEventReminder', () => {
    it('should dispatch event reminder to all members', async () => {
      const event = mockEvent()
      const familyGroup = mockFamilyGroup()
      const user = mockUser()
      const preference = mockPreference({ channel: 'EMAIL', enabled: true })
      const membership = {
        ...mockMembership(),
        user: {
          ...user,
          preferences: [preference],
        },
      }

      // @ts-ignore
      prismaMock.event.findUnique.mockResolvedValue({
        ...event,
        familyGroup,
        creator: user,
      })

      // @ts-ignore
      prismaMock.membership.findMany.mockResolvedValue([membership])

      // @ts-ignore
      prismaMock.deliveryAttempt.create.mockResolvedValue({
        id: 'delivery-123',
        itemType: 'EVENT',
        itemId: event.id,
        userId: user.id,
        channel: 'EMAIL',
        status: 'QUEUED',
      })

      // @ts-ignore
      prismaMock.deliveryAttempt.update.mockResolvedValue({})

      mockEmailProvider.send.mockResolvedValue({
        success: true,
        messageId: 'email-123',
      })

      await dispatchService.dispatchEventReminder({
        eventId: event.id,
        familyGroupId: familyGroup.id,
      })

      expect(prismaMock.event.findUnique).toHaveBeenCalled()
      expect(prismaMock.membership.findMany).toHaveBeenCalled()
      expect(mockEmailProvider.send).toHaveBeenCalled()
      expect(prismaMock.deliveryAttempt.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          status: 'SENT',
          providerMessageId: 'email-123',
          error: undefined,
        },
      })
    })

    it('should throw error if event not found', async () => {
      // @ts-ignore
      prismaMock.event.findUnique.mockResolvedValue(null)

      await expect(
        dispatchService.dispatchEventReminder({
          eventId: 'non-existent',
          familyGroupId: 'family-123',
        })
      ).rejects.toThrow('Event not found')
    })
  })
})


