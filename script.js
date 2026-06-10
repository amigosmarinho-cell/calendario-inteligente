/* =====================================
   LEOTECNOLOGIA
   SISTEMA DE ASSISTÊNCIA TÉCNICA
===================================== */

let calendar;
let selectedEvent = null;

/* =====================================
   BANCO LOCAL
===================================== */

let clients =
JSON.parse(localStorage.getItem("clients")) || [];

let services =
JSON.parse(localStorage.getItem("services")) || [];

let appointments =
JSON.parse(localStorage.getItem("appointments")) || [];

/* =====================================
   SENHA ADMIN
===================================== */

function showAdminLogin(){

document.getElementById("adminModal").style.display="flex";

}

function closeAdminModal(){

document.getElementById("adminModal").style.display="none";

}

function adminLogin(){

const password =
document.getElementById("adminPassword").value;

if(password === OWNER_PASSWORD){

document.getElementById("adminPanel")
.classList.remove("hidden");

alert("Acesso liberado!");

closeAdminModal();

}else{

alert("Senha incorreta!");

}

}

/* =====================================
   TEMA
===================================== */

function toggleTheme(){

document.body.classList.toggle("light-theme");

localStorage.setItem(
"theme",
document.body.classList.contains("light-theme")
);

}

function loadTheme(){

const theme =
localStorage.getItem("theme");

if(theme === "true"){

document.body.classList.add("light-theme");

}

}

/* =====================================
   GERAR OS
===================================== */

function generateOSNumber(){

const number =
Date.now().toString().slice(-6);

document.getElementById("osNumber").value =
`OS-${number}`;

}

/* =====================================
   CALENDÁRIO
===================================== */

document.addEventListener(
"DOMContentLoaded",
function(){

loadTheme();

generateOSNumber();

initializeCalendar();

loadAppointments();

updateDashboard();

}
);

function initializeCalendar(){

const calendarEl =
document.getElementById("calendar");

calendar =
new FullCalendar.Calendar(
calendarEl,
{

locale:"pt-br",

initialView:"dayGridMonth",

height:"auto",

headerToolbar:{
left:"prev,next today",
center:"title",
right:"dayGridMonth,timeGridWeek"
},

eventClick:function(info){

selectedEvent = info.event;

showEventModal(info.event);

}

}
);

calendar.render();

}

/* =====================================
   CARREGAR EVENTOS
===================================== */

function loadAppointments(){

appointments.forEach(event=>{

calendar.addEvent({

title:event.client,

start:event.date,

extendedProps:event

});

});

}

/* =====================================
   HORÁRIOS
===================================== */

function selectTime(time){

const input =
document.getElementById("serviceDate");

if(!input.value){

const today =
new Date();

const year =
today.getFullYear();

const month =
String(today.getMonth()+1)
.padStart(2,"0");

const day =
String(today.getDate())
.padStart(2,"0");

input.value =
`${year}-${month}-${day}T${time}`;

}else{

const datePart =
input.value.split("T")[0];

input.value =
`${datePart}T${time}`;

}

}

/* =====================================
   SALVAR AGENDAMENTO
===================================== */

function saveAppointment(){

const serviceDate =
document.getElementById("serviceDate").value;

const serviceType =
document.getElementById("serviceType").value;

const clientName =
document.getElementById("clientName").value;

const clientPhone =
document.getElementById("clientPhone").value;

if(
!serviceDate ||
!serviceType ||
!clientName
){

alert("Preencha os campos obrigatórios.");

return;

}

const appointment = {

id:Date.now(),

client:clientName,

phone:clientPhone,

service:serviceType,

date:serviceDate

};

appointments.push(appointment);

localStorage.setItem(
"appointments",
JSON.stringify(appointments)
);

calendar.addEvent({

title:clientName,

start:serviceDate,

extendedProps:appointment

});

saveClient();

updateDashboard();

alert("Agendamento realizado!");

}

/* =====================================
   SALVAR CLIENTE
===================================== */

function saveClient(){

const client = {

name:
document.getElementById("clientName").value,

phone:
document.getElementById("clientPhone").value,

address:
document.getElementById("clientAddress").value,

email:
document.getElementById("clientEmail").value

};

const exists =
clients.find(
c=>c.phone===client.phone
);

if(!exists){

clients.push(client);

localStorage.setItem(
"clients",
JSON.stringify(clients)
);

}

}

/* =====================================
   SALVAR ORDEM SERVIÇO
===================================== */

