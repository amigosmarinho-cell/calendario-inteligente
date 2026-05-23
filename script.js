# Backend Java Completo — Agenda Inteligente PRO

```java
package com.agendainteligente;

import com.google.gson.Gson;
import spark.Spark;

import java.time.LocalDateTime;
import java.util.*;

public class AgendaInteligenteAPI {

    static List<Evento> eventos = new ArrayList<>();
    static Gson gson = new Gson();

    public static void main(String[] args) {

        Spark.port(8080);

        // LIBERAR CORS
        Spark.options("/*", (request, response) -> {

            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");

            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }

            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");

            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
            }

            return "OK";
        });

        Spark.before((request, response) -> {
            response.header("Access-Control-Allow-Origin", "*");
            response.type("application/json");
        });

        // ROTA TESTE
        Spark.get("/", (req, res) -> {
            return gson.toJson(Map.of(
                    "status", "online",
                    "sistema", "Agenda Inteligente PRO"
            ));
        });

        // LISTAR EVENTOS
        Spark.get("/eventos", (req, res) -> {
            return gson.toJson(eventos);
        });

        // CRIAR EVENTO
        Spark.post("/eventos", (req, res) -> {

            Evento evento = gson.fromJson(req.body(), Evento.class);

            // VALIDAÇÃO
            if (evento.nomeCliente == null || evento.nomeCliente.isEmpty()) {
                res.status(400);
                return gson.toJson(Map.of("erro", "Nome obrigatório"));
            }

            // VERIFICAR HORÁRIO DUPLICADO
            boolean ocupado = eventos.stream().anyMatch(e ->
                    e.dataHora.equals(evento.dataHora)
            );

            if (ocupado) {
                res.status(409);
                return gson.toJson(Map.of("erro", "Horário ocupado"));
            }

            evento.id = UUID.randomUUID().toString();
            evento.status = "Agendado";
            evento.criadoEm = LocalDateTime.now().toString();

            eventos.add(evento);

            return gson.toJson(Map.of(
                    "mensagem", "Agendamento criado",
                    "evento", evento
            ));
        });

        // BUSCAR EVENTO
        Spark.get("/eventos/:id", (req, res) -> {

            String id = req.params(":id");

            Optional<Evento> evento = eventos.stream()
                    .filter(e -> e.id.equals(id))
                    .findFirst();

            if (evento.isPresent()) {
                return gson.toJson(evento.get());
            }

            res.status(404);
            return gson.toJson(Map.of("erro", "Evento não encontrado"));
        });

        // DELETAR EVENTO
        Spark.delete("/eventos/:id", (req, res) -> {

            String id = req.params(":id");

            boolean removido = eventos.removeIf(e -> e.id.equals(id));

            if (removido) {
                return gson.toJson(Map.of(
                        "mensagem", "Evento deletado"
                ));
            }

            res.status(404);
            return gson.toJson(Map.of("erro", "Evento não encontrado"));
        });

        // ATUALIZAR STATUS
        Spark.put("/eventos/:id/status", (req, res) -> {

            String id = req.params(":id");

            Map body = gson.fromJson(req.body(), Map.class);

            String novoStatus = (String) body.get("status");

            for (Evento e : eventos) {

                if (e.id.equals(id)) {
                    e.status = novoStatus;

                    return gson.toJson(Map.of(
                            "mensagem", "Status atualizado",
                            "evento", e
                    ));
                }
            }

            res.status(404);
            return gson.toJson(Map.of("erro", "Evento não encontrado"));
        });

        // DASHBOARD
        Spark.get("/dashboard", (req, res) -> {

            long total = eventos.size();

            long finalizados = eventos.stream()
                    .filter(e -> "Finalizado".equals(e.status))
                    .count();

            long cancelados = eventos.stream()
                    .filter(e -> "Cancelado".equals(e.status))
                    .count();

            return gson.toJson(Map.of(
                    "totalAgendamentos", total,
                    "finalizados", finalizados,
                    "cancelados", cancelados
            ));
        });

        System.out.println("====================================");
        System.out.println(" Agenda Inteligente PRO ONLINE ");
        System.out.println(" http://localhost:8080 ");
        System.out.println("====================================");
    }

    // CLASSE EVENTO
    static class Evento {

        String id;

        String nomeCliente;

        String telefone;

        String servico;

        String descricao;

        String dataHora;

        String status;

        String criadoEm;
    }
}
```

---

# Dependências Maven (pom.xml)

```xml
<dependencies>

    <dependency>
        <groupId>com.sparkjava</groupId>
        <artifactId>spark-core</artifactId>
        <version>2.9.4</version>
    </dependency>

    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>

</dependencies>
```

---

# Estrutura do Projeto

```bash
agenda-inteligente-java/
│
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── agendainteligente/
│                   └── AgendaInteligenteAPI.java
│
├── pom.xml
```

---

# Como Executar

## Instalar:

* Java JDK 17+
* Maven

---

# Executar

```bash
mvn clean install
mvn exec:java
```

ou:

```bash
mvn spring-boot:run
```

---

# Testar API

## Listar eventos

```bash
GET http://localhost:8080/eventos
```

---

## Criar evento

```bash
POST http://localhost:8080/eventos
```

JSON:

```json
{
  "nomeCliente": "Leonardo",
  "telefone": "98999999999",
  "servico": "Suporte Técnico",
  "descricao": "Formatação",
  "dataHora": "2026-05-25T14:00"
}
```

---

# Melhorias Futuras

Você pode adicionar:

* Firebase
* Banco MySQL
* Login JWT
* WhatsApp API
* Dashboard React
* APK Android
* Painel Admin
* Multiempresa
* PDF automático
* Relatórios
* Integração Moodle

---

# Hospedagem Recomendada

Você pode publicar em:

* Render
* Railway
* VPS Linux
* Docker
* AWS
* Oracle Cloud
