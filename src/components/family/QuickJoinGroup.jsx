/**
 * Quick Join Group Component
 * Provides a simple way to join an existing family group
 */

import React, { useState, useCallback } from 'react';
import { LogIn, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { joinFamilyGroup, isValidGroupCode } from '../../services/family/GroupCodeService';
import { useAuth } from '../../services/auth/AuthContext';

export default function QuickJoinGroup({ onSuccess, onCancel }) {
  const [groupCode, setGroupCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const handleJoin = useCallback(async (e) => {
    e.preventDefault();
    
    if (!isValidGroupCode(groupCode.toUpperCase())) {
      setError('Please enter a valid group code (format: WORD-WORD-1234)');
      return;
    }

    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await joinFamilyGroup(user, groupCode.trim().toUpperCase(), nickname.trim());
      
      if (result.success) {
        onSuccess?.(result.group);
      } else {
        setError(result.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      setError('Failed to join family group');
    } finally {
      setLoading(false);
    }
  }, [user, groupCode, nickname, onSuccess]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Join Family Group
        </h2>
        <p className="text-gray-600 text-sm">
          Enter the group code shared by your family member
        </p>
      </div>

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Code
          </label>
          <input
            type="text"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
            placeholder="SHIELD-STRONG-8530"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg"
            maxLength={20}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Mom, Dad, Alex, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={20}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            How you'll appear to other group members (not your real name)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !isValidGroupCode(groupCode) || !nickname.trim()}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Joining...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Join Group</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Privacy:</strong> Only your nickname will be visible to group members. 
          No personal information is shared.
        </p>
      </div>
    </div>
  );
}