// Calendar functionality
const daysContainer = document.getElementById('days');
const monthYearElement = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Reminder functionality
const reminderInput = document.getElementById('reminder-input');
const addReminderBtn = document.getElementById('add-reminder');
const reminderList = document.getElementById('reminder-list');

// Todo functionality
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo');
const todoList = document.getElementById('todo-list');

let currentDate = new Date();
let reminders = JSON.parse(localStorage.getItem('calendarReminders')) || {};
let todos = JSON.parse(localStorage.getItem('calendarTodos')) || {};
let selectedDate = null; // Track currently selected date

// Initialize calendar
function initCalendar() {
    renderCalendar();
    loadSelectedDateItems();
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month-year display
    monthYearElement.textContent = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
    
    // Clear previous days
    daysContainer.innerHTML = '';
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('span');
        emptyDay.classList.add('other-month');
        daysContainer.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('span');
        dayElement.textContent = day;
        
        // Check if it's today
        if (day === today.getDate() && 
            month === today.getMonth() && 
            year === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // Check for reminders and todos
        const dateKey = `${year}-${month + 1}-${day}`;
        if (reminders[dateKey] && reminders[dateKey].length > 0) {
            dayElement.classList.add('has-reminder');
        }
        if (todos[dateKey] && todos[dateKey].length > 0) {
            dayElement.classList.add('has-todo');
        }
        
        // Add click event to select date
        dayElement.addEventListener('click', () => selectDate(day, month, year));
        
        daysContainer.appendChild(dayElement);
    }
    
    // If no date is selected, select today by default
    if (!selectedDate) {
        selectDate(today.getDate(), today.getMonth(), today.getFullYear());
    }
}

// Select a date
function selectDate(day, month, year) {
    selectedDate = { day, month, year };
    const dateKey = `${year}-${month + 1}-${day}`;
    
    // Update UI to show selected date
    updateSelectedDateUI(day, month, year);
    loadSelectedDateItems();
    
    // Show date info
    showDateInfo(day, month, year);
}

// Update UI to show which date is selected
function updateSelectedDateUI(day, month, year) {
    // Remove selected class from all days
    const allDays = daysContainer.querySelectorAll('span');
    allDays.forEach(dayEl => dayEl.classList.remove('selected'));
    
    // Add selected class to clicked day
    const dateKey = `${year}-${month + 1}-${day}`;
    const dayElements = daysContainer.querySelectorAll('span');
    dayElements.forEach((dayEl, index) => {
        if (dayEl.textContent === day.toString() && !dayEl.classList.contains('other-month')) {
            dayEl.classList.add('selected');
        }
    });
}

// Load reminders and todos for selected date
function loadSelectedDateItems() {
    if (!selectedDate) return;
    
    const { day, month, year } = selectedDate;
    const dateKey = `${year}-${month + 1}-${day}`;
    
    loadRemindersForDate(dateKey);
    loadTodosForDate(dateKey);
}

