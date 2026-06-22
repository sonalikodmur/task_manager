let currentDate = new Date();
let selectedDate = new Date();
let tasks = [
    'Wake up at 5 AM',
    'Exercise',
    'Read 30 minutes',
    'Coding Practice',
    'Drink 3L Water',
    'Meditation',
    'Journal',
    'Sleep before 11 PM'
];
let monthlyData = {};
let chart = null;
let darkMode = false;

function init() {
    loadData();
    updateDisplay();
    setupEventListeners();
    renderCalendar();
    renderTasks();
    updateStats();
    updateChart();
}

function loadData() {
    const savedTasks = localStorage.getItem('tasks');
    const savedMonthlyData = localStorage.getItem('monthlyData');
    const savedDarkMode = localStorage.getItem('darkMode');

    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    if (savedMonthlyData) {
        monthlyData = JSON.parse(savedMonthlyData);
    }
    if (savedDarkMode) {
        darkMode = JSON.parse(savedDarkMode);
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
    }
}

function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('monthlyData', JSON.stringify(monthlyData));
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDayKey(date) {
    return String(date.getDate()).padStart(2, '0');
}

function updateDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('monthYear').textContent = 
        `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const today = new Date();
    document.getElementById('todayDate').textContent = 
        `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    
    updateSelectedDateTitle();
}

function updateSelectedDateTitle() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('selectedDateTitle').textContent = 
        `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const today = new Date();

    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isToday = dayDate.toDateString() === today.toDateString();
        const isFuture = dayDate > today;
        const isSelected = dayDate.toDateString() === selectedDate.toDateString();

        if (isToday) dayElement.classList.add('today');
        if (isFuture) {
            dayElement.classList.add('future');
        } else {
            const status = getDayStatus(dayDate);
            dayElement.classList.add(status);
        }
        if (isSelected) dayElement.classList.add('selected');

        dayElement.addEventListener('click', () => {
            selectedDate = dayDate;
            renderCalendar();
            renderTasks();
            updateSelectedDateTitle();
        });

        calendar.appendChild(dayElement);
    }
}

function getDayStatus(date) {
    const monthKey = getMonthKey(date);
    const dayKey = getDayKey(date);
    
    if (!monthlyData[monthKey] || !monthlyData[monthKey][dayKey]) {
        return 'none';
    }

    const completedTasks = monthlyData[monthKey][dayKey].filter(t => t).length;
    if (completedTasks === 0) return 'none';
    if (completedTasks === tasks.length) return 'completed';
    return 'partial';
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';

    const searchTerm = document.getElementById('searchTask').value.toLowerCase();
    const filter = document.getElementById('filterTasks').value;
    const monthKey = getMonthKey(selectedDate);
    const dayKey = getDayKey(selectedDate);
    const dayTasks = monthlyData[monthKey]?.[dayKey] || Array(tasks.length).fill(false);

    tasks.forEach((task, index) => {
        if (searchTerm && !task.toLowerCase().includes(searchTerm)) return;
        
        const isCompleted = dayTasks[index] || false;
        
        if (filter === 'completed' && !isCompleted) return;
        if (filter === 'pending' && isCompleted) return;

        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.draggable = true;
        taskItem.dataset.index = index;

        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} data-index="${index}">
            <span class="task-name ${isCompleted ? 'completed' : ''}">${task}</span>
            <div class="task-actions">
                <button class="task-btn edit" data-index="${index}"><i class="fas fa-edit"></i></button>
                <button class="task-btn delete" data-index="${index}"><i class="fas fa-trash"></i></button>
                <button class="task-btn drag" data-index="${index}"><i class="fas fa-grip-vertical"></i></button>
            </div>
        `;

        tasksList.appendChild(taskItem);
    });

    setupTaskEventListeners();
    setupDragAndDrop();
}

function setupTaskEventListeners() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            toggleTask(index);
        });
    });

    document.querySelectorAll('.task-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            editTask(index);
        });
    });

    document.querySelectorAll('.task-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            deleteTask(index);
        });
    });
}

function setupDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.currentTarget.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.currentTarget.dataset.index);
        });

        item.addEventListener('dragend', (e) => {
            e.currentTarget.classList.remove('dragging');
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = parseInt(e.currentTarget.dataset.index);
            
            if (fromIndex !== toIndex) {
                reorderTasks(fromIndex, toIndex);
            }
        });
    });
}

function toggleTask(index) {
    const monthKey = getMonthKey(selectedDate);
    const dayKey = getDayKey(selectedDate);

    if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
    }
    if (!monthlyData[monthKey][dayKey]) {
        monthlyData[monthKey][dayKey] = Array(tasks.length).fill(false);
    }

    monthlyData[monthKey][dayKey][index] = !monthlyData[monthKey][dayKey][index];

    saveData();
    renderTasks();
    renderCalendar();
    updateStats();
    updateChart();

    const completedTasks = monthlyData[monthKey][dayKey].filter(t => t).length;
    if (completedTasks === tasks.length) {
        triggerConfetti();
    }
}

