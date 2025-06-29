import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const Chat = memo(({ roomId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const messagesEndRef = useRef(null);
  const isMounted = useRef(true);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socketRef.current) {
      socketService.connect(token);
      socketRef.current = true;
    }
    if (socketService.socket) {
      const onConnect = () => {
        setIsSocketReady(true);
      };
      socketService.socket.on('connect', onConnect);
      if (socketService.connected) setIsSocketReady(true);
      return () => {
        socketService.socket.off('connect', onConnect);
      };
    }
  }, []);

  const handleMessage = useCallback((data) => {
    if (isMounted.current) {
      setMessages((prevMessages) => {
        const updated = [...prevMessages, data];
        return updated;
      });
    }
  }, []);

  const handleHistory = useCallback((history) => {
    if (isMounted.current) {
      setMessages(history);
    }
  }, []);

  const handleUsers = useCallback((users) => {
    if (isMounted.current) {
      setUsers(users);
    }
  }, []);

  useEffect(() => {
    if (!isSocketReady) return;
    isMounted.current = true;

    socketService.joinRoom(roomId, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });

    const unsubscribeMessage = socketService.onMessage((data) => {
      handleMessage(data);
    });
    const unsubscribeHistory = socketService.onHistory((history) => {
      handleHistory(history);
    });
    const unsubscribeUsers = socketService.onRoomUsers((users) => {
      handleUsers(users);
    });

    return () => {
      isMounted.current = false;
      unsubscribeMessage();
      unsubscribeHistory();
      unsubscribeUsers();
      socketService.leaveRoom(roomId);
    };
  }, [isSocketReady, roomId, handleMessage, handleHistory, handleUsers, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim()) {
      const messageData = {
        text: newMessage,
        sender: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
        },
        timestamp: new Date().toISOString(),
      };
      socketService.sendMessage(roomId, messageData);
      setNewMessage('');
    }
  }, [newMessage, user, roomId]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
        color="primary"
        variant="outlined"
      >
        Назад
      </Button>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={3} sx={{ p: 2, mb: 2, pt: 7 }}>
          <Typography variant="h6">Участники чата</Typography>
          <List>
            {users.map((user) => {
              const isCurrent = user.socketId === socketService.socket?.id;
              const roleLabel = user.role === 'driver' ? 'Водитель' : 'Пассажир';
              const secondary = isCurrent ? `(Вы, ${roleLabel})` : `(${roleLabel})`;
              return (
                <ListItem key={user.socketId}>
                  <ListItemText 
                    primary={`${user.firstName} ${user.lastName}`}
                    secondary={secondary}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
        
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            p: 2,
            mb: 2,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f5f5f5',
          }}
        >
          {messages.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', color: '#666' }}>
              Нет сообщений. Будьте первым, кто напишет!
            </Typography>
          ) : (
            <List>
              {messages.map((msg, idx) => (
                <React.Fragment key={idx}>
                  <ListItem
                    sx={{
                      backgroundColor: msg.sender.id === user.id ? '#e3f2fd' : '#fff',
                      borderRadius: 2,
                      mb: 1,
                      maxWidth: '80%',
                      alignSelf: msg.sender.id === user.id ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" color="primary">
                          {msg.sender.name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body1"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            {msg.text}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Отправить
          </Button>
        </Box>
      </Box>
    </Box>
  );
});

Chat.displayName = 'Chat';

export default Chat; 