import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import ManagementPage from './components/ManagementPage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

function App() {
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    const fetchContainers = async () => {
      const querySnapshot = await getDocs(collection(db, "GarbageContainers"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContainers(data);
    };
    fetchContainers();
  }, []);

  return (
    <Router>
      <AppBar position="static" style={{ backgroundColor: '#151515' }}>
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>My Master App</Typography>
          <Button component={Link} to="/" style={{ color: '#FFDB00' }}>Home</Button>
          <Button component={Link} to="/management" style={{ color: '#FFDB00' }}>Management</Button>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<HomePage containers={containers} />} />
        <Route path="/management" element={<ManagementPage />} />
      </Routes>
    </Router>
  );
}

export default App;
