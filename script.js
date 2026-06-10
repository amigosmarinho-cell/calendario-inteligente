// =========================================
// VARIÁVEIS GLOBAIS
// =========================================
let calendar;
let selectedEvent = null;
let events = JSON.parse(localStorage.getItem('events')) || [];
let touchStartX = 0;
let touchStartY = 0;

// =========================================
// CONFIGURAÇÃO MOBILE
// =========================================
const isMobile = window.innerWidth <= 768;

// =========================================
// INICIALIZAÇÃO OTIMIZADA
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    updateDashboard();
    updateBookedTimes();
    loadTheme();
    setupMobileGestures();
    setupTouchEvents();
    
    // Configurações mobile
    if (isMobile) {
        optimizeForMobile();
    }
    
    // Atualizar garantias automaticamente
    checkAndUpdateGarantias();
    
    // Atualizar dashboard a cada minuto
    setInterval(updateDashboard, 60000);
    
    // Verificar garantias diariamente
    setInterval(checkAndUpdateGarantias, 24 * 60 * 60 * 1000);
});

// =========================================
// CALENDÁRIO OTIMIZADO PARA MOBILE
// =========================================
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    const calendarConfig = {
        initialView: isMobile ? 'dayGridWeek' : 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: isMobile ? 
            { left: 'prev,next', center: 'title', right: 'today' } :
            { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
        },
        events: events,
        eventColor: '#2563eb',
        eventClick: function(info) {
            if (isMobile) {
                showMobileEventModal(info.event);
            } else {
                showEventModal(info.event);
            }
        },
        dateClick: function(info) {
            selectDate(info.date);
            if (isMobile) {
                scrollToForm();
            }
        },
        dayMaxEvents: isMobile ? 2 : true,
        navLinks: !isMobile,
        selectable: !isMobile,
        selectMirror: !isMobile,
        height: isMobile ? 'auto' : 'auto',
        contentHeight: isMobile ? 350 : 500,
        handleWindowResize: true,
        windowResizeDelay: 100,
        eventDisplay: 'block',
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        }
    };
    
    calendar = new FullCalendar.Calendar(calendarEl, calendarConfig);
    calendar.render();
    
    // Ajustar após renderização
    setTimeout(() => {
        calendar.updateSize();
    }, 100);
}

// =========================================
// GESTOS TOUCH MOBILE
// =========================================
function setupMobileGestures() {
    if (!isMobile) return;
    
    // Swipe para navegação
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', e => {
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

function setupTouchEvents() {
    // Prevenir zoom em inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('touchstart', e => {
            e.stopPropagation();
        });
    });
    
    // Touch feedback nos botões
    const buttons = document.querySelectorAll('button, .time-slot');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

// =========================================
// OTIMIZAÇÃO MOBILE
// =========================================
function optimizeForMobile() {
    // Ajustar tamanhos
    document.querySelectorAll('.times-grid').forEach(grid => {
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    });
    
    // Modal mobile otimizado
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.querySelector('.modal-content').style.width = '95%';
        modal.querySelector('.modal-content').style.margin = '10% auto';
    }
    
    // Formulário mobile
    const formGrid = document.querySelector('.form-grid');
    if (formGrid) {
        formGrid.style.gridTemplateColumns = '1fr';
    }
    
    // Dashboard mobile
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
        dashboard.style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
}

function scrollToForm() {
    document.querySelector('.event-form').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// =========================================
// CONTROLE AUTOMÁTICO DE GARANTIAS
// =========================================
function checkAndUpdateGarantias() {
    const today = new Date();
    
    events.forEach(event => {
        if (event.status === 'Finalizado') {
            const finalizationDate = new Date(event.finalizationDate || event.start);
            const garantiaEndDate = new Date(finalizationDate);
            garantiaEndDate.setDate(garantiaEndDate.getDate() + 30);
            
            // Atualizar status da garantia
            if (today > garantiaEndDate) {
                event.garantiaStatus = 'Expirada';
            } else {
                event.garantiaStatus = 'Ativa';
                event.garantiaDaysLeft = Math.ceil((garantiaEndDate - today) / (1000 * 60 * 60 * 24));
            }
        }
    });
    
    saveEvents();
    updateGarantiasDisplay();
}

function updateGarantiasDisplay() {
    const garantiaList = document.getElementById('garantiaList');
    if (!garantiaList) return;
    
    const activeGarantias = events.filter(event => 
        event.status === 'Finalizado' && 
        event.garantiaStatus !== 'Expirada'
    );
    
    if (activeGarantias.length === 0) {
        garantiaList.innerHTML = `
            <div class="garantia-item">
                <div>
                    <strong>✅ Nenhuma garantia ativa</strong>
                    <br>
                    <small>Os serviços finalizados aparecerão aqui</small>
                </div>
                <div class="garantia-badge green">OK</div>
            </div>
        `;
        return;
    }
    
    garantiaList.innerHTML = activeGarantias.map(event => {
        const daysLeft = event.garantiaDaysLeft || 0;
        const badgeClass = daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'yellow' : 'green';
        const badgeText = daysLeft <= 0 ? 'Vence hoje' : `${daysLeft} dias`;
        
        return `
            <div class="garantia-item">
                <div>
                    <strong>${event.clientName}</strong>
                    <br>
                    <small>${event.serviceType} - ${badgeText}</small>
                </div>
                <div class="garantia-badge ${badgeClass}">${badgeText}</div>
            </div>
        `;
    }).join('');
}

// =========================================
// FINALIZAÇÃO COM GARANTIA
// =========================================
function finalizarServico(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (confirm(`Finalizar serviço para ${event.clientName}? Isso iniciará a garantia de 30 dias.`)) {
        event.status = 'Finalizado';
        event.finalizationDate = new Date().toISOString();
        event.garantiaStatus = 'Ativa';
        event.garantiaDaysLeft = 30;
        
        // Atualizar cor no calendário
        calendar.getEventById(eventId).setProp('color', '#10b981');
        
        saveEvents();
        updateDashboard();
        updateGarantiasDisplay();
        
        showNotification(`✅ Serviço finalizado! Garantia de 30 dias iniciada.`, 'success');
        
        // Enviar notificação mobile se permitido
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Serviço Finalizado', {
                body: `${event.serviceType} para ${event.clientName} finalizado com garantia!`,
                icon: '/favicon.ico'
            });
        }
    }
}

