import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiDeleteBinLine, RiPencilLine, RiLockLine, RiCheckLine, RiArchiveLine, RiArrowGoBackLine } from 'react-icons/ri';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, where, getDoc, getDocs } from 'firebase/firestore';
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
  const [selectedUser, setSelectedUser] = useState('');
  const [todosUsers, setTodosUsers] = useState([]);

  const snapshotListenerRef = useRef(null);
  const auth = getAuth();
  const navigate = useNavigate();

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
      const todoSnapshot = await getDoc(todoRef);
      const todo = todoSnapshot.data();

      if (!todo.locked || (todo.locked && todo.authorEmail === user.email)) {
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
    const todoSnapshot = await getDoc(todoRef);
    const todo = todoSnapshot.data();

    if (!todo.locked || (todo.locked && todo.authorEmail === user.email)) {
      try {
        await deleteDoc(todoRef);
        handleUsersAfterDeleteOrArchive(todo.authorEmail);
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
    }
  };

  const handleUsersAfterDeleteOrArchive = async (taskUserEmail) => {
    const querySnapshot = await getDocs(todosCollection);
    const todosWithSameUser = querySnapshot.docs.filter((doc) => doc.data().authorEmail === taskUserEmail);
    if (todosWithSameUser.length === 0) {
      setSelectedUser("all");
    }
  }

  const handleArchiveTodo = async (e, id, archived) => {
    e.stopPropagation();
    const todoRef = doc(getFirestore(), 'todos', id);

    try {
      await updateDoc(todoRef, {
        archived: !archived,
      });
    } catch (error) {
      console.error('Error archiving todo:', error);
    }
  };

  const handleToggleTodo = async (id, completed) => {
    const todoRef = doc(getFirestore(), 'todos', id);
    const todoSnapshot = await getDoc(todoRef);
    const todo = todoSnapshot.data();

    if (!todo.locked || (todo.locked && todo.authorEmail === user.email)) {
      try {
        await updateDoc(todoRef, {
          completed: !completed,
        });
      } catch (error) {
        console.error('Error updating todo:', error);
      }
    }
  };

  const handleFilterChange = (event) => {
    const currentFilter = event.target.value;
    setFilter(currentFilter);
    if (currentFilter === "user") {
      setSelectedUser("all");
    }
  };

  const handleLockTodo = async (e, id) => {
    e.stopPropagation();
    const todoRef = doc(getFirestore(), 'todos', id);
    const todoSnapshot = await getDoc(todoRef);
    const todo = todoSnapshot.data();

    if (todo.authorEmail === user.email) {
      try {
        await updateDoc(todoRef, {
          locked: !todo.locked,
        });
      } catch (error) {
        console.error('Error updating todo:', error);
      }
    }
  };

  const handleUserChange = (event) => {
    console.log("handleUserChange", event.target.value)
    setSelectedUser(event.target.value);
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
      console.log(selectedUser);
      if (selectedUser !== 'all') {
        todosQuery = query(
          todosQuery,
          where('authorEmail', '==', selectedUser),
          where('archived', '==', false)
        );
      } else {
        todosQuery = query(todosQuery, where('archived', '==', false));
      }
    }

    const unsubscribeSnapshot = onSnapshot(todosQuery, orderBy('createdAt'), (querySnapshot) => {
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
  }, [auth, filter, selectedUser]);

  useEffect(() => {
    const unsubscribeSnapshot = onSnapshot(todosCollection, (querySnapshot) => {
      const updatedTodosUsers = [];
      querySnapshot.forEach((doc) => {
        const todo = doc.data();
        if (!updatedTodosUsers.some((user) => user.email === todo.authorEmail) && todo.archived === false) {
          updatedTodosUsers.push({
            email: todo.authorEmail,
            name: todo.authorName,
          });
        }
      });
      setTodosUsers(updatedTodosUsers);
    });

    return () => {
      unsubscribeSnapshot();
    };
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
        {filter === 'user' && (
          <select value={selectedUser} onChange={handleUserChange} className='user-filter'>
            <option value="all">Todos os usuários</option>
            {todosUsers.map((user) => (
              <option key={user.email} value={user.email}>{user.name}</option>
            ))}
          </select>
        )}
        <select value={filter} onChange={handleFilterChange} className='todo-filter'>
          <option value="all">Todos os itens</option>
          <option value="completed">Todos os itens finalizados</option>
          <option value="pending">Todos os itens pendentes</option>
          <option value="archived">Mostrar itens arquivados</option>
          <option value="user">Filtro por usuário</option>
        </select>
      </div>

      <div className="todo-list">
        {todos.length === 0 ? (
          <div className="empty-message">Nenhuma tarefa encontrada.</div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.locked && todo.authorEmail !== user.email ? 'locked' : ''}`}
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
              {(!todo.locked || (todo.locked && todo.authorEmail === user.email)) && (
                <>
                  {todo.completed && (
                    <button onClick={(e) => handleArchiveTodo(e, todo.id, todo.archived)} className="archive-button">
                      {todo.archived ? <RiArrowGoBackLine /> : <RiArchiveLine />}
                    </button>
                  )}
                  {todo.authorEmail === user.email && (
                    <button
                      onClick={(e) => handleLockTodo(e, todo.id)}
                      className={`lock-button ${todo.locked ? 'locked' : ''}`}
                    >
                      {todo.locked ? <RiLockLine /> : <RiLockLine />}
                    </button>
                  )}
                  {!todo.archived && (
                    <>
                      {editTodo === todo.id ? (
                        <button onClick={(e) => handleUpdateTodo(e, todo.id)} className="update-button">
                          <RiCheckLine className='update-button' />
                        </button>
                      ) : (
                        <button onClick={(e) => handleEditTodo(e, todo.id)} className="edit-button">
                          <RiPencilLine />
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={(e) => handleDeleteTodo(e, todo.id)} className="delete-button">
                    <RiDeleteBinLine />
                  </button>
                </>
              )}
              {todo.locked && todo.authorEmail !== user.email && (
                <div className="lock-indicator">
                  <span role="img" aria-label="Locked">🔒</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="todo-input">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite um novo item"
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
