import React, { useState, useEffect } from 'react';
import {
  Container, Box, Grid, Typography, TextField, Button, Paper, Snackbar, Alert, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GeoPoint } from 'firebase/firestore';

const ManagementPage = () => {
  // State for Start/End Points
  const [startPointName, setStartPointName] = useState('');
  const [endPointName, setEndPointName] = useState('');
  const [startPointLat, setStartPointLat] = useState('');
  const [startPointLng, setStartPointLng] = useState('');
  const [endPointLat, setEndPointLat] = useState('');
  const [endPointLng, setEndPointLng] = useState('');

  // State for Adding Garbage Containers
  const [garbageName, setGarbageName] = useState('');
  const [garbageLat, setGarbageLat] = useState('');
  const [garbageLng, setGarbageLng] = useState('');
  const [garbageFullCapacity, setGarbageFullCapacity] = useState('');

  // State for Updating Garbage Containers
  const [selectedGarbageId, setSelectedGarbageId] = useState('');
  const [garbageContainers, setGarbageContainers] = useState([]);
  const [updatedGarbageLat, setUpdatedGarbageLat] = useState('');
  const [updatedGarbageLng, setUpdatedGarbageLng] = useState('');
  const [updatedGarbageFullCapacity, setUpdatedGarbageFullCapacity] = useState('');
  const [updatedGarbageCurrentCapacity, setUpdatedGarbageCurrentCapacity] = useState('');

  // State for Adding Garbage Cars
  const [garbageCarId, setGarbageCarId] = useState('');
  const [garbageCarFullCapacity, setGarbageCarFullCapacity] = useState('');

  // State for Updating Garbage Cars
  const [selectedCarId, setSelectedCarId] = useState('');
  const [garbageCars, setGarbageCars] = useState([]);
  const [updatedGarbageCarFullCapacity, setUpdatedGarbageCarFullCapacity] = useState('');

  // State for section visibility
  const [visibleSection, setVisibleSection] = useState('');

  // Snackbar notification state
  const [notification, setNotification] = useState({ open: false, message: '', severity: '' });

  // Fetch current Start/End Points from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const pointsQuery = await getDocs(collection(db, "GarbageStartEndPointsLocation"));
        const pointsData = pointsQuery.docs.map(doc => doc.data())[0]; // Assuming single doc for start/end points

        if (pointsData) {
          setStartPointName(pointsData.StartPointName);
          setEndPointName(pointsData.EndPointName);
          setStartPointLat(pointsData.StartPoint.latitude);
          setStartPointLng(pointsData.StartPoint.longitude);
          setEndPointLat(pointsData.EndPoint.latitude);
          setEndPointLng(pointsData.EndPoint.longitude);
        }

        // Fetch all garbage containers
        const containersQuery = await getDocs(collection(db, "GarbageContainers"));
        const containersData = containersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageContainers(containersData);

        // Fetch all garbage cars
        const carsQuery = await getDocs(collection(db, "GarbageCars"));
        const carsData = carsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageCars(carsData);

      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  // Update Start/End Points
  const handleUpdatePoints = async () => {
    if (startPointName && startPointLat && startPointLng && endPointName && endPointLat && endPointLng) {
      try {
        // Convert the latitude and longitude to GeoPoint
        const startPointGeoPoint = new GeoPoint(parseFloat(startPointLat), parseFloat(startPointLng));
        const endPointGeoPoint = new GeoPoint(parseFloat(endPointLat), parseFloat(endPointLng));
  
        // Get the reference to the existing document you want to update
        const docRef = doc(db, "GarbageStartEndPointsLocation", "iy7wdtfpXUbrnwzo92ly"); // Replace "uniqueDocId" with your actual document ID
  
        // Update the document with new GeoPoints
        await updateDoc(docRef, {
          StartPoint: startPointGeoPoint,
          EndPoint: endPointGeoPoint,
          StartPointName: startPointName,  // Optional: Update name if needed
          EndPointName: endPointName       // Optional: Update name if needed
        });
  
        // Notify the user of the successful update
        setNotification({ open: true, message: 'Points updated successfully!', severity: 'success' });
  
        // Clear input fields (Optional)
        setStartPointName('');
        setStartPointLat('');
        setStartPointLng('');
        setEndPointName('');
        setEndPointLat('');
        setEndPointLng('');
  
      } catch (error) {
        console.error("Error updating points: ", error);
        setNotification({ open: true, message: 'Error updating points. Please try again.', severity: 'error' });
      }
    } else {
      setNotification({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
    }
  };
  
  

  // Add New Garbage Container
  const handleAddGarbageContainer = async () => {
    if (garbageName && garbageLat && garbageLng && garbageFullCapacity) {
      try {
        await addDoc(collection(db, "GarbageContainers"), {
          GarbageName: garbageName,
          GarbageLocation: new GeoPoint(parseFloat(garbageLat), parseFloat(garbageLng)),
          GarbageFullCapacity: parseFloat(garbageFullCapacity),
          GarbageCurrentCapacity: 0, // Set default initial capacity to 0
        });

        setNotification({ open: true, message: 'Garbage container added successfully!', severity: 'success' });
        setGarbageName('');
        setGarbageLat('');
        setGarbageLng('');
        setGarbageFullCapacity('');

        // Refresh container list
        const containersQuery = await getDocs(collection(db, "GarbageContainers"));
        const containersData = containersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageContainers(containersData);

      } catch (error) {
        console.error("Error adding garbage container: ", error);
        setNotification({ open: true, message: 'Error adding garbage container. Please try again.', severity: 'error' });
      }
    } else {
      setNotification({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
    }
  };

  // Update Garbage Container
  const handleUpdateGarbageContainer = async () => {
    if (selectedGarbageId && updatedGarbageLat && updatedGarbageLng && updatedGarbageFullCapacity && updatedGarbageCurrentCapacity !== '') {
      try {
        const docRef = doc(db, "GarbageContainers", selectedGarbageId);
        await updateDoc(docRef, {
          GarbageLocation: new GeoPoint(parseFloat(updatedGarbageLat), parseFloat(updatedGarbageLng)),
          GarbageFullCapacity: parseFloat(updatedGarbageFullCapacity),
          GarbageCurrentCapacity: parseFloat(updatedGarbageCurrentCapacity)
        });

        setNotification({ open: true, message: 'Garbage container updated successfully!', severity: 'success' });
        setSelectedGarbageId('');
        setUpdatedGarbageLat('');
        setUpdatedGarbageLng('');
        setUpdatedGarbageFullCapacity('');
        setUpdatedGarbageCurrentCapacity('');

        // Refresh container list
        const containersQuery = await getDocs(collection(db, "GarbageContainers"));
        const containersData = containersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageContainers(containersData);

      } catch (error) {
        console.error("Error updating garbage container: ", error);
        setNotification({ open: true, message: 'Error updating garbage container. Please try again.', severity: 'error' });
      }
    } else {
      setNotification({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
    }
  };

  // Add New Garbage Car
  const handleAddGarbageCar = async () => {
    if (garbageCarId && garbageCarFullCapacity) {
      try {
        await addDoc(collection(db, "GarbageCars"), {
          GarbageCarId: garbageCarId,
          GarbageCarFullCapacity: parseFloat(garbageCarFullCapacity),
        });

        setNotification({ open: true, message: 'Garbage car added successfully!', severity: 'success' });
        setGarbageCarId('');
        setGarbageCarFullCapacity('');

        // Refresh car list
        const carsQuery = await getDocs(collection(db, "GarbageCars"));
        const carsData = carsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageCars(carsData);

      } catch (error) {
        console.error("Error adding garbage car: ", error);
        setNotification({ open: true, message: 'Error adding garbage car. Please try again.', severity: 'error' });
      }
    } else {
      setNotification({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
    }
  };

  // Update Garbage Car
  const handleUpdateGarbageCar = async () => {
    if (selectedCarId && updatedGarbageCarFullCapacity) {
      try {
        const docRef = doc(db, "GarbageCars", selectedCarId);
        await updateDoc(docRef, {
          GarbageCarFullCapacity: parseFloat(updatedGarbageCarFullCapacity),
        });

        setNotification({ open: true, message: 'Garbage car updated successfully!', severity: 'success' });
        setSelectedCarId('');
        setUpdatedGarbageCarFullCapacity('');

        // Refresh car list
        const carsQuery = await getDocs(collection(db, "GarbageCars"));
        const carsData = carsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageCars(carsData);

      } catch (error) {
        console.error("Error updating garbage car: ", error);
        setNotification({ open: true, message: 'Error updating garbage car. Please try again.', severity: 'error' });
      }
    } else {
      setNotification({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
    }
  };

  // Delete Garbage Container
  const handleDeleteGarbageContainer = async () => {
    if (selectedGarbageId) {
      try {
        await deleteDoc(doc(db, "GarbageContainers", selectedGarbageId));
        setNotification({ open: true, message: 'Garbage container deleted successfully!', severity: 'success' });

        // Refresh container list
        const containersQuery = await getDocs(collection(db, "GarbageContainers"));
        const containersData = containersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageContainers(containersData);

        setSelectedGarbageId('');
      } catch (error) {
        console.error("Error deleting garbage container: ", error);
        setNotification({ open: true, message: 'Error deleting garbage container. Please try again.', severity: 'error' });
      }
    } else {
      setNotification({ open: true, message: 'Please select a garbage container to delete.', severity: 'warning' });
    }
  };

  // Delete Garbage Car
  const handleDeleteGarbageCar = async () => {
    if (selectedCarId) {
      try {
        await deleteDoc(doc(db, "GarbageCars", selectedCarId));
        setNotification({ open: true, message: 'Garbage car deleted successfully!', severity: 'success' });

        // Refresh car list
        const carsQuery = await getDocs(collection(db, "GarbageCars"));
        const carsData = carsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGarbageCars(carsData);

        setSelectedCarId('');
      } catch (error) {
        console.error("Error deleting garbage car: ", error);
        setNotification({ open: true, message: 'Error deleting garbage car. Please try again.', severity: 'error' });
      }
    } else {
      setNotification({ open: true, message: 'Please select a garbage car to delete.', severity: 'warning' });
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Management Page</Typography>

      <Box mb={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setVisibleSection('points')}
              style={{ backgroundColor: visibleSection === 'points' ? '#FF8F00' : '#26355D', color: '#FFFFFF' }}
            >
              Start/End Points
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setVisibleSection('garbageCar')}
              style={{ backgroundColor: visibleSection === 'garbageCar' ? '#FF8F00' : '#26355D', color: '#FFFFFF' }}
            >
              Waste Compactor Truck
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setVisibleSection('garbageContainer')}
              style={{ backgroundColor: visibleSection === 'garbageContainer' ? '#FF8F00' : '#26355D', color: '#FFFFFF' }}
            >
              Waste Container
            </Button>
          </Grid>
        </Grid>
      </Box>

      {visibleSection === 'points' && (
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6" gutterBottom>Start/End Points Management</Typography>
          <Box mb={2}>
            <TextField
              label="Start Point Name"
              value={startPointName}
              onChange={(e) => setStartPointName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Start Point Latitude"
              value={startPointLat}
              onChange={(e) => setStartPointLat(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Start Point Longitude"
              value={startPointLng}
              onChange={(e) => setStartPointLng(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Box>
          <Box mb={2}>
            <TextField
              label="End Point Name"
              value={endPointName}
              onChange={(e) => setEndPointName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="End Point Latitude"
              value={endPointLat}
              onChange={(e) => setEndPointLat(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="End Point Longitude"
              value={endPointLng}
              onChange={(e) => setEndPointLng(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Box>
          <Button variant="contained" color="primary" onClick={handleUpdatePoints}>Update Points</Button>
        </Paper>
      )}

      {visibleSection === 'garbageContainer' && (
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6" gutterBottom>Add Waste Container</Typography>
          <Box mb={2}>
            <TextField
              label="Waste Container Name"
              value={garbageName}
              onChange={(e) => setGarbageName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Latitude"
              value={garbageLat}
              onChange={(e) => setGarbageLat(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Longitude"
              value={garbageLng}
              onChange={(e) => setGarbageLng(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Full Capacity"
              value={garbageFullCapacity}
              onChange={(e) => setGarbageFullCapacity(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Box>
          <Button variant="contained" color="primary" onClick={handleAddGarbageContainer}>Add Waste Container</Button>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>Update Waste Container</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Container</InputLabel>
              <Select
                value={selectedGarbageId}
                onChange={(e) => {
                  setSelectedGarbageId(e.target.value);
                  const selectedGarbage = garbageContainers.find(g => g.id === e.target.value);
                  if (selectedGarbage) {
                    setUpdatedGarbageLat(selectedGarbage.GarbageLocation.latitude);
                    setUpdatedGarbageLng(selectedGarbage.GarbageLocation.longitude);
                    setUpdatedGarbageFullCapacity(selectedGarbage.GarbageFullCapacity);
                    setUpdatedGarbageCurrentCapacity(selectedGarbage.GarbageCurrentCapacity);
                  }
                }}
              >
                {garbageContainers.map(container => (
                  <MenuItem key={container.id} value={container.id}>
                    {container.GarbageName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Updated Latitude"
              value={updatedGarbageLat}
              onChange={(e) => setUpdatedGarbageLat(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Updated Longitude"
              value={updatedGarbageLng}
              onChange={(e) => setUpdatedGarbageLng(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Updated Full Capacity"
              value={updatedGarbageFullCapacity}
              onChange={(e) => setUpdatedGarbageFullCapacity(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Updated Current Capacity"
              value={updatedGarbageCurrentCapacity}
              onChange={(e) => setUpdatedGarbageCurrentCapacity(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="contained" color="primary" onClick={handleUpdateGarbageContainer}>Update Waste Container</Button>
            <Button variant="contained" color="secondary" onClick={handleDeleteGarbageContainer} style={{ marginLeft: '10px' }}>Delete Waste Container</Button>
          </Box>
        </Paper>
      )}

      {visibleSection === 'garbageCar' && (
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6" gutterBottom>Add Waste Compactor Truck</Typography>
          <Box mb={2}>
            <TextField
              label="Waste Compactor Truck ID"
              value={garbageCarId}
              onChange={(e) => setGarbageCarId(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Full Capacity"
              value={garbageCarFullCapacity}
              onChange={(e) => setGarbageCarFullCapacity(e.target.value)}
              fullWidth
              margin="normal"
            />
          </Box>
          <Button variant="contained" color="primary" onClick={handleAddGarbageCar}>Add Waste Compactor Truck</Button>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>Update Waste Compactor Truck</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Waste Compactor Truck</InputLabel>
              <Select
                value={selectedCarId}
                onChange={(e) => {
                  setSelectedCarId(e.target.value);
                  const selectedCar = garbageCars.find(car => car.id === e.target.value);
                  if (selectedCar) {
                    setUpdatedGarbageCarFullCapacity(selectedCar.GarbageCarFullCapacity);
                  }
                }}
              >
                {garbageCars.map(car => (
                  <MenuItem key={car.id} value={car.id}>
                    {car.GarbageCarId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Updated Full Capacity"
              value={updatedGarbageCarFullCapacity}
              onChange={(e) => setUpdatedGarbageCarFullCapacity(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="contained" color="primary" onClick={handleUpdateGarbageCar}>Update Waste Compactor Truck</Button>
            <Button variant="contained" color="secondary" onClick={handleDeleteGarbageCar} style={{ marginLeft: '10px' }}>Delete Waste Compactor Truck</Button>
          </Box>
        </Paper>
      )}

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManagementPage;
