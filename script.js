// =========================================
// CONFIGURAÇÃO DE CORES MODERNAS
// =========================================
const MODERN_COLORS = {
    primary: '#6366f1',        // Índigo vibrante
    primaryDark: '#4f46e5',
    secondary: '#8b5cf6',      // Roxo moderno
    success: '#10b981',        // Verde menta
    warning: '#f59e0b',        // Laranja quente
    error: '#ef4444',          // Vermelho vivo
    info: '#06b6d4',           // Ciano brilhante
    
    // Gradientes modernos
    gradient: {
        primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        success: 'linear-gradient(135deg, #10b981, #34d399)',
        warning: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        error: 'linear-gradient(135deg, #ef4444, #f87171)'
    }
};

// =========================================
// VARIÁVEIS GLOBAIS
// =========================================
let calendar;
let selectedEvent = null;
let events = JSON.parse(localStorage.getItem('events')) || [];
let touchStartX = 0;
let touchStartY = 0;

// =========================================
// INICIALIZAÇÃO MOBILE
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    updateDashboard();
    updateBookedTimes();
    setupMobileGestures();
    setupTouchEvents();
    setupMobileOptimizations();
    checkAndUpdateGarantias();
    
    // Atualizações automáticas
    setInterval(updateDashboard, 60000);
    setInterval(checkAndUpdateGarantias, 24 * 60 * 60 * 1000);
    
    // Configurar notificações mobile
    setupPushNotifications();
});

// =========================================
// CALENDÁRIO MOBILE COM CORES VIBRANTES
// =========================================
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    const calendarConfig = {
        initialView: window.innerWidth <= 768 ? 'dayGridWeek' : 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: window.innerWidth <= 768 ? 
            { left: 'prev,next', center: 'title', right: 'today' } :
            { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
        },
        events: events.map(event => ({
            ...event,
            backgroundColor: getEventColor(event.status),
            borderColor: getEventColor(event.status),
            textColor: '#ffffff',
            className: 'modern-event'
        })),
        eventClick: function(info) {
            showMobileEventModal(info.event);
        },
        dateClick: function(info) {
            selectDate(info.date);
            if (window.innerWidth <= 768) {
                scrollToForm();
            }
        },
        dayMaxEvents: window.innerWidth <= 768 ? 2 : true,
        height: window.innerWidth <= 768 ? 'auto' : 500,
        contentHeight: window.innerWidth <= 768 ? 350 : 500,
        handleWindowResize: true,
        windowResizeDelay: 100,
        eventDisplay: 'block',
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        },
        dayHeaderFormat: window.innerWidth <= 768 ? 
            { weekday: 'short', day: 'numeric' } : 
            { weekday: 'long', day: 'numeric' }
    };
    
    calendar = new FullCalendar.Calendar(calendarEl, calendarConfig);
    calendar.render();
}

// =========================================
// CORES MODERNAS POR STATUS
// =========================================
function getEventColor(status) {
    const colors = {
        'Agendado': MODERN_COLORS.primary,
        'Em andamento': MODERN_COLORS.warning,
        'Finalizado': MODERN_COLORS.success,
        'Cancelado': MODERN_COLORS.error
    };
    return colors[status] || MODERN_COLORS.primary;
}

// =========================================
// GESTOS TOUCH MOBILE
// =========================================
function setupMobileGestures() {
    const calendarEl = document.getElementById('calendar');
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    calendarEl.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    calendarEl.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                calendar.next();
            } else {
                calendar.prev();
            }
        }
    }
}

// =========================================
// OTIMIZAÇÕES TOUCH
// =========================================
function setupTouchEvents() {
    // Prevenir zoom em inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('touchstart', e => {
            e.stopPropagation();
        });
        
        // Focus suave
        input.addEventListener('focus', () => {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    });
    
    // Touch feedback vibrante
    const buttons = document.querySelectorAll('button, .time-slot');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
            this.style.transition = 'transform 0.1s ease';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
            setTimeout(() => {
                this.style.transition = '';
            }, 100);
        });
    });
}

// =========================================
// OTIMIZAÇÕES MOBILE
// =========================================
function setupMobileOptimizations() {
    // Ajustar grid de horários
    if (window.innerWidth <= 768) {
        const timesGrid = document.querySelector('.times-grid');
        if (timesGrid) {
            timesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
    }
    
    // Configurar viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta
