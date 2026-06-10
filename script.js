// =========================================
// VARIÁVEIS GLOBAIS
// =========================================
let calendar;
let events = [];
let selectedDate = null;

// =========================================
// INICIALIZAÇÃO AO CARREGAR PÁGINA
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    loadEvents();
    initializeForm();
    updateDashboard();
});

// =========================================
// CALENDÁRIO - FULLCALENDAR
// =========================================
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.error('❌ Elemento #calendar não encontrado');
        return;
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: window.innerWidth <= 768 ? 'dayGridWeek' : 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'today'
        },
        buttonText: {
            today: 'Hoje'
        },
        height: 'auto',
        events: events,
        dateClick: function(info) {
            selectedDate = info.date;
            openBookingModal(info.date);
        },
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        eventDidMount: function(info) {
            // Estilizar eventos
            info.el.style.borderRadius = '8px';
            info.el.style.padding = '2px 4px';
            info.el.style.fontSize = '0.75rem';
            info.el.style.margin = '1px 0';
        }
    });
    
    calendar.render();
    console.log('✅ Calendário inicializado');
}

// =========================================
// CARREGAR E SALVAR EVENTOS
// =========================================
function loadEvents() {
    events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    
    // Converter strings de data para objetos Date
    events = events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: event.end ? new Date(event.end) : null
    }));
    
    if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    }
    
    updateDashboard();
}

function saveEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

// =========================================
// ADICIONAR EVENTO (FUNÇÃO QUE FALTAVA!)
// =========================================
function addEvent(eventData) {
    if (!eventData.title || !eventData.start) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return false;
    }
    
    const newEvent = {
        id: Date.now().toString(),
        title: eventData.title,
        start: new Date(eventData.start),
        end: eventData.end ? new Date(eventData.end) : null,
        clientName: eventData.clientName || '',
        phone: eventData.phone || '',
        service: eventData.service || '',
        notes: eventData.notes || '',
        status: eventData.status || 'Agendado',
        color: eventData.color || '#6366f1'
    };
    
    events.push(newEvent);
    saveEvents();
    
    if (calendar) {
        calendar.addEvent(newEvent);
    }
    
    updateDashboard();
    showNotification('Evento agendado com sucesso!', 'success');
    return true;
}

// =========================================
// EDITAR EVENTO
// =========================================
function editEvent(eventId, updatedData) {
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
        events[eventIndex] = { ...events[eventIndex], ...updatedData };
        saveEvents();
        
        if (calendar) {
            const event = calendar.getEventById(eventId);
            if (event) {
                event.remove();
                calendar.addEvent(events[eventIndex]);
            }
        }
        
        updateDashboard();
        showNotification('Evento atualizado!', 'success');
    }
}

// =========================================
// EXCLUIR EVENTO
// =========================================
function deleteEvent(eventId) {
    events = events.filter(e => e.id !== eventId);
    saveEvents();
    
    if (calendar) {
        const event = calendar.getEventById(eventId);
        if (event) {
            event.remove();
        }
    }
    
    updateDashboard();
    showNotification('Evento excluído', 'warning');
}

// =========================================
// MODAL DE AGENDAMENTO
// =========================================
function openBookingModal(date) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;
    
    document.getElementById('selectedDate').value = formatDateForInput(date);
    document.getElementById('modalTitle').textContent = `Agendar para ${formatDate(date)}`;
    
    // Limpar formulário
    document.getElementById('bookingForm').reset();
    
    // Mostrar modal
    modal.style.display = 'block';
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

