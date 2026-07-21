import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import './App.css';

// Initial sticker database
const STICKERS = [
  { id: 'st1', emoji: '🦖', name: 'Khủng Long Con', cost: 5 },
  { id: 'st2', emoji: '🐱', name: 'Mèo Phi Hành Gia', cost: 10 },
  { id: 'st3', emoji: '🦄', name: 'Kỳ Lân Cầu Vồng', cost: 15 },
  { id: 'st4', emoji: '🦊', name: 'Cáo Thông Thái', cost: 20 },
  { id: 'st5', emoji: '🐼', name: 'Gấu Trúc Ăn Kem', cost: 25 },
  { id: 'st6', emoji: '🦁', name: 'Sư Tử Dũng Cảm', cost: 30 },
  { id: 'st7', emoji: '🐳', name: 'Cá Voi Thân Thiện', cost: 35 },
  { id: 'st8', emoji: '🦉', name: 'Cú Mèo Học Rộng', cost: 40 },
  { id: 'st9', emoji: '🐨', name: 'Koala Tinh Nghịch', cost: 45 },
  { id: 'st10', emoji: '🦥', name: 'Chú Lười Vui Tính', cost: 50 },
  { id: 'st11', emoji: '🚀', name: 'Tên Lửa Khám Phá', cost: 60 },
  { id: 'st12', emoji: '👑', name: 'Vương Miện Trí Tuệ', cost: 80 }
];

const MASCOT_MESSAGES = {
  default: [
    "Bé hãy tính phép tính này giúp tớ nhé! 💖",
    "Phép tính này có làm khó được cậu không? 🤔",
    "Cố lên nào bé yêu! Bạn làm được mà! 🌟",
    "Cùng học toán thật vui với tớ nhé! 🦖"
  ],
  correct: [
    "Tuyệt vời quá! Đúng rồi! 🎉",
    "Cậu giỏi quá, xuất sắc luôn! 🏆",
    "Chuẩn xác! Nhận 1 sao vàng thôi nào! ⭐",
    "Quá siêu! Cố lên nhé! 🚀"
  ],
  wrong: [
    "Không sao đâu, cậu thử tính lại xem nào! 😊",
    "Gần đúng rồi đấy, đếm kỹ lại nhé! 🧐",
    "Đừng nản chí, làm lại nhé bé yêu! 💕",
    "Thử suy nghĩ lại một chút xem sao! 🌸"
  ]
};

const VISUAL_EMOJIS = ['🍎', '🍓', '🍪', '⭐', '🎈', '🐠', '🍊', '🍬', '🍩', '🥕', '🐝', '🍄'];

