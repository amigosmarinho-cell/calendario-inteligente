let calendar;
let selectedEvent = null;

const ownerPassword = "123456";

const servicePrices = {
    "Suporte Técnico": 80,
    "Instalação": 120,
    "Manutenção": 150,
    "Designer": 200
};

const totalSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
];

document.addEventListener("DOMContentLoaded", function () {

    const calendarEl =
        document.getElementById("calendar");

    calendar = new FullCalendar.Calendar(calendarEl, {

        initialView:
            window.innerWidth < 768
                ? "timeGridDay"
                : "timeGridWeek",

        locale: "pt-br",

        editable: true,
        selectable: true,

        allDaySlot: false,

        slotMinTime: "08:00:00",
        slotMaxTime: "22:00:00",

        height: 320,

        headerToolbar: {
            left: "prev,next",
            center: "title",
            right: "today"
        },

        events:
            JSON.parse(
                localStorage.getItem("eventos")
            ) || [],

        select: function (info) {

            document.getElementById("start").value =
                formatDate(info.start);

        },

        eventClick: function (info) {

            selectedEvent = info.event;

            document.getElementById("modalTitle").innerHTML =
                `<strong>Cliente:</strong><br>${info.event.title}`;

            document.getElementById("modalDescription").innerHTML =
                `<strong>Descrição:</strong><br>${info.event.extendedProps.description}`;

            document.getElementById("modalDate").innerHTML =
                `<strong>Data:</strong><br>${info.event.start.toLocaleString("pt-BR")}`;

            document.getElementById("eventModal").style.display =
                "flex";

        }

    });

    calendar.render();

    updateOccupiedTimes();
    updateDashboard();
    blockPastTimes();

});

function formatDate(date) {

    return date.toISOString().slice(0, 16);

}

function selectTime(time) {

    const currentDate = new Date();

    const year =
        currentDate.getFullYear();

    const month =
        String(
            currentDate.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            currentDate.getDate()
        ).padStart(2, "0");

    document.getElementById("start").value =
        `${year}-${month}-${day}T${time}`;

}

function isTimeOccupied(start) {

    const selectedDate =
        new Date(start);

    const selectedDay =
        selectedDate.toISOString()
            .split("T")[0];

    const selectedHour =
        String(
            selectedDate.getHours()
        ).padStart(2, "0");

    return calendar.getEvents().some(event => {

        const eventDate =
            new Date(event.start);

        const eventDay =
            eventDate.toISOString()
                .split("T")[0];

        const eventHour =
            String(
                eventDate.getHours()
            ).padStart(2, "0");

        return (
            selectedDay === eventDay &&
            selectedHour === eventHour
        );

    });

}

function updateOccupiedTimes() {

    const buttons =
        document.querySelectorAll(".time-slot");

    buttons.forEach(btn => {

        btn.classList.remove("occupied");

        btn.disabled = false;

        btn.innerHTML =
            btn.dataset.time;

    });

    const today =
        new Date();

    calendar.getEvents().forEach(event => {

        const eventDate =
            new Date(event.start);

        const sameDay =
            eventDate.toDateString() ===
            today.toDateString();

        if (sameDay) {

            const hour =
                String(
                    eventDate.getHours()
                ).padStart(2, "0") + ":00";

            buttons.forEach(btn => {

                if (
                    btn.dataset.time === hour
                ) {

                    btn.classList.add(
                        "occupied"
                    );

                    btn.disabled = true;

                    btn.innerHTML =
                        "🔴 Ocupado";

                }

            });

        }

    });

}

function addEvent() {

    const clientName =
        document.getElementById("clientName")
            .value.trim();

    const clientPhone =
        document.getElementById("clientPhone")
            .value.trim();

    const serviceType =
        document.getElementById("serviceType")
            .value;

    const status =
        document.getElementById("statusService")
            .value;

    const description =
        document.getElementById("description")
            .value.trim();

    const start =
        document.getElementById("start")
            .value;

    if (
        !clientName ||
        !clientPhone ||
        !serviceType ||
        !description ||
        !start
    ) {

        alert(
            "⚠️ Preencha todos os campos!"
        );

        return;

    }

    if (
        isTimeOccupied(start)
    ) {

        alert(
            "❌ Este horário já está ocupado!"
        );

        return;

    }

    let eventColor =
        "#ef4444";

    if (
        status === "Finalizado"
    ) {

        eventColor =
            "#22c55e";

    }

    if (
        status === "Em andamento"
    ) {

        eventColor =
            "#3b82f6";

    }

    if (
        status === "Cancelado"
    ) {

        eventColor =
            "#6b7280";

    }

    calendar.addEvent({

        title:
            `${serviceType} - ${clientName}`,

        start:
            start,

        description:
            description,

        status:
            status,

        color:
            eventColor

    });

    updateOccupiedTimes();

    saveEvents();

    updateDashboard();

    playNotification();

    const servicePrice =
        servicePrices[serviceType] || 0;

    sendWhatsAppToOwner(
        clientName,
        clientPhone,
        serviceType,
        description,
        start,
        status,
        servicePrice
    );

    alert(
        "✅ Agendamento salvo!"
    );

    clearForm();

}

function clearForm() {

    document.getElementById(
        "clientName"
    ).value = "";

    document.getElementById(
        "clientPhone"
    ).value = "";

    document.getElementById(
        "serviceType"
    ).value = "";

    document.getElementById(
        "statusService"
    ).value = "Agendado";

    document.getElementById(
        "description"
    ).value = "";

    document.getElementById(
        "start"
    ).value = "";

}
function saveEvents() {

    const events = [];

    calendar.getEvents().forEach(event => {

        events.push({

            title: event.title,

            start: event.start,

            description:
                event.extendedProps.description,

            status:
                event.extendedProps.status,

            color:
                event.backgroundColor

        });

    });

    localStorage.setItem(
        "eventos",
        JSON.stringify(events)
    );

}

