import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchTodos = async () => {
    try {
      const response = await axios.get('/api/todos'); // 깔끔한 상대 경로
      setTodos(response.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchTodos(); }, []);

  const getMonthName = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'long' });
  const getDayOfWeek = (dateStr) => new Date(dateStr).toLocaleString('en-US', { weekday: 'short' });
  const getWeekOfMonth = (dateStr) => {
    const d = new Date(dateStr);
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    return Math.ceil((d.getDate() + firstDay) / 7);
  };

  const getProcessedTodos = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let filtered = todos.filter(todo => {
      if (activeFilter === "Important") return todo.starred;
      const todoDate = new Date(todo.createdAt);
      if (activeFilter === "Today") return todo.createdAt === todayStr;
      if (activeFilter === "Next 7 Days") {
        const diff = (todoDate - now) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 7;
      }
      if (activeFilter === "Month") return todoDate.getMonth() === now.getMonth() && todoDate.getFullYear() === now.getFullYear();
      if (activeFilter === "Year") return todoDate.getFullYear() === now.getFullYear();
      return true;
    });

    return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  const processedTodos = getProcessedTodos();

  const groupedTodos = processedTodos.reduce((groups, todo) => {
    let groupKey = todo.createdAt;
    if (activeFilter === "Month" || activeFilter === "Year") {
      groupKey = `${getMonthName(todo.createdAt)} - Week ${getWeekOfMonth(todo.createdAt)}`;
    }
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(todo);
    groups[groupKey].sort((a, b) => b.starred - a.starred); 
    return groups;
  }, {});

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await axios.post('/api/todos', { title: newTodo, createdAt: selectedDate }); // 깔끔한 상대 경로
    setNewTodo(""); fetchTodos();
  };

  const toggleTodo = async (id, completed) => {
    await axios.put(`/api/todos/${id}`, { completed: !completed }); // 깔끔한 상대 경로
    fetchTodos();
  };

  const toggleStar = async (id, starred) => {
    await axios.put(`/api/todos/${id}`, { starred: !starred }); // 깔끔한 상대 경로
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    await axios.delete(`/api/todos/${id}`); // 깔끔한 상대 경로
    fetchTodos();
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">📅 Scheduler</div>
        <nav>
          {["All", "Important", "Today", "Next 7 Days", "Month", "Year"].map(f => (
            <button key={f} className={activeFilter === f ? "active" : ""} onClick={() => setActiveFilter(f)}>
              {f === "Important" ? "⭐ Important" : f}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header>
          <h1>{activeFilter}</h1>
          <div className="input-row">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && addTodo()} placeholder="Add a task..." />
            <button onClick={addTodo}>Add</button>
          </div>
        </header>

        <section className="list-area">
          {Object.keys(groupedTodos).map(key => (
            <div key={key} className="date-group">
              <h3 className="date-header">
                {key} {(activeFilter !== "Month" && activeFilter !== "Year") && `(${getDayOfWeek(key)})`}
              </h3>
              <ul>
                {groupedTodos[key].map(todo => (
                  <li key={todo._id} className={todo.completed ? "task-done" : ""}>
                    <div className="task-left">
                      <span className={`star-btn ${todo.starred ? "on" : ""}`} onClick={() => toggleStar(todo._id, todo.starred)}>
                        {todo.starred ? "⭐" : "☆"}
                      </span>
                      <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo._id, todo.completed)} />
                      <span className="task-text">{todo.title}</span>
                    </div>
                    <button className="del-btn" onClick={() => deleteTodo(todo._id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App