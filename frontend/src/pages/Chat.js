import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import Chat from '../components/Chat';

const ChatPage = () => {
  const { roomId } = useParams();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Чат поездки
        </Typography>
        <Box sx={{ height: 'calc(100vh - 200px)' }}>
          <Chat roomId={roomId} />
        </Box>
      </Box>
    </Container>
  );
};

export default ChatPage; 