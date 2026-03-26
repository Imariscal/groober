import { api } from '@/lib/api';

class ClientTagsApi {
  /**
   * GET /clients/:clientId/tags
   * Returns all tags for a specific client
   *
   * @param clientId - The ID of the client
   * @returns Array of tag strings
   */
  async getTags(clientId: string): Promise<string[]> {
    try {
      const response = await api.get(`/clients/${clientId}/tags`);
      return (response.data || []) as string[];
    } catch (error: any) {
      console.error('[ClientTagsApi] Error fetching tags:', error);
      return [];
    }
  }

  /**
   * POST /clients/:clientId/tags
   * Adds a new tag to a client
   *
   * @param clientId - The ID of the client
   * @param tag - The tag string to add
   * @returns Created tag response
   */
  async addTag(clientId: string, tag: string): Promise<{ tag: string; createdAt: string } | null> {
    try {
      const response = await api.post(`/clients/${clientId}/tags`, { tag });
      return (response.data || null) as { tag: string; createdAt: string } | null;
    } catch (error: any) {
      console.error('[ClientTagsApi] Error adding tag:', error);
      throw error;
    }
  }

  /**
   * DELETE /clients/:clientId/tags/:tag
   * Removes a tag from a client
   *
   * @param clientId - The ID of the client
   * @param tag - The tag string to remove
   */
  async removeTag(clientId: string, tag: string): Promise<void> {
    try {
      await api.delete(`/clients/${clientId}/tags/${encodeURIComponent(tag)}`, {});
    } catch (error: any) {
      console.error('[ClientTagsApi] Error removing tag:', error);
      throw error;
    }
  }

  /**
   * Utility to search tags with autocomplete
   * Can be extended to support backend search endpoint
   *
   * @param allTags - Array of all available tags
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Filtered tags matching query
   */
  searchTags(allTags: string[], query: string, limit: number = 10): string[] {
    if (!query.trim()) return allTags.slice(0, limit);
    const lowerQuery = query.toLowerCase();
    return allTags.filter((tag) => tag.toLowerCase().includes(lowerQuery)).slice(0, limit);
  }
}

export const clientTagsApi = new ClientTagsApi();
