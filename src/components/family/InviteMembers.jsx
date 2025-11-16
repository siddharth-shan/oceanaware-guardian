/**
 * Invite Members Component
 * Provides easy ways to invite family members to join the group
 */

import React, { useState, useCallback } from 'react';
import { 
  UserPlus, 
  Copy, 
  CheckCircle, 
  Share2, 
  MessageSquare, 
  Users, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function InviteMembers({ groupCode, groupName, memberCount = 1 }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const [showFullInstructions, setShowFullInstructions] = useState(false);

  const copyGroupCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy group code:', error);
    }
  }, [groupCode]);

  const copyFullInstructions = useCallback(async () => {
    const instructions = `Join our family safety group on EcoQuest Wildfire Watch!

Group: ${groupName}
Group Code: ${groupCode}

Steps to join:
1. Open EcoQuest Wildfire Watch app
2. Go to Family Safety
3. Choose "Join Existing Group" 
4. Enter this group code: ${groupCode}
5. Add your nickname

This allows us to coordinate safely during emergencies while protecting our privacy. The app only shares what you choose to share.

Download the app: https://ecoquest-wildfire-watch.app (if needed)`;

    try {
      await navigator.clipboard.writeText(instructions);
      setCopiedInstructions(true);
      setTimeout(() => setCopiedInstructions(false), 3000);
    } catch (error) {
      console.error('Failed to copy instructions:', error);
    }
  }, [groupCode, groupName]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} - Family Safety Group`,
          text: `Join our family safety group "${groupName}" on EcoQuest Wildfire Watch! Use group code: ${groupCode}`,
          url: window.location.origin
        });
      } catch (error) {
        console.log('Native sharing cancelled or failed:', error);
        // Fallback to copy
        copyFullInstructions();
      }
    } else {
      // Fallback to copy
      copyFullInstructions();
    }
  }, [groupCode, groupName, copyFullInstructions]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
          Invite Family Members
        </h2>
        <div className="text-sm text-gray-600">
          {memberCount} member{memberCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Quick Group Code Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">Group Code</h3>
            <div className="text-2xl font-mono font-bold text-blue-600">
              {groupCode}
            </div>
          </div>
          <button
            onClick={copyGroupCode}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            {copiedCode ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleNativeShare}
          className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Share2 className="w-5 h-5" />
          <span>Share Invitation</span>
        </button>
        
        <button
          onClick={copyFullInstructions}
          className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          {copiedInstructions ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Instructions Copied!</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              <span>Copy Full Instructions</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Instructions */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setShowFullInstructions(!showFullInstructions)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">
              How Family Members Can Join
            </span>
          </div>
          {showFullInstructions ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {showFullInstructions && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Step-by-Step Instructions:</h4>
              <ol className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                  <span>Open the EcoQuest Wildfire Watch app</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                  <span>Navigate to the "Family Safety" section</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                  <span>Choose "Join Existing Group"</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                  <span>Enter the group code: <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">{groupCode}</span></span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">5</span>
                  <span>Add their nickname (not their real name for privacy)</span>
                </li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  <strong>Privacy Note:</strong> Family members only need to share a nickname. 
                  No personal information is required or collected.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Sharing Tips</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Share via text message, email, or your preferred messaging app</li>
          <li>• The group code never expires - family can join anytime</li>
          <li>• You can share the code as many times as needed</li>
          <li>• New members will appear in your group dashboard once they join</li>
        </ul>
      </div>
    </div>
  );
}