function saveOS(){

const os = {

id:Date.now(),

osNumber:
document.getElementById("osNumber").value,

client:
document.getElementById("clientName").value,

phone:
document.getElementById("clientPhone").value,

equipment:
document.getElementById("equipmentType").value,

brand:
document.getElementById("equipmentBrand").value,

model:
document.getElementById("equipmentModel").value,

status:
document.getElementById("serviceStatus").value,

problem:
document.getElementById("reportedProblem").value,

service:
document.getElementById("servicePerformed").value,

value:
document.getElementById("serviceValue").value,

obs:
document.getElementById("observations").value,

createdAt:
new Date().toLocaleDateString()

};

services.push(os);

localStorage.setItem(
"services",
JSON.stringify(services)
);

updateDashboard();

generateOSNumber();

alert("Ordem de serviço salva!");

}

/* =====================================
   DASHBOARD
===================================== */

function updateDashboard(){

document.getElementById("clientCount")
.innerText =
clients.length;

document.getElementById("serviceCount")
.innerText =
services.length;

const today =
new Date().toISOString().split("T")[0];

const todayAppointments =
appointments.filter(a=>
a.date.startsWith(today)
);

document.getElementById("todayCount")
.innerText =
todayAppointments.length;

let total = 0;

services.forEach(service=>{

total +=
parseFloat(service.value || 0);

});

document.getElementById("revenueMonth")
.innerText =
`R$ ${total.toFixed(2)}`;

}

/* =====================================
   MODAL
===================================== */

function showEventModal(event){

document.getElementById("eventModal")
.style.display="flex";

document.getElementById("modalBody")
.innerHTML = `

<p><strong>Cliente:</strong>
${event.title}</p>

<p><strong>Data:</strong>
${new Date(event.start)
.toLocaleString()}</p>

`;

}

function closeModal(){

document.getElementById("eventModal")
.style.display="none";

}

/* =====================================
   FECHAR MODAL AO CLICAR FORA
===================================== */

window.onclick = function(event){

const modal =
document.getElementById("eventModal");

const adminModal =
document.getElementById("adminModal");

if(event.target === modal){

closeModal();

}

if(event.target === adminModal){

closeAdminModal();

}

};
/* =====================================
   CONSULTA DE OS
===================================== */

function consultarOS(){

const telefone =
document.getElementById("consultaTelefone")
.value.trim();

const resultado =
document.getElementById("resultadoConsulta");

if(!telefone){

alert("Informe um telefone.");

return;

}

const registros =
services.filter(service =>
service.phone.includes(telefone)
);

if(registros.length === 0){

resultado.innerHTML = `
<div class="history-item">
Nenhum serviço encontrado.
</div>
`;

return;

}

resultado.innerHTML = "";

registros.forEach(item => {

resultado.innerHTML += `

<div class="history-item">

<h4>${item.osNumber}</h4>

<p>
<strong>Cliente:</strong>
${item.client}
</p>

<p>
<strong>Status:</strong>
${item.status}
</p>

<p>
<strong>Equipamento:</strong>
${item.equipment}
</p>

<p>
<strong>Valor:</strong>
R$ ${item.value}
</p>

</div>

`;

});

}

/* =====================================
   BUSCA CLIENTES
===================================== */

function searchClient(){

const search =
document.getElementById("searchClient")
.value.toLowerCase();

const history =
document.getElementById("serviceHistory");

if(!history) return;

history.innerHTML = "";

const filtered =
services.filter(service =>

(service.client || "")
.toLowerCase()
.includes(search)

||

(service.phone || "")
.toLowerCase()
.includes(search)

||

(service.osNumber || "")
.toLowerCase()
.includes(search)

);

filtered.forEach(renderHistoryItem);

}

/* =====================================
   HISTÓRICO
===================================== */

function loadHistory(){

const history =
document.getElementById("serviceHistory");

if(!history) return;

history.innerHTML = "";

if(services.length === 0){

history.innerHTML = `
<p class="empty-history">
Nenhum serviço registrado.
</p>
`;

return;

}

services.forEach(renderHistoryItem);

}

function renderHistoryItem(item){

const history =
document.getElementById("serviceHistory");

history.innerHTML += `

<div class="history-item">

<h4>${item.osNumber}</h4>

<p>
<strong>Cliente:</strong>
${item.client}
</p>

<p>
<strong>Status:</strong>
${item.status}
</p>

<p>
<strong>Valor:</strong>
R$ ${item.value}
</p>

</div>

`;

}

/* =====================================
   GARANTIA 90 DIAS
===================================== */

function generateWarranty(){

const cliente =
document.getElementById("clientName").value;

const servico =
document.getElementById("servicePerformed").value;

const valor =
document.getElementById("serviceValue").value;

const data =
new Date().toLocaleDateString();

const texto = `

GARANTIA DE 90 DIAS

Cliente: ${cliente}

Data: ${data}

Serviço Executado:

${servico}

Valor Cobrado:

R$ ${valor}

A LeoTecnologia oferece garantia de 90 dias
sobre o serviço executado.

A garantia não cobre:

- Mau uso
- Quedas
- Líquidos
- Oxidação
- Intervenção de terceiros
- Danos elétricos

`;

document.getElementById("warrantyText")
.value = texto;

alert("Garantia gerada!");

}

