import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Trips from "./pages/Trips";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import { AuthProvider } from "./context/AuthContext";
import CreateTrip from "./components/CreateTrip";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    h1: {
      fontFamily: "'Open Sans', 'Roboto', sans-serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Open Sans', 'Roboto', sans-serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Open Sans', 'Roboto', sans-serif",
      fontWeight: 600,
    },
    h4: {
      fontFamily: "'Open Sans', 'Roboto', sans-serif",
      fontWeight: 600,
    },
    h5: {
      fontFamily: "'Open Sans', 'Roboto', sans-serif",
      fontWeight: 600,
    },
    h6: {
      fontFamily: "'Open Sans', 'Roboto', sans-serif",
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
      fontSize: "1rem",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "4px",
          padding: "8px 16px",
          minWidth: "80px",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
          },
        },
        sizeLarge: {
          padding: "10px 22px",
          fontSize: "1.1rem",
        },
        sizeSmall: {
          padding: "4px 10px",
          fontSize: "0.85rem",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#bdbdbd",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#919191",
          },
        },
      },
    },
  },
});

const AppContent = () => {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {isAdminRoute ? (
        <Routes>
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/chat/:roomId" element={<Chat />} />
            <Route path="/create-trip" element={<CreateTrip />} />
          </Routes>
        </Layout>
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ThemeProvider>
  );
}

export default App;