function sendWhatsAppToOwner(
    clientName,
    clientPhone,
    serviceType,
    description,
    date,
    status,
    servicePrice
) {

    const ownerPhone =
        "5598999942905";

    const message = `📅 NOVO AGENDAMENTO

👤 Cliente:
${clientName}

📞 Telefone:
${clientPhone}

🛠️ Serviço:
${serviceType}

💰 Valor:
R$ ${servicePrice}

📌 Status:
${status}

📝 Descrição:
${description}

⏰ Data:
${new Date(date).toLocaleString("pt-BR")}
`;

    const url =
        `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

}

function closeModal() {

    document.getElementById(
        "eventModal"
    ).style.display = "none";

}

function deleteSelectedEvent() {

    if (!selectedEvent) return;

    const password =
        prompt(
            "🔒 Digite a senha do administrador:"
        );

    if (
        password !== ownerPassword
    ) {

        alert(
            "❌ Senha incorreta!"
        );

        return;

    }

    selectedEvent.remove();

    saveEvents();

    updateOccupiedTimes();

    updateDashboard();

    closeModal();

    alert(
        "🗑️ Agendamento removido!"
    );

}

function updateDashboard() {

    const today =
        new Date();

    const todayEvents =
        calendar.getEvents().filter(event => {

            const eventDate =
                new Date(event.start);

            return (
                eventDate.toDateString() ===
                today.toDateString()
            );

        });

    const totalToday =
        todayEvents.length;

    const occupiedSlots =
        todayEvents.map(event => {

            return (
                String(
                    new Date(event.start)
                        .getHours()
                ).padStart(2, "0") +
                ":00"
            );

        });

    const freeTimes =
        totalSlots.filter(
            slot =>
                !occupiedSlots.includes(slot)
        ).length;

    const uniqueClients =
        new Set(

            calendar.getEvents().map(event => {

                const parts =
                    event.title.split(" - ");

                return (
                    parts[1] ||
                    event.title
                );

            })

        );

    document.getElementById(
        "todayCount"
    ).innerText =
        totalToday;

    document.getElementById(
        "freeCount"
    ).innerText =
        freeTimes;

    document.getElementById(
        "clientCount"
    ).innerText =
        uniqueClients.size;

}

function searchEvents() {

    const search =
        document.getElementById(
            "searchClient"
        )
            .value
            .toLowerCase();

    calendar.getEvents().forEach(event => {

        const title =
            event.title.toLowerCase();

        if (
            title.includes(search)
        ) {

            event.setProp(
                "display",
                "auto"
            );

        } else {

            event.setProp(
                "display",
                "none"
            );

        }

    });

}

function toggleTheme() {

    document.body.classList.toggle(
        "light-theme"
    );

}

function exportBackup() {

    const data =
        localStorage.getItem(
            "eventos"
        );

    const blob =
        new Blob(
            [data],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "backup_agenda.json";

    a.click();

}

function playNotification() {

    const audio =
        new Audio(
            "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
        );

    audio.play();

}

function blockPastTimes() {

    const now =
        new Date();

    const buttons =
        document.querySelectorAll(
            ".time-slot"
        );

    buttons.forEach(btn => {

        const hour =
            parseInt(
                btn.dataset.time.split(":")[0]
            );

        if (
            hour <= now.getHours()
        ) {

            btn.disabled = true;

            btn.style.opacity =
                "0.5";

        }

    });

}

/* ==========================
   GARANTIA 90 DIAS
========================== */

function showWarranty() {

    if (!selectedEvent) {

        alert(
            "Nenhum serviço selecionado."
        );

        return;

    }

    const titulo =
        selectedEvent.title;

    const partes =
        titulo.split(" - ");

    const servico =
        partes[0];

    const cliente =
        partes[1] || titulo;

    const dataFinalizacao =
        new Date(
            selectedEvent.start
        );

    const validade =
        new Date(
            dataFinalizacao
        );

    validade.setDate(
        validade.getDate() + 90
    );

    document.getElementById(
        "garantiaCliente"
    ).innerText =
        cliente;

    document.getElementById(
        "garantiaServico"
    ).innerText =
        servico;

    document.getElementById(
        "garantiaData"
    ).innerText =
        dataFinalizacao.toLocaleDateString(
            "pt-BR"
        );

    document.getElementById(
        "garantiaValidade"
    ).innerText =
        validade.toLocaleDateString(
            "pt-BR"
        );

    document.getElementById(
        "warrantyModal"
    ).style.display =
        "flex";

}

function closeWarranty() {

    document.getElementById(
        "warrantyModal"
    ).style.display =
        "none";

}

function printWarranty() {

    const conteudo =
        document.getElementById(
            "warrantyContent"
        ).innerHTML;

    const janela =
        window.open(
            "",
            "",
            "width=900,height=700"
        );

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

/* ==========================
   FECHAR MODAIS
========================== */

window.onclick = function (
    event
) {

    const modal1 =
        document.getElementById(
            "eventModal"
        );

    const modal2 =
        document.getElementById(
            "warrantyModal"
        );

    if (
        event.target === modal1
    ) {

        closeModal();

    }

    if (
        event.target === modal2
    ) {

        closeWarranty();

    }

};
