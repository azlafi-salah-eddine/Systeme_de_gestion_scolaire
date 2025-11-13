import React, { useState } from 'react';
import Icon from '../Icon';

interface ArabicKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClose: () => void;
  isVisible: boolean;
  className?: string;
}

const ArabicKeyboard: React.FC<ArabicKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onSpace,
  onClose,
  isVisible,
  className = ''
}) => {
  const [shift, setShift] = useState(false);

  const arabicKeys = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
    ['ذ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  ];

  const arabicKeysShift = [
    ['َ', 'ً', 'ُ', 'ٌ', 'ِ', 'ٍ', 'ْ', 'ّ', 'ٰ', 'ٓ', 'ٔ', 'ٕ'],
    ['ٖ', 'ٗ', '٘', 'ٙ', 'ٚ', 'ٛ', 'ٜ', 'ٝ', 'ٞ', 'ٟ', 'ٰ'],
    ['ٱ', 'ٲ', 'ٳ', 'ٴ', 'ٵ', 'ٶ', 'ٷ', 'ٸ', 'ٹ', 'ٺ', 'ٻ'],
    ['ټ', 'ٽ', 'پ', 'ٿ', 'ڀ', 'ځ', 'ڂ', 'ڃ', 'ڄ', 'څ', 'چ']
  ];

  const currentKeys = shift ? arabicKeysShift : arabicKeys;

  if (!isVisible) return null;

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-2 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-medium text-slate-600 dark:text-gray-300">عربي</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
        >
          <Icon name="close" size="sm" />
        </button>
      </div>
      
      <div className="space-y-1">
        {currentKeys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-0.5">
            {row.map((key, keyIndex) => (
              <button
                key={keyIndex}
                onClick={() => onKeyPress(key)}
                className="px-1.5 py-1 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-medium text-gray-900 dark:text-gray-100 min-w-[24px] h-6"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        
        {/* Bottom row with special keys */}
        <div className="flex justify-center gap-1 mt-1">
          <button
            onClick={() => setShift(!shift)}
            className={`px-2 py-1 rounded text-xs font-medium min-w-[35px] h-6 ${
              shift 
                ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'
            }`}
          >
            Shift
          </button>
          <button
            onClick={onSpace}
            className="px-3 py-1 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-medium text-gray-900 dark:text-gray-100 h-6"
          >
            Espace
          </button>
          <button
            onClick={onBackspace}
            className="px-2 py-1 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-medium text-gray-900 dark:text-gray-100 min-w-[35px] h-6"
          >
            <Icon name="arrow-left" size="sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArabicKeyboard;
