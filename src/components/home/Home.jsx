import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import firebase from '../../config/firebase';
import './Home.css';

const todosCollection = collection(getFirestore(), 'todos');

const Home = ({ handleLogout }) => {
  console.log('Home.jsx');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const snapshotListenerRef = useRef(null);

  const auth = getAuth();

  const handleAddTodo = async () => {
    if (newTodo.trim() !== '') {
      const todo = {
        text: newTodo,
        completed: false,
        createdAt: new Date(),
        authorEmail: user.email,
        authorName: user.displayName || user.email.split('@')[0],
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
    const todoRef = doc(getFirestore(), 'todos', id);

    try {
      await deleteDoc(todoRef);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleToggleTodo = async (id, completed) => {
    const todoRef = doc(getFirestore(), 'todos', id);

    try {
      await updateDoc(todoRef, {
        completed: !completed,
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  
    const unsubscribeSnapshot = onSnapshot(
      query(todosCollection, orderBy('createdAt')),
      (querySnapshot) => {
        const todosData = [];
        querySnapshot.forEach((doc) => {
          todosData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setTodos(todosData);
      }
    );
  
    snapshotListenerRef.current = [unsubscribeAuth, unsubscribeSnapshot];
  
    return () => {
      if (snapshotListenerRef.current) {
        snapshotListenerRef.current[0]();
        snapshotListenerRef.current[1]();
      }
    };
  }, [auth]);  

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleAddTodo();
    }
  };

  const logout = () => {
    handleLogout();
    navigate('/login');
  };

  const getDisplayName = () => {
    if (user && user.displayName) {
      return user.displayName;
    } else if (user && user.email) {
      return user.email.split('@')[0]; // Pega a parte antes do "@" no email
    } else {
      return '';
    }
  };

  return (
    <div className="home-container">
      <h1>Bem-vindo, {getDisplayName()}!</h1>

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
            <span className="todo-author">{todo.authorName}</span>
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
