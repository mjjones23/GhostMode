/**
 * Backward-compatible re-export — prefer services/coachService.js for new code.
 */
import {
  checkCoachBackendStatus,
  fetchCoachReply,
} from '../services/coachService';

export { checkCoachBackendStatus, fetchCoachReply };

/** @deprecated Use fetchCoachReply instead. */
export async function sendCoachMessage(messages) {
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');

  return fetchCoachReply({
    userText: lastUser?.content || '',
    chatHistory: messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        sender: message.role === 'user' ? 'user' : 'ai',
        text: message.content,
      })),
  });
}
