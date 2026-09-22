import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateAccuracy,
  calculateConsistency,
  calculateRawWpm,
  calculateWpm,
  createTypingText,
  getLanguageDirection,
  getLanguageOptions,
} from '../utils/typing';

const WpmChart = lazy(() => import('./WpmChart'));

const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];
const DEFAULT_LANGUAGE = 'english';
// The first keystrokes land over a near-zero elapsed time, which reads as
// hundreds of WPM. Sampling those would drag every consistency score to 0.
const WARMUP_MS = 2000;

export default function TypingTest({ onResultSaved }) {
  const inputRef = useRef(null);
  const startedAtRef = useRef(0);
  const frameRef = useRef();
  const tabShortcutRef = useRef(false);
  // the timer and the window key listener both outlive the render that created
  // them, so they must not close over state directly - they call through these
  const finishRef = useRef(null);
  const resetRef = useRef(null);
  // the caret span and the strip it sits on, for keeping the active line visible
  const caretRef = useRef(null);
  const trackRef = useRef(null);
  const [focused, setFocused] = useState(false);
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
          finishRef.current?.();
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

    if (started && !finished && elapsedMs >= WARMUP_MS) {
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
    const nodes = [];
    let index = 0;

    const renderChar = (char) => {
      let className = 'char';
      if (index < typed.length) {
        className += typed[index] === char ? ' correct' : ' incorrect';
      } else if (index === typed.length) {
        className += ' current';
      }

      const node = (
        <span key={index} className={className} ref={index === typed.length ? caretRef : null}>
          {char}
        </span>
      );

      index += 1;
      return node;
    };

    // A span per character lets the browser break a line in the middle of a
    // word, which looks broken. Wrapping each word in an inline-block keeps it
    // whole; the spaces stay plain inline, and that is where lines may break.
    text.split(' ').forEach((word, wordIndex) => {
      if (wordIndex > 0) nodes.push(renderChar(' '));
      nodes.push(<span key={`w${index}`} className="word">{[...word].map(renderChar)}</span>);
    });

    return nodes;
  }, [text, typed]);

  // The text runs to hundreds of characters, so only three lines are on screen
  // and the strip slides up to keep the caret on the middle one. Written
  // straight to the node: this runs on every keystroke and re-rendering for it
  // would be a render per character typed.
  useEffect(() => {
    const caret = caretRef.current;
    const track = trackRef.current;
    if (!caret || !track) return;

    // offsetHeight of an inline span is its glyph box, not its line box, so the
    // line height has to come from the track's own computed style.
    const lineHeight = parseFloat(getComputedStyle(track).lineHeight);
    const line = Math.round(caret.offsetTop / lineHeight);
    track.style.transform = `translateY(-${Math.max(0, line - 1) * lineHeight}px)`;
  }, [typed, text]);

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
        // Swallowing Tab everywhere would trap anyone navigating by keyboard,
        // so the restart shortcut only arms while the test itself has focus.
        if (document.activeElement !== inputRef.current) return;
        event.preventDefault();
        tabShortcutRef.current = true;
        return;
      }

      if (event.key === 'Enter' && tabShortcutRef.current) {
        event.preventDefault();
        tabShortcutRef.current = false;
        resetRef.current?.();
        return;
      }

      if (event.key !== 'Shift') {
        tabShortcutRef.current = false;
      }

      if (event.key === 'Escape') {
        resetRef.current?.();
        return;
      }

      // Typing after clicking away should put you back in the test rather than
      // going nowhere. This keystroke is spent on focusing, not typed.
      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  useEffect(() => {
    finishRef.current = finishTest;
    resetRef.current = resetTest;
  });

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

    if (mode === 'time') {
      // a time test ends on the clock, never on running out of words
      if (value.length > text.length - 40) {
        setText((previous) => `${previous} ${buildText()}`);
      }
      return;
    }

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
  const direction = getLanguageDirection(selectedLanguage);

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

  const typedWords = typed.trim() ? typed.trim().split(/\s+/).length : 0;

  return (
    <div className={`typing-shell${started && !finished ? ' is-running' : ''}`}>
      {/* The config bar fades out once the clock starts - nothing here is
          useful mid-test, and a still screen is easier to read against. */}
      <div className="config-bar">
        <div className="config-group" role="group" aria-label="Text options">
          <button type="button" className={punctuation ? 'chip active' : 'chip'} onClick={() => changeTextOption('punctuation', !punctuation)}>@ punctuation</button>
          <button type="button" className={numbers ? 'chip active' : 'chip'} onClick={() => changeTextOption('numbers', !numbers)}># numbers</button>
          <button type="button" className={quote ? 'chip active' : 'chip'} onClick={() => changeTextOption('quote', !quote)}>❝ quote</button>
          <button type="button" className={uppercase ? 'chip active' : 'chip'} onClick={() => changeTextOption('uppercase', !uppercase)}>A words</button>
        </div>

        <span className="config-divider" />

        <div className="config-group" role="group" aria-label="Test mode">
          <button type="button" className={mode === 'time' ? 'chip active' : 'chip'} onClick={() => changeMode('time')}>time</button>
          <button type="button" className={mode === 'words' ? 'chip active' : 'chip'} onClick={() => changeMode('words')}>words</button>
        </div>

        <span className="config-divider" />

        <div className="config-group" role="group" aria-label={mode === 'time' ? 'Duration' : 'Word count'}>
          {mode === 'time' ? durationOptions : wordOptions}
        </div>

        <span className="config-divider" />

        <div className="config-group">
          <select id="language-select" aria-label="Language" className="chip select" value={selectedLanguage} onChange={handleLanguageChange}>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="live-bar">
        <span className="live-counter mono">
          {mode === 'time' ? Math.ceil(timeLeft) : `${typedWords}/${wordCount}`}
        </span>
        <span className="live-wpm mono">{Math.round(stats.wpm)} wpm</span>
      </div>

      {/* The textarea sits invisibly on top of the text: it takes the
          keystrokes, the rendered spans below show them. A visible input would
          make the reader's eyes jump between two copies of the same sentence. */}
      <div
        className={`test-panel${focused ? '' : ' is-blurred'}`}
        onClick={focusInput}
        role="presentation"
      >
        <div className="text-window">
          <div className="text-track" ref={trackRef} dir={direction} lang={selectedLanguage}>
            {renderedText}
          </div>
        </div>

        <textarea
          ref={inputRef}
          dir={direction}
          value={typed}
          onChange={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onCopy={(event) => event.preventDefault()}
          onCut={(event) => event.preventDefault()}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          onDragOver={(event) => event.preventDefault()}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Typing test input"
          className="typing-input"
        />

        <div className="focus-veil" aria-hidden="true">
          <span>Click here or press any key to focus</span>
        </div>
      </div>

      <div className="test-footer">
        <button type="button" className="restart-button" onClick={() => resetTest()} aria-label="Restart test">
          ⟳ restart
        </button>
        <span className="restart-hint">
          <kbd>Tab</kbd> then <kbd>Enter</kbd> to restart
        </span>
      </div>

      {wpmHistory.length ? (
        <div className="chart-box">
          <Suspense fallback={<p className="chart-placeholder">Loading graph...</p>}>
            <WpmChart data={wpmHistory} />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