function App() {
  // Navigation & Screens
  const [screen, setScreen] = useState('home'); // 'home' | 'play' | 'stickers' | 'study'
  
  // Game Setup
  const [mode, setMode] = useState('plus'); // 'plus' | 'minus' | 'multiply' | 'divide' | 'mixed'
  const [range, setRange] = useState(10); // 10 | 20 | 100 (for plus/minus)
  const [tableLimit, setTableLimit] = useState(9); // limit for multiplication/division
  
  // Game State
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1 to 20 questions per round
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [showGameFinished, setShowGameFinished] = useState(false);
  const [buttonStates, setButtonStates] = useState({}); // { optionIndex: 'correct' | 'wrong' | 'idle' }
  const [correctFirstTryCount, setCorrectFirstTryCount] = useState(0); // Track correct on first try
  const [latestResult, setLatestResult] = useState(null); // Track latest game result for finished screen
  
  // Rewards & Progress (Persisted in LocalStorage)
  const [stars, setStars] = useState(() => {
    const saved = localStorage.getItem('math_stars');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('math_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [unlockedStickers, setUnlockedStickers] = useState(() => {
    const saved = localStorage.getItem('math_unlocked_stickers');
    return saved ? JSON.parse(saved) : ['st1']; // first sticker free!
  });
  const [newSticker, setNewSticker] = useState(null);
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('math_records');
    return saved ? JSON.parse(saved) : [];
  });

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mascotMsg, setMascotMsg] = useState("Cùng học toán thật vui với tớ nhé! 🦖");
  const currentAudioRef = useRef(null);
  const bgMusicRef = useRef(null);

  // Background music controller
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!bgMusicRef.current) {
      const audio = new Audio('/bgm.mp3');
      audio.loop = true;
      audio.volume = 0.05; // BGM volume set low so it doesn't overpower TTS
      bgMusicRef.current = audio;
    }
    
    if (soundEnabled) {
      const playPromise = bgMusicRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("BGM autoplay prevented. Playing on click instead.", error);
        });
      }
    } else {
      bgMusicRef.current.pause();
    }
  }, [soundEnabled]);

  // Fallback to start playing BGM on first interaction
  useEffect(() => {
    const handleFirstClick = () => {
      if (soundEnabled && bgMusicRef.current && bgMusicRef.current.paused) {
        bgMusicRef.current.play().catch(e => console.log("BGM play failed on click:", e));
      }
    };
    window.addEventListener('click', handleFirstClick);
    return () => {
      window.removeEventListener('click', handleFirstClick);
    };
  }, [soundEnabled]);

  // Study Screen State
  const [studyType, setStudyType] = useState('plus'); // 'plus' | 'minus' | 'multiply' | 'divide'
  const [studyNum, setStudyNum] = useState(2); // table number (1-10)

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('math_stars', stars);
  }, [stars]);

  useEffect(() => {
    localStorage.setItem('math_streak', streak);
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('math_unlocked_stickers', JSON.stringify(unlockedStickers));
  }, [unlockedStickers]);

  useEffect(() => {
    localStorage.setItem('math_records', JSON.stringify(records));
  }, [records]);

  // Voice speech helper (Google Translate TTS - relying on no-referrer policy to bypass CORS/hotlink block)
  const speak = (text) => {
    if (!soundEnabled) return;
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
      }
      
      const cleanText = encodeURIComponent(text.replace(/[^\p{L}\s\d,!?]/gu, ''));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${cleanText}`;
      
      const audio = new Audio(url);
      audio.playbackRate = 1.2; // Speak slightly faster for better responsiveness
      currentAudioRef.current = audio;
      audio.play().catch(e => console.log("Audio playback interrupted:", e));
    } catch (e) {
      console.error("Audio TTS error:", e);
    }
  };

  // Trigger random mascot message
  const triggerMascotMsg = (type) => {
    const list = MASCOT_MESSAGES[type];
    const msg = list[Math.floor(Math.random() * list.length)];
    setMascotMsg(msg);
    // Speak mascot message if it's correct/wrong and it's a short cheer
    if (type === 'correct' || type === 'wrong') {
      // Don't read full math question, just cheer
      speak(msg.replace(/[^\p{L}\s\d,!?]/gu, '')); // strip emojis for reading
    }
  };

  // Generate question helper
  const generateQuestion = (currentMode, currentRange) => {
    let num1, num2, op, answer, textQuestion, textAudio;
    let selectedOp = currentMode;
    
    if (currentMode === 'mixed') {
      const ops = ['plus', 'minus', 'multiply', 'divide'];
      selectedOp = ops[Math.floor(Math.random() * ops.length)];
    }

    if (selectedOp === 'plus') {
      op = '+';
      // simple addition
      num1 = Math.floor(Math.random() * (currentRange - 1)) + 1;
      num2 = Math.floor(Math.random() * (currentRange - num1)) + 1;
      answer = num1 + num2;
      textQuestion = `${num1} + ${num2} = ?`;
      textAudio = `${num1} cộng ${num2} bằng mấy?`;
    } else if (selectedOp === 'minus') {
      op = '-';
      // subtraction (positive results only)
      num1 = Math.floor(Math.random() * (currentRange - 1)) + 2; // min 2
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // min 1, max num1-1
      answer = num1 - num2;
      textQuestion = `${num1} - ${num2} = ?`;
      textAudio = `${num1} trừ ${num2} bằng mấy?`;
    } else if (selectedOp === 'multiply') {
      op = '×';
      // multiplication table up to 9
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      answer = num1 * num2;
      textQuestion = `${num1} × ${num2} = ?`;
      textAudio = `${num1} nhân ${num2} bằng mấy?`;
    } else {
      op = '÷';
      // division (results integer 1-9)
      const quotient = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      num1 = quotient * num2;
      answer = quotient;
      textQuestion = `${num1} ÷ ${num2} = ?`;
      textAudio = `${num1} chia ${num2} bằng mấy?`;
    }

    // Generate 4 distinct options near the answer
    const optionsSet = new Set([answer]);
    while (optionsSet.size < 4) {
      let offset = Math.floor(Math.random() * 9) - 4; // -4 to +4
      let opt = answer + offset;
      if (opt > 0 && opt !== answer) {
        optionsSet.add(opt);
      } else {
        optionsSet.add(Math.floor(Math.random() * currentRange) + 1);
      }
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    const emoji = VISUAL_EMOJIS[Math.floor(Math.random() * VISUAL_EMOJIS.length)];

    return { num1, num2, op, answer, options, emoji, textQuestion, textAudio };
  };

  // Start new game
  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setCurrentStep(1);
    setShowGameFinished(false);
    setAnswered(false);
    setSelectedAnswer(null);
    setWrongAnswersCount(0);
    setCorrectFirstTryCount(0);
    setButtonStates({});
    
    // Choose correct range based on mode
    const defaultRange = (selectedMode === 'plus' || selectedMode === 'minus') ? 10 : 100;
    setRange(defaultRange);
    
    const firstQ = generateQuestion(selectedMode, defaultRange);
    setCurrentQuestion(firstQ);
    setScreen('play');
    
    // Mascot greetings
    const greetings = [
      "Trận đấu bắt đầu rồi! Cố lên nha!",
      "Hãy làm hết sức mình nhé!",
      "Học toán thật vui nào bé ơi!",
      "Tớ tin bạn sẽ trả lời đúng hết!"
    ];
    const greet = greetings[Math.floor(Math.random() * greetings.length)];
    setMascotMsg(greet);
    
    // Delay speech slightly to let UI render
    setTimeout(() => {
      speak(greet + ". " + firstQ.textAudio);
    }, 100);
  };

  // Handle Range Selection change
  const handleRangeChange = (newRange) => {
    setRange(newRange);
    const newQ = generateQuestion(mode, newRange);
    setCurrentQuestion(newQ);
    setAnswered(false);
    setSelectedAnswer(null);
    setButtonStates({});
    setWrongAnswersCount(0);
    speak(`Thay đổi phạm vi tính sang ${newRange}. ` + newQ.textAudio);
  };

  // Handle Answer selection
  const handleAnswer = (option, index) => {
    if (answered && buttonStates[index] === 'correct') return; // already solved

    if (option === currentQuestion.answer) {
      // CORRECT!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.75 }
      });

      setButtonStates(prev => ({ ...prev, [index]: 'correct' }));
      setSelectedAnswer(index);
      setAnswered(true);
      
      // Calculate reward: if answered correctly on first try, get 1 star
      const isFirstTry = wrongAnswersCount === 0;
      if (isFirstTry) {
        setStars(s => s + 1);
        setStreak(st => st + 1);
        setCorrectFirstTryCount(c => c + 1);
      }
      
      triggerMascotMsg('correct');

      // Play sound effects or speak
      // Wait and load next question
      setTimeout(() => {
        if (currentStep < 20) {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          const nextQ = generateQuestion(mode, range);
          setCurrentQuestion(nextQ);
          setAnswered(false);
          setSelectedAnswer(null);
          setWrongAnswersCount(0);
          setButtonStates({});
          triggerMascotMsg('default');
          speak(nextQ.textAudio);
        } else {
          // Finished 20 questions!
          const finalCorrect = correctFirstTryCount + (isFirstTry ? 1 : 0);
          
          // Determine medal and bonus stars
          let medalType = 'effort';
          let medalEmoji = '🏅';
          let medalName = 'Huy Chương Cố Gắng';
          let bonusStars = 2;
          
          if (finalCorrect === 20) {
            medalType = 'gold';
            medalEmoji = '🏆';
            medalName = 'Cúp Vàng Trí Tuệ';
            bonusStars = 15;
          } else if (finalCorrect >= 18) {
            medalType = 'silver';
            medalEmoji = '🥈';
            medalName = 'Huy Chương Bạc';
            bonusStars = 10;
          } else if (finalCorrect >= 15) {
            medalType = 'bronze';
            medalEmoji = '🥉';
            medalName = 'Huy Chương Đồng';
            bonusStars = 5;
          }

          // Create new record log
          const newRecord = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit'
            }) + ' ' + new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            mode: mode,
            range: (mode === 'plus' || mode === 'minus') ? `Phạm vi ${range}` : (mode === 'mixed' ? 'Hỗn hợp' : `Bảng ${studyNum}`),
            correctCount: finalCorrect,
            medal: medalType,
            medalEmoji: medalEmoji,
            medalName: medalName,
            bonusStars: bonusStars
          };

          setRecords(prev => [newRecord, ...prev]);
          setLatestResult({
            correctCount: finalCorrect,
            medalEmoji: medalEmoji,
            medalName: medalName,
            bonusStars: bonusStars
          });
          setShowGameFinished(true);
          setStars(s => s + 10 + bonusStars); // 10 completion stars + bonus stars for medal!
          
          speak(`Chúc mừng bé đã hoàn thành hai mươi câu hỏi! Bé trả lời đúng ${finalCorrect} câu ngay lần đầu và nhận được phần thưởng là ${medalName} cùng với ${10 + bonusStars} sao vàng!`);
          
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 }
          });
        }
      }, 2000);

    } else {
      // WRONG!
      setButtonStates(prev => ({ ...prev, [index]: 'wrong' }));
      setWrongAnswersCount(w => w + 1);
      setStreak(0); // reset streak
      triggerMascotMsg('wrong');
      
      // Speak warning
      speak("Ôi, sai rồi! Con hãy đếm lại và chọn lại nhé.");

      // remove the wrong state shake after animation finishes
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [index]: 'idle' }));
      }, 500);
    }
  };

  // Handle unlocking stickers
  const unlockSticker = (sticker) => {
    if (stars < sticker.cost) {
      speak("Con chưa đủ sao vàng đâu! Hãy luyện tập thêm nhé!");
      return;
    }
    
    // Unlock
    setStars(s => s - sticker.cost);
    setUnlockedStickers(prev => [...prev, sticker.id]);
    setNewSticker(sticker);
    speak(`Chúc mừng bé đã mở khóa được sticker ${sticker.name}!`);

    // Confetti burst
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Render Visual Helpers
  const renderVisuals = () => {
    if (!currentQuestion) return null;
    const { num1, num2, op, emoji } = currentQuestion;

    // We only display visual items if numbers are small (e.g. both <= 10) to avoid clutter
    if (num1 > 10 || num2 > 10) {
      return (
        <div style={{ fontSize: '1.2rem', color: '#6E6875', fontWeight: 'bold' }}>
          💡 Hãy cùng tư duy nhẩm phép tính này nhé!
        </div>
      );
    }

    // Plus mode helper
    if (op === '+') {
      return (
        <div className="math-visuals">
          <div className="visual-group">
            {Array.from({ length: num1 }).map((_, i) => (
              <span key={`v1-${i}`} className="visual-item">{emoji}</span>
            ))}
          </div>
          <span className="math-sign">+</span>
          <div className="visual-group">
            {Array.from({ length: num2 }).map((_, i) => (
              <span key={`v2-${i}`} className="visual-item">{emoji}</span>
            ))}
          </div>
        </div>
      );
    }

    // Minus mode helper
    if (op === '-') {
      return (
        <div className="math-visuals">
          <div className="visual-group">
            {Array.from({ length: num1 - num2 }).map((_, i) => (
              <span key={`v1-${i}`} className="visual-item">{emoji}</span>
            ))}
            {Array.from({ length: num2 }).map((_, i) => (
              <span key={`v2-${i}`} className="visual-item" style={{ opacity: 0.3, textDecoration: 'line-through' }}>{emoji}</span>
            ))}
          </div>
          <div style={{ fontSize: '1rem', color: '#888', marginLeft: '10px' }}>
            (Có {num1}, bớt đi {num2})
          </div>
        </div>
      );
    }

    // Multiply mode helper (grid of groups)
    if (op === '×') {
      return (
        <div className="math-visuals" style={{ flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '1rem', color: '#6E6875', marginBottom: '5px' }}>
            {num1} nhóm, mỗi nhóm có {num2} hình:
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: num1 }).map((_, g) => (
              <div key={`g-${g}`} className="visual-group" style={{ background: '#FFFDF0', borderColor: 'var(--color-warning)' }}>
                {Array.from({ length: num2 }).map((_, i) => (
                  <span key={`gi-${g}-${i}`} className="visual-item">{emoji}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Divide mode helper
    if (op === '÷') {
      // Division: num1 / num2 = quotient (answer)
      // Represent num1 total items, separated into num2 columns
      const quotient = currentQuestion.answer;
      return (
        <div className="math-visuals" style={{ flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '1rem', color: '#6E6875', marginBottom: '5px' }}>
            Chia đều {num1} hình vào {num2} túi:
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: num2 }).map((_, g) => (
              <div key={`g-${g}`} className="visual-group" style={{ background: '#F0F7FF', borderColor: 'var(--color-primary)' }}>
                {Array.from({ length: quotient }).map((_, i) => (
                  <span key={`gi-${g}-${i}`} className="visual-item">{emoji}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Play sound when clicking formula row in Study Board
  const speakFormula = (n1, n2, operation, result) => {
    let opWord = 'cộng';
    if (operation === 'minus') opWord = 'trừ';
    if (operation === 'multiply') opWord = 'nhân';
    if (operation === 'divide') opWord = 'chia';
    
    const text = `${n1} ${opWord} ${n2} bằng ${result}`;
    speak(text);
  };

  // Render Table content for Study Board
  const renderStudyTable = () => {
    const rows = [];
    const emoji = VISUAL_EMOJIS[studyNum % VISUAL_EMOJIS.length];

    if (studyType === 'plus') {
      for (let i = 1; i <= 10; i++) {
        const res = studyNum + i;
        rows.push(
          <div key={`s-${i}`} className="study-row" onClick={() => speakFormula(studyNum, i, 'plus', res)}>
            <span className="formula-text">{studyNum} + {i} = {res}</span>
            <span className="formula-speaker">🔊</span>
            <div className="formula-dots">
              {Array.from({ length: studyNum }).map((_, idx) => (
                <span key={`d1-${idx}`} className="study-dot">{emoji}</span>
              ))}
              <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>+</span>
              {Array.from({ length: i }).map((_, idx) => (
                <span key={`d2-${idx}`} className="study-dot">{emoji}</span>
              ))}
            </div>
          </div>
        );
      }
    } else if (studyType === 'minus') {
      for (let i = studyNum; i <= studyNum + 9; i++) {
        const res = i - studyNum;
        rows.push(
          <div key={`s-${i}`} className="study-row" onClick={() => speakFormula(i, studyNum, 'minus', res)}>
            <span className="formula-text">{i} - {studyNum} = {res}</span>
            <span className="formula-speaker">🔊</span>
            <div className="formula-dots">
              {Array.from({ length: i - studyNum }).map((_, idx) => (
                <span key={`d1-${idx}`} className="study-dot">{emoji}</span>
              ))}
              {Array.from({ length: studyNum }).map((_, idx) => (
                <span key={`d2-${idx}`} className="study-dot" style={{ opacity: 0.25 }}>{emoji}</span>
              ))}
            </div>
          </div>
        );
      }
    } else if (studyType === 'multiply') {
      for (let i = 1; i <= 10; i++) {
        const res = studyNum * i;
        rows.push(
          <div key={`s-${i}`} className="study-row" onClick={() => speakFormula(studyNum, i, 'multiply', res)}>
            <span className="formula-text">{studyNum} × {i} = {res}</span>
            <span className="formula-speaker">🔊</span>
            <div className="formula-dots">
              {Array.from({ length: i }).map((_, grpIdx) => (
                <span key={`g-${grpIdx}`} className="study-group-box">
                  {Array.from({ length: studyNum }).map((_, idx) => (
                    <span key={`d-${idx}`} className="study-dot-small">{emoji}</span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        );
      }
    } else if (studyType === 'divide') {
      for (let i = 1; i <= 10; i++) {
        const product = studyNum * i;
        const res = i;
        rows.push(
          <div key={`s-${i}`} className="study-row" onClick={() => speakFormula(product, studyNum, 'divide', res)}>
            <span className="formula-text">{product} ÷ {studyNum} = {res}</span>
            <span className="formula-speaker">🔊</span>
            <div className="formula-dots">
              {Array.from({ length: res }).map((_, grpIdx) => (
                <span key={`g-${grpIdx}`} className="study-group-box">
                  {Array.from({ length: studyNum }).map((_, idx) => (
                    <span key={`d-${idx}`} className="study-dot-small">{emoji}</span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        );
      }
    }
    return rows;
  };

  return (
    <>
      {/* Floating background decorations */}
      <div className="bg-decorations">
        <div className="decor-item">🎈</div>
        <div className="decor-item">🌟</div>
        <div className="decor-item">🍬</div>
        <div className="decor-item">🍭</div>
        <div className="decor-item">🍩</div>
        <div className="decor-item">🧸</div>
      </div>

      {/* Header bar */}
      <header className="app-header">
        <div className="logo-container" onClick={() => setScreen('home')}>
          <span className="logo-icon">🎡</span>
          <span className="logo-text">Sân Chơi Toán</span>
        </div>
        <div className="stats-container">
          <button 
            className={`sound-toggle-btn ${soundEnabled ? 'active' : ''}`} 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              speak(soundEnabled ? "" : "Bật âm thanh");
            }}
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          
          <button 
            className="journal-header-btn" 
            style={{ 
              background: 'white', 
              border: '3px solid var(--color-pink-light)', 
              borderRadius: '50px', 
              padding: '6px 14px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              color: 'var(--color-pink-dark)', 
              fontSize: '1rem',
              boxShadow: '0 4px 0 var(--color-pink)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'transform 0.1s, box-shadow 0.1s'
            }}
            onClick={() => {
              setScreen('journal');
              speak("Mở nhật ký học tập");
            }}
            title="Xem nhật ký học tập"
          >
            📜 Nhật Ký
          </button>
          
          <div className="stat-badge streak">
            🔥 {streak}
          </div>
          
          <div className="stat-badge stars">
            ⭐ {stars}
          </div>
        </div>
      </header>

      {/* Screen Router */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* SCREEN: HOME */}
        {screen === 'home' && (
          <div className="home-screen">
            <div className="intro-card">
              <h2>Chào mừng bé đến với Sân Chơi Toán Học!</h2>
              <p>Hãy chọn một phép tính để bắt đầu luyện tập và nhận Sao Vàng nhé! 🌟</p>
            </div>
            
            <div className="modes-grid">
              <button className="mode-card plus" onClick={() => startGame('plus')}>
                <span className="mode-icon">➕</span>
                <span className="mode-title">Phép Cộng</span>
                <span className="mode-desc">Thêm vào vui vẻ</span>
              </button>

              <button className="mode-card minus" onClick={() => startGame('minus')}>
                <span className="mode-icon">➖</span>
                <span className="mode-title">Phép Trừ</span>
                <span className="mode-desc">Bớt đi dễ dàng</span>
              </button>

              <button className="mode-card multiply" onClick={() => startGame('multiply')}>
                <span className="mode-icon">✖️</span>
                <span className="mode-title">Phép Nhân</span>
                <span className="mode-desc">Bảng cửu chương</span>
              </button>

              <button className="mode-card divide" onClick={() => startGame('divide')}>
                <span className="mode-icon">➗</span>
                <span className="mode-title">Phép Chia</span>
                <span className="mode-desc">Chia đều quà xinh</span>
              </button>

              <button className="mode-card mixed" onClick={() => startGame('mixed')}>
                <span className="mode-icon">🔀</span>
                <span className="mode-title">Hỗn Hợp</span>
                <span className="mode-desc">Trộn lẫn thử thách</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px', width: '100%' }}>
              <button className="sticker-book-btn" onClick={() => {
                setScreen('stickers');
                speak("Chào mừng bé đến với Kho Báu Sticker! Hãy tích lũy sao vàng để đổi những sticker siêu đáng yêu nhé!");
              }}>
                🎒 Kho Báu Sticker
              </button>
              
              <button className="sticker-book-btn" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary-dark)', boxShadow: '0 6px 0 var(--color-primary)' }} onClick={() => {
                setScreen('study');
                speak("Bảng Học Tập đây rồi! Bé muốn học bảng tính nào hãy chọn ở phía trên nhé.");
              }}>
                📖 Bảng Học Tập
              </button>

              <button className="sticker-book-btn" style={{ borderColor: 'var(--color-pink)', color: 'var(--color-pink-dark)', boxShadow: '0 6px 0 var(--color-pink)' }} onClick={() => {
                setScreen('journal');
                speak("Mở nhật ký học tập và bảng vàng thành tích.");
              }}>
                📜 Nhật Ký Học Tập
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: GAME PLAY */}
        {screen === 'play' && currentQuestion && (
          <div className="game-container">
            <div className="game-controls">
              <button className="back-btn" onClick={() => {
                setScreen('home');
                speak("Trở về màn hình chính");
              }}>
                🏠 Trang chủ
              </button>

              {/* Range settings for Plus/Minus */}
              {(mode === 'plus' || mode === 'minus') && (
                <div className="game-settings">
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-light)' }}>Phạm vi:</span>
                  <select 
                    className="range-select" 
                    value={range} 
                    onChange={(e) => handleRangeChange(parseInt(e.target.value, 10))}
                  >
                    <option value={10}>Trong phạm vi 10</option>
                    <option value={20}>Trong phạm vi 20</option>
                    <option value={100}>Trong phạm vi 100</option>
                    <option value={1000}>Trong phạm vi 1000</option>
                  </select>
                </div>
              )}

              {/* Indicator for Multiplication/Division */}
              {(mode === 'multiply' || mode === 'divide') && (
                <div className="game-settings">
                  <span className="stat-badge" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                    🔢 Bảng cửu chương 1 - 9
                  </span>
                </div>
              )}

              {mode === 'mixed' && (
                <div className="game-settings">
                  <span className="stat-badge" style={{ fontSize: '0.9rem', padding: '4px 10px', borderColor: 'var(--color-pink)' }}>
                    🔀 Trộn ngẫu nhiên
                  </span>
                </div>
              )}
            </div>

            {/* Caterpillar progress */}
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(currentStep - 1) * 5}%` }}>
                <span className="caterpillar-head">🐛</span>
              </div>
              <span className="progress-target">🍎</span>
              <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '1px', fontWeight: 'bold', fontSize: '0.85rem', color: '#333' }}>
                Câu hỏi {currentStep} / 20
              </div>
            </div>

            {showGameFinished ? (
              // GAME FINISHED SPLASH SCREEN
              <div className="finished-card" style={{ textAlign: 'center', padding: '30px 10px', animation: 'popIn 0.5s' }}>
                <h2 style={{ fontSize: '2.4rem', color: 'var(--color-success-dark)', marginBottom: '10px' }}>🎉 Hoàn Thành Xuất Sắc! 🎉</h2>
                
                {latestResult && (
                  <div className="medal-showcase" style={{ margin: '20px auto', padding: '20px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', maxWidth: '400px', border: '3px dashed var(--color-warning-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                    <div className="medal-sparkle" style={{ fontSize: '5rem', display: 'inline-block', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.15))' }}>{latestResult.medalEmoji}</div>
                    <h3 className="medal-name" style={{ fontSize: '1.6rem', color: 'var(--text-dark)', marginTop: '10px', fontWeight: '800' }}>{latestResult.medalName}</h3>
                    <div className="score-summary" style={{ fontSize: '1.25rem', color: 'var(--text-light)', margin: '12px 0', fontWeight: '700' }}>
                      Đúng <span style={{ color: 'var(--color-success-dark)', fontSize: '1.4rem' }}>{latestResult.correctCount} / 20</span> câu ngay lần đầu!
                    </div>
                    <div className="award-stars-text" style={{ fontSize: '1.2rem', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                      Bé nhận thêm <span style={{ color: 'var(--color-warning-dark)', fontSize: '1.4rem' }}>⭐ {10 + latestResult.bonusStars} sao vàng</span> thưởng!
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '4px', fontStyle: 'italic' }}>
                      (10 sao hoàn thành + {latestResult.bonusStars} sao huy chương)
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '25px' }}>
                  <button className="sticker-book-btn" onClick={() => startGame(mode)}>
                    🔄 Chơi lại màn này
                  </button>
                  <button className="sticker-book-btn" style={{ borderColor: 'var(--color-pink)', color: 'var(--color-pink-dark)', boxShadow: '0 6px 0 var(--color-pink)' }} onClick={() => {
                    setScreen('journal');
                    speak("Mở nhật ký học tập");
                  }}>
                    📜 Nhật Ký Học Tập
                  </button>
                  <button className="sticker-book-btn" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary-dark)', boxShadow: '0 6px 0 var(--color-primary)' }} onClick={() => setScreen('home')}>
                    🏠 Về trang chủ
                  </button>
                </div>
              </div>
            ) : (
              // ACTIVE GAME SCREEN
              <>
                <div className="math-card">
                  <div className="math-question">
                    {currentQuestion.textQuestion}
                  </div>
                  {renderVisuals()}
                  <button 
                    className="sound-toggle-btn" 
                    style={{ position: 'absolute', bottom: '10px', right: '10px', width: '36px', height: '36px', fontSize: '1rem' }}
                    onClick={() => speak(currentQuestion.textAudio)}
                    title="Đọc đề bài"
                  >
                    🔊
                  </button>
                </div>

                <div className="answers-grid">
                  {currentQuestion.options.map((opt, idx) => {
                    let stateClass = '';
                    if (buttonStates[idx] === 'correct') stateClass = 'correct-pulse';
                    if (buttonStates[idx] === 'wrong') stateClass = 'wrong-shake';
                    
                    return (
                      <button
                        key={`opt-${idx}`}
                        className={`bubble-btn ${stateClass}`}
                        onClick={() => handleAnswer(opt, idx)}
                        disabled={answered && buttonStates[idx] !== 'correct'}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="mascot-area">
                  <div className="mascot-character">🦖</div>
                  <div className="speech-bubble">
                    {mascotMsg}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SCREEN: STICKER BOOK */}
        {screen === 'stickers' && (
          <div className="sticker-book-screen">
            <div className="sticker-title-bar">
              <h2>🎒 Kho Báu Sticker Của Bé</h2>
              <button className="back-btn" onClick={() => {
                setScreen('home');
                speak("Trở về màn hình chính");
              }}>
                🏠 Trang chủ
              </button>
            </div>
            
            <p style={{ color: 'var(--text-light)', marginBottom: '20px', fontSize: '1.1rem' }}>
              Dùng Sao Vàng ⭐ kiếm được khi trả lời đúng để mở khóa các bạn sticker siêu dễ thương nhé!
            </p>

            <div className="sticker-grid">
              {STICKERS.map((st) => {
                const isUnlocked = unlockedStickers.includes(st.id);
                const canAfford = stars >= st.cost;
                
                return (
                  <div 
                    key={st.id} 
                    className={`sticker-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <span className="sticker-image">{st.emoji}</span>
                    <span className="sticker-name">{st.name}</span>
                    
                    {!isUnlocked && (
                      <button 
                        className="sticker-lock-cost"
                        disabled={!canAfford}
                        onClick={() => unlockSticker(st)}
                        style={{ 
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          opacity: canAfford ? 1 : 0.6,
                          background: canAfford ? 'var(--color-warning)' : '#ADB5BD'
                        }}
                      >
                        ⭐ {st.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN: STUDY BOARD */}
        {screen === 'study' && (
          <div className="sticker-book-screen">
            <div className="sticker-title-bar">
              <h2>📖 Bảng Học Tập Thông Thái</h2>
              <button className="back-btn" onClick={() => {
                setScreen('home');
                speak("Trở về màn hình chính");
              }}>
                🏠 Trang chủ
              </button>
            </div>

            {/* Type selector */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', justifyContent: 'center' }}>
              <button 
                className={`back-btn ${studyType === 'plus' ? 'active' : ''}`}
                style={{ 
                  borderColor: studyType === 'plus' ? 'var(--color-success)' : '#CED4DA',
                  background: studyType === 'plus' ? '#E8F5E9' : '#FFF',
                  color: studyType === 'plus' ? 'var(--color-success-dark)' : 'var(--text-light)'
                }}
                onClick={() => {
                  setStudyType('plus');
                  speak("Bảng cộng");
                }}
              >
                ➕ Bảng Cộng
              </button>
              
              <button 
                className={`back-btn ${studyType === 'minus' ? 'active' : ''}`}
                style={{ 
                  borderColor: studyType === 'minus' ? 'var(--color-primary)' : '#CED4DA',
                  background: studyType === 'minus' ? '#E3F2FD' : '#FFF',
                  color: studyType === 'minus' ? 'var(--color-primary-dark)' : 'var(--text-light)'
                }}
                onClick={() => {
                  setStudyType('minus');
                  speak("Bảng trừ");
                }}
              >
                ➖ Bảng Trừ
              </button>
              
              <button 
                className={`back-btn ${studyType === 'multiply' ? 'active' : ''}`}
                style={{ 
                  borderColor: studyType === 'multiply' ? 'var(--color-purple)' : '#CED4DA',
                  background: studyType === 'multiply' ? '#F3E5F5' : '#FFF',
                  color: studyType === 'multiply' ? 'var(--color-purple-dark)' : 'var(--text-light)'
                }}
                onClick={() => {
                  setStudyType('multiply');
                  speak("Bảng nhân");
                }}
              >
                ✖️ Bảng Nhân
              </button>
              
              <button 
                className={`back-btn ${studyType === 'divide' ? 'active' : ''}`}
                style={{ 
                  borderColor: studyType === 'divide' ? 'var(--color-orange)' : '#CED4DA',
                  background: studyType === 'divide' ? '#FFE0B2' : '#FFF',
                  color: studyType === 'divide' ? 'var(--color-orange-dark)' : 'var(--text-light)'
                }}
                onClick={() => {
                  setStudyType('divide');
                  speak("Bảng chia");
                }}
              >
                ➗ Bảng Chia
              </button>
            </div>

            {/* Number Table Selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '25px', justifyContent: 'center' }}>
              {Array.from({ length: 9 }).map((_, idx) => {
                const num = idx + 1; // Tables 1 to 9
                // For division/multiplication, common to show 2 to 9
                if ((studyType === 'multiply' || studyType === 'divide') && num === 1) return null;
                
                return (
                  <button
                    key={`num-sel-${num}`}
                    className="sound-toggle-btn"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      background: studyNum === num ? 'var(--color-warning)' : 'white',
                      color: studyNum === num ? 'white' : 'var(--text-dark)',
                      borderColor: 'var(--color-warning)'
                    }}
                    onClick={() => {
                      setStudyNum(num);
                      speak(`Bảng ${num}`);
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Table Rows list */}
            <div className="study-table-container">
              {renderStudyTable()}
            </div>
          </div>
        )}

        {/* SCREEN: LEARNING JOURNAL & ACHIEVEMENTS */}
        {screen === 'journal' && (
          <div className="sticker-book-screen">
            <div className="sticker-title-bar">
              <h2>📜 Nhật Ký Học Tập Của Bé</h2>
              <button className="back-btn" onClick={() => {
                setScreen('home');
                speak("Trở về màn hình chính");
              }}>
                🏠 Trang chủ
              </button>
            </div>

            <p style={{ color: 'var(--text-light)', marginBottom: '20px', fontSize: '1.1rem' }}>
              Nơi ghi nhận các phần thưởng huy chương và kết quả học tập của bé để bố mẹ cùng đánh giá! 🌟
            </p>

            {/* Medal Achievements Card */}
            <div className="journal-medals-summary" style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '24px',
              padding: '20px',
              border: '2px solid #E1E8EE',
              marginBottom: '25px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)', marginBottom: '15px', fontWeight: '800', textAlign: 'center' }}>
                🏆 Bảng Vàng Danh Hiệu Đã Đạt
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#FFFEE0', padding: '10px 4px', borderRadius: '16px', border: '2px solid #FFE082' }}>
                  <div style={{ fontSize: '2.5rem' }}>🏆</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#B38000', margin: '4px 0' }}>Cúp Vàng</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {records.filter(r => r.medal === 'gold').length}
                  </div>
                </div>
                <div style={{ background: '#F8F9FA', padding: '10px 4px', borderRadius: '16px', border: '2px solid #DEE2E6' }}>
                  <div style={{ fontSize: '2.5rem' }}>🥈</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#6C757D', margin: '4px 0' }}>Huy Chương Bạc</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {records.filter(r => r.medal === 'silver').length}
                  </div>
                </div>
                <div style={{ background: '#FFF5F0', padding: '10px 4px', borderRadius: '16px', border: '2px solid #FFD0B8' }}>
                  <div style={{ fontSize: '2.5rem' }}>🥉</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#C86430', margin: '4px 0' }}>Huy Chương Đồng</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {records.filter(r => r.medal === 'bronze').length}
                  </div>
                </div>
                <div style={{ background: '#FFF0F5', padding: '10px 4px', borderRadius: '16px', border: '2px solid #FFC2D4' }}>
                  <div style={{ fontSize: '2.5rem' }}>🏅</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#D6336C', margin: '4px 0' }}>Cố Gắng</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {records.filter(r => r.medal === 'effort').length}
                  </div>
                </div>
              </div>
            </div>

            {/* History Logs Card */}
            <div className="journal-history-card" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '24px',
              padding: '20px',
              border: '2px solid #E1E8EE',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)', marginBottom: '15px', fontWeight: '800' }}>
                📝 Nhật Ký Chi Tiết Luyện Tập
              </h3>

              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-light)', fontSize: '1.1rem' }}>
                  🦖 Bé chưa có bản ghi học tập nào. Hãy bắt đầu luyện tập một phép tính bất kỳ nhé!
                </div>
              ) : (
                <>
                  <div className="journal-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
                    {records.map((rec) => (
                      <div key={rec.id} className="journal-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'white',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        border: '2px solid #F1F3F5',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#ADB5BD', fontWeight: '600' }}>🕒 {rec.date}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="stat-badge" style={{
                              fontSize: '0.85rem',
                              padding: '2px 8px',
                              borderWidth: '2px',
                              borderColor: rec.mode === 'mixed' ? 'var(--color-pink-light)' : 'var(--color-primary-light)',
                              color: rec.mode === 'mixed' ? 'var(--color-pink-dark)' : 'var(--color-primary-dark)',
                              background: rec.mode === 'mixed' ? '#FFF0F6' : '#E3F2FD',
                              boxShadow: 'none'
                            }}>
                              {rec.mode === 'mixed' ? '🔀 Hỗn Hợp' : 
                               rec.mode === 'plus' ? '➕ Phép Cộng' :
                               rec.mode === 'minus' ? '➖ Phép Trừ' :
                               rec.mode === 'multiply' ? '✖ Phép Nhân' : '➗ Phép Chia'}
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-light)' }}>
                              {rec.range}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                              Đúng <span style={{ color: rec.correctCount >= 18 ? 'var(--color-success)' : 'var(--color-orange-dark)' }}>{rec.correctCount} / 20</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-warning-dark)', fontWeight: 'bold' }}>
                              ⭐ +{10 + rec.bonusStars} Sao
                            </div>
                          </div>
                          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }} title={rec.medalName}>
                            {rec.medalEmoji}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button 
                      className="back-btn" 
                      style={{ 
                        borderColor: 'var(--color-danger)', 
                        color: 'var(--color-danger-dark)', 
                        background: '#FFF0F6',
                        fontSize: '0.95rem',
                        padding: '6px 14px'
                      }}
                      onClick={() => {
                        if (window.confirm("Bố mẹ có chắc chắn muốn xóa toàn bộ lịch sử học tập của bé không?")) {
                          setRecords([]);
                          speak("Đã xóa toàn bộ nhật ký học tập");
                        }
                      }}
                    >
                      🗑️ Xóa tất cả nhật ký
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: STICKER UNLOCKED CELEBRATION */}
      {newSticker && (
        <div className="sticker-unlock-modal">
          <div className="unlock-content">
            <div className="unlock-title">🎉 Đã Mở Khóa! 🎉</div>
            <div className="unlock-emoji">{newSticker.emoji}</div>
            <div className="unlock-name">Bé nhận được bạn: {newSticker.name}</div>
            <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>
              Hãy tiếp tục luyện tập chăm chỉ để mở khóa thêm nhiều bạn bè nhé!
            </p>
            <button className="unlock-btn" onClick={() => setNewSticker(null)}>
              Tuyệt quá!
            </button>
          </div>
        </div>
      )}

      {/* Decorative footer */}
      <footer style={{ textAlign: 'center', padding: '15px', fontSize: '0.9rem', color: '#ADB5BD' }}>
        🎈 Math Playground - Học toán thật vui 🎈
      </footer>

      {/* Inline styles for study table custom rows since we didn't add it in index.css */}
      <style>{`
        .study-table-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #FFFDF9;
          padding: 15px;
          border-radius: 20px;
          border: 3px solid #E1E8EE;
          max-height: 400px;
          overflow-y: auto;
        }
        .study-row {
          display: flex;
          align-items: center;
          background: white;
          padding: 10px 16px;
          border-radius: 14px;
          border: 2px solid #E1E8EE;
          cursor: pointer;
          transition: transform 0.1s, border-color 0.1s;
          min-height: 54px;
        }
        .study-row:hover {
          transform: translateX(4px);
          border-color: var(--color-warning);
        }
        .formula-text {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-dark);
          min-width: 140px;
          text-align: left;
        }
        .formula-speaker {
          font-size: 1.1rem;
          margin-right: 15px;
          opacity: 0.6;
        }
        .formula-dots {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          flex-grow: 1;
        }
        .study-dot {
          font-size: 1.2rem;
        }
        .study-dot-small {
          font-size: 0.95rem;
        }
        .study-group-box {
          display: inline-flex;
          gap: 2px;
          border: 1px dashed #CED4DA;
          padding: 2px 4px;
          border-radius: 6px;
          background: #FAFAFA;
        }
      `}</style>
    </>
  );
}

export default App;
