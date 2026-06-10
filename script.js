// =========================================
// VARIÁVEIS GLOBAIS
// =========================================
let calendar;
let selectedEvent = null;
let events = JSON.parse(localStorage.getItem('events')) || [];

// =========================================
// INICIALIZAÇÃO
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    updateDashboard();
    updateBookedTimes();
    loadTheme();
    
    // Adicionar event listeners
    document.addEventListener('keydown', handleKeyboard);
    
    // Atualizar dashboard a cada minuto
    setInterval(updateDashboard, 60000);
});

// =========================================
// CALENDÁRIO
// =========================================
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
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
        events: events,
        eventColor: '#2563eb',
        eventClick: function(info) {
            showEventModal(info.event);
        },
        dateClick: function(info) {
            selectDate(info.date);
        },
        eventDrop: function(info) {
            updateEventDate(info.event, info.newDate);
        },
        eventResize: function(info) {
            updateEventDuration(info.event, info.start, info.end);
        },
        dayMaxEvents: true,
        navLinks: true,
        selectable: true,
        selectMirror: true
    });
    
    calendar.render();
}

// =========================================
// FUNÇÕES DE EVENTOS
// =========================================
function addEvent() {
    const serviceType = document.getElementById('serviceType').value;
    const statusService = document.getElementById('statusService').value;
    const clientName = document.getElementById('clientName').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const description = document.getElementById('description').value.trim();
    const start = document.getElementById('start').value;
    
    // Validação
    if (!serviceType || !clientName || !clientPhone || !start) {
        showNotification('⚠️ Por favor, preencha todos os campos obrigatórios!', 'error');
        return false;
    }
    
    // Validação de telefone
    if (!/^\d{10,11}$/.test(clientPhone.replace(/\D/g, ''))) {
        showNotification('📞 Telefone inválido! Use 10 ou 11 dígitos.', 'error');
        return false;
    }
    
    // Verificar conflito de horário
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hora
    
    const hasConflict = events.some(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end || new Date(eventStart.getTime() + 60 * 60 * 1000));
        
        return startDate < eventEnd && endDate > eventStart;
    });
    
    if (hasConflict) {
        showNotification('⏰ Horário já agendado! Escolha outro horário.', 'error');
        return false;
    }
    
    const event = {
        id: Date.now().toString(),
        title: `${serviceType} - ${clientName}`,
        clientName,
        clientPhone,
        serviceType,
        status: statusService,
        description,
        start: start,
        end: endDate.toISOString().slice(0, 16),
        color: getColorByStatus(statusService)
    };
    
    events.push(event);
    saveEvents();
    calendar.addEvent(event);
    updateDashboard();
    updateBookedTimes();
    clearForm();
    
    showNotification('✅ Agendamento salvo com sucesso!', 'success');
    return true;
}

function updateEvent(eventId, updatedData) {
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
        events[index] = { ...events[index], ...updatedData };
        saveEvents();
        calendar.getEventById(eventId).remove();
        calendar.addEvent(events[index]);
        updateDashboard();
        updateBookedTimes();
    }
}

function deleteEvent(eventId) {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        events = events.filter(e => e.id !== eventId);
        saveEvents();
        calendar.getEventById(eventId).remove();
        updateDashboard();
        updateBookedTimes();
        closeModal();
        showNotification('🗑️ Agendamento excluído com sucesso!', 'success');
    }
}

function updateEventDate(event, newDate) {
    const index = events.findIndex(e => e.id === event.id);
    if (index !== -1) {
        events[index].start = newDate.toISOString();
        events[index].end = new Date(newDate.getTime() + 60 * 60 * 1000).toISOString();
        saveEvents();
        updateDashboard();
    }
}

// =========================================
// FUNÇÕES AUXILIARES
// =========================================
function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}

function clearForm() {
    document.getElementById('serviceType').value = '';
    document.getElementById('statusService').value = 'Agendado';
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('description').value = '';
    document.getElementById('start').value = '';
    
    // Limpar seleção de horário
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
}

function selectTime(time) {
    const dateInput = document.getElementById('start');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    dateInput.value = `${dateStr}T${time}`;
    
    // Atualizar seleção visual
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    document.querySelector(`[data-time="${time}"]`).classList.add('selected');
}

function selectDate(date) {
    const dateStr = date.toISOString().slice(0, 16);
    document.getElementById('start').value = dateStr;
}

function getColorByStatus(status) {
    const colors = {
        'Agendado': '#2563eb',
        'Em andamento': '#f59e0b',
        'Finalizado': '#10b981',
        'Cancelado': '#ef4444'
    };
    return colors[status] || '#2563eb';
}

// =========================================
// DASHBOARD
// =========================================
function updateDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Contar agendamentos de hoje
    const todayEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= today && eventDate <= todayEnd;
    });
    
    // Contar horários livres (exemplo: 9 horários por dia)
    const totalSlots = 9;
    const bookedSlots = todayEvents.length;
    const freeSlots = totalSlots - bookedSlots;
    
    // Contar clientes únicos
    const uniqueClients = [...new Set(events.map(e => e.clientName))];
    
    // Atualizar contadores
    document.getElementById('todayCount').textContent = todayEvents.length;
    document.getElementById('freeCount').textContent = Math.max(0, freeSlots);
    document.getElementById('clientCount').textContent = uniqueClients.length;
    
    // Atualizar garantias próximas
    updateGarantias();
}

