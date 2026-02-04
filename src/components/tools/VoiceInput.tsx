import React, { useState, useEffect, useCallback, useRef } from 'react';
import { researchService } from '../../services/researchService';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

/**
 * Walt-tab Voice Input Component
 * Add items to lists using voice commands
 * Examples: "Add apples to groceries", "Add Mighty Ducks to watchlist"
 */

// List type mapping
type ListType = 'grocery' | 'watchlist' | 'reading' | 'music' | 'places' | 'restaurants';

interface ParsedCommand {
  item: string;
  listType: ListType | null;
  quantity?: number;
  unit?: string;
}

// Check for browser support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const speechSupported = !!SpeechRecognition;

const VoiceInput: React.FC = () => {
  const { showToast } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const [step, setStep] = useState<'idle' | 'listening' | 'confirm' | 'details'>('idle');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const recognitionRef = useRef<any>(null);

  // Parse the voice command to extract item and list type
  const parseCommand = useCallback((text: string): ParsedCommand => {
    const lowerText = text.toLowerCase();
    let listType: ListType | null = null;
    let item = text;

    // Detect list type from keywords
    if (lowerText.includes('grocery') || lowerText.includes('groceries') || lowerText.includes('shopping')) {
      listType = 'grocery';
    } else if (lowerText.includes('movie') || lowerText.includes('watch') || lowerText.includes('film') || lowerText.includes('show') || lowerText.includes('tv')) {
      listType = 'watchlist';
    } else if (lowerText.includes('book') || lowerText.includes('read')) {
      listType = 'reading';
    } else if (lowerText.includes('music') || lowerText.includes('song') || lowerText.includes('album') || lowerText.includes('artist') || lowerText.includes('listen') || lowerText.includes('spotify')) {
      listType = 'music';
    } else if (lowerText.includes('place') || lowerText.includes('visit') || lowerText.includes('travel') || lowerText.includes('destination')) {
      listType = 'places';
    } else if (lowerText.includes('restaurant') || lowerText.includes('eat') || lowerText.includes('food') || lowerText.includes('dining')) {
      listType = 'restaurants';
    }

    // Extract the item name by removing common phrases
    const removePatterns = [
      /^add\s+/i,
      /\s+to\s+(my\s+)?(grocery|groceries|shopping|movie|movies|watch|watchlist|book|books|reading|music|listen|song|album|place|places|visit|restaurant|restaurants|eat|food)\s*(list)?$/i,
      /\s+list$/i,
    ];

    for (const pattern of removePatterns) {
      item = item.replace(pattern, '');
    }

    item = item.trim();

    // Try to extract quantity for groceries (e.g., "5 apples", "a dozen eggs")
    let quantity: number | undefined;
    let unit: string | undefined;

    if (listType === 'grocery') {
      const quantityMatch = item.match(/^(\d+)\s+(.+)$/);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1], 10);
        item = quantityMatch[2];
      }

      const dozenMatch = item.match(/^(a\s+)?dozen\s+(.+)$/i);
      if (dozenMatch) {
        quantity = 12;
        item = dozenMatch[2];
      }
    }

    return { item, listType, quantity, unit };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!speechSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript;
      setTranscript(transcriptText);

      if (result.isFinal) {
        const parsed = parseCommand(transcriptText);
        setParsedCommand(parsed);
        setIsListening(false);

        if (parsed.listType === 'grocery') {
          setStep('details');
          if (parsed.quantity) setQuantity(parsed.quantity);
        } else if (parsed.listType) {
          setStep('confirm');
        } else {
          setStep('confirm');
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setStep('idle');
      if (event.error === 'not-allowed') {
        showToast('Microphone access denied. Please enable it in your browser settings.', 'error');
      } else {
        showToast('Voice recognition failed. Please try again.', 'error');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [parseCommand, showToast]);

  const startListening = () => {
    if (!speechSupported) {
      showToast('Voice input is not supported in your browser', 'error');
      return;
    }

    setTranscript('');
    setParsedCommand(null);
    setStep('listening');
    setIsListening(true);
    setQuantity(1);
    setUnit('');

    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const addToList = () => {
    if (!parsedCommand || !parsedCommand.item) {
      showToast('No item to add', 'warning');
      return;
    }

    const { item, listType } = parsedCommand;

    switch (listType) {
      case 'grocery':
        researchService.addGroceryItem({
          name: item,
          quantity: quantity,
          unit: unit || '',
          isStaple: false,
        });
        showToast(`Added "${item}" to Grocery List`, 'success');
        break;

      case 'watchlist':
        researchService.addToWatchlist({
          name: item,
          works: [],
          imdbUrl: null,
          addedAt: new Date().toISOString(),
        });
        showToast(`Added "${item}" to Watchlist`, 'success');
        break;

      case 'reading':
        researchService.addToReadingList({
          name: item,
          works: [],
          kindleUrl: null,
          addedAt: new Date().toISOString(),
        });
        showToast(`Added "${item}" to Reading List`, 'success');
        break;

      case 'music':
        researchService.addToSpotifyList({
          name: item,
          spotifyUrl: null,
          addedAt: new Date().toISOString(),
        });
        showToast(`Added "${item}" to Listen List`, 'success');
        break;

      case 'places':
        researchService.addToPlacesList({
          name: item,
          location: null,
          reason: 'Added via voice',
          addedAt: new Date().toISOString(),
        });
        showToast(`Added "${item}" to Places to Visit`, 'success');
        break;

      case 'restaurants':
        researchService.addRestaurant({
          name: item,
          cuisine: '',
          location: '',
        });
        showToast(`Added "${item}" to Restaurants`, 'success');
        break;

      default:
        showToast('Please specify which list to add to', 'warning');
        return;
    }

    // Reset state
    setStep('idle');
    setTranscript('');
    setParsedCommand(null);
    setQuantity(1);
    setUnit('');
  };

  const selectList = (list: ListType) => {
    if (parsedCommand) {
      setParsedCommand({ ...parsedCommand, listType: list });
      if (list === 'grocery') {
        setStep('details');
      } else {
        setStep('confirm');
      }
    }
  };

  const cancel = () => {
    setStep('idle');
    setTranscript('');
    setParsedCommand(null);
    setQuantity(1);
    setUnit('');
    stopListening();
  };

  const getListDisplayName = (listType: ListType | null): string => {
    switch (listType) {
      case 'grocery': return 'Grocery List';
      case 'watchlist': return 'Watchlist';
      case 'reading': return 'Reading List';
      case 'music': return 'Listen List';
      case 'places': return 'Places to Visit';
      case 'restaurants': return 'Restaurants';
      default: return 'Unknown';
    }
  };

  if (!speechSupported) {
    return (
      <Card className="border-2 border-steel">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">🎤</span>
          <h3 className="text-h3 font-semibold text-black mb-2">Voice Input Not Supported</h3>
          <p className="text-slate text-small">
            Your browser doesn't support voice input. Try using Chrome, Edge, or Safari.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-steel">
      {/* Idle State - Main Button */}
      {step === 'idle' && (
        <div className="text-center py-6">
          <button
            onClick={startListening}
            className="w-24 h-24 rounded-full bg-tab-orange hover:bg-tab-orange/90 text-white flex items-center justify-center mx-auto mb-4 transition-all hover:scale-105 active:scale-95 shadow-lg"
            aria-label="Start voice input"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <h3 className="text-h3 font-semibold text-black mb-2">Voice Input</h3>
          <p className="text-slate text-small max-w-sm mx-auto">
            Tap the microphone and say something like:<br />
            <span className="text-charcoal font-medium">"Add apples to groceries"</span><br />
            <span className="text-charcoal font-medium">"Add Inception to watchlist"</span>
          </p>
        </div>
      )}

      {/* Listening State */}
      {step === 'listening' && (
        <div className="text-center py-6">
          <button
            onClick={stopListening}
            className="w-24 h-24 rounded-full bg-tab-red text-white flex items-center justify-center mx-auto mb-4 animate-pulse"
            aria-label="Stop listening"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <h3 className="text-h3 font-semibold text-tab-red mb-2">Listening...</h3>
          {transcript && (
            <p className="text-charcoal bg-concrete p-3 rounded-sm mt-4 text-left">
              "{transcript}"
            </p>
          )}
        </div>
      )}

      {/* Confirm/Select List State */}
      {step === 'confirm' && parsedCommand && (
        <div className="py-4">
          <h3 className="text-h3 font-semibold text-black mb-4">Confirm Addition</h3>

          <div className="bg-concrete p-4 rounded-sm mb-4">
            <p className="text-small text-slate mb-1">Item:</p>
            <p className="text-lg font-semibold text-black">{parsedCommand.item}</p>
          </div>

          {parsedCommand.listType ? (
            <>
              <div className="bg-tab-blue/10 p-4 rounded-sm mb-4 border border-tab-blue/20">
                <p className="text-small text-slate mb-1">Adding to:</p>
                <p className="text-lg font-semibold text-tab-blue">{getListDisplayName(parsedCommand.listType)}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={cancel} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={addToList} className="flex-1">Add to List</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-small text-slate mb-3">Which list should this go to?</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => selectList('grocery')} className="p-3 bg-success/10 border border-success/30 rounded-sm text-left hover:bg-success/20 transition-colors">
                  <span className="text-lg">🛒</span>
                  <span className="ml-2 font-medium">Groceries</span>
                </button>
                <button onClick={() => selectList('watchlist')} className="p-3 bg-tab-red/10 border border-tab-red/30 rounded-sm text-left hover:bg-tab-red/20 transition-colors">
                  <span className="text-lg">🎬</span>
                  <span className="ml-2 font-medium">Watchlist</span>
                </button>
                <button onClick={() => selectList('reading')} className="p-3 bg-tab-orange/10 border border-tab-orange/30 rounded-sm text-left hover:bg-tab-orange/20 transition-colors">
                  <span className="text-lg">📚</span>
                  <span className="ml-2 font-medium">Reading</span>
                </button>
                <button onClick={() => selectList('music')} className="p-3 bg-success/10 border border-success/30 rounded-sm text-left hover:bg-success/20 transition-colors">
                  <span className="text-lg">🎵</span>
                  <span className="ml-2 font-medium">Music</span>
                </button>
                <button onClick={() => selectList('places')} className="p-3 bg-tab-blue/10 border border-tab-blue/30 rounded-sm text-left hover:bg-tab-blue/20 transition-colors">
                  <span className="text-lg">📍</span>
                  <span className="ml-2 font-medium">Places</span>
                </button>
                <button onClick={() => selectList('restaurants')} className="p-3 bg-warning/10 border border-warning/30 rounded-sm text-left hover:bg-warning/20 transition-colors">
                  <span className="text-lg">🍽️</span>
                  <span className="ml-2 font-medium">Restaurants</span>
                </button>
              </div>
              <Button variant="secondary" onClick={cancel} className="w-full">Cancel</Button>
            </>
          )}
        </div>
      )}

      {/* Details State (for groceries) */}
      {step === 'details' && parsedCommand && (
        <div className="py-4">
          <h3 className="text-h3 font-semibold text-black mb-4">Add to Grocery List</h3>

          <div className="bg-concrete p-4 rounded-sm mb-4">
            <p className="text-small text-slate mb-1">Item:</p>
            <p className="text-lg font-semibold text-black">{parsedCommand.item}</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-small font-semibold text-black mb-2">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-small font-semibold text-black mb-2">Unit (optional)</label>
              <Input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="lbs, oz, bags, etc."
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={cancel} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={addToList} className="flex-1">Add to Groceries</Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VoiceInput;