// Load reminders for specific date
function loadRemindersForDate(dateKey) {
    const dateReminders = reminders[dateKey] || [];
    
    reminderList.innerHTML = '';
    
    if (dateReminders.length === 0) {
        reminderList.innerHTML = '<li style="text-align: center; opacity: 0.7;">No reminders</li>';
        return;
    }
    
    dateReminders.forEach(reminder => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${reminder.text}
            <button class="delete-btn" onclick="deleteReminder('${dateKey}', ${reminder.id})">×</button>
        `;
        reminderList.appendChild(li);
    });
}

// Load todos for specific date
function loadTodosForDate(dateKey) {
    const dateTodos = todos[dateKey] || [];
    
    todoList.innerHTML = '';
    
    if (dateTodos.length === 0) {
        todoList.innerHTML = '<li style="text-align: center; opacity: 0.7;">No todos</li>';
        return;
    }
    
    dateTodos.forEach(todo => {
        const li = document.createElement('li');
        if (todo.completed) {
            li.classList.add('completed');
        }
        
        li.innerHTML = `
            ${todo.text}
            <div>
                <button class="delete-btn" onclick="toggleTodo('${dateKey}', ${todo.id})">✓</button>
                <button class="delete-btn" onclick="deleteTodo('${dateKey}', ${todo.id})">×</button>
            </div>
        `;
        
        li.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                toggleTodo(dateKey, todo.id);
            }
        });
        
        todoList.appendChild(li);
    });
}

// Show date information
function showDateInfo(day, month, year) {
    const dateKey = `${year}-${month + 1}-${day}`;
    const dateReminders = reminders[dateKey] || [];
    const dateTodos = todos[dateKey] || [];
    
    // Update the card titles to show the selected date
    document.querySelector('.reminder-container h3').textContent = `📝 ${month + 1}/${day}/${year} Reminders`;
    document.querySelector('.todo-container h3').textContent = `✅ ${month + 1}/${day}/${year} Todos`;
}

// Reminder functionality
function addReminder() {
    if (!selectedDate) {
        alert('Please select a date first!');
        return;
    }
    
    const text = reminderInput.value.trim();
    if (!text) return;
    
    const { day, month, year } = selectedDate;
    const dateKey = `${year}-${month + 1}-${day}`;
    
    if (!reminders[dateKey]) {
        reminders[dateKey] = [];
    }
    
    reminders[dateKey].push({
        text: text,
        id: Date.now(),
        completed: false
    });
    
    saveReminders();
    loadRemindersForDate(dateKey);
    renderCalendar(); // Re-render to update indicators
    reminderInput.value = '';
}

function deleteReminder(dateKey, id) {
    reminders[dateKey] = reminders[dateKey].filter(r => r.id !== id);
    if (reminders[dateKey].length === 0) {
        delete reminders[dateKey];
    }
    saveReminders();
    loadRemindersForDate(dateKey);
    renderCalendar();
}

function saveReminders() {
    localStorage.setItem('calendarReminders', JSON.stringify(reminders));
}

// Todo functionality
function addTodo() {
    if (!selectedDate) {
        alert('Please select a date first!');
        return;
    }
    
    const text = todoInput.value.trim();
    if (!text) return;
    
    const { day, month, year } = selectedDate;
    const dateKey = `${year}-${month + 1}-${day}`;
    
    if (!todos[dateKey]) {
        todos[dateKey] = [];
    }
    
    todos[dateKey].push({
        text: text,
        id: Date.now(),
        completed: false
    });
    
    saveTodos();
    loadTodosForDate(dateKey);
    renderCalendar(); // Re-render to update indicators
    todoInput.value = '';
}

function toggleTodo(dateKey, id) {
    const todo = todos[dateKey].find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        loadTodosForDate(dateKey);
        renderCalendar();
    }
}

function deleteTodo(dateKey, id) {
    todos[dateKey] = todos[dateKey].filter(t => t.id !== id);
    if (todos[dateKey].length === 0) {
        delete todos[dateKey];
    }
    saveTodos();
    loadTodosForDate(dateKey);
    renderCalendar();
}

function saveTodos() {
    localStorage.setItem('calendarTodos', JSON.stringify(todos));
}

// Clear all items for selected date
function clearAllReminders() {
    if (!selectedDate) {
        alert('Please select a date first!');
        return;
    }
    
    const { day, month, year } = selectedDate;
    const dateKey = `${year}-${month + 1}-${day}`;
    
    if (confirm(`Clear all reminders for ${month + 1}/${day}/${year}?`)) {
        delete reminders[dateKey];
        saveReminders();
        loadRemindersForDate(dateKey);
        renderCalendar();
    }
}

function clearAllTodos() {
    if (!selectedDate) {
        alert('Please select a date first!');
        return;
    }
    
    const { day, month, year } = selectedDate;
    const dateKey = `${year}-${month + 1}-${day}`;
    
    if (confirm(`Clear all todos for ${month + 1}/${day}/${year}?`)) {
        delete todos[dateKey];
        saveTodos();
        loadTodosForDate(dateKey);
        renderCalendar();
    }
}

// Navigation
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    selectedDate = null; // Reset selected date when changing months
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    selectedDate = null; // Reset selected date when changing months
    renderCalendar();
});

// Event listeners
addReminderBtn.addEventListener('click', addReminder);
reminderInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addReminder();
});

addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// Initialize the calendar when page loads
document.addEventListener('DOMContentLoaded', initCalendar);