// rotas
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const pontoRoutes = require('./routes/pontos');
const app = express();
require('dotenv').config();


app.use(express.json());
app.use(cors());

// Inicializar banco de dados
require('./database/database');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pontos', pontoRoutes);

// Servir frontend
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'sistema_ponto'
};

// Rota para buscar funcionários
app.get('/api/funcionarios', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM funcionarios');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar registros de ponto
app.get('/api/pontos', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT p.*, f.nome as funcionario_nome 
      FROM pontos p 
      JOIN funcionarios f ON p.funcionario_id = f.id 
      ORDER BY p.data_hora DESC
    `);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar pontos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para adicionar funcionário
app.post('/api/funcionarios', async (req, res) => {
  const { nome, email, cargo } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO funcionarios (nome, email, cargo) VALUES (?, ?, ?)',
      [nome, email, cargo]
    );
    await connection.end();
    res.json({ id: result.insertId, message: 'Funcionário adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para relatórios (exemplo: horas trabalhadas por funcionário)
app.get('/api/relatorios/horas/:funcionarioId', async (req, res) => {
  const { funcionarioId } = req.params;
  const { dataInicio, dataFim } = req.query;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
        DATE(data_hora) as data,
        MIN(CASE WHEN tipo = 'entrada' THEN data_hora END) as entrada,
        MAX(CASE WHEN tipo = 'saida' THEN data_hora END) as saida,
        TIMESTAMPDIFF(HOUR, 
          MIN(CASE WHEN tipo = 'entrada' THEN data_hora END),
          MAX(CASE WHEN tipo = 'saida' THEN data_hora END)
        ) as horas_trabalhadas
      FROM pontos 
      WHERE funcionario_id = ? 
        AND DATE(data_hora) BETWEEN ? AND ?
      GROUP BY DATE(data_hora)
    `, [funcionarioId, dataInicio, dataFim]);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
});