import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homeFor } from '../components/common/RoleRoute';
import api from '../services/api';
import '../styles/InteractiveGames.css';

const InteractiveGamesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Logged-in students go back to their games page, staff to their dashboard,
  // children playing without an account to the start page
  const homePath = user?.role === 'student' ? '/student-dashboard' : user ? homeFor(user) : '/learning-helper';
  const canvasRef = useRef(null);
  
  // Game sequence
  const gameSequence = [
    { id: 'math', name: 'Math Adventure', icon: '🔢', category: 'Thinker' },
    { id: 'color', name: 'Color Match', icon: '🎨', category: 'Dreamer' },
    { id: 'memory', name: 'Memory Game', icon: '🧠', category: 'Reader' },
    { id: 'story', name: 'Story Time', icon: '📖', category: 'Listener' },
    { id: 'drawing', name: 'Drawing Fun', icon: '✏️', category: 'Dreamer' }
  ];

  // State
  const [currentGameIndex, setCurrentGameIndex] = useState(-1);
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [gamesCompleted, setGamesCompleted] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  
  // Game-specific state
  const [gameData, setGameData] = useState(null);
  const [mathAnswer, setMathAnswer] = useState(null);
  const [colorTarget, setColorTarget] = useState(null);
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [storyData, setStoryData] = useState(null);
  const [userStoryOrder, setUserStoryOrder] = useState([]);
  const [drawingPrompt, setDrawingPrompt] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#FFD700');
  const [brushSize, setBrushSize] = useState(5);
  const [strokeCount, setStrokeCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Load existing session or use stored session ID
    const storedSessionId = localStorage.getItem('currentSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
    
    if (currentGameIndex >= 0 && currentGameIndex < gameSequence.length) {
      loadGame(gameSequence[currentGameIndex]);
    }
  }, [currentGameIndex]);

  const startSequence = () => {
    setCurrentGameIndex(0);
    setScore(0);
    setStarsEarned(0);
    setGamesCompleted(0);
    setStartTime(Date.now());
  };

  const loadGame = (game) => {
    setCurrentGame(game);
    setFeedback('');
    setErrors(0);
    setIsAnswered(false);
    
    switch(game.id) {
      case 'math':
        loadMathGame();
        break;
      case 'color':
        loadColorGame();
        break;
      case 'memory':
        loadMemoryGame();
        break;
      case 'story':
        loadStoryGame();
        break;
      case 'drawing':
        loadDrawingGame();
        break;
    }
  };

  const loadMathGame = async () => {
    try {
      const response = await api.get('/assessment/games/math-problem');
      setGameData(response.data);
      setMathAnswer(response.data.answer);
      
      // Generate wrong answers
      const wrongAnswers = [];
      for (let i = 0; i < 3; i++) {
        let wrong = response.data.answer + Math.floor(Math.random() * 7) - 3;
        if (wrong < 0) wrong = 0;
        if (wrong !== response.data.answer && !wrongAnswers.includes(wrong)) {
          wrongAnswers.push(wrong);
        }
      }
      
      const allAnswers = [response.data.answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
      setGameData({ ...response.data, options: allAnswers });
    } catch (error) {
      console.error('Error loading math game:', error);
    }
  };

  const checkMath = (selectedAnswer) => {
    if (isAnswered) return;
    
    if (selectedAnswer === mathAnswer) {
      setIsAnswered(true);
      setFeedback('🎉 Perfect! You got it right!');
      setTimeout(() => completeGame(), 2500);
    } else {
      setErrors(errors + 1);
      setFeedback('🤔 Try again! Think about it carefully!');
      setTimeout(() => setFeedback(''), 1500);
    }
  };

  const loadColorGame = async () => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown'];
    const target = colors[Math.floor(Math.random() * colors.length)];
    setColorTarget(target);
    
    const wrongColors = colors.filter(c => c !== target).sort(() => Math.random() - 0.5).slice(0, 3);
    const allColors = [target, ...wrongColors].sort(() => Math.random() - 0.5);
    
    setGameData({ target, options: allColors });
  };

  const checkColor = (selected) => {
    if (isAnswered) return;
    
    if (selected === colorTarget) {
      setIsAnswered(true);
      setFeedback('🌈 Perfect Match! You found the right color!');
      setTimeout(() => completeGame(), 2500);
    } else {
      setErrors(errors + 1);
      setFeedback('🤔 Not quite! Look at the color name again!');
      setTimeout(() => setFeedback(''), 1500);
    }
  };

  const loadMemoryGame = () => {
    const emojis = ['🐶', '🐱', '🦁', '🐘', '🦊', '🐼'];
    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    setMemoryCards(cards.map((emoji, index) => ({ id: index, emoji, flipped: false, matched: false })));
    setFlippedCards([]);
    setMatchedPairs(0);
  };

  const flipCard = (index) => {
    if (flippedCards.length >= 2) return;
    
    const card = memoryCards[index];
    if (card.flipped || card.matched) return;
    
    const newCards = [...memoryCards];
    newCards[index].flipped = true;
    setMemoryCards(newCards);
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      setTimeout(() => checkMemoryMatch(newFlipped), 800);
    }
  };

  const checkMemoryMatch = (indices) => {
    const [idx1, idx2] = indices;
    const newCards = [...memoryCards];
    
    if (newCards[idx1].emoji === newCards[idx2].emoji) {
      newCards[idx1].matched = true;
      newCards[idx2].matched = true;
      const newMatched = matchedPairs + 1;
      setMatchedPairs(newMatched);
      
      if (newMatched === 6) {
        setFeedback('🎉 Memory master! You found all pairs!');
        setTimeout(() => completeGame(), 1000);
      }
    } else {
      setErrors(errors + 1);
      newCards[idx1].flipped = false;
      newCards[idx2].flipped = false;
    }
    
    setMemoryCards(newCards);
    setFlippedCards([]);
  };

  const loadStoryGame = async () => {
    try {
      const response = await api.get('/assessment/games/story');
      setStoryData(response.data);
      setUserStoryOrder([]);
    } catch (error) {
      console.error('Error loading story game:', error);
    }
  };

  const selectStoryScene = (sceneId) => {
    if (userStoryOrder.includes(sceneId)) return;
    setUserStoryOrder([...userStoryOrder, sceneId]);
  };

  const checkStoryOrder = () => {
    if (isAnswered) return;
    
    const correctOrder = storyData.scenes.map(s => s.id).sort((a, b) => {
      const sceneA = storyData.scenes.find(scene => scene.id === a);
      const sceneB = storyData.scenes.find(scene => scene.id === b);
      return sceneA.order - sceneB.order;
    });
    
    const isCorrect = JSON.stringify(userStoryOrder) === JSON.stringify(correctOrder);
    
    if (isCorrect) {
      setIsAnswered(true);
      setFeedback('🎉 Perfect Story! You put the pictures in the right order!');
      setTimeout(() => completeGame(), 2500);
    } else {
      setErrors(errors + 1);
      setFeedback('🤔 Not quite right! Think about what happens first!');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const resetStory = () => {
    setUserStoryOrder([]);
    setFeedback('');
  };

  const loadDrawingGame = () => {
    const prompts = [
      {emoji: '🌞', text: 'Draw a Sun', color: '#FFD700', type: 'sun'},
      {emoji: '🏠', text: 'Draw a House', color: '#8B4513', type: 'house'},
      {emoji: '🌳', text: 'Draw a Tree', color: '#228B22', type: 'tree'},
      {emoji: '🐱', text: 'Draw a Cat', color: '#FF69B4', type: 'cat'},
      {emoji: '⭐', text: 'Draw a Star', color: '#FFD700', type: 'star'}
    ];
    
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    setDrawingPrompt(prompt);
    setDrawingColor(prompt.color);
    setStrokeCount(0);
    
    // Initialize canvas
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, 100);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setStrokeCount(strokeCount + 1);
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setStrokeCount(0);
    }
  };

  const finishDrawing = () => {
    if (isAnswered) return;
    
    if (strokeCount > 0) {
      setIsAnswered(true);
      setFeedback('🎨 Beautiful drawing! Great job!');
      setTimeout(() => completeGame(), 2500);
    } else {
      setFeedback('🖍️ Try drawing something first!');
    }
  };

  const completeGame = async () => {
    const newStars = starsEarned + 1;
    const newCompleted = gamesCompleted + 1;
    
    setStarsEarned(newStars);
    setGamesCompleted(newCompleted);
    
    // Update session in backend
    if (sessionId) {
      try {
        const gameScoreKey = `${currentGame.id}_score`;
        const totalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        
        await api.put(`/assessment/sessions/${sessionId}/update`, {
          [gameScoreKey]: 1,
          games_completed: newCompleted,
          total_stars: newStars,
          total_errors: errors,
          total_time: totalTime
        });
      } catch (error) {
        console.error('Error updating session:', error);
      }
    }
    
    setTimeout(() => {
      goToNextGame();
    }, 500);
  };

  const goToNextGame = () => {
    const nextIndex = currentGameIndex + 1;
    if (nextIndex < gameSequence.length) {
      setCurrentGameIndex(nextIndex);
    } else {
      showFinalResults();
    }
  };

  const skipGame = () => {
    goToNextGame();
  };

  const showFinalResults = async () => {
    // Complete session in backend
    if (sessionId) {
      try {
        const totalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        
        await api.post(`/assessment/sessions/${sessionId}/complete`, {
          total_time: totalTime
        });
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
    
    setCurrentGame(null);
    setCurrentGameIndex(-2); // -2 means show results
  };

  const colorNames = {
    'red': '🔴 Red', 'blue': '🔵 Blue', 'green': '🟢 Green',
    'yellow': '🟡 Yellow', 'purple': '🟣 Purple', 'orange': '🟠 Orange',
    'pink': '🩷 Pink', 'brown': '🟤 Brown'
  };

  // Main menu
  if (currentGameIndex === -1) {
    return (
      <div className="interactive-games-page">
        <button onClick={() => navigate(homePath)} className="back-to-home-btn">
          ← Back to Home
        </button>
        <div className="games-header">
          <h1>🎮 Interactive Learning Games</h1>
          <p>Complete all 5 fun activities!</p>
        </div>

        <div className="game-sequence-preview">
          <h2>Your Adventure</h2>
          <div className="sequence-grid">
            {gameSequence.map((game, index) => (
              <div key={game.id} className="sequence-card">
                <div className="sequence-number">{index + 1}</div>
                <div className="sequence-icon">{game.icon}</div>
                <h3>{game.name}</h3>
              </div>
            ))}
          </div>
          <button onClick={startSequence} className="start-adventure-btn">
            🚀 Start Adventure!
          </button>
        </div>
      </div>
    );
  }

  // Final results
  if (currentGameIndex === -2) {
    return (
      <div className="interactive-games-page">
        <button onClick={() => navigate(homePath)} className="back-to-home-btn">
          ← Back to Home
        </button>
        <div className="final-results">
          <h1>🎉 Amazing Work!</h1>
          <div className="results-stats">
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{starsEarned}</div>
              <div className="stat-label">Stars Earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎮</div>
              <div className="stat-value">{gamesCompleted}</div>
              <div className="stat-label">Games Completed</div>
            </div>
          </div>
          <div className="result-message">
            <h2>You're a Learning Superstar! 🌟</h2>
            <p>You tried your best and that's what matters!</p>
          </div>
          <div className="result-actions">
            <button onClick={() => setCurrentGameIndex(-1)} className="play-again-btn">
              🔄 Play Again
            </button>
            <button onClick={() => navigate('/student-dashboard')} className="home-btn">
              📊 View Dashboard
            </button>
            <button onClick={() => navigate(homePath)} className="home-btn">
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active game
  const progress = ((currentGameIndex + 1) / gameSequence.length) * 100;

  return (
    <div className="interactive-games-page game-active">
      <button onClick={() => navigate(homePath)} className="back-to-home-btn">
        ← Back to Home
      </button>
      
      <div className="game-progress">
        <div className="progress-info">
          <span>Activity {currentGameIndex + 1} of {gameSequence.length}</span>
          <span>⭐ {starsEarned}</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {currentGame && (
        <div className="game-container">
          <div className="game-header">
            <h2>{currentGame.icon} {currentGame.name}</h2>
            <button onClick={skipGame} className="skip-btn">Skip →</button>
          </div>

          {/* Math Game */}
          {currentGame.id === 'math' && gameData && (
            <div className="math-game">
              <div className="problem-display">{gameData.problem}</div>
              <p className="instruction">Click on the correct answer:</p>
              <div className="math-options">
                {gameData.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => checkMath(option)}
                    className="math-option"
                    disabled={isAnswered}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Game */}
          {currentGame.id === 'color' && gameData && (
            <div className="color-game">
              <p className="instruction">
                Click on: <strong style={{ color: colorTarget, fontSize: '24px' }}>
                  {colorNames[colorTarget]}
                </strong>
              </p>
              <div className="color-options">
                {gameData.options.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => checkColor(color)}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    disabled={isAnswered}
                  >
                    <span className="color-label">{colorNames[color]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Memory Game */}
          {currentGame.id === 'memory' && memoryCards.length > 0 && (
            <div className="memory-game">
              <p className="instruction">Find all matching pairs!</p>
              <p className="score">Pairs found: {matchedPairs}/6</p>
              <div className="memory-grid">
                {memoryCards.map((card, index) => (
                  <div
                    key={index}
                    className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                    onClick={() => flipCard(index)}
                  >
                    <div className="card-front">?</div>
                    <div className="card-back">{card.emoji}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Story Game */}
          {currentGame.id === 'story' && storyData && (
            <div className="story-game">
              <h3>{storyData.title}</h3>
              <p className="instruction">Click the pictures in the right order!</p>
              <div className="story-scenes">
                {storyData.scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => selectStoryScene(scene.id)}
                    className={`story-scene ${userStoryOrder.includes(scene.id) ? 'selected' : ''}`}
                    disabled={userStoryOrder.includes(scene.id)}
                  >
                    <div className="scene-emoji">{scene.bigEmoji}</div>
                    <p>{scene.shortText}</p>
                    {userStoryOrder.includes(scene.id) && (
                      <span className="order-badge">{userStoryOrder.indexOf(scene.id) + 1}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="story-controls">
                {userStoryOrder.length === 4 && (
                  <button onClick={checkStoryOrder} className="check-btn" disabled={isAnswered}>
                    ✓ Check My Story!
                  </button>
                )}
                {userStoryOrder.length > 0 && !isAnswered && (
                  <button onClick={resetStory} className="reset-btn">
                    🔄 Start Over
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Drawing Game */}
          {currentGame.id === 'drawing' && drawingPrompt && (
            <div className="drawing-game">
              <h3>{drawingPrompt.emoji} {drawingPrompt.text}!</h3>
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
              />
              <div className="drawing-controls">
                <button onClick={clearCanvas} className="control-btn">🗑️ Clear</button>
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(e) => setDrawingColor(e.target.value)}
                  className="color-picker"
                />
                <label>
                  Brush:
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  />
                </label>
                <button onClick={finishDrawing} className="finish-btn" disabled={isAnswered}>✓ Done!</button>
              </div>
              <p className="drawing-stats">Strokes: {strokeCount}</p>
            </div>
          )}

          {feedback && (
            <div className={`feedback ${feedback.includes('🎉') || feedback.includes('🌈') || feedback.includes('🎨') ? 'success' : 'error'}`}>
              {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveGamesPage;
