/**
 * Isolated Group Setup Component - Prevents focus loss from parent re-renders
 * This component is designed to be stable and not re-render when parent components change
 */

import React, { useState, useCallback, memo } from 'react';
import { Users, Plus, LogIn, Shield, Info, CheckCircle, AlertTriangle } from 'lucide-react';

// Import services directly to avoid context re-renders
import { createFamilyGroup, joinFamilyGroup } from '../../services/family/GroupCodeService';
import { isValidGroupCode } from '../../services/family/GroupCodeService';
import { useAuth } from '../../services/auth/AuthContext';
import GroupCreationSuccess from './GroupCreationSuccess';

const IsolatedGroupSetup = memo(({ onComplete }) => {
  console.log('🔧 IsolatedGroupSetup render');
  
  const [mode, setMode] = useState('choice'); // choice, create, join, success
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdGroupData, setCreatedGroupData] = useState(null);
  const [createdGroupCode, setCreatedGroupCode] = useState(null);

  const { user } = useAuth();

  // Stable event handlers - these will never change
  const handleGroupNameChange = useCallback((e) => {
    console.log('📝 Group name changing:', e.target.value);
    setGroupName(e.target.value);
  }, []);

  const handleGroupCodeChange = useCallback((e) => {
    setGroupCode(e.target.value.toUpperCase());
  }, []);

  const handleNicknameChange = useCallback((e) => {
    setNickname(e.target.value);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleCreateGroup = useCallback(async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      console.log('🔥 Creating group:', groupName.trim());
      const result = await createFamilyGroup(user, groupName.trim());
      
      if (result.success) {
        console.log('✅ Group created successfully');
        setCreatedGroupData(result.group);
        setCreatedGroupCode(result.groupCode);
        setMode('success');
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to create group:', error);
      setError('Failed to create family group');
    } finally {
      setLoading(false);
    }
  }, [user, groupName, onComplete, clearError]);

  const handleJoinGroup = useCallback(async (e) => {
    e.preventDefault();
    clearError();

    if (!isValidGroupCode(groupCode.toUpperCase())) {
      setError('Invalid group code format');
      return;
    }

    setLoading(true);

    try {
      const result = await joinFamilyGroup(user, groupCode.trim(), nickname.trim());
      
      if (result.success) {
        console.log('✅ Joined group successfully');
        onComplete?.();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to join group:', error);
      setError('Failed to join family group');
    } finally {
      setLoading(false);
    }
  }, [user, groupCode, nickname, onComplete, clearError]);

  const ChoiceStep = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Family Safety Groups
        </h2>
        <p className="text-gray-600">
          Coordinate with your family during emergencies while protecting your privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create New Group */}
        <button
          onClick={() => setMode('create')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 transition-colors">
              <Plus className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Create New Group
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Start a new family safety group and invite others to join
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✅ Generate secure group code</li>
                <li>✅ Manage group settings</li>
                <li>✅ Monitor family safety status</li>
              </ul>
            </div>
          </div>
        </button>

        {/* Join Existing Group */}
        <button
          onClick={() => setMode('join')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
              <LogIn className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Join Existing Group
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Join your family's group using a group code
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>✅ Enter group code from family</li>
                <li>✅ Set your display nickname</li>
                <li>✅ Start coordinating safely</li>
              </ul>
            </div>
          </div>
        </button>
      </div>

      {/* Privacy Information */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors text-sm w-full"
        >
          <Info className="h-4 w-4 mr-2" />
          {showInstructions ? 'Hide' : 'Show'} privacy & safety information
        </button>
        
        {showInstructions && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              How Family Groups Protect Your Privacy
            </h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Groups use anonymous codes (like FIRE-SAFE-1234) instead of personal information</li>
              <li>• Only nicknames are shared, never real names or contact details</li>
              <li>• Location sharing is optional and only when you choose</li>
              <li>• All data is stored locally on your device first</li>
              <li>• Groups can be deleted instantly with no trace</li>
              <li>• No central database or account required</li>
            </ul>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
              <strong>Perfect for emergencies:</strong> Groups work offline and don't require internet to coordinate basic safety status.
            </div>
          </div>
        )}
      </div>
    </div>
  ), [showInstructions]);

  const CreateStep = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <Plus className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Create Family Group
        </h2>
        <p className="text-gray-600">
          Start a new family safety group and get a shareable group code.
        </p>
      </div>

      <form onSubmit={handleCreateGroup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name (Optional)
          </label>
          <input
            type="text"
            value={groupName}
            onChange={handleGroupNameChange}
            placeholder="e.g., Smith Family, Emergency Group"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            maxLength={50}
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            A friendly name to help identify your group. If empty, we'll generate one.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            What happens next:
          </h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>✓ A secure group code will be generated (like FIRE-SAFE-1234)</li>
            <li>✓ You'll become the group creator with management access</li>
            <li>✓ Share the group code with family members to invite them</li>
            <li>✓ Start coordinating safety status with privacy protection</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Create Group
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  ), [groupName, handleGroupNameChange, handleCreateGroup, error, loading]);

  const JoinStep = useCallback(() => (
    <div className="space-y-6">
      <div className="text-center">
        <LogIn className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Join Family Group
        </h2>
        <p className="text-gray-600">
          Enter the group code shared by your family member.
        </p>
      </div>

      <form onSubmit={handleJoinGroup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Code
          </label>
          <input
            type="text"
            value={groupCode}
            onChange={handleGroupCodeChange}
            placeholder="SHIELD-STRONG-8530"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg"
            maxLength={20}
            pattern="[A-Z]+-[A-Z]+-\d{4}"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: WORD-WORD-1234 (like SHIELD-STRONG-8530)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="Mom, Dad, Alex, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">
            How you'll appear to other group members. Not your real name for privacy.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Privacy Protection:
          </h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Only your nickname will be visible to group members</li>
            <li>• Your safety status updates are shared with the group</li>
            <li>• Location sharing is optional and only when you choose</li>
            <li>• You can leave the group at any time</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !isValidGroupCode(groupCode)}
            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Join Group
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  ), [groupCode, nickname, handleGroupCodeChange, handleNicknameChange, handleJoinGroup, error, loading]);

  const handleSuccessContinue = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      {mode === 'choice' && <ChoiceStep />}
      {mode === 'create' && <CreateStep />}
      {mode === 'join' && <JoinStep />}
      {mode === 'success' && (
        <GroupCreationSuccess 
          groupData={createdGroupData}
          groupCode={createdGroupCode}
          onContinue={handleSuccessContinue}
        />
      )}
    </div>
  );
});

IsolatedGroupSetup.displayName = 'IsolatedGroupSetup';

export default IsolatedGroupSetup;