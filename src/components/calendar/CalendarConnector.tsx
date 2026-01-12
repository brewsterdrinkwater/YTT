import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useApp } from '../../contexts/AppContext';

interface CalendarConnectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

const CalendarConnector: React.FC<CalendarConnectorProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const { showToast } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // In a real implementation, this would initiate OAuth flow
    // For demo purposes, we'll simulate a connection
    try {
      // Simulate OAuth flow delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store a demo token
      localStorage.setItem('ytt-calendar-token', 'demo-token-' + Date.now());

      showToast('Google Calendar connected!', 'success');
      onConnect();
    } catch (error) {
      showToast('Failed to connect calendar', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('ytt-calendar-token');
    showToast('Calendar disconnected', 'info');
    onClose();
  };

  const isConnected = localStorage.getItem('ytt-calendar-token') !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Calendar" size="sm">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15v-12h15v12zm-10.5-9h-3v3h3v-3zm4.5 0h-3v3h3v-3zm4.5 0h-3v3h3v-3zm-9 4.5h-3v3h3v-3zm4.5 0h-3v3h3v-3z" />
          </svg>
        </div>

        {isConnected ? (
          <>
            <h3 className="text-lg font-semibold mb-2">Calendar Connected</h3>
            <p className="text-gray-500 text-sm mb-6">
              Your Google Calendar is connected. Events will appear in your daily view.
            </p>
            <Button variant="danger" onClick={handleDisconnect} className="w-full">
              Disconnect Calendar
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2">Connect Google Calendar</h3>
            <p className="text-gray-500 text-sm mb-4">
              See your calendar events alongside your daily entries. We only request read-only
              access.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Permissions requested:</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View calendar events (read-only)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-danger" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cannot modify or delete events
                </li>
              </ul>
            </div>

            <Button onClick={handleConnect} isLoading={isConnecting} className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Connect with Google
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CalendarConnector;
