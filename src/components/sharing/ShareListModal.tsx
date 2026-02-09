import React, { useState, useEffect } from 'react';
import { SharedListType, ShareInfo, sharingService } from '../../services/sharingService';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import { Input } from '../common/Input';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listType: SharedListType;
  listData: unknown[];
  onListShared?: () => void;
}

const LIST_TYPE_LABELS: Record<SharedListType, string> = {
  grocery: 'Grocery List',
  watchlist: 'Watchlist',
  reading: 'Reading List',
  music: 'Music List',
  places: 'Places List',
  restaurants: 'Restaurant List',
};

const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  listType,
  listData,
  onListShared,
}) => {
  const { showToast } = useApp();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, listType]);

  const loadShares = async () => {
    setLoadingShares(true);
    const data = await sharingService.getSharesForList(listType);
    setShares(data);
    setLoadingShares(false);
  };

  const handleShare = async () => {
    if (!sharingService.isValidPhone(phone)) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    setLoading(true);
    const result = await sharingService.shareList(listType, phone, listData);
    setLoading(false);

    if (result.success) {
      showToast('List shared successfully!', 'success');
      setPhone('');
      loadShares();
      onListShared?.();
    } else {
      showToast(result.error || 'Failed to share list', 'error');
    }
  };

  const handleRevoke = async (shareId: string, sharePhone: string) => {
    const result = await sharingService.revokeShare(shareId);

    if (result.success) {
      showToast(`Removed access for ${sharingService.formatPhoneForDisplay(sharePhone)}`, 'success');
      loadShares();
    } else {
      showToast(result.error || 'Failed to revoke access', 'error');
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm border-2 border-black w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-steel">
          <h2 className="text-lg font-bold">Share {LIST_TYPE_LABELS[listType]}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-concrete rounded-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Add new share */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-charcoal">
              Share with phone number
            </label>
            <p className="text-sm text-slate">
              Enter the phone number of the person you want to share with. They'll be able to view and edit this list.
            </p>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="flex-1 !mb-0"
                maxLength={14}
              />
              <Button
                onClick={handleShare}
                variant="primary"
                disabled={loading || !phone}
                className="whitespace-nowrap"
              >
                {loading ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>

          {/* Current shares */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal mb-2">
              Currently shared with
            </h3>

            {loadingShares ? (
              <p className="text-slate text-sm py-4 text-center">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="text-slate text-sm py-4 text-center italic">
                This list is not shared with anyone
              </p>
            ) : (
              <ul className="space-y-2">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-concrete rounded-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium">
                        {sharingService.formatPhoneForDisplay(share.phone)}
                      </span>
                      {share.isResolved ? (
                        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      ) : (
                        <span className="text-xs bg-tab-orange/20 text-tab-orange px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevoke(share.id, share.phone)}
                      className="text-slate hover:text-danger text-sm font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Info */}
          <div className="bg-tab-blue/10 p-3 rounded-sm">
            <p className="text-sm text-tab-blue">
              <strong>Note:</strong> The person you share with must have a Walt-Tab account
              with their phone number registered to see the shared list.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-steel">
          <Button onClick={onClose} variant="secondary" className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareListModal;
