import React, { useEffect, useState } from 'react';
import MapComponent from './MapComponent';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Grid, Typography } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useRoutes } from 'react-router-dom';

const HomePage = ({ containers }) => {
  const [startPointName, setStartPointName] = useState('');
  const [endPointName, setEndPointName] = useState('');
  const [routes, setRoutes] = useState([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [users, setUserLocations] = useState([]);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pointsQuery = await getDocs(collection(db, "StartAndEndPointsLocation"));
        const pointsData = pointsQuery.docs.map(doc => doc.data())[0];

        if (pointsData) {
          setStartPointName(pointsData.StartPointName);
          setEndPointName(pointsData.EndPointName);
        }

                // Fetch user locations
                const userLocationsSnapshot = await getDocs(collection(db, 'userLocations'));
                const userLocationsData = userLocationsSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                setUserLocations(userLocationsData);
                
      } catch (error) {
        console.error("Error fetching start/end points: ", error);
      }
    };

    fetchData();
  }, []);



  return (
    <Container style={{ backgroundColor: '#26355D', color: '#FFFFFF', padding: '20px' }}>
      <MapComponent routes={routes} optimizedRoutes={optimizedRoutes} />

      <Box mt={4} mb={4}>
        <Grid container spacing={4} justifyContent="space-between" alignItems="center">
          <Grid item xs={12} sm={5} container alignItems="center" spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" style={{ color: '#FFFFFF' }}>
                Start Point 🚀 
              </Typography>
            </Grid>
            <Grid item xs={12} container alignItems="center" spacing={2}>
              <Grid item>
                <img src="/mylocation.png" alt="Start Point Logo" style={{ width: '70px', height: '70px' }} />
              </Grid>
              <Grid item>
                <Typography variant="body1" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                  {startPointName || "Loading..."}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} sm={5} container alignItems="center" spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" style={{ color: '#FFFFFF' }}>
                End Point 🏁 
              </Typography>
            </Grid>
            <Grid item xs={12} container alignItems="center" spacing={2}>
              <Grid item>
                <img src="/logo192.png" alt="End Point Logo" style={{ width: '60px', height: '60px' }} />
              </Grid>
              <Grid item>
                <Typography variant="body1" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                  {"Loading..."}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Id</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell component="th" scope="row">{user.Name}</TableCell>
                <TableCell align="right">{user.id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default HomePage;