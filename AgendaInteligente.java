import java.awt.*;
import java.awt.event.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import javax.swing.*;
import javax.swing.border.EmptyBorder;

public class AgendaInteligente extends JFrame {

    private JTextField nomeField;
    private JTextField telefoneField;
    private JTextField eventoField;
    private JTextField dataHoraField;

    private DefaultListModel<String> listaEventos;
    private JList<String> eventosList;

    private ArrayList<Agendamento> agendamentos;

    public AgendaInteligente() {

        agendamentos = new ArrayList<>();

        setTitle("Agenda Inteligente");
        setSize(500, 750);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(EXIT_ON_CLOSE);

        JPanel painel = new JPanel();
        painel.setLayout(new BorderLayout());
        painel.setBackground(new Color(15, 23, 42));

        /* HEADER */

        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setBackground(new Color(15, 23, 42));
        header.setBorder(new EmptyBorder(20,20,20,20));

        JLabel titulo = new JLabel("Agenda Inteligente");
        titulo.setForeground(Color.WHITE);
        titulo.setFont(new Font("Arial", Font.BOLD, 28));
        titulo.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel subtitulo = new JLabel("Sistema de Agendamentos");
        subtitulo.setForeground(new Color(180,180,180));
        subtitulo.setFont(new Font("Arial", Font.PLAIN, 16));
        subtitulo.setAlignmentX(Component.CENTER_ALIGNMENT);

        header.add(titulo);
        header.add(Box.createVerticalStrut(10));
        header.add(subtitulo);

        /* FORMULÁRIO */

        JPanel form = new JPanel();
        form.setLayout(new GridLayout(10,1,10,10));
        form.setBorder(new EmptyBorder(20,20,20,20));
        form.setBackground(new Color(30,41,59));

        nomeField = criarCampo();
        telefoneField = criarCampo();
        eventoField = criarCampo();
        dataHoraField = criarCampo();

        dataHoraField.setText(
            LocalDateTime.now()
            .format(
                DateTimeFormatter.ofPattern(
                    "yyyy-MM-dd HH:mm"
                )
            )
        );

        JButton salvarBtn = new JButton("Salvar Agendamento");
        estilizarBotao(salvarBtn, new Color(37,99,235));

        salvarBtn.addActionListener(new ActionListener() {

            @Override
            public void actionPerformed(ActionEvent e) {

                salvarAgendamento();
            }
        });

        JButton whatsappBtn = new JButton("Enviar WhatsApp");
        estilizarBotao(whatsappBtn, new Color(34,197,94));

        whatsappBtn.addActionListener(new ActionListener() {

            @Override
            public void actionPerformed(ActionEvent e) {

                enviarWhatsApp();
            }
        });

        form.add(criarLabel("Nome do Cliente"));
        form.add(nomeField);

        form.add(criarLabel("Telefone"));
        form.add(telefoneField);

        form.add(criarLabel("Evento"));
        form.add(eventoField);

        form.add(criarLabel("Data e Hora"));
        form.add(dataHoraField);

        form.add(salvarBtn);
        form.add(whatsappBtn);

        /* LISTA DE EVENTOS */

        JPanel listaPanel = new JPanel(new BorderLayout());
        listaPanel.setBackground(new Color(15,23,42));
        listaPanel.setBorder(new EmptyBorder(10,20,20,20));

        JLabel listaTitulo = new JLabel("Agendamentos");
        listaTitulo.setForeground(Color.WHITE);
        listaTitulo.setFont(new Font("Arial", Font.BOLD, 22));

        listaEventos = new DefaultListModel<>();
        eventosList = new JList<>(listaEventos);

        eventosList.setBackground(new Color(51,65,85));
        eventosList.setForeground(Color.WHITE);
        eventosList.setFont(new Font("Arial", Font.PLAIN, 14));

        JScrollPane scroll = new JScrollPane(eventosList);

        listaPanel.add(listaTitulo, BorderLayout.NORTH);
        listaPanel.add(scroll, BorderLayout.CENTER);

        painel.add(header, BorderLayout.NORTH);
        painel.add(form, BorderLayout.CENTER);
        painel.add(listaPanel, BorderLayout.SOUTH);

        add(painel);
    }

    /* CAMPOS */

    private JTextField criarCampo() {

        JTextField campo = new JTextField();

        campo.setFont(new Font("Arial", Font.PLAIN, 16));

        campo.setBackground(Color.WHITE);

        campo.setForeground(Color.BLACK);

        return campo;
    }

    /* LABELS */

    private JLabel criarLabel(String texto) {

        JLabel label = new JLabel(texto);

        label.setForeground(Color.WHITE);

        label.setFont(new Font("Arial", Font.BOLD, 14));

        return label;
    }

    /* BOTÕES */

    private void estilizarBotao(
        JButton botao,
        Color cor
    ) {

        botao.setBackground(cor);

        botao.setForeground(Color.WHITE);

        botao.setFont(new Font("Arial", Font.BOLD, 16));

        botao.setFocusPainted(false);

        botao.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }

    /* SALVAR */

    private void salvarAgendamento() {

        String nome = nomeField.getText();

        String telefone = telefoneField.getText();

        String evento = eventoField.getText();

        String dataHora = dataHoraField.getText();

        if(
            nome.isEmpty() ||
            telefone.isEmpty() ||
            evento.isEmpty() ||
            dataHora.isEmpty()
        ) {

            JOptionPane.showMessageDialog(
                this,
                "Preencha todos os campos!"
            );

            return;
        }

        Agendamento ag = new Agendamento(
            nome,
            telefone,
            evento,
            dataHora
        );

        agendamentos.add(ag);

        listaEventos.addElement(
            "🔴 " +
            evento +
            " | 👤 " +
            nome +
            " | ⏰ " +
            dataHora
        );

        JOptionPane.showMessageDialog(
            this,
            "Agendamento salvo com sucesso!"
        );

        limparCampos();
    }

    /* LIMPAR */

    private void limparCampos() {

        nomeField.setText("");

        telefoneField.setText("");

        eventoField.setText("");

        dataHoraField.setText(
            LocalDateTime.now()
            .format(
                DateTimeFormatter.ofPattern(
                    "yyyy-MM-dd HH:mm"
                )
            )
        );
    }

    /* WHATSAPP */

    private void enviarWhatsApp() {

        String nome = nomeField.getText();

        String telefone = telefoneField.getText();

        String evento = eventoField.getText();

        String dataHora = dataHoraField.getText();

        String mensagem =
            "📅 NOVO AGENDAMENTO\n\n" +
            "👤 Cliente: " + nome + "\n" +
            "📞 Telefone: " + telefone + "\n" +
            "📌 Evento: " + evento + "\n" +
            "⏰ Data: " + dataHora;

        JOptionPane.showMessageDialog(
            this,
            mensagem
        );
    }

    /* MAIN */

    public static void main(String[] args) {

        SwingUtilities.invokeLater(new Runnable() {

            @Override
            public void run() {

                new AgendaInteligente().setVisible(true);
            }
        });
    }
}

/* CLASSE AGENDAMENTO */

class Agendamento {

    private String nome;

    private String telefone;

    private String evento;

    private String dataHora;

    public Agendamento(
        String nome,
        String telefone,
        String evento,
        String dataHora
    ) {

        this.nome = nome;

        this.telefone = telefone;

        this.evento = evento;

        this.dataHora = dataHora;
    }

    public String getNome() {

        return nome;
    }

    public String getTelefone() {

        return telefone;
    }

    public String getEvento() {

        return evento;
    }

    public String getDataHora() {

        return dataHora;
    }
}
