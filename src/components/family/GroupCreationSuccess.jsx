/**
 * Group Creation Success Component
 * Shows group code and provides sharing instructions after successful group creation
 */

import React, { useState, useCallback } from 'react';
import { CheckCircle, Copy, Users, Share2, ArrowRight, QrCode, MessageSquare } from 'lucide-react';

export default function GroupCreationSuccess({ groupData, groupCode, onContinue }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);

  const copyGroupCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy group code:', error);
    }
  }, [groupCode]);

  const copyInstructions = useCallback(async () => {
    const instructions = `Join our family safety group on EcoQuest Wildfire Watch!

Group Code: ${groupCode}

Steps to join:
1. Open EcoQuest Wildfire Watch app
2. Go to Family Safety
3. Choose "Join Existing Group"
4. Enter this group code: ${groupCode}
5. Add your nickname

This allows us to coordinate safely during emergencies while protecting our privacy. The app only shares what you choose to share.`;

    try {
      await navigator.clipboard.writeText(instructions);
      setCopiedInstructions(true);
      setTimeout(() => setCopiedInstructions(false), 3000);
    } catch (error) {
      console.error('Failed to copy instructions:', error);
    }
  }, [groupCode]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <div className="text-center space-y-6">
        {/* Success Header */}
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Family Group Created Successfully!
            </h2>
            <p className="text-gray-600">
              Your family safety group "{groupData.name}" is ready for coordination.
            </p>
          </div>
        </div>

        {/* Group Code Display */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Group Code</h3>
          <div className="bg-white rounded-lg p-4 border-2 border-dashed border-orange-300">
            <div className="text-3xl font-mono font-bold text-orange-600 mb-2">
              {groupCode}
            </div>
            <button
              onClick={copyGroupCode}
              className="inline-flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              {copiedCode ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sharing Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            How to Invite Family Members
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Option 1: Share the Code</h4>
              <p className="text-blue-700 text-sm mb-3">
                Send your family members the group code: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{groupCode}</span>
              </p>
              <p className="text-blue-600 text-sm">
                They can join by going to Family Safety → Join Existing Group
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Option 2: Send Complete Instructions</h4>
              <p className="text-blue-700 text-sm mb-3">
                Copy and send complete step-by-step instructions via text, email, or messaging app.
              </p>
              <button
                onClick={copyInstructions}
                className="inline-flex items-center space-x-2 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
              >
                {copiedInstructions ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Instructions Copied!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Copy Full Instructions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">🔒 Privacy Protected</h4>
          <p className="text-gray-600 text-sm">
            Your family group uses anonymous codes and only shares the information you choose. 
            No personal data is collected or stored centrally.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={copyGroupCode}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Code Again</span>
          </button>
          
          <button
            onClick={onContinue}
            className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Continue to Group Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tips */}
        <div className="text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Quick Tips</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Save the group code somewhere safe - you'll need it if you reinstall the app</li>
            <li>• Family members can join anytime using the code</li>
            <li>• The group works offline for basic safety coordination</li>
            <li>• You can leave and rejoin anytime with the same code</li>
          </ul>
        </div>
      </div>
    </div>
  );
}