/* =====================================
   IMPRESSÃO
===================================== */

function printWarranty(){

const content =
document.getElementById("warrantyText")
.value;

const win =
window.open("", "_blank");

win.document.write(`
<html>
<head>
<title>Garantia</title>
<style>
body{
font-family:Arial;
padding:30px;
line-height:1.8;
}
</style>
</head>
<body>
<pre>${content}</pre>
</body>
</html>
`);

win.document.close();

win.print();

}

/* =====================================
   FINANCEIRO
===================================== */

function updateFinancial(){

let recebido = 0;

services.forEach(service => {

recebido +=
parseFloat(service.value || 0);

});

const pendente =
services.filter(
s =>
s.status !== "Entregue"
)
.reduce((acc,s)=>
acc + parseFloat(s.value || 0),
0);

document.getElementById("totalRecebido")
.innerText =
`R$ ${recebido.toFixed(2)}`;

document.getElementById("totalPendente")
.innerText =
`R$ ${pendente.toFixed(2)}`;

document.getElementById("totalMes")
.innerText =
`R$ ${recebido.toFixed(2)}`;

}

/* =====================================
   WHATSAPP
===================================== */

function sendWhatsAppUpdate(){

if(!selectedEvent){

alert("Selecione um evento.");

return;

}

const phone =
selectedEvent.extendedProps.phone || "";

const text = encodeURIComponent(

`Olá!

Seu atendimento foi atualizado.

Cliente: ${selectedEvent.title}

LeoTecnologia`

);

window.open(
`https://wa.me/55${phone}?text=${text}`,
"_blank"
);

}

/* =====================================
   BACKUP JSON
===================================== */

function exportBackup(){

const backup = {

clients,
services,
appointments

};

const data =
JSON.stringify(
backup,
null,
2
);

const blob =
new Blob(
[data],
{
type:"application/json"
}
);

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href = url;

a.download =
`backup-leotecnologia-${Date.now()}.json`;

a.click();

URL.revokeObjectURL(url);

}

/* =====================================
   IMPORTAÇÃO
===================================== */

function importBackup(){

document
.getElementById("importFile")
.click();

}

document
.getElementById("importFile")
.addEventListener(
"change",
function(event){

const file =
event.target.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload =
function(e){

try{

const data =
JSON.parse(e.target.result);

clients =
data.clients || [];

services =
data.services || [];

appointments =
data.appointments || [];

localStorage.setItem(
"clients",
JSON.stringify(clients)
);

localStorage.setItem(
"services",
JSON.stringify(services)
);

localStorage.setItem(
"appointments",
JSON.stringify(appointments)
);

location.reload();

}catch(error){

alert("Arquivo inválido.");

}

};

reader.readAsText(file);

}
);

/* =====================================
   RELATÓRIO
===================================== */

function generateReport(){

const totalClientes =
clients.length;

const totalOS =
services.length;

let faturamento = 0;

services.forEach(service=>{

faturamento +=
parseFloat(service.value || 0);

});

alert(

`RELATÓRIO

Clientes:
${totalClientes}

Ordens:
${totalOS}

Faturamento:
R$ ${faturamento.toFixed(2)}`

);

}

/* =====================================
   EXCLUIR OS
===================================== */

function deleteSelectedOS(){

if(!selectedEvent){

alert("Nenhum registro selecionado.");

return;

}

const senha =
prompt(
"Digite a senha do administrador:"
);

if(senha !== OWNER_PASSWORD){

alert("Senha incorreta.");

return;

}

if(!confirm(
"Deseja realmente excluir?"
)){

return;

}

const eventId =
selectedEvent.extendedProps.id;

appointments =
appointments.filter(
a => a.id !== eventId
);

localStorage.setItem(
"appointments",
JSON.stringify(appointments)
);

selectedEvent.remove();

closeModal();

alert("Registro excluído.");

}

/* =====================================
   LIMPAR BANCO
===================================== */

function clearDatabase(){

const senha =
prompt(
"Digite a senha:"
);

if(senha !== OWNER_PASSWORD){

alert("Senha incorreta.");

return;

}

if(
!confirm(
"Apagar todos os dados?"
)
){

return;

}

localStorage.removeItem("clients");
localStorage.removeItem("services");
localStorage.removeItem("appointments");

location.reload();

}

/* =====================================
   INICIALIZAÇÃO FINAL
===================================== */

document.addEventListener(
"DOMContentLoaded",
function(){

loadHistory();

updateFinancial();

}
);
