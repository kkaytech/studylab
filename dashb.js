document.addEventListener('DOMContentLoaded', () => {
  // Dark Mode
  const darkModeBtn = document.getElementById('darkModeToggle');
  darkModeBtn.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

  // Timer elements
  const timerDisplay = document.getElementById('timer');
  const startBtn = document.getElementById('startTimer');
  const pauseBtn = document.getElementById('pauseTimer');
  const resetBtn = document.getElementById('resetTimer');
  const shortBreakBtn = document.getElementById('shortBreak');
  const longBreakBtn = document.getElementById('longBreak');
  const pomInput = document.getElementById('pomodoro-minutes');
  const setTimerBtn = document.getElementById('setTimerBtn');

  // Stats storage
  let studySecondsToday = parseInt(localStorage.getItem('studySecondsToday')) || 0;
  let focusSessions = parseInt(localStorage.getItem('focusSessions')) || 0;

  // Timer state
  let DEFAULT_SECONDS = 25 * 60;
  let timer = DEFAULT_SECONDS;
  let intervalId = null;

  // Progress ring setup (ensure this element exists in HTML)
  const circle = document.querySelector('.progress-ring__circle');
  let circumference = 0;
  if (circle) {
    const radius = circle.r.baseVal.value;
    circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
    circle.style.transition = 'stroke-dashoffset 0.35s, stroke 0.2s';
  }

  function setProgress(percent) {
    if (!circle || circumference === 0) return;
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateDisplay() {
    timerDisplay.textContent = formatTime(timer);
    // update ring percent (guard divide by zero)
    const percent = DEFAULT_SECONDS > 0 ? ((DEFAULT_SECONDS - timer) / DEFAULT_SECONDS) * 100 : 0;
    setProgress(percent);
    updateStats(); // refresh stats UI when needed
  }

  function setCustomTimer() {
    const mins = parseInt(pomInput.value);
    if (isNaN(mins) || mins <= 0) {
      alert('Enter a valid number of minutes');
      return;
    }
    DEFAULT_SECONDS = mins * 60;
    timer = DEFAULT_SECONDS;
    updateDisplay();
  }

  setTimerBtn.addEventListener('click', setCustomTimer);

  // START: combine timer tick + studySeconds increment in same interval
  startBtn.addEventListener('click', () => {
    if (intervalId) return; // already running
    // increment focus sessions once per start
    focusSessions++;
    saveStats();
    updateStats();

    intervalId = setInterval(() => {
      timer--;
      studySecondsToday++;
      saveStats(); // persist study time frequently
      if (timer < 0) {
        clearInterval(intervalId);
        intervalId = null;
        timer = DEFAULT_SECONDS;
        // optional: small finish animation
      }
      updateDisplay();
    }, 1000);
  });

  pauseBtn.addEventListener('click', () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  resetBtn.addEventListener('click', () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    timer = DEFAULT_SECONDS;
    updateDisplay();
  });

  shortBreakBtn.addEventListener('click', () => {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    timer = 5 * 60;
    DEFAULT_SECONDS = 5 * 60;
    updateDisplay();
  });

  longBreakBtn.addEventListener('click', () => {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    timer = 15 * 60;
    DEFAULT_SECONDS = 15 * 60;
    updateDisplay();
  });

  // ===== To-Do List (with priority tag) =====
  const todoInput = document.getElementById('todo-input');
  const addTodoBtn = document.getElementById('add-todo-btn');
  const todoList = document.getElementById('todo-list');
  const clearTodoBtn = document.getElementById('clear-todo-btn');
  const prioritySelect = document.getElementById('priority-select');

  function addTodoToDOM(text, priority = 'medium', done = false) {
    const li = document.createElement('li');
    li.classList.add('todo-item');
    li.dataset.priority = priority;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = done;
    checkbox.addEventListener('change', () => {
      saveTodos();
      updateStats();
    });

    const span = document.createElement('span');
    span.textContent = text;

    const priorityTag = document.createElement('span');
    priorityTag.classList.add('priority-tag', priority);
    priorityTag.textContent = priority.toUpperCase();

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(priorityTag);

    todoList.appendChild(li);
  }

  function saveTodos() {
    const todos = [];
    todoList.querySelectorAll('li').forEach(li => {
      const cb = li.querySelector('input[type="checkbox"]');
      const prTag = li.querySelector('.priority-tag');
      todos.push({
        text: li.querySelector('span').textContent,
        done: cb ? cb.checked : false,
        priority: prTag ? prTag.classList.contains('high') ? 'high' : prTag.classList.contains('low') ? 'low' : 'medium' : 'medium'
      });
    });
    localStorage.setItem('dashboardTodos', JSON.stringify(todos));
    updateStats();
  }

  function loadTodos() {
    const todos = JSON.parse(localStorage.getItem('dashboardTodos')) || [];
    todoList.innerHTML = '';
    todos.forEach(t => addTodoToDOM(t.text, t.priority, t.done));
    updateStats();
  }

  addTodoBtn.addEventListener('click', () => {
    const text = todoInput.value.trim();
    const pr = prioritySelect ? prioritySelect.value : 'medium';
    if (!text) return;
    addTodoToDOM(text, pr, false);
    todoInput.value = '';
    saveTodos();
  });

  todoInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTodoBtn.click(); });
  clearTodoBtn.addEventListener('click', () => { localStorage.removeItem('dashboardTodos'); loadTodos(); });

  loadTodos();

  // ===== Goals (card style) =====
  const goalsInput = document.getElementById('goals-input');
  const addGoalBtn = document.getElementById('add-goal-btn');
  const goalsList = document.getElementById('goals-list');
  const clearGoalBtn = document.getElementById('clear-goal-btn');

  function addGoalToDOM(text, done = false) {
    const goalDiv = document.createElement('div');
    goalDiv.classList.add('goal-item');
    goalDiv.dataset.text = text;

    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    const doneBtn = document.createElement('button');
    doneBtn.textContent = '✔';
    doneBtn.addEventListener('click', () => {
      goalDiv.classList.toggle('done');
      saveGoals();
      updateStats();
    });

    goalDiv.appendChild(textSpan);
    goalDiv.appendChild(doneBtn);
    goalsList.appendChild(goalDiv);
  }

  function saveGoals() {
    const goals = [];
    goalsList.querySelectorAll('.goal-item').forEach(g => {
      goals.push({
        text: g.querySelector('span').textContent,
        done: g.classList.contains('done')
      });
    });
    localStorage.setItem('dashboardGoals', JSON.stringify(goals));
    updateStats();
  }

  function loadGoals() {
    const goals = JSON.parse(localStorage.getItem('dashboardGoals')) || [];
    goalsList.innerHTML = '';
    goals.forEach(g => addGoalToDOM(g.text, g.done));
    updateStats();
  }

  addGoalBtn.addEventListener('click', () => {
    const t = goalsInput.value.trim();
    if (!t) return;
    addGoalToDOM(t, false);
    goalsInput.value = '';
    saveGoals();
  });

  goalsInput.addEventListener('keypress', e => { if (e.key === 'Enter') addGoalBtn.click(); });
  clearGoalBtn.addEventListener('click', () => { localStorage.removeItem('dashboardGoals'); loadGoals(); });

  loadGoals();

  // ===== Quote of the Day =====
  const quotes = [
    "The best way to get started is to quit talking and begin doing. – Walt Disney",
    "Don’t let yesterday take up too much of today. – Will Rogers",
    "It always seems impossible until it’s done. – Nelson Mandela"
  ];
  const quoteEl = document.getElementById('quote');
  const newQuoteBtn = document.getElementById('newQuoteBtn');

  function setQuote() { if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)]; }
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', setQuote);
  setQuote();

  // ===== Stats Tracking =====
  function updateStats() {
    // tasks completed
    const completedTasks = [...document.querySelectorAll('#todo-list li input[type="checkbox"]:checked')].length;
    const completedEl = document.getElementById('completed-tasks');
    if (completedEl) completedEl.textContent = completedTasks;

    // goals achieved
    const achievedGoals = document.querySelectorAll('.goal-item.done').length;
    const goalsAchEl = document.getElementById('goals-achieved');
    if (goalsAchEl) goalsAchEl.textContent = achievedGoals;

    // study time
    const studyEl = document.getElementById('study-time');
    if (studyEl) {
      const h = Math.floor(studySecondsToday / 3600);
      const m = Math.floor((studySecondsToday % 3600) / 60);
      studyEl.textContent = `${h}h ${m}m`;
    }

    // focus sessions
    const focusEl = document.getElementById('focus-sessions');
    if (focusEl) focusEl.textContent = focusSessions;
  }

  function saveStats() {
    localStorage.setItem('studySecondsToday', studySecondsToday);
    localStorage.setItem('focusSessions', focusSessions);
  }

  // ensure stats update at load
  updateStats();

  // also save stats periodically (in case of long sessions)
  const statsSaveInterval = setInterval(() => { saveStats(); }, 10_000);

  // save when window closes
  window.addEventListener('beforeunload', () => { saveStats(); });


});
