import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  calculateAccuracy,
  calculateConsistency,
  calculateRawWpm,
  calculateWpm,
  createTypingText,
  getLanguageOptions,
} from '../utils/typing';

const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];
const DEFAULT_LANGUAGE = 'english';

export default function TypingTest({ user, onResultSaved }) {
  const inputRef = useRef(null);
  const startedAtRef = useRef(0);
  const frameRef = useRef();
  const tabShortcutRef = useRef(false);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [text, setText] = useState(() => createTypingText(DEFAULT_LANGUAGE));
  const [mode, setMode] = useState('time');
  const [duration, setDuration] = useState(30);
  const [wordCount, setWordCount] = useState(25);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [quote, setQuote] = useState(false);
  const [uppercase, setUppercase] = useState(false);
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [wpmHistory, setWpmHistory] = useState([]);
  const [stats, setStats] = useState({
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    errors: 0,
    correctChars: 0,
    incorrectChars: 0,
  });

  useEffect(() => {
    if (mode === 'time' && started && !finished) {
      frameRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startedAtRef.current;
        const remaining = Math.max(0, duration * 1000 - elapsedMs);
        setTimeLeft(remaining / 1000);

        if (remaining <= 0) {
          finishTest();
        }
      }, 50);
    }

    return () => {
      if (frameRef.current) clearInterval(frameRef.current);
    };
  }, [started, finished, duration, mode]);

  useEffect(() => {
    const correctChars = [...typed].filter((ch, index) => text[index] === ch).length;
    const incorrectChars = typed.length - correctChars;
    const elapsedMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    const wpm = calculateWpm(correctChars, elapsedMs);
    const rawWpm = calculateRawWpm(typed.length, elapsedMs);
    const accuracy = calculateAccuracy(correctChars, typed.length || 1);

    setStats({
      wpm: Math.max(0, wpm),
      rawWpm: Math.max(0, rawWpm),
      accuracy: Math.max(0, Math.min(100, accuracy)),
      errors: incorrectChars,
      correctChars,
      incorrectChars,
    });

    if (started && !finished) {
      const nextPoint = { time: Number((elapsedMs / 1000).toFixed(1)), wpm: Number(wpm.toFixed(1)) };
      setWpmHistory((previous) => {
        if (!previous.length || previous[previous.length - 1].time !== nextPoint.time) {
          return [...previous, nextPoint];
        }
        return previous;
      });
    }
  }, [typed, started, finished, text]);

  const renderedText = useMemo(() => {
    return text.split('').map((char, index) => {
      let className = 'char';
      if (index < typed.length) {
        className += typed[index] === char ? ' correct' : ' incorrect';
      } else if (index === typed.length && started) {
        className += ' current';
      }
      return <span key={`${char}-${index}`} className={className}>{char}</span>;
    });
  }, [text, typed, started]);

  const focusInput = () => inputRef.current?.focus();

  useEffect(() => {
    focusInput();
  }, []);

  const resetTest = (nextText = createTypingText(selectedLanguage, {
    punctuation,
    numbers,
    quote,
    uppercase,
    wordCount: mode === 'words' ? wordCount : 0,
  })) => {
    setTyped('');
    setStarted(false);
    setFinished(false);
    setTimeLeft(duration);
    setWpmHistory([]);
    setText(nextText);
    setStats({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      errors: 0,
      correctChars: 0,
      incorrectChars: 0,
    });
    startedAtRef.current = 0;
    focusInput();
  };

  const buildText = (nextOptions = {}) => createTypingText(selectedLanguage, {
    punctuation,
    numbers,
    quote,
    uppercase,
    wordCount: mode === 'words' ? wordCount : 0,
    ...nextOptions,
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        tabShortcutRef.current = true;
        return;
      }

      if (event.key === 'Enter' && tabShortcutRef.current) {
        event.preventDefault();
        tabShortcutRef.current = false;
        resetTest();
        return;
      }

      if (event.key !== 'Shift') {
        tabShortcutRef.current = false;
      }

      if (event.key === 'Escape') {
        resetTest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLanguage, duration, text, mode, wordCount, punctuation, numbers, quote, uppercase]);

  const finishTest = async (completedText = typed) => {
    if (finished) return;
    setFinished(true);
    if (frameRef.current) clearInterval(frameRef.current);

    const totalTyped = completedText.length;
    const correctChars = [...completedText].filter((char, index) => text[index] === char).length;
    const elapsedMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    const finalWpm = calculateWpm(correctChars, elapsedMs || 1000);
    const finalRawWpm = calculateRawWpm(totalTyped, elapsedMs || 1000);
    const finalAccuracy = calculateAccuracy(correctChars, totalTyped || 1);
    const finalConsistency = calculateConsistency(wpmHistory.length ? wpmHistory.map((item) => item.wpm) : [finalWpm]);
    const payload = {
      wpm: Number(finalWpm.toFixed(2)),
      raw_wpm: Number(finalRawWpm.toFixed(2)),
      accuracy: Number(finalAccuracy.toFixed(2)),
      consistency: Number(finalConsistency.toFixed(2)),
      errors: Math.max(0, totalTyped - correctChars),
      correct_chars: correctChars,
      incorrect_chars: Math.max(0, totalTyped - correctChars),
      test_duration: mode === 'time' ? duration : Math.max(1, Math.round((elapsedMs || 1000) / 1000)),
    };

    onResultSaved?.(payload);
  };

  const handleInput = (event) => {
    const value = event.target.value;
    if (finished) return;

    if (!started) {
      startedAtRef.current = Date.now();
      setStarted(true);
    }

    if (value.length > text.length) {
      return;
    }

    setTyped(value);

    if (value.length >= text.length) {
      finishTest(value);
    }
  };

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;
    setSelectedLanguage(nextLanguage);
    const nextText = createTypingText(nextLanguage, {
      punctuation,
      numbers,
      quote,
      uppercase,
      wordCount: mode === 'words' ? wordCount : 0,
    });
    resetTest(nextText);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    const nextText = createTypingText(selectedLanguage, {
      punctuation,
      numbers,
      quote,
      uppercase,
      wordCount: nextMode === 'words' ? wordCount : 0,
    });
    resetTest(nextText);
  };

  const changeTextOption = (key, value) => {
    const nextOptions = { [key]: value };
    if (key === 'punctuation') setPunctuation(value);
    if (key === 'numbers') setNumbers(value);
    if (key === 'quote') setQuote(value);
    if (key === 'uppercase') setUppercase(value);
    resetTest(createTypingText(selectedLanguage, {
      punctuation: key === 'punctuation' ? value : punctuation,
      numbers: key === 'numbers' ? value : numbers,
      quote: key === 'quote' ? value : quote,
      uppercase: key === 'uppercase' ? value : uppercase,
      wordCount: mode === 'words' ? wordCount : 0,
      ...nextOptions,
    }));
  };

  const languageOptions = getLanguageOptions();

  const durationOptions = DURATIONS.map((option) => (
    <button
      key={option}
      type="button"
      className={option === duration ? 'active' : ''}
      onClick={() => {
        setDuration(option);
        setTimeLeft(option);
        if (!started) {
          setStats({
            wpm: 0,
            rawWpm: 0,
            accuracy: 100,
            errors: 0,
            correctChars: 0,
            incorrectChars: 0,
          });
        }
      }}
    >
      {option}s
    </button>
  ));

  const wordOptions = WORD_COUNTS.map((option) => (
    <button
      key={option}
      type="button"
      className={option === wordCount ? 'active' : ''}
      onClick={() => {
        setWordCount(option);
        if (mode === 'words') resetTest(buildText({ wordCount: option }));
      }}
    >
      {option}
    </button>
  ));

  return (
    <div className="typing-shell">
      <div className="toolbar">
        <div className="language-selector">
          <label htmlFor="language-select">Language</label>
          <select id="language-select" value={selectedLanguage} onChange={handleLanguageChange}>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="mode-group" aria-label="Test mode">
          <button type="button" className={mode === 'time' ? 'active' : ''} onClick={() => changeMode('time')}>Time</button>
          <button type="button" className={mode === 'words' ? 'active' : ''} onClick={() => changeMode('words')}>Words</button>
        </div>
        <div className="duration-group">{mode === 'time' ? durationOptions : wordOptions}</div>
        <span className="restart-hint" aria-label="Restart test shortcut">
          <kbd>Tab</kbd><span>+</span><kbd>Enter</kbd><span>-</span> Restart test
        </span>
      </div>

      <div className="typing-options">
        <button type="button" className={punctuation ? 'option active' : 'option'} onClick={() => changeTextOption('punctuation', !punctuation)}>@ punctuation</button>
        <button type="button" className={numbers ? 'option active' : 'option'} onClick={() => changeTextOption('numbers', !numbers)}># numbers</button>
        <button type="button" className={quote ? 'option active' : 'option'} onClick={() => changeTextOption('quote', !quote)}>❝ quote</button>
        <button type="button" className={uppercase ? 'option active' : 'option'} onClick={() => changeTextOption('uppercase', !uppercase)}>A sentence case</button>
      </div>

      <div className="stats-row">
        <div><span>WPM</span><strong>{stats.wpm.toFixed(1)}</strong></div>
        <div><span>Raw</span><strong>{stats.rawWpm.toFixed(1)}</strong></div>
        <div><span>Accuracy</span><strong>{stats.accuracy.toFixed(1)}%</strong></div>
        <div><span>Errors</span><strong>{stats.errors}</strong></div>
        <div><span>{mode === 'time' ? 'Time' : 'Words'}</span><strong>{mode === 'time' ? `${timeLeft.toFixed(1)}s` : `${typed.trim() ? typed.trim().split(/\s+/).length : 0} / ${wordCount}`}</strong></div>
      </div>

      <div className="test-panel">
        <div className="text-display" onClick={focusInput}>{renderedText}</div>
        <textarea
          ref={inputRef}
          value={typed}
          onChange={handleInput}
          onFocus={focusInput}
          onCopy={(event) => event.preventDefault()}
          onCut={(event) => event.preventDefault()}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          onDragOver={(event) => event.preventDefault()}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="Start typing here..."
          className="typing-input"
        />
      </div>

      <div className="chart-box">
        <h3>WPM graph</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={wpmHistory.length ? wpmHistory : [{ time: 0, wpm: 0 }]}> 
            <CartesianGrid strokeDasharray="3 3" stroke="#2f3344" />
            <XAxis dataKey="time" stroke="#9aa3bd" tickFormatter={(value) => `${value}s`} />
            <YAxis stroke="#9aa3bd" domain={[0, 400]} ticks={[0, 100, 200, 300, 400]} />
            <Tooltip />
            <Line type="monotone" dataKey="wpm" stroke="#7dd3fc" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
