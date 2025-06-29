import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  ExitToApp as ExitToAppIcon,
  CarRental as CarRentalIcon,
} from "@mui/icons-material";
import Applications from "./Applications";
import Drivers from "./Drivers";
import Statistics from "./Statistics";
import { DriverInfoChangeRequests } from "./DriverInfoChangeRequests";
import { adminService } from "../services/apiService";

const drawerWidth = 300;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("applications");
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [pendingInfoChangeCount, setPendingInfoChangeCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const applicationsCount =
        await adminService.getPendingApplicationsCount();
      const infoChangeCount =
        await adminService.getPendingInfoChangeRequestsCount();
      setPendingApplicationsCount(applicationsCount);
      setPendingInfoChangeCount(infoChangeCount);
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "applications":
        return <Applications />;
      case "drivers":
        return <Drivers />;
      case "statistics":
        return <Statistics />;
      case "driverInfoChanges":
        return <DriverInfoChangeRequests />;
      default:
        return <Applications />;
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6">Панель администратора</Typography>
        </Box>
        <Divider />
        <List>
          <ListItem
            button
            selected={activeTab === "applications"}
            onClick={() => setActiveTab("applications")}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Заявки" />
            </Box>
            <Badge badgeContent={pendingApplicationsCount} color="error" sx={{ mr: 2 }} />
          </ListItem>
          <ListItem
            button
            selected={activeTab === "driverInfoChanges"}
            onClick={() => setActiveTab("driverInfoChanges")}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListItemIcon>
                <CarRentalIcon />
              </ListItemIcon>
              <ListItemText primary="Изменения данных" />
            </Box>
            <Badge badgeContent={pendingInfoChangeCount} color="error" sx={{ mr: 2 }} />
          </ListItem>
          <ListItem
            button
            selected={activeTab === "drivers"}
            onClick={() => setActiveTab("drivers")}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Водители" />
          </ListItem>
          <ListItem
            button
            selected={activeTab === "statistics"}
            onClick={() => setActiveTab("statistics")}
          >
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Статистика" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Выход" />
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflowX: "auto",
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