// =========================================
// MODAL MOBILE OTIMIZADO
// =========================================
function showMobileEventModal(event) {
    const modal = document.getElementById('eventModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Layout mobile compacto
    modalContent.innerHTML = `
        <button class="close-modal" onclick="closeModal()" style="font-size: 24px;">&times;</button>
        <h3 style="margin-bottom: 15px; font-size: 1.2rem;">${event.title}</h3>
        
        <div style="font-size: 0.9rem; line-height: 1.5;">
            <p><strong>👤 Cliente:</strong> ${event.extendedProps.clientName}</p>
            <p><strong>📞 Tel:</strong> <a href="tel:${event.extendedProps.clientPhone}" style="color: var(--primary);">${event.extendedProps.clientPhone}</a></p>
            <p><strong>🛠️ Serviço:</strong> ${event.extendedProps.serviceType}</p>
            <p><strong>📅 Data:</strong> ${new Date(event.start).toLocaleDateString('pt-BR')}</p>
            <p><strong>⏰ Horário:</strong> ${new Date(event.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
            <p><strong>📝 Descrição:</strong> ${event.extendedProps.description || 'Sem descrição'}</p>
            
            ${event.status === 'Finalizado' ? `
                <p><strong>✅ Finalizado em:</strong> ${new Date(event.finalizationDate).toLocaleDateString('pt-BR')}</p>
                <p><strong>🛡️ Garantia:</strong> ${event.garantiaDaysLeft || 0} dias restantes</p>
            ` : ''}
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            ${event.status !== 'Finalizado' ? `
                <button onclick="finalizarServico('${event.id}')" style="flex: 1; background: var(--success); color: white; padding: 12px; border: none; border-radius: 8px; font-weight: 600;">
                    ✅ Finalizar
                </button>
            ` : ''}
            <button onclick="deleteEvent('${event.id}')" style="flex: 1; background: var(--error); color: white; padding: 12px; border: none; border-radius: 8px; font-weight: 600;">
                🗑️ Excluir
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

// =========================================
// EVENTOS OTIMIZADOS
// =========================================
function addEvent() {
    // Validação mobile otimizada
    const serviceType = document.getElementById('serviceType').value;
    const statusService = document.getElementById('statusService').value;
    const clientName = document.getElementById('clientName').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const description = document.getElementById('description').value.trim();
    const start = document.getElementById('start').value;
    
    // Validação mobile-friendly
    if (!serviceType || !clientName || !clientPhone || !start) {
        showNotification('⚠️ Preencha todos os campos!', 'error');
        if (isMobile) scrollToForm();
        return false;
    }
    
    // Validação de telefone mobile
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        showNotification('📞 WhatsApp inválido!', 'error');
        return false;
    }
    
    // Resto da validação permanece igual...
    // [código de validação de conflitos...]
    
    const event = {
        id: Date.now().toString(),
        title: `${serviceType} - ${clientName}`,
        clientName,
        clientPhone: formatPhone(clientPhone),
        serviceType,
        status: statusService,
        description,
        start: start,
        end: new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
        color: getColorByStatus(statusService),
        garantiaStatus: statusService === 'Finalizado' ? 'Ativa' : 'Não aplicável',
        garantiaDaysLeft: statusService === 'Finalizado' ? 30 : null
    };
    
    events.push(event);
    saveEvents();
    calendar.addEvent(event);
    updateDashboard();
    updateBookedTimes();
    updateGarantiasDisplay();
    clearForm();
    
    showNotification('✅ Agendado com sucesso!', 'success');
    
    if (isMobile) {
        // Scroll para o calendário
        document.getElementById('calendar').scrollIntoView({ behavior: 'smooth' });
    }
    
    return true;
}

// =========================================
// FORMATADOR DE TELEFONE MOBILE
// =========================================
function formatPhone(phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
        return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
    }
    return `(${clean.slice(0,2)}) ${clean.slice(2,6)}-${clean.slice(6)}`;
}

// =========================================
// NOTIFICAÇÕES MOBILE
// =========================================
function showNotification(message, type = 'info') {
    // Criar elemento de notificação mobile-friendly
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: ${isMobile ? '10px' : '20px'};
        right: ${isMobile ? '10px' : '20px'};
        left: ${isMobile ? '10px' : 'auto'};
        padding: ${isMobile ? '12px 16px' : '15px 25px'};
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        font-size: ${isMobile ? '0.9rem' : '1rem'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, isMobile ? 2000 : 3000);
}

// =========================================
// ORIENTAÇÃO MOBILE
// =========================================
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        if (calendar) {
            calendar.updateSize();
        }
    }, 100);
});

// =========================================
// MELHORIAS DE PERFORMANCE MOBILE
// =========================================
// Debounce para funções pesadas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Usar debounce para busca
const debouncedSearch = debounce(searchEvents, 300);
document.getElementById('searchClient')?.addEventListener('input', debouncedSearch);

// =========================================
// PERMISSÃO DE NOTIFICAÇÃO
// =========================================
if ('Notification' in window && isMobile) {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Notificações permitidas');
        }
    });
}