function addTask() {
    const input = document.getElementById('newTaskInput');
    const taskName = input.value.trim();
    
    if (taskName) {
        tasks.push(taskName);
        input.value = '';
        saveData();
        renderTasks();
        updateStats();
        updateChart();
    }
}

function editTask(index) {
    const newName = prompt('Edit task:', tasks[index]);
    if (newName && newName.trim()) {
        tasks[index] = newName.trim();
        saveData();
        renderTasks();
    }
}

function deleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks.splice(index, 1);
        saveData();
        renderTasks();
        updateStats();
        updateChart();
    }
}

function reorderTasks(fromIndex, toIndex) {
    const [task] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, task);
    
    Object.keys(monthlyData).forEach(monthKey => {
        Object.keys(monthlyData[monthKey]).forEach(dayKey => {
            const dayTasks = monthlyData[monthKey][dayKey];
            const [taskStatus] = dayTasks.splice(fromIndex, 1);
            dayTasks.splice(toIndex, 0, taskStatus);
        });
    });

    saveData();
    renderTasks();
}

function updateStats() {
    const monthKey = getMonthKey(currentDate);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    let totalCompleted = 0;
    let totalMissed = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalPossible = 0;

    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayKey = getDayKey(dayDate);
        const isFuture = dayDate > today;
        
        if (!isFuture) {
            const dayTasks = monthlyData[monthKey]?.[dayKey] || Array(tasks.length).fill(false);
            const completed = dayTasks.filter(t => t).length;
            const missed = tasks.length - completed;
            
            totalCompleted += completed;
            totalMissed += missed;
            totalPossible += tasks.length;

            if (completed === tasks.length) {
                tempStreak++;
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                }
            } else {
                tempStreak = 0;
            }
        }
    }

    currentStreak = tempStreak;
    const completionPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    document.getElementById('totalCompleted').textContent = totalCompleted;
    document.getElementById('totalMissed').textContent = totalMissed;
    document.getElementById('currentStreak').textContent = currentStreak;
    document.getElementById('bestStreak').textContent = bestStreak;
    document.getElementById('completionPercent').textContent = completionPercent + '%';
}

function updateChart() {
    const monthKey = getMonthKey(currentDate);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const labels = [];
    const data = [];
    const today = new Date();

    for (let day = 1; day <= lastDay.getDate(); day++) {
        labels.push(day);
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayKey = getDayKey(dayDate);
        const isFuture = dayDate > today;
        
        if (!isFuture) {
            const dayTasks = monthlyData[monthKey]?.[dayKey] || Array(tasks.length).fill(false);
            data.push(dayTasks.filter(t => t).length);
        } else {
            data.push(null);
        }
    }

    const ctx = document.getElementById('progressChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completed Tasks',
                data: data,
                borderColor: '#102A71',
                backgroundColor: 'rgba(16, 42, 113, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#F5C400',
                pointBorderColor: '#102A71',
                pointBorderWidth: 2,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: tasks.length > 0 ? tasks.length : 10,
                    ticks: {
                        stepSize: 1,
                        color: getComputedStyle(document.body).getPropertyValue('--text-color')
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color')
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function triggerConfetti() {
    const container = document.getElementById('confetti');
    const colors = ['#F5C400', '#2ECC71', '#102A71', '#E74C3C', '#3498DB'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        container.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

function exportCSV() {
    const monthKey = getMonthKey(currentDate);
    let csv = 'Day,' + tasks.join(',') + '\n';
    
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayKey = getDayKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        const dayTasks = monthlyData[monthKey]?.[dayKey] || Array(tasks.length).fill(false);
        csv += day + ',' + dayTasks.map(t => t ? 'Yes' : 'No').join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-tracker-${monthKey}.csv`;
    a.click();
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const importedData = JSON.parse(e.target.result);
        if (importedData.tasks && importedData.monthlyData) {
            tasks = importedData.tasks;
            monthlyData = importedData.monthlyData;
            saveData();
            renderCalendar();
            renderTasks();
            updateStats();
            updateChart();
            alert('Data imported successfully!');
        }
    };
    reader.readAsText(file);
}

function resetMonth() {
    if (confirm('Are you sure you want to reset this month? All progress will be lost.')) {
        const monthKey = getMonthKey(currentDate);
        delete monthlyData[monthKey];
        saveData();
        renderCalendar();
        renderTasks();
        updateStats();
        updateChart();
    }
}

function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateDisplay();
        renderCalendar();
        updateStats();
        updateChart();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateDisplay();
        renderCalendar();
        updateStats();
        updateChart();
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode');
        const icon = document.querySelector('.theme-btn i');
        icon.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
        saveData();
        updateChart();
    });

    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    document.getElementById('searchTask').addEventListener('input', renderTasks);
    document.getElementById('filterTasks').addEventListener('change', renderTasks);

    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
        }
    });
    document.getElementById('resetMonth').addEventListener('click', resetMonth);

    document.getElementById('exportPDF').addEventListener('click', () => {
        alert('PDF export requires additional library like jsPDF. For now, please use CSV export.');
    });
}

const icon = document.querySelector('.theme-btn i');
icon.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';

init();