import React from 'react';
import { Container, Box, Typography, Button, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const MotionPaper = motion(Paper);
const MotionTypography = motion(Typography);
const MotionButton = motion(Button);
const MotionBox = motion(Box);

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <MotionTypography 
              variant="h3" 
              component="h1" 
              gutterBottom
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              FEFU Drive
            </MotionTypography>
            <MotionTypography 
              variant="h5" 
              color="textSecondary" 
              paragraph
              initial="hidden"
              animate="visible"
              variants={slideUp}
              transition={{ delay: 0.2 }}
            >
              Найди попутчиков для поездки в университет или домой
            </MotionTypography>
            <MotionTypography 
              variant="body1" 
              paragraph
              initial="hidden"
              animate="visible"
              variants={slideUp}
              transition={{ delay: 0.4 }}
            >
              Сэкономь на поездках, познакомься с новыми людьми и сделай свой путь
              в университет более комфортным.
            </MotionTypography>
            <MotionBox 
              sx={{ mt: 4 }}
              initial="hidden"
              animate="visible"
              variants={slideUp}
              transition={{ delay: 0.6 }}
            >
              {user ? (
                <MotionButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/trips')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Найти поездку
                </MotionButton>
              ) : (
                <MotionButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/register')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Начать
                </MotionButton>
              )}
            </MotionBox>
          </Grid>
          <Grid item xs={12} md={6}>
            <MotionPaper
              elevation={3}
              sx={{
                p: 4,
                backgroundImage: 'url(/logo.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: 500,
                display: 'flex',
                alignItems: 'flex-end',
              }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box sx={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', p: 2, width: '100%' }}>
                <Typography variant="h6" color="white">
                  Более 1000 успешных поездок
                </Typography>
                <Typography variant="body2" color="white">
                  Присоединяйся к сообществу FEFU Drive
                </Typography>
              </Box>
            </MotionPaper>
          </Grid>
        </Grid>

        <Box sx={{ my: 8 }}>
          <MotionTypography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            align="center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Преимущества
          </MotionTypography>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <Grid container spacing={4} sx={{ mt: 2 }}>
              {[
                {
                  title: "Экономия",
                  description: "Раздели стоимость поездки с попутчиками и сэкономь на транспорте"
                },
                {
                  title: "Комфорт",
                  description: "Путешествуй в комфортных условиях с проверенными водителями"
                },
                {
                  title: "Безопасность",
                  description: "Все водители проходят проверку, а поездки отслеживаются"
                }
              ].map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <MotionPaper 
                    elevation={3} 
                    sx={{ p: 4, height: '100%' }}
                    variants={slideUp}
                    whileHover={{ y: -10, boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)' }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body1">
                      {item.description}
                    </Typography>
                  </MotionPaper>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Box>

        <Box sx={{ my: 8 }}>
          <MotionTypography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            align="center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Как это работает
          </MotionTypography>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <Grid container spacing={4} sx={{ mt: 2 }}>
              {[
                {
                  step: "1. Регистрация",
                  description: "Создай аккаунт и заполни профиль"
                },
                {
                  step: "2. Поиск",
                  description: "Найди подходящую поездку или создай свою"
                },
                {
                  step: "3. Бронирование",
                  description: "Забронируй место и свяжись с водителем"
                },
                {
                  step: "4. Поездка",
                  description: "Наслаждайся комфортной поездкой"
                }
              ].map((item, index) => (
                <Grid item xs={12} md={3} key={index}>
                  <MotionPaper 
                    elevation={3} 
                    sx={{ p: 4, height: '100%' }}
                    variants={slideUp}
                    whileHover={{ y: -10, boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)' }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {item.step}
                    </Typography>
                    <Typography variant="body1">
                      {item.description}
                    </Typography>
                  </MotionPaper>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Box>
      </Box>
    </Container>
  );
};

export default Home; 