let calendar;
let allEvents = JSON.parse(localStorage.getItem("leotecnologia_events") || "[]");
let filteredEvents = [...allEvents];
let selectedEvent = null;
let selectedTimeButton = null;
let selectedTime = "";
let canFinalize = false;

const ADMIN_CODE = "1234";

function saveEvents(){
  localStorage.setItem("leotecnologia_events", JSON.stringify(allEvents));
}

function toggleTheme(){
  document.body.classList.toggle("light-theme");
}

function selectTime(time, button){
  selectedTime = time;

  if(selectedTimeButton) selectedTimeButton.classList.remove("selected");
  selectedTimeButton = button;
  selectedTimeButton.classList.add("selected");

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  document.getElementById("start").value = `${yyyy}-${mm}-${dd}T${time}`;
}

function getStatusColor(status){
  switch(status){
    case "Em andamento": return "#3b82f6";
    case "Finalizado": return "#22c55e";
    case "Cancelado": return "#ef4444";
    default: return "#facc15";
  }
}

function addEvent(){
  const serviceType = document.getElementById("serviceType").value;
  const statusService = document.getElementById("statusService").value;
  const clientName = document.getElementById("clientName").value.trim();
  const clientPhone = document.getElementById("clientPhone").value.trim();
  const description = document.getElementById("description").value.trim();
  const start = document.getElementById("start").value;

  if(!serviceType || !clientName || !start){
    alert("Preencha o tipo de serviço, nome do cliente e data/hora.");
    return;
  }

  const duplicate = allEvents.some(ev => ev.start === start);
  if(duplicate){
    alert("Já existe um agendamento nesse horário.");
    return;
  }

  const color = getStatusColor(statusService);

  const event = {
    id: Date.now().toString(),
    title: `${serviceType} - ${clientName}`,
    start: start,
    backgroundColor: color,
    borderColor: color,
    extendedProps: {
      serviceType,
      statusService,
      clientName,
      clientPhone,
      description
    }
  };

  allEvents.push(event);
  saveEvents();
  applyFilters();
  updateDashboard();
  updateTimeSlots();
  clearForm();
  alert("Agendamento salvo com sucesso!");
}

function clearForm(){
  document.getElementById("serviceType").value = "";
  document.getElementById("statusService").value = "Agendado";
  document.getElementById("clientName").value = "";
  document.getElementById("clientPhone").value = "";
  document.getElementById("description").value = "";
  document.getElementById("start").value = "";

  if(selectedTimeButton){
    selectedTimeButton.classList.remove("selected");
    selectedTimeButton = null;
  }

  selectedTime = "";
}

function applyFilters(){
  const query = document.getElementById("searchClient").value.toLowerCase().trim();
  const statusFilter = document.getElementById("filterStatus").value;

  filteredEvents = allEvents.filter(ev => {
    const name = (ev.extendedProps.clientName || "").toLowerCase();
    const phone = (ev.extendedProps.clientPhone || "").toLowerCase();
    const title = (ev.title || "").toLowerCase();
    const status = ev.extendedProps.statusService || "";

    const matchQuery = !query || name.includes(query) || phone.includes(query) || title.includes(query);
    const matchStatus = !statusFilter || status === statusFilter;

    return matchQuery && matchStatus;
  });

  renderCalendarEvents();
  updateDashboard();
  updateTimeSlots();
}

function clearFilters(){
  document.getElementById("searchClient").value = "";
  document.getElementById("filterStatus").value = "";
  applyFilters();
}

function renderCalendarEvents(){
  calendar.removeAllEvents();
  filteredEvents.forEach(ev => calendar.addEvent(ev));
}

function updateDashboard(){
  const today = new Date();
  const todayStr = today.toISOString().split("T");

  const todayEvents = allEvents.filter(ev => ev.start.split("T") === todayStr);
  const clients = new Set(allEvents.map(ev => (ev.extendedProps.clientName || "").toLowerCase()));

  document.getElementById("todayCount").innerText = todayEvents.length;
  document.getElementById("clientCount").innerText = clients.size;
  document.getElementById("freeCount").innerText = Math.max(9 - todayEvents.length, 0);
}

function updateTimeSlots(){
  const todayStr = new Date().toISOString().split("T");

  document.querySelectorAll(".time-slot").forEach(btn => {
    const time = btn.dataset.time;
    const occupied = allEvents.some(ev => ev.start.startsWith(todayStr) && ev.start.includes(time));
    btn.classList.toggle("occupied", occupied);
    btn.disabled = occupied;
  });
}

function openEventModal(event){
  selectedEvent = event;
  canFinalize = false;

  document.getElementById("modalTitle").innerText =
    `Serviço: ${event.extendedProps.serviceType} | Cliente: ${event.extendedProps.clientName}`;

  document.getElementById("modalDescription").innerText =
    `Descrição: ${event.extendedProps.description || "Sem descrição"}`;

  document.getElementById("modalDate").innerText =
    `Data/Hora: ${new Date(event.start).toLocaleString("pt-BR")}`;

  document.getElementById("modalStatus").innerText =
    `Status: ${event.extendedProps.statusService || "Agendado"}`;

  document.getElementById("btnFinalize").style.display = "none";
  document.getElementById("eventModal").style.display = "flex";
}

