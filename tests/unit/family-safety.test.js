/**
 * Unit Tests for Family Safety Hub Components
 * Tests family coordination logic and group management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Family Safety Hub Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Group Code Generation and Validation', () => {
    it('should generate valid group codes', () => {
      const generateGroupCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const code = generateGroupCode();
      
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should validate group code format', () => {
      const isValidGroupCode = (code) => {
        return typeof code === 'string' && 
               code.length === 6 && 
               /^[A-Z0-9]{6}$/.test(code);
      };

      expect(isValidGroupCode('ABC123')).toBe(true);
      expect(isValidGroupCode('FAMILY')).toBe(true);
      expect(isValidGroupCode('abc123')).toBe(false); // lowercase
      expect(isValidGroupCode('AB12')).toBe(false); // too short
      expect(isValidGroupCode('ABC12!')).toBe(false); // special chars
    });
  });

  describe('Family Group Management', () => {
    it('should create group with proper structure', () => {
      const createGroup = (groupName, creatorName, creatorId) => {
        return {
          code: 'ABC123',
          name: groupName,
          createdBy: creatorId,
          createdAt: new Date().toISOString(),
          members: [{
            id: creatorId,
            name: creatorName,
            role: 'creator',
            status: 'unknown',
            lastCheckIn: null,
            joinedAt: new Date().toISOString()
          }],
          settings: {
            autoCheckIn: true,
            emergencyContacts: [],
            shareLocation: true
          }
        };
      };

      const group = createGroup('Test Family', 'John Doe', 'user123');
      
      expect(group.code).toBe('ABC123');
      expect(group.name).toBe('Test Family');
      expect(group.members).toHaveLength(1);
      expect(group.members[0].role).toBe('creator');
      expect(group.settings.autoCheckIn).toBe(true);
    });

    it('should add member to existing group', () => {
      const group = {
        code: 'ABC123',
        members: [
          { id: 'creator', name: 'John', role: 'creator' }
        ]
      };

      const addMemberToGroup = (group, userId, userName) => {
        const newMember = {
          id: userId,
          name: userName,
          role: 'member',
          status: 'unknown',
          lastCheckIn: null,
          joinedAt: new Date().toISOString()
        };

        return {
          ...group,
          members: [...group.members, newMember]
        };
      };

      const updatedGroup = addMemberToGroup(group, 'user456', 'Jane Doe');
      
      expect(updatedGroup.members).toHaveLength(2);
      expect(updatedGroup.members[1].name).toBe('Jane Doe');
      expect(updatedGroup.members[1].role).toBe('member');
    });

    it('should handle member status updates', () => {
      const updateMemberStatus = (members, userId, newStatus) => {
        return members.map(member => 
          member.id === userId 
            ? { ...member, status: newStatus, lastCheckIn: new Date().toISOString() }
            : member
        );
      };

      const members = [
        { id: 'user1', name: 'John', status: 'unknown' },
        { id: 'user2', name: 'Jane', status: 'unknown' }
      ];

      const updated = updateMemberStatus(members, 'user1', 'safe');
      
      expect(updated[0].status).toBe('safe');
      expect(updated[0].lastCheckIn).toBeDefined();
      expect(updated[1].status).toBe('unknown'); // unchanged
    });
  });

  describe('Member Status Logic', () => {
    it('should determine if check-in is needed', () => {
      const needsCheckIn = (member, thresholdHours = 4) => {
        if (!member.lastCheckIn) return true;
        
        const lastCheckIn = new Date(member.lastCheckIn);
        const threshold = Date.now() - (thresholdHours * 60 * 60 * 1000);
        
        return lastCheckIn.getTime() < threshold;
      };

      const recentMember = {
        id: 'user1',
        lastCheckIn: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      };

      const oldMember = {
        id: 'user2',
        lastCheckIn: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
      };

      const newMember = {
        id: 'user3',
        lastCheckIn: null
      };

      expect(needsCheckIn(recentMember)).toBe(false);
      expect(needsCheckIn(oldMember)).toBe(true);
      expect(needsCheckIn(newMember)).toBe(true);
    });

    it('should calculate group safety summary', () => {
      const calculateGroupSummary = (members) => {
        const summary = {
          total: members.length,
          safe: 0,
          emergency: 0,
          unknown: 0,
          needsCheckIn: 0
        };

        members.forEach(member => {
          summary[member.status]++;
          
          if (needsCheckIn(member)) {
            summary.needsCheckIn++;
          }
        });

        return summary;
      };

      const needsCheckIn = (member) => {
        if (!member.lastCheckIn) return true;
        const threshold = Date.now() - (4 * 60 * 60 * 1000);
        return new Date(member.lastCheckIn).getTime() < threshold;
      };

      const members = [
        { id: '1', status: 'safe', lastCheckIn: new Date().toISOString() },
        { id: '2', status: 'emergency', lastCheckIn: new Date().toISOString() },
        { id: '3', status: 'unknown', lastCheckIn: null },
        { id: '4', status: 'safe', lastCheckIn: null }
      ];

      const summary = calculateGroupSummary(members);
      
      expect(summary.total).toBe(4);
      expect(summary.safe).toBe(2);
      expect(summary.emergency).toBe(1);
      expect(summary.unknown).toBe(1);
      expect(summary.needsCheckIn).toBe(2); // members 3 and 4
    });
  });

  describe('Emergency Communication', () => {
    it('should format emergency messages', () => {
      const formatEmergencyMessage = (member, messageType, details = '') => {
        const timestamp = new Date().toLocaleString();
        
        switch (messageType) {
          case 'safe':
            return `${member.name} checked in as SAFE at ${timestamp}`;
          case 'emergency':
            return `🚨 EMERGENCY: ${member.name} needs help! ${details} (${timestamp})`;
          case 'evacuating':
            return `${member.name} is evacuating. ${details} (${timestamp})`;
          default:
            return `${member.name}: ${details} (${timestamp})`;
        }
      };

      const member = { name: 'John Doe' };
      
      const safeMessage = formatEmergencyMessage(member, 'safe');
      const emergencyMessage = formatEmergencyMessage(member, 'emergency', 'Trapped in building');
      
      expect(safeMessage).toContain('checked in as SAFE');
      expect(emergencyMessage).toContain('🚨 EMERGENCY');
      expect(emergencyMessage).toContain('Trapped in building');
    });

    it('should prioritize emergency messages', () => {
      const prioritizeMessages = (messages) => {
        const priorities = {
          'emergency': 1,
          'evacuating': 2,
          'safe': 3,
          'unknown': 4
        };

        return messages.sort((a, b) => {
          const priorityA = priorities[a.type] || 5;
          const priorityB = priorities[b.type] || 5;
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // Sort by timestamp if same priority
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
      };

      const messages = [
        { type: 'safe', timestamp: '2023-01-01T10:00:00Z', text: 'Safe check-in' },
        { type: 'emergency', timestamp: '2023-01-01T09:00:00Z', text: 'Emergency!' },
        { type: 'evacuating', timestamp: '2023-01-01T11:00:00Z', text: 'Evacuating now' }
      ];

      const sorted = prioritizeMessages(messages);
      
      expect(sorted[0].type).toBe('emergency');
      expect(sorted[1].type).toBe('evacuating');
      expect(sorted[2].type).toBe('safe');
    });
  });

  describe('Privacy and Security', () => {
    it('should generate anonymous user IDs', () => {
      const generateAnonymousId = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `local-${timestamp}-${random}`;
      };

      const id = generateAnonymousId();
      
      expect(id).toMatch(/^local-\d+-[a-z0-9]{9}$/);
    });

    it('should sanitize user input', () => {
      const sanitizeInput = (input, maxLength = 100) => {
        if (typeof input !== 'string') return '';
        
        return input
          .trim()
          .substring(0, maxLength)
          .replace(/[<>'"&]/g, ''); // Remove potential XSS characters
      };

      expect(sanitizeInput('  Hello World  ')).toBe('Hello World');
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeInput('A'.repeat(150), 100)).toHaveLength(100);
    });

    it('should validate group permissions', () => {
      const canPerformAction = (member, action) => {
        const permissions = {
          creator: ['delete', 'transfer', 'kick', 'invite', 'settings'],
          admin: ['kick', 'invite', 'settings'],
          member: ['invite']
        };

        return permissions[member.role]?.includes(action) || false;
      };

      const creator = { role: 'creator' };
      const admin = { role: 'admin' };
      const member = { role: 'member' };

      expect(canPerformAction(creator, 'delete')).toBe(true);
      expect(canPerformAction(admin, 'kick')).toBe(true);
      expect(canPerformAction(member, 'delete')).toBe(false);
      expect(canPerformAction(member, 'invite')).toBe(true);
    });
  });

  describe('Real-time Updates', () => {
    it('should handle connection state changes', () => {
      const handleConnectionChange = (isOnline, pendingUpdates = []) => {
        if (isOnline && pendingUpdates.length > 0) {
          return {
            action: 'sync',
            updates: pendingUpdates,
            timestamp: new Date().toISOString()
          };
        }
        
        return {
          action: isOnline ? 'connected' : 'offline',
          updates: [],
          timestamp: new Date().toISOString()
        };
      };

      const onlineWithPending = handleConnectionChange(true, [
        { type: 'status', data: { status: 'safe' } }
      ]);

      const offlineState = handleConnectionChange(false, []);

      expect(onlineWithPending.action).toBe('sync');
      expect(onlineWithPending.updates).toHaveLength(1);
      expect(offlineState.action).toBe('offline');
    });

    it('should queue updates when offline', () => {
      const queueUpdate = (queue, update) => {
        const queuedUpdate = {
          ...update,
          queuedAt: new Date().toISOString(),
          retryCount: 0
        };

        return [...queue, queuedUpdate];
      };

      const queue = [];
      const update = { type: 'status', userId: 'user1', status: 'safe' };
      
      const newQueue = queueUpdate(queue, update);
      
      expect(newQueue).toHaveLength(1);
      expect(newQueue[0].queuedAt).toBeDefined();
      expect(newQueue[0].retryCount).toBe(0);
    });
  });
});