function updateGarantias() {
    const garantiaList = document.getElementById('garantiaList');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const garantiasProximas = events.filter(event => {
        const eventDate = new Date(event.start);
        const daysDiff = Math.floor((eventDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 30 && event.status === 'Finalizado';
    });
    
    if (garantiasProximas.length === 0) {
        garantiaList.innerHTML = `
            <div class="garantia-item">
                <div>
                    <strong>Nenhuma garantia próxima</strong>
                    <br>
                    Os serviços aparecerão aqui.
                </div>
                <div class="garantia-badge green">OK</div>
            </div>
        `;
        return;
    }
    
    garantiaList.innerHTML = garantiasProximas.map(event => {
        const daysLeft = Math.floor((new Date(event.start) - new Date()) / (1000 * 60 * 60 * 24));
        const badgeClass = daysLeft <= 7 ? 'red' : daysLeft <= 15 ? 'yellow' : 'green';
        
        return `
            <div class="garantia-item">
                <div>
                    <strong>${event.clientName}</strong>
                    <br>
                    ${event.serviceType} - ${daysLeft} dias restantes
                </div>
                <div class="garantia-badge ${badgeClass}">
                    ${daysLeft <= 7 ? 'URGENTE' : daysLeft <= 15 ? 'ATENÇÃO' : 'OK'}
                </div>
            </div>
        `;
    }).join('');
}

// =========================================
// BUSCA E FILTROS
// =========================================
function searchEvents() {
    const searchTerm = document.getElementById('searchClient').value.toLowerCase();
    
    // Filtrar eventos no calendário
    calendar.getEvents().forEach(event => {
        const shouldShow = event.title.toLowerCase().includes(searchTerm) ||
                          event.extendedProps.clientName.toLowerCase().includes(searchTerm) ||
                          event.extendedProps.serviceType.toLowerCase().includes(searchTerm);
        
        event.setProp('display', shouldShow ? 'auto' : 'none');
    });
}

// =========================================
// MODAL
// =========================================
function showEventModal(event) {
    selectedEvent = event;
    
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalDate = document.getElementById('modalDate');
    
    modalTitle.textContent = event.title;
    modalDescription.innerHTML = `
        <strong>Cliente:</strong> ${event.extendedProps.clientName}<br>
        <strong>Telefone:</strong> ${event.extendedProps.clientPhone}<br>
        <strong>Serviço:</strong> ${event.extendedProps.serviceType}<br>
        <strong>Status:</strong> ${event.extendedProps.status}<br>
        <strong>Descrição:</strong> ${event.extendedProps.description || 'Sem descrição'}
    `;
    
    const startDate = new Date(event.start);
    modalDate.textContent = `Data: ${startDate.toLocaleDateString('pt-BR')} às ${startDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
    selectedEvent = null;
}

function deleteSelectedEvent() {
    if (selectedEvent) {
        deleteEvent(selectedEvent.id);
    }
}

// =========================================
// TEMA
// =========================================
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Atualizar calendário
    if (calendar) {
        calendar.render();
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// =========================================
// BACKUP E RESTORE
// =========================================
function exportBackup() {
    const backup = {
        events: events,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leotecnologia-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('📦 Backup exportado com sucesso!', 'success');
}

function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            if (backup.events && Array.isArray(backup.events)) {
                if (confirm(`Importar ${backup.events.length} agendamentos? Isso substituirá os atuais.`)) {
                    events = backup.events;
                    saveEvents();
                    calendar.refetchEvents();
                    updateDashboard();
                    showNotification('✅ Backup importado com sucesso!', 'success');
                }
            }
        } catch (error) {
            showNotification('❌ Erro ao importar backup!', 'error');
        }
    };
    reader.readAsText(file);
}

// =========================================
// HORÁRIOS AGENDADOS
// =========================================
function updateBookedTimes() {
    const today = new Date().toISOString().split('T')[0];
    
    // Resetar todos os horários
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('booked');
        slot.disabled = false;
        slot.title = '';
    });
    
    // Marcar horários ocupados
    events.forEach(event => {
        if (event.start && event.start.startsWith(today)) {
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

// =========================================
// NOTIFICAÇÕES
// =========================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos da notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1001',
        animation: 'slideIn 0.3s ease',
        maxWidth: '300px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    });
    
    // Cores por tipo
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// =========================================
// ATALHOS DE TECLADO
// =========================================
function handleKeyboard(e) {
    // Ctrl/Cmd + N: Novo agendamento
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('clientName').focus();
    }
    
    // Esc: Fechar modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + E: Exportar backup
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportBackup();
    }
}

// =========================================
// INICIALIZAÇÃO DE CAMPOS
// =========================================
function initializeFormDefaults() {
    // Definir data/hora mínima para agora
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15); // Adicionar 15 minutos
    const minDateTime = now.toISOString().slice(0, 16);
    document.getElementById('start').min = minDateTime;
    
    // Definir valor padrão para próximo horário disponível
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    document.getElementById('start').value = nextHour.toISOString().slice(0, 16);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeFormDefaults);

// =========================================
// ANIMAÇÕES CSS
// =========================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .notification {
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);