function closeModal(){
  document.getElementById("eventModal").style.display = "none";
  selectedEvent = null;
  canFinalize = false;
  document.getElementById("btnFinalize").style.display = "none";
}

function unlockFinalize(){
  const code = prompt("Digite o código de autorização para finalizar:");

  if(code === ADMIN_CODE){
    canFinalize = true;
    document.getElementById("btnFinalize").style.display = "block";
    alert("Acesso liberado para finalizar serviços.");
  } else {
    alert("Código incorreto.");
  }
}

function markAsFinalizado(){
  if(!canFinalize){
    alert("Somente você pode finalizar este serviço.");
    return;
  }

  if(!selectedEvent){
    alert("Nenhum serviço selecionado.");
    return;
  }

  const eventIndex = allEvents.findIndex(ev => ev.id === selectedEvent.id);

  if(eventIndex === -1){
    alert("Evento não encontrado.");
    return;
  }

  allEvents[eventIndex].extendedProps.statusService = "Finalizado";
  allEvents[eventIndex].backgroundColor = getStatusColor("Finalizado");
  allEvents[eventIndex].borderColor = getStatusColor("Finalizado");

  saveEvents();
  applyFilters();
  closeModal();
  alert("Serviço marcado como finalizado com sucesso!");
}

function deleteSelectedEvent(){
  if(!selectedEvent){
    alert("Nenhum serviço selecionado.");
    return;
  }

  if(!confirm("Deseja excluir este agendamento?")) return;

  allEvents = allEvents.filter(ev => ev.id !== selectedEvent.id);
  saveEvents();
  closeModal();
  applyFilters();
  alert("Agendamento excluído com sucesso!");
}

function buildWhatsAppMessage(event){
  const name = event.extendedProps.clientName || "";
  const phone = event.extendedProps.clientPhone || "";
  const service = event.extendedProps.serviceType || "";
  const status = event.extendedProps.statusService || "";
  const date = new Date(event.start).toLocaleDateString("pt-BR");
  const hour = new Date(event.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const desc = event.extendedProps.description || "Sem observações";

  return `Olá, ${name}! 👋

Seu agendamento na LeoTecnologia foi registrado com sucesso.

🛠️ Serviço: ${service}
📌 Status: ${status}
📅 Data: ${date}
⏰ Horário: ${hour}
📞 Telefone: ${phone}
📝 Observação: ${desc}

Se precisar de mais informações, estamos à disposição.`;
}

function sendWhatsApp(){
  if(!selectedEvent){
    alert("Nenhum serviço selecionado.");
    return;
  }

  const phone = (selectedEvent.extendedProps.clientPhone || "").replace(/\D/g, "");
  if(!phone){
    alert("Informe o telefone do cliente para enviar no WhatsApp.");
    return;
  }

  const message = buildWhatsAppMessage(selectedEvent);
  const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function showWarranty(){
  if(!selectedEvent){
    alert("Nenhum serviço selecionado.");
    return;
  }

  const cliente = selectedEvent.extendedProps.clientName;
  const servico = selectedEvent.extendedProps.serviceType;
  const dataFinalizacao = new Date(selectedEvent.start);
  const validade = new Date(dataFinalizacao);
  validade.setDate(validade.getDate() + 90);

  document.getElementById("garantiaCliente").innerText = cliente;
  document.getElementById("garantiaServico").innerText = servico;
  document.getElementById("garantiaData").innerText = dataFinalizacao.toLocaleDateString("pt-BR");
  document.getElementById("garantiaValidade").innerText = validade.toLocaleDateString("pt-BR");
  document.getElementById("warrantyModal").style.display = "flex";
}

function closeWarranty(){
  document.getElementById("warrantyModal").style.display = "none";
}

function printWarranty(){
  const conteudo = document.getElementById("warrantyContent").innerHTML;
  const janela = window.open("", "", "width=900,height=700");

  janela.document.write(`
    <html>
    <head>
      <title>Garantia LeoTecnologia</title>
      <style>
        body{
          font-family:Arial;
          padding:30px;
          line-height:1.8;
        }
        h3{
          text-align:center;
        }
        ul{
          margin-left:25px;
        }
      </style>
    </head>
    <body>
      ${conteudo}
    </body>
    </html>
  `);

  janela.document.close();
  janela.print();
}

function exportBackup(){
  const data = JSON.stringify(allEvents, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "backup-agendamentos-leotecnologia.json";
  a.click();
  URL.revokeObjectURL(url);
}

window.onclick = function(event){
  const modal1 = document.getElementById("eventModal");
  const modal2 = document.getElementById("warrantyModal");

  if(event.target === modal1) closeModal();
  if(event.target === modal2) closeWarranty();
};

document.addEventListener("DOMContentLoaded", function(){
  const calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "pt-br",
    height: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: ""
    },
    events: filteredEvents,
    eventClick: function(info){
      openEventModal(info.event);
    },
    dateClick: function(info){
      const time = selectedTime || "08:00";
      document.getElementById("start").value = `${info.dateStr}T${time}`;
    }
  });

  calendar.render();
  applyFilters();
});

