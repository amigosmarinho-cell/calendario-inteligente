// =========================================
// VARIÁVEIS GLOBAIS
// =========================================
let calendar;
let selectedEvent = null;

// =========================================
// INICIALIZAÇÃO
// =========================================
document.addEventListener('DOMContentLoaded', function () {
    initCalendar();
    updateDashboard();
    updateBookedTimes();
    loadTheme();
});

// =========================================
// CALENDÁRIO FULLCALENDAR
// =========================================
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '18:00:00',
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: '08:00',
            endTime: '18:00'
        },
        events: function (fetchInfo, successCallback) {
            const events = JSON.parse(localStorage.getItem('events')) || [];
            successCallback(events);
        },
        eventClick: function (info) {
            openModal(info.event);
        },
        dateClick: function (info) {
            document.getElementById('start').value = info.dateStr.substring(0, 16);
            updateBookedTimes();
        },
        datesSet: function () {
            updateBookedTimes();
            updateDashboard();
        }
    });
    calendar.render();
}

// =========================================
// FUNÇÕES DE EVENTOS
// =========================================
function addEvent() {
    const serviceType = document.getElementById('serviceType').value;
    const statusService = document.getElementById('statusService').value;
    const clientName = document.getElementById('clientName').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const description = document.getElementById('description').value;
    const start = document.getElementById('start').value;

    if (!serviceType || !clientName || !clientPhone || !description || !start) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return false;
    }

    const events = JSON.parse(localStorage.getItem('events')) || [];

    // Verificar conflito de horário
    const conflict = events.find(e => e.start === start);
    if (conflict) {
        alert('Este horário já está agendado.        return false;
    }

    const newEvent = {
        id: Date.now(),
        title: clientName,
        start: start,
        end: new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
        description: description,
        serviceType: serviceType,
        status: statusService,
        phone: clientPhone,
        color: getColorByStatus(statusService)
    };

    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));

    calendar.refetchEvents();
    updateBookedTimes();
    updateDashboard();
    showSuccessMessage('✅ Agendamento salvo com sucesso!');
    resetForm();
    return true;
}

function deleteSelectedEvent() {
    if (!selectedEvent) return false;

    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const updatedEvents = events.filter(e => e.id !== selectedEvent.id);
        localStorage.setItem('events', JSON.stringify(updatedEvents));

        calendar.refetchEvents();
        updateBookedTimes();
        updateDashboard();
        closeModal();
        showSuccessMessage('🗑️ Agendamento removido com sucesso!');
    }
    return true;
}

// =========================================
// FUNÇÕES AUXILIARES
// =========================================
function updateBookedTimes() {
    const selectedDate = document.getElementById('start').value.split('T')[0];
    const events = JSON.parse(localStorage.getItem('events')) || [];

    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('booked');
        slot.disabled = false;
        slot.title = '';
    });

    events.forEach(event => {
        if (event.start && event.start.startsWith(selectedDate)) {
            const time = event.start.split('T')[1].substring(0, 5);
            const slot = document.querySelector(`[data-time="${time}"]`);
            if (slot) {
                slot.classList.add('booked');
                slot.disabled = true;
                slot.title = `Horário ${time} já agendado`;
            }
        }
    });
}

function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const events = JSON.parse(localStorage.getItem('events')) || [];

    const todayEvents = events.filter(e => e.start && e.start.startsWith(today));
    const freeSlots = 9 - todayEvents.length;
    const uniqueClients = [...new Set(events.map(e => e.title))];

    document.getElementById('todayCount').textContent = todayEvents.length;
    document.getElementById('freeCount').textContent = Math.max(0, freeSlots);
    document.getElementById('clientCount').textContent = uniqueClients.length;
}

function loadCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    document.getElementById('start').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    updateBookedTimes();
}

function selectTime(time) {
    const startInput = document.getElementById('start');
    const currentDate = startInput.value ? startInput.value.split('T')[0] : new Date().toISOString().split('T')[0];
    startInput.value = `${currentDate}T${time}`;
    updateBookedTimes();
}

function resetForm() {
    document.querySelector('form').reset();
    loadCurrentDateTime();
}

function getColorByStatus(status) {
    const colors = {
        'Agendado': '#ffc107',
        'Em andamento': '#007bff',
        'Finalizado': '#28a745',
        'Cancelado': '#dc3545'
    };
    return colors[status] || '#6c757d';
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// =========================================
// MODAL
// =========================================
function openModal(event) {
    selectedEvent = event;
    document.getElementById('modalTitle').textContent = event.title;
    document.getElementById('modalDescription').textContent = event.extendedProps.description || '';
    document.getElementById('modalDate').textContent = new Date(event.start).toLocaleString('pt-BR');
    document.getElementById('eventModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
    selectedEvent = null;
}

// =========================================
// UTILITÁRIOS
// =========================================
function exportBackup() {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup-agenda-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function searchEvents() {
    const searchTerm = document.getElementById('searchClient').value.toLowerCase();
    if (searchTerm) {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const filteredEvents = events.filter(e =>
            e.title.toLowerCase().includes(searchTerm) ||
            e.description.toLowerCase().includes(searchTerm)
        );

        if (filteredEvents.length > 0) {
            calendar.gotoDate(filteredEvents[0].start);
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// =========================================
// ATUALIZAR HORA EM TEMPO REAL
// =========================================
function updateCurrentTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const formatted = now.toLocaleDateString('pt-BR', options);
    const el = document.getElementById('currentDateTime');
    if (el) el.textContent = formatted;
}

setInterval(updateCurrentTime, 1000);
updateCurrentTime();
