/* ==========================================================================
   1. VARIÁVEIS GERAIS E INICIALIZAÇÃO
   ========================================================================== */
let calendar;
const today = new Date().toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  loadGarantias();
  updateDashboard();
});

/* ==========================================================================
   2. CONFIGURAÇÃO DO FULLCALENDAR
   ========================================================================== */
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

/* ==========================================================================
   3. PERSISTÊNCIA E MANIPULAÇÃO DE EVENTOS
   ========================================================================== */
// Carrega os eventos salvos no LocalStorage
function loadEvents() {
  return JSON.parse(localStorage.getItem('events')) || [];
}

// Verifica se um horário específico já possui agendamento
function isSlotBooked(date, time) {
  const events = loadEvents();
  return events.some(e => e.start === `${date}T${time}:00`);
}

// Salva o evento e dispara as atualizações na tela e no WhatsApp
function saveEvent(e) {
  e.preventDefault();
  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;

  if (!time) {
    alert('Por favor, selecione um horário disponível!');
    return;
  }

  if (isSlotBooked(date, time)) {
    alert('Horário já ocupado! Escolha outro.');
    return;
  }

  const events = loadEvents();
  const newEvent = {
    id: Date.now().toString(),
    title: document.getElementById('clientName').value,
    start: `${date}T${time}:00`,
    extendedProps: {
      phone: document.getElementById('clientPhone').value,
      address: document.getElementById('clientAddress').value,
      vehicle: document.getElementById('clientVehicle').value,
      service: document.getElementById('serviceType').value,
      description: document.getElementById('serviceDescription').value
    }
  };

  events.push(newEvent);
  localStorage.setItem('events', JSON.stringify(events));
  calendar.addEvent(newEvent);

  sendWhatsApp(newEvent);
  closeEventForm();
  updateDashboard();
  showToast('Agendamento salvo com sucesso!');
}

/* ==========================================================================
   4. INTEGRAÇÃO COM WHATSAPP
   ========================================================================== */
function sendWhatsApp(event) {
  // Limpa caracteres especiais do telefone digitado
  let rawPhone = event.extendedProps.phone.replace(/\D/g, ''); 

  // Adiciona o código do Brasil se o usuário colocar só o DDD + número
  if (!rawPhone.startsWith('55') && rawPhone.length <= 11) {
    rawPhone = '55' + rawPhone;
  }

  const formattedDate = event.start.split('T')[0].split('-').reverse().join('/');
  const formattedTime = event.start.split('T')[1].substring(0, 5);

  const msg = `Olá ${event.title}! Confirmamos seu agendamento para *${event.extendedProps.service}* no dia *${formattedDate}* às *${formattedTime}*.\n\n*Descrição:* ${event.extendedProps.description || 'Não informada'}\n*Endereço:* ${event.extendedProps.address}`;

  const url = `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/* ==========================================================================
   5. DASHBOARD (PAINEL DE HOJE E GARANTIAS)
   ========================================================================== */
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
    const time = ev.start.split('T')[1].substring(0, 5);
    li.innerHTML = `
      <strong>${ev.title} - ${time}h</strong>
      <span>${ev.extendedProps.service}</span>
      <p>${ev.extendedProps.description || 'Sem descrição'}</p>
    `;
    listEl.appendChild(li);
  });
}

function loadGarantias() {
  const garantias = [
    { cliente: 'João Silva', servico: 'Limpeza de Computador', dias: 15 },
    { cliente: 'Maria Souza', servico: 'Remoção de Virus', dias: 5 }
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

/* ==========================================================================
   6. CONTROLE DO FORMULÁRIO E SLOTS DE HORÁRIO
   ========================================================================== */
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
  const date = document.getElementById('eventDate').value;
  const selectedTime = document.getElementById('eventTime').value;

  // Cria botões de horário comercial das 08h às 17h
  for (let h = 8; h < 18; h++) {
    const timeFormatted = `${h.toString().padStart(2, '0')}:00`;
    const booked = isSlotBooked(date, timeFormatted);

    const slot = document.createElement('div');
    let slotClass = 'time-slot';

    if (booked) {
      slotClass += ' booked';
    } else if (selectedTime === timeFormatted) {
      slotClass += ' selected';
    }

    slot.className = slotClass;
    slot.textContent = timeFormatted;

    if (!booked) {
      slot.onclick = () => {
        document.getElementById('eventTime').value = timeFormatted;
        generateTimeSlots(); // Recarrega para destacar o horário selecionado
      };
    }
    grid.appendChild(slot);
  }
}

/* ==========================================================================
   7. MODAL DE DETALHES E BUSCA
   ========================================================================== */
function showEventModal(event) {
  const modal = document.getElementById('eventModal');
  const content = document.getElementById('modalContent');
  const props = event.extendedProps;

  const formattedDate = event.startStr.split('T')[0].split('-').reverse().join('/');
  const formattedTime = event.startStr.split('T')[1] ? event.startStr.split('T')[1].substring(0, 5) : '—';

  content.innerHTML = `
    <p><strong>Cliente:</strong> ${event.title}</p>
    <p><strong>Data/Hora:</strong> ${formattedDate} às ${formattedTime}</p>
    <p><strong>Telefone:</strong> ${props.phone}</p>
    <p><strong>Endereço:</strong> ${props.address}</p>
    <p><strong>Equipamento:</strong> ${props.vehicle}</p>
    <p><strong>Serviço:</strong> ${props.service}</p>
    <p><strong>Descrição:</strong> ${props.description || '—'}</p>
  `;
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('eventModal').style.display = 'none';
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

/* ==========================================================================
   8. UTILITÁRIOS (SCROLL E MENSAGEM TOAST)
   ========================================================================== */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'success-message';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
