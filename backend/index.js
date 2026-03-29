require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.log(err));

// [수정] 스키마: starred와 createdAt 필드 포함
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  starred: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
});
const Todo = mongoose.model('Todo', todoSchema);

// API 엔드포인트
app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

app.post('/api/todos', async (req, res) => {
  // 프론트에서 보낸 title, starred, createdAt을 모두 저장
  const newTodo = new Todo(req.body);
  await newTodo.save();
  res.json(newTodo);
});

app.put('/api/todos/:id', async (req, res) => {
  // [수정] 어떤 필드(completed 혹은 starred)가 들어와도 유연하게 업데이트
  const todo = await Todo.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  res.json(todo);
});

app.delete('/api/todos/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: '삭제 완료' });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`로컬 서버 실행 중: http://localhost:${PORT}`));
}

module.exports = app; 