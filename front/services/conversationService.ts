import { apiClient } from './apiClient';
import { Message, Conversation } from '@/types';

export const conversationService = {
  async createConversation(title?: string): Promise<string> {
    const response = await apiClient.callEdgeFunction(
      'conversations',
      'POST',
      { title: title || 'Nueva conversación' },
      true
    );
    return response.conversation.id;
  },

  async saveMessage(conversationId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
    await apiClient.callEdgeFunction(
      `conversations/${conversationId}/messages`,
      'POST',
      {
        role: message.role,
        content: message.content,
        filters: message.filters || null,
        selected_listing_ids: message.selectedListingIds || null,
        frozen_selection: message.frozenSelection || false,
        search_status: 'completed',
        listings: [],
      },
      true
    );
  },

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const response = await apiClient.callEdgeFunction(
      `conversations/${conversationId}/messages`,
      'GET',
      undefined,
      true
    );

    return response.messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date(msg.created_at),
      createdAt: msg.created_at,
      filters: msg.filters,
      selectedListingIds: msg.selected_listing_ids,
      frozenSelection: msg.frozen_selection,
    }));
  },

  async getUserConversations(): Promise<Conversation[]> {
    const response = await apiClient.callEdgeFunction(
      'conversations',
      'GET',
      undefined,
      true
    );

    return response.conversations;
  },

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    await apiClient.callEdgeFunction(
      `conversations/${conversationId}`,
      'PUT',
      { title },
      true
    );
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.callEdgeFunction(
      `conversations/${conversationId}`,
      'DELETE',
      undefined,
      true
    );
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await apiClient.callEdgeFunction(
      `conversations/${conversationId}`,
      'GET',
      undefined,
      true
    );

    return response.conversation;
  },
};
