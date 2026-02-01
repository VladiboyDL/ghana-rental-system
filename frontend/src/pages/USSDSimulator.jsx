import { useState } from 'react';
import { Phone, Send, RotateCcw, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { ussdAPI } from '../services/api';

const USSDSimulator = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const startSession = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Generate a session ID
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      // Initial USSD request
      const response = await ussdAPI.processSession({
        sessionId: newSessionId,
        phoneNumber: phoneNumber.startsWith('+233') ? phoneNumber : `+233${phoneNumber.replace(/^0/, '')}`,
        serviceCode: '*920*66#',
        text: ''
      });

      setDisplayText(response.data.message);
      setSessionActive(true);
      setHistory([{ type: 'system', text: response.data.message }]);
    } catch (error) {
      toast.error('Failed to start USSD session');
    } finally {
      setLoading(false);
    }
  };

  const sendInput = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    const userInput = inputValue;
    setInputValue('');

    try {
      // Build the cumulative text
      const currentHistory = history.filter(h => h.type === 'user').map(h => h.text);
      currentHistory.push(userInput);
      const cumulativeText = currentHistory.join('*');

      const response = await ussdAPI.processSession({
        sessionId,
        phoneNumber: phoneNumber.startsWith('+233') ? phoneNumber : `+233${phoneNumber.replace(/^0/, '')}`,
        serviceCode: '*920*66#',
        text: cumulativeText
      });

      setDisplayText(response.data.message);
      setHistory(prev => [
        ...prev,
        { type: 'user', text: userInput },
        { type: 'system', text: response.data.message }
      ]);

      // Check if session ended
      if (response.data.action === 'END') {
        setSessionActive(false);
      }
    } catch (error) {
      toast.error('Failed to process input');
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setSessionId('');
    setDisplayText('');
    setInputValue('');
    setSessionActive(false);
    setHistory([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (sessionActive) {
        sendInput();
      } else {
        startSession();
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">USSD Simulator</h1>
        <button
          onClick={resetSession}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Phone Frame */}
      <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl">
        {/* Phone Header */}
        <div className="flex items-center justify-center py-2 mb-4">
          <div className="w-20 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Screen */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {/* Status Bar */}
          <div className="bg-gray-700 px-4 py-2 flex items-center justify-between text-white text-xs">
            <span>9:41</span>
            <div className="flex items-center space-x-1">
              <Smartphone className="w-4 h-4" />
              <span>GH</span>
            </div>
          </div>

          {/* USSD Display */}
          <div className="bg-black text-green-400 font-mono p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {!sessionActive && !displayText ? (
              <div className="text-center py-8">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500">Enter your phone number to start</p>
                <p className="text-sm text-gray-600 mt-2">Dial *920*66#</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={index} className={`${item.type === 'user' ? 'text-right' : ''}`}>
                    {item.type === 'user' ? (
                      <span className="inline-block bg-green-900 text-green-300 px-3 py-1 rounded">
                        {item.text}
                      </span>
                    ) : (
                      <div className="whitespace-pre-wrap">{item.text}</div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">Processing...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            {!sessionActive ? (
              <div className="space-y-3">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter phone (e.g., 0241234567)"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={15}
                />
                <button
                  onClick={startSession}
                  disabled={loading || !phoneNumber}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-green-700 disabled:opacity-50"
                >
                  <Phone className="w-5 h-5" />
                  <span>{loading ? 'Dialing...' : 'Dial *920*66#'}</span>
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your response..."
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                />
                <button
                  onClick={sendInput}
                  disabled={loading || !inputValue}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Home Button */}
        <div className="flex justify-center py-4">
          <div className="w-12 h-12 rounded-full border-2 border-gray-700 flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm border-2 border-gray-600" />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 space-y-4">
        <div className="card">
          <h3 className="font-bold mb-2">About USSD</h3>
          <p className="text-sm text-gray-600">
            This simulator mimics the USSD experience used in Ghana for mobile banking
            and services. Real users would dial *920*66# on their phones to access the
            Ghana Rental Taxation Platform.
          </p>
        </div>

        <div className="card">
          <h3 className="font-bold mb-2">Available Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Pay rent to landlords</li>
            <li>• Check account balance</li>
            <li>• View payment history</li>
            <li>• Check market rent rates</li>
            <li>• Register for the platform</li>
          </ul>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="font-bold text-yellow-800 mb-2">Demo Mode</h3>
          <p className="text-sm text-yellow-700">
            This is a simulation. In production, this would connect to actual
            mobile network operators and mobile money providers in Ghana.
          </p>
        </div>
      </div>
    </div>
  );
};

export default USSDSimulator;
