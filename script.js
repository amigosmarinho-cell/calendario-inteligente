document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const eventModal = document.getElementById("eventModal");
  const closeModal = document.getElementById("closeModal");
  const btnAddEvent = document.getElementById("btnAddEvent");
  const btnClearForm = document.getElementById("btnClearForm");
  const btnFinalize = document.getElementById("btnFinalize");
  const showWarrantyBtn = document.getElementById("showWarrantyBtn");
  const toggleThemeBtn = document.getElementById("toggleThemeBtn");
  const warrantySection = document.getElementById("warrantySection");

  let selectedEvent = null;
  let eventsData = [];

  try {
    eventsData = JSON.parse(localStorage.getItem("agendaInteligenteEvents") || "[]");
  } catch (error) {
    eventsData = [];
  }

  function saveEvents() {
    localStorage.setItem("agendaInteligenteEvents", JSON.stringify(eventsData));
  }

  function updateCounters() {
    const total = eventsData.length;

    const today = new Date().toISOString().split("T")[0];

    const todayTotal = eventsData.filter(function (ev) {
      return ev.date === today;
    }).length;

    const completed = eventsData.filter(function (ev) {
      return ev.extendedProps && ev.extendedProps.statusService === "Concluído";
    }).length;

    document.getElementById("totalAppointments").textContent = total;
    document.getElementById("todayAppointments").textContent = todayTotal;
    document.getElementById("completedAppointments").textContent = completed;
  }

  function formatCurrency(value) {
    const number = parseFloat(value || 0);

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return "Não informada";

    const [y, m, d] = dateStr.split("-");

    if (!y || !m || !d) return "Não informada";

    return `${d}/${m}/${y}`;
  }

  function formatDateTimeParts(startStr) {
    if (!startStr) {
      return {
        date: "Não informada",
        time: "Não informada"
      };
    }

    if (startStr instanceof Date) {
      const date = startStr.toISOString().split("T")[0];
      const time = startStr.toTimeString().slice(0, 5);

      return {
        date: formatDateBR(date),
        time: time || "Não informada"
      };
    }

    const parts = String(startStr).split("T");

    return {
      date: formatDateBR(parts[0]),
      time: parts[1] ? parts[1].slice(0, 5) : "Não informada"
    };
  }

  function buildWhatsAppMessage(eventData) {
    const dt = formatDateTimeParts(eventData.startStr || eventData.start);
    const props = eventData.extendedProps || {};

    return `Olá, ${props.clientName || "cliente"}!

Seu agendamento foi registrado com sucesso.

Serviço: ${props.serviceType || "Não informado"}
Status: ${props.statusService || "Não informado"}
Descrição: ${props.description || "Não informada"}
Serviço realizado: ${props.serviceDone || "Não informado"}
Valor total: ${formatCurrency(props.serviceTotal || 0)}
Data: ${dt.date}
Hora: ${dt.time}

Agenda Inteligente`;
  }

  function openEventModal(event) {
    selectedEvent = event;

    const props = event.extendedProps || {};
    const dt = formatDateTimeParts(event.startStr || event.start);

    document.getElementById("modalClientName").textContent =
      `Cliente: ${props.clientName || "Não informado"}`;

    document.getElementById("modalClientPhone").textContent =
      `Telefone: ${props.clientPhone || "Não informado"}`;

    document.getElementById("modalServiceType").textContent =
      `Serviço: ${props.serviceType || "Não informado"}`;

    document.getElementById("modalStatusService").textContent =
      `Status: ${props.statusService || "Não informado"}`;

    document.getElementById("modalDescription").textContent =
      `Descrição: ${props.description || "Não informada"}`;

    document.getElementById("modalServiceDone").textContent =
      `Serviço realizado: ${props.serviceDone || "Não informado"}`;

    document.getElementById("modalServiceTotal").textContent =
      `Valor total: ${formatCurrency(props.serviceTotal || 0)}`;

    document.getElementById("modalDate").textContent =
      `Data: ${dt.date}`;

    document.getElementById("modalTime").textContent =
      `Hora: ${dt.time}`;

    eventModal.style.display = "flex";
  }

  function showWarranty(event) {
    warrantySection.style.display = "block";

    const props = event.extendedProps || {};
    const dt = formatDateTimeParts(event.startStr || event.start);

    document.getElementById("garantiaCliente").textContent =
      props.clientName || "Não informado";

    document.getElementById("garantiaServico").textContent =
      props.serviceType || "Não informado";

    document.getElementById("garantiaServicoFeito").textContent =
      props.serviceDone || "Não informado";

    document.getElementById("garantiaTotal").textContent =
      formatCurrency(props.serviceTotal || 0);

    document.getElementById("garantiaData").textContent =
      dt.date;

    document.getElementById("garantiaValidade").textContent =
      "90 dias após a execução";

    warrantySection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function clearForm() {
    document.getElementById("clientName").value = "";
    document.getElementById("clientPhone").value = "";
    document.getElementById("serviceType").value = "";
    document.getElementById("statusService").value = "Pendente";
    document.getElementById("eventDate").value = "";
    document.getElementById("eventTime").value = "";
    document.getElementById("description").value = "";
    document.getElementById("serviceDone").value = "";
    document.getElementById("serviceTotal").value = "";
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "pt-br",
    height: "auto",

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay"
    },

    buttonText: {
      today: "Hoje",
      month: "Mês",
      week: "Semana",
      day: "Dia"
    },

    events: eventsData.map(function (ev) {
      return {
        id: ev.id,
        title: ev.title,
        start: ev.start,
        extendedProps: ev.extendedProps
      };
    }),

    eventClick: function (info) {
      openEventModal(info.event);
    }
  });

  btnAddEvent.addEventListener("click", function () {
    const clientName = document.getElementById("clientName").value.trim();
    const clientPhone = document.getElementById("clientPhone").value.trim();
    const serviceType = document.getElementById("serviceType").value.trim();
    const statusService = document.getElementById("statusService").value;
    const eventDate = document.getElementById("eventDate").value;
    const eventTime = document.getElementById("eventTime").value;
    const description = document.getElementById("description").value.trim();
    const serviceDone = document.getElementById("serviceDone").value.trim();
    const serviceTotal = document.getElementById("serviceTotal").value.trim();

    if (!clientName || !serviceType || !eventDate || !eventTime) {
      alert("Preencha pelo menos nome, serviço, data e hora.");
      return;
    }

    const newEvent = {
      id: String(Date.now()),
      title: `${clientName} - ${serviceType}`,
      start: `${eventDate}T${eventTime}`,
      startStr: `${eventDate}T${eventTime}`,
      date: eventDate,
      extendedProps: {
        clientName,
        clientPhone,
        serviceType,
        statusService,
        description,
        serviceDone,
        serviceTotal
      }
    };

    eventsData.push(newEvent);
    saveEvents();

    calendar.addEvent({
      id: newEvent.id,
      title: newEvent.title,
      start: newEvent.start,
      extendedProps: newEvent.extendedProps
    });

    updateCounters();
    clearForm();

    alert("Agendamento adicionado com sucesso.");
  });

  btnClearForm.addEventListener("click", clearForm);

  closeModal.addEventListener("click", function () {
    eventModal.style.display = "none";
  });

  eventModal.addEventListener("click", function (e) {
    if (e.target === eventModal) {
      eventModal.style.display = "none";
    }
  });

  btnFinalize.addEventListener("click", function () {
    if (!selectedEvent) return;

    showWarranty(selectedEvent);
    eventModal.style.display = "none";
  });

  showWarrantyBtn.addEventListener("click", function () {
    if (selectedEvent) {
      showWarranty(selectedEvent);
    } else if (eventsData.length > 0) {
      showWarranty(eventsData[eventsData.length - 1]);
    } else {
      alert("Nenhum agendamento disponível para gerar termo de garantia.");
    }
  });

  toggleThemeBtn.addEventListener("click", function () {
    document.body.classList.toggle("light-theme");
  });

  calendar.render();
  updateCounters();
});
