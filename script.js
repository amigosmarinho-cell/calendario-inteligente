/* =========================================
   VARIÁVEIS GLOBAIS
========================================= */
let calendar;
const today = new Date().toISOString().split('T')[0];

/* =========================================
   INICIALIZAÇÃO
========================================= */
document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  loadGarantias();
  updateDashboard();
});

/* =========================================
   CALENDÁRIO
========================================= */
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    locale: 'pt-br',
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    events: loadEvents(),
    eventClick: (info) => showEventModal(info.event)
  });
  calendar.render();
}

/* =========================================
   EVENTOS (CRUD LOCAL)
========================================= */
function loadEvents() {
  return JSON.parse(localStorage.getItem('events')) || [];
}

function saveEvents(events) {
  localStorage.setItem('events', JSON.stringify(events));
}

/* =========================================
   BLOQUEIO DE HORÁRIO DUPLICADO
========================================= */
function isSlotBooked(date, time) {
  const events = loadEvents();
  return events.some(e => e.start === `${date}T${time}`);
}

/* =========================================
   SALVAR AGENDAMENTO + WHATSAPP
========================================= */
function saveEvent(e) {
  e.preventDefault();

  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;

  if (isSlotBooked(date, time)) {
    alert('Horário já ocupado! Escolha outro.');
    return;
  }

  const events = loadEvents();
  const newEvent = {
    id: Date.now(),
    title: document.getElementById('clientName').value,
    start: `${date}T${time}`,
    extendedProps: {
      phone: document.getElementById('clientPhone').value,
      address: document.getElementById('clientAddress').value,
      vehicle: document.getElementById('clientVehicle').value,
      service: document.getElementById('serviceType').value,
      description: document.getElementById('serviceDescription').value
    }
  };

  events.push(newEvent);
  saveEvents(events);
  calendar.addEvent(newEvent);

  sendWhatsApp(newEvent);
  closeEventForm();
  updateDashboard();
  showToast('Agendamento salvo!');
}

/* =========================================
   ENVIO DE WHATSAPP
========================================= */
function sendWhatsApp(event) {
  const tel = event.extendedProps.phone.replace(/\D/g, '');
  const msg = `Olá ${event.title}! Confirmamos seu agendamento para *${event.extendedProps.service}* no dia *${new Date(event.start).toLocaleDateString('pt-BR')}* às *${new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}*. Endereço: ${event.extendedProps.address}.`;
  const url = `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/* =========================================
   DASHBOARD – HOJE
========================================= */
function updateDashboard() {
  const events = loadEvents();
  const todayEvents = events.filter(e => e.start?.startsWith(today));
  const listEl = document.getElementById('todayEventsList');
  listEl.innerHTML = '';

  if (todayEvents.length === 0) {
    listEl.innerHTML = '<li style="color:#4d4d4d">Nenhum agendamento hoje.</li>';
    return;
  }

  todayEvents.forEach(ev => {
    const li = document.createElement('li');
    const time = new Date(ev.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    li.innerHTML = `
      <strong>${ev.title}</strong>
      <span>${time}</span>
      <p>${ev.extendedProps.description || 'Sem descrição'}</p>
    `;
    listEl.appendChild(li);
  });
}

/* =========================================
   GARANTIAS (MOCK)
========================================= */
function loadGarantias() {
  const garantias = [
    { cliente: 'João Silva', servico: 'Troca de Freio', dias: 25 },
    { cliente: 'Maria Souza', servico: 'Revisão', dias: 5 }
  ];
  const box = document.getElementById('garantiaList');
  box.innerHTML = '';
  garantias.forEach(g => {
    const div = document.createElement('div');
    div.className = 'garantia-item';
    const badgeClass = g.dias > 20 ? 'green' : g.dias > 10 ? 'warning' : 'danger';
    div.innerHTML = `
      <span>${g.cliente} – ${g.servico}</span>
      <span class="garantia-badge ${badgeClass}">${g.dias} dias</span>
    `;
    box.appendChild(div);
  });
}

/* =========================================
   FORMULÁRIO
========================================= */
function openEventForm(date = today, time = '09:00') {
  document.getElementById('eventFormSection').style.display = 'block';
  document.getElementById('eventDate').value = date;
  document.getElementById('eventTime').value = time;
  generateTimeSlots();
  scrollToSection('eventFormSection');
}

function closeEventForm() {
  document.getElementById('eventFormSection').style.display = 'none';
  document.getElementById('eventForm').reset();
}

function generateTimeSlots() {
  const grid = document.getElementById('timesGrid');
  grid.innerHTML = '';
  const events = loadEvents();
  const date = document.getElementById('eventDate').value;

  for (let h = 8; h < 18; h++) {
    const time = `${h.toString().padStart(2, '0')}:00`;
    const booked = events.some(e => e.start === `${date}T${time}:00`);
    const slot = document.createElement('div');
    slot.className = `time-slot ${booked ? 'booked' : ''}`;
    slot.textContent = time;
    if (!booked) {
      slot.onclick = () => document.getElementById('eventTime').value = `${time}:00`;
    }
    grid.appendChild(slot);
  }
}

/* =========================================
   MODAL
========================================= */
function showEventModal(event) {
  const modal = document.getElementById('eventModal');
  const content = document.getElementById('modalContent');
  const props = event.extendedProps;
  content.innerHTML = `
    <p><strong>Cliente:</strong> ${event.title}</p>
    <p><strong>Horário:</strong> ${new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    <p><strong>Telefone:</strong> ${props.phone}</p>
    <p><strong>Endereço:</strong> ${props.address}</p>
    <p><strong>Veículo:</strong> ${props.vehicle}</p>
    <p><strong>Serviço:</strong> ${props.service}</p>
    <p><strong>Descrição:</strong> ${props.description || '—'}</p>
  `;
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('eventModal').style.display = 'none';
}

/* =========================================
   UTILITÁRIOS
========================================= */
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function searchEvents(query) {
  calendar.removeAllEvents();
  const events = loadEvents();
  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.extendedProps.service.toLowerCase().includes(query.toLowerCase())
  );
  calendar.addEventSource(filtered);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'success-message';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
