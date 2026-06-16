/* =========================================================
   AGENDA INTELIGENTE – JavaScript Completo (Mobile-First)
   ========================================================= */

/* ---------------------------------------------------------
   VARIÁVEIS GLOBAIS
   --------------------------------------------------------- */
let calendar;          // instância FullCalendar
let selectedEvent = null; // evento selecionado no modal

/* ---------------------------------------------------------
   INICIALIZAÇÃO
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  loadCurrentTime();
  setInterval(loadCurrentTime, 60_000); // atualiza relógio a cada minuto
  updateDashboard();
  applyStoredTheme();
});

/* ---------------------------------------------------------
   FULLCALENDAR
   --------------------------------------------------------- */
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 768 ? 'listWeek' : 'timeGridWeek',
    locale: 'pt-br',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: window.innerWidth < 768 ? '' : 'dayGridMonth,timeGridWeek'
    },
    slotMinTime: '08:00',
    slotMaxTime: '18:00',
    events: fetchEvents,
    eventClick: handleEventClick,
    datesSet: updateDashboard
  });
  calendar.render();
}

function fetchEvents(info, successCallback) {
  const events = JSON.parse(localStorage.getItem('events')) || [];
  successCallback(events);
}

/* ---------------------------------------------------------
   CRUD DE EVENTOS
   --------------------------------------------------------- */
function addEvent() {
  const form = {
    title: getValue('clientName'),
    start: getValue('start'),
    description: getValue('description'),
    serviceType: getValue('serviceType'),
    status: getValue('statusService'),
    phone: getValue('clientPhone')
  };

  if (!form.title || !form.start) {
    alert('Preencha nome e horário');
    return;
  }

  const events = JSON.parse(localStorage.getItem('events')) || [];
  if (events.find(e => e.start === form.start)) {
    alert('Horário já ocupado');
    return;
  }

  events.push({
    id: Date.now(),
    ...form,
    color: {
      Agendado: '#ffc107',
      'Em andamento': '#007bff',
      Finalizado: '#28a745',
      Cancelado: '#dc3545'
    }[form.status]
  });

  localStorage.setItem('events', JSON.stringify(events));
  calendar.refetchEvents();
  updateDashboard();
  showToast('✅ Agendamento salvo');
  resetForm();
}

function deleteSelectedEvent() {
  if (!selectedEvent || !confirm('Confirma exclusão?')) return;

  const events = JSON.parse(localStorage.getItem('events')) || [];
  const filtered = events.filter(e => e.id !== selectedEvent.id);
  localStorage.setItem('events', JSON.stringify(filtered));

  calendar.refetchEvents();
  updateDashboard();
  closeModal();
  showToast('🗑️ Excluído');
}

/* ---------------------------------------------------------
   UTILITÁRIOS DE FORMULÁRIO
   --------------------------------------------------------- */
function resetForm() {
  document.querySelector('form').reset();
  loadCurrentTime();
}

function loadCurrentTime() {
  const now = new Date();
  const date = now.toISOString().slice(0, 16);
  setValue('start', date);
  updateBookedTimes();
}

function selectTime(time) {
  const date = getValue('start')?.split('T')[0] || new Date().toISOString().split('T')[0];
  setValue('start', `${date}T${time}`);
  updateBookedTimes();
}

function updateBookedTimes() {
  const date = getValue('start')?.split('T')[0] || new Date().toISOString().split('T')[0];
  const events = JSON.parse(localStorage.getItem('events')) || [];
  document.querySelectorAll('.time-slot').forEach(slot => {
    const time = slot.dataset.time;
    const isBooked = events.some(e => e.start === `${date}T${time}`);
    slot.classList.toggle('booked', isBooked);
    slot.disabled = isBooked;
  });
}

/* ---------------------------------------------------------
   DASHBOARD
   --------------------------------------------------------- */
function updateDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const events = JSON.parse(localStorage.getItem('events')) || [];
  const todayEvents = events.filter(e => e.start?.startsWith(today));
  const freeSlots = Math.max(0, 9 - todayEvents.length);
  const uniqueClients = [...new Set(events.map(e => e.title))];

  setText('todayCount', todayEvents.length);
  setText('freeCount', freeSlots);
  setText('clientCount', uniqueClients.length);
}

/* ---------------------------------------------------------
   MODAL
   --------------------------------------------------------- */
function openModal(event) {
  selectedEvent = event;
  setText('modalTitle', event.title);
  setText('modalDescription', event.extendedProps.description || '');
  setText('modalDate', new Date(event.start).toLocaleString('pt-BR'));
  showModal();
}

function showModal() {
  document.getElementById('eventModal').style.display = 'block';
}
function closeModal() {
  document.getElementById('eventModal').style.display = 'none';
  selectedEvent = null;
}

/* ---------------------------------------------------------
   TEMA
   --------------------------------------------------------- */
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
function applyStoredTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

/* ---------------------------------------------------------
   BACKUP & RESTAURAÇÃO
   --------------------------------------------------------- */
function exportBackup() {
  const events = JSON.parse(localStorage.getItem('events')) || [];
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `backup-agenda-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

/* ---------------------------------------------------------
   BUSCA
   --------------------------------------------------------- */
function searchEvents() {
  const term = getValue('searchClient').toLowerCase();
  if (!term) return;
  const events = JSON.parse(localStorage.getItem('events')) || [];
  const found = events.find(e =>
    e.title.toLowerCase().includes(term) ||
    e.description.toLowerCase().includes(term)
  );
  if (found) calendar.gotoDate(found.start);
}

/* ---------------------------------------------------------
   HELPERS RÁPIDOS
   --------------------------------------------------------- */
const getValue = id => document.getElementById(id).value.trim();
const setValue = (id, val) => document.getElementById(id).value = val;
const setText = (id, val) => document.getElementById(id).textContent = val;
