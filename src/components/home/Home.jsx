import React, { useEffect, useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri'; // Import icons from react-icons library

const Home = ({ user, handleLogout }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  const navigate = useNavigate();

  const handleAddTodo = () => {
    if (newTodo.trim() !== '') {
      const todo = {
        id: Date.now(),
        text: newTodo,
        completed: false,
      };
      setTodos((prevTodos) => [...prevTodos, todo]);
      setNewTodo('');
    }
  };

  const handleDeleteTodo = (id) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  const handleToggleTodo = (id) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  useEffect(() => {
    setTodos([
      { id: 1, text: 'Todo 1', completed: false },
      { id: 2, text: 'Todo 2', completed: true },
      { id: 3, text: 'Todo 3', completed: false },
    ]);
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleAddTodo();
    }
  };

  const logout = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="home-container">
      <h1>Bem-vindo, {user.displayName}!</h1>

      <div className="todo-list">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
            onClick={() => handleToggleTodo(todo.id)}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              readOnly
              className="todo-checkbox"
            />
            <span className="todo-text">{todo.text}</span>
            <button onClick={() => handleDeleteTodo(todo.id)} className="delete-button">
              <RiDeleteBinLine />
            </button>
          </div>
        ))}
      </div>

      <div className="todo-input">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown} // Handle "Enter" key press
          placeholder="Enter a new todo"
        />
        <button onClick={handleAddTodo} className="add-button">
          <RiAddLine />
        </button>
      </div>

      <button className="logout-button" onClick={logout}>
        Deslogar
      </button>
    </div>
  );
};

export default Home;
