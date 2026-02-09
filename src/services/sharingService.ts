import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type SharedListType = 'grocery' | 'watchlist' | 'reading' | 'music' | 'places' | 'restaurants';

export interface UserProfile {
  id: string;
  phone_number: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedList {
  id: string;
  list_type: SharedListType;
  owner_id: string;
  shared_with_phone: string;
  shared_with_user_id: string | null;
  list_data: unknown[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShareInfo {
  id: string;
  phone: string;
  isResolved: boolean;
  createdAt: string;
}

class SharingService {
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  // ============ User Profile Methods ============

  async getMyProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }

    return data;
  }

  async updateMyProfile(updates: { phone_number?: string; display_name?: string }): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Format phone number to digits only
    if (updates.phone_number) {
      updates.phone_number = updates.phone_number.replace(/\D/g, '');
    }

    // Try to upsert the profile
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'This phone number is already registered to another user' };
      }
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ============ List Sharing Methods ============

  async shareList(listType: SharedListType, phone: string, listData: unknown[]): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Format phone to digits only
    const formattedPhone = phone.replace(/\D/g, '');

    // Check if user is trying to share with themselves
    const myProfile = await this.getMyProfile();
    if (myProfile?.phone_number === formattedPhone) {
      return { success: false, error: 'Cannot share with yourself' };
    }

    // Look up if this phone has a user account
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone_number', formattedPhone)
      .single();

    // Create or update the share
    const { error } = await supabase
      .from('shared_lists')
      .upsert({
        owner_id: user.id,
        list_type: listType,
        shared_with_phone: formattedPhone,
        shared_with_user_id: targetProfile?.id || null,
        list_data: listData,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'owner_id,list_type,shared_with_phone',
      });

    if (error) {
      console.error('Error sharing list:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async revokeShare(shareId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('shared_lists')
      .delete()
      .eq('id', shareId);

    if (error) {
      console.error('Error revoking share:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getMySharedLists(listType?: SharedListType): Promise<SharedList[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('shared_lists')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true);

    if (listType) {
      query = query.eq('list_type', listType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching my shared lists:', error);
      return [];
    }

    return data || [];
  }

  async getListsSharedWithMe(listType?: SharedListType): Promise<SharedList[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get my phone number
    const myProfile = await this.getMyProfile();
    if (!myProfile?.phone_number) return [];

    let query = supabase
      .from('shared_lists')
      .select('*')
      .eq('is_active', true)
      .or(`shared_with_user_id.eq.${user.id},shared_with_phone.eq.${myProfile.phone_number}`);

    if (listType) {
      query = query.eq('list_type', listType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching lists shared with me:', error);
      return [];
    }

    return data || [];
  }

  async getSharesForList(listType: SharedListType): Promise<ShareInfo[]> {
    const shares = await this.getMySharedLists(listType);

    return shares.map(share => ({
      id: share.id,
      phone: share.shared_with_phone,
      isResolved: share.shared_with_user_id !== null,
      createdAt: share.created_at,
    }));
  }

  // ============ Sync Methods ============

  async syncListData(listType: SharedListType, listData: unknown[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update all shares for this list type
    const { error } = await supabase
      .from('shared_lists')
      .update({
        list_data: listData,
        updated_at: new Date().toISOString(),
      })
      .eq('owner_id', user.id)
      .eq('list_type', listType);

    if (error) {
      console.error('Error syncing list data:', error);
    }
  }

  async updateSharedListData(shareId: string, listData: unknown[]): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('shared_lists')
      .update({
        list_data: listData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shareId);

    if (error) {
      console.error('Error updating shared list:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // ============ Realtime Subscriptions ============

  subscribeToSharedList(
    shareId: string,
    onUpdate: (listData: unknown[]) => void
  ): () => void {
    const channelName = `shared_list_${shareId}`;

    // Clean up existing subscription
    this.unsubscribeFromSharedList(shareId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shared_lists',
          filter: `id=eq.${shareId}`,
        },
        (payload) => {
          const newData = payload.new as SharedList;
          onUpdate(newData.list_data);
        }
      )
      .subscribe();

    this.realtimeChannels.set(shareId, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromSharedList(shareId);
  }

  unsubscribeFromSharedList(shareId: string): void {
    const channel = this.realtimeChannels.get(shareId);
    if (channel) {
      supabase.removeChannel(channel);
      this.realtimeChannels.delete(shareId);
    }
  }

  unsubscribeAll(): void {
    this.realtimeChannels.forEach((_, shareId) => {
      this.unsubscribeFromSharedList(shareId);
    });
  }

  // ============ Utility Methods ============

  formatPhoneForDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  }

  isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }
}

export const sharingService = new SharingService();
