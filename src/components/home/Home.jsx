import React, { useEffect, useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const Home = ({ user, handleLogout }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  const navigate = useNavigate();
  const db = getFirestore();

  const todosCollection = collection(db, 'todos');

  const handleAddTodo = async () => {
    if (newTodo.trim() !== '') {
      const todo = {
        text: newTodo,
        completed: false,
      };

      try {
        await addDoc(todosCollection, todo);
        setNewTodo('');
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    }
  };

  const handleDeleteTodo = async (id) => {
    const todoRef = doc(db, 'todos', id);

    try {
      await deleteDoc(todoRef);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleToggleTodo = async (id, completed) => {
    const todoRef = doc(db, 'todos', id);

    try {
      await updateDoc(todoRef, {
        completed: !completed,
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(todosCollection, (querySnapshot) => {
      const todosData = [];
      querySnapshot.forEach((doc) => {
        todosData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setTodos(todosData);
    });

    return () => unsubscribe();
  }, [todosCollection]);

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
            onClick={() => handleToggleTodo(todo.id, todo.completed)}
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
          onKeyDown={handleKeyDown}
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
