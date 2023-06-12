import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import firebase from '../../config/firebase';
import './Home.css';

const todosCollection = collection(getFirestore(), 'todos');

const Home = ({ handleLogout }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editTodo, setEditTodo] = useState(null);
  const [editedTodoText, setEditedTodoText] = useState('');
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  const navigate = useNavigate();
  const snapshotListenerRef = useRef(null);

  const auth = getAuth();

  const handleAddTodo = async () => {
    if (newTodo.trim() !== '') {
      const todo = {
        text: newTodo,
        completed: false,
        archived: false,
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

  const handleUpdateTodo = async (e, id) => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.target.classList.contains('update-button')) {
      const todoRef = doc(getFirestore(), 'todos', id);

      try {
        await updateDoc(todoRef, {
          text: editedTodoText,
        });
        setEditTodo(null);
        setEditedTodoText('');
      } catch (error) {
        console.error('Error updating todo:', error);
      }
    }
  };

  const handleEditTodo = (e, id) => {
    e.stopPropagation();
    const todo = todos.find((todo) => todo.id === id);
    setEditTodo(id);
    setEditedTodoText(todo.text);
  };


  const handleDeleteTodo = async (e, id) => {
    e.stopPropagation();
    const todoRef = doc(getFirestore(), 'todos', id);

    try {
      await deleteDoc(todoRef);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleArchiveTodo = async (e, id) => {
    e.stopPropagation();
    const todoRef = doc(getFirestore(), 'todos', id);

    try {
      await updateDoc(todoRef, {
        archived: !todoRef.archived,
      });
    } catch (error) {
      console.error('Error archiving todo:', error);
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

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    let todosQuery = todosCollection;

    if (filter === 'completed') {
      todosQuery = query(todosQuery, where('completed', '==', true), where('archived', '==', false));
    } else if (filter === 'pending') {
      todosQuery = query(todosQuery, where('completed', '==', false));
    } else if (filter === 'archived') {
      todosQuery = query(todosQuery, where('archived', '==', true));
    } else if (filter === 'all') {
      todosQuery = query(todosQuery, where('archived', '==', false));
    } else if (filter === 'user') {
      // Adicione o filtro por usuário aqui
    }

    const unsubscribeSnapshot = onSnapshot(todosQuery, (querySnapshot) => {
      const todosData = [];
      querySnapshot.forEach((doc) => {
        todosData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setTodos(todosData);
    });

    snapshotListenerRef.current = [unsubscribeAuth, unsubscribeSnapshot];

    return () => {
      if (snapshotListenerRef.current) {
        snapshotListenerRef.current[0]();
        snapshotListenerRef.current[1]();
      }
    };
  }, [auth, filter]);

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
      return user.email.split('@')[0];
    } else {
      return '';
    }
  };

  return (
    <div className="home-container">
      <h1>Bem-vindo, {getDisplayName()}!</h1>

      <div className="filter">
        <select value={filter} onChange={handleFilterChange}>
          <option value="all">Todos os itens</option>
          <option value="completed">Todos os itens finalizados</option>
          <option value="pending">Todos os itens pendentes</option>
          <option value="archived">Mostrar itens ocultados</option>
          <option value="user">Filtro por usuário</option>
        </select>
      </div>

      <div className="todo-list">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
            onClick={() => handleToggleTodo(todo.id, todo.completed)}
          >
            {editTodo === todo.id ? (
              <input
                type="text"
                value={editedTodoText}
                onChange={(e) => setEditedTodoText(e.target.value)}
                onKeyDown={(e) => handleUpdateTodo(e, todo.id)}
                autoFocus
              />
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  readOnly
                  className="todo-checkbox"
                />
                <span className="todo-text">{todo.text}</span>
              </>
            )}
            <span className="todo-author">{todo.authorName}</span>
            {editTodo === todo.id ? (
              <button onClick={(e) => handleUpdateTodo(e, todo.id)} className="update-button">
                Update
              </button>
            ) : (
              <button onClick={(e) => handleEditTodo(e, todo.id)} className="edit-button">
                Edit
              </button>
            )}
            {todo.completed && !todo.archived && (
              <button onClick={(e) => handleArchiveTodo(e, todo.id)} className="archive-button">
                Arquivar
              </button>
            )}
            <button onClick={(e) => handleDeleteTodo(e, todo.id)} className="delete-button">
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
