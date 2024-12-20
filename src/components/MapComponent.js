import React, { useEffect, useState } from 'react';
import MapGL, { Source, Layer, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button, Stack } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import mapboxSdk from '@mapbox/mapbox-sdk/umd/mapbox-sdk.min';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWhtZGJzaHJlZW0iLCJhIjoiY2x4NnNocG4yMjNqZjJpczl2OXJmaTJ5eiJ9.WuEnDR_f--XPNGHw0mrxLA';

const directionsClient = mapboxSdk({ accessToken: MAPBOX_TOKEN }).directions;

const formatTime = (time) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  console.log(seconds);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

};

const calculateTimeWithStops = (totalTime, containers) => {
  const extraTime = containers.reduce((acc, container) => {
    return acc + (container.GarbageFullCapacity === 240 ? 35 : 60);
  }, 0);
  return totalTime + extraTime;
};

const RouteDetailsTable = ({ standardRoute, optimizedRoute }) => {
  if (!standardRoute || !optimizedRoute) return null;

  const calculateFuelConsumption = (distance) => {
    const fuelConsumptionRate = 70; // Liters per 100 km
    return (distance / 1000) * (fuelConsumptionRate / 100);
  };

  const timeWithStopsStandard = calculateTimeWithStops(standardRoute.totalTime, standardRoute.filteredContainers);
  const timeWithStopsOptimized = calculateTimeWithStops(optimizedRoute.totalTime, optimizedRoute.filteredContainers);

  return (
    <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#2b2b2b', color: '#FFFFFF', borderRadius: '5px' }}>
      <h3 style={{ color: '#FFA500' }}>Route Comparison</h3>
      <table style={{ width: '105%', color: '#FFFFFF' }}>
        <thead>
          <tr>
            <th></th>
            <th>Standard Route</th>
            <th>Optimized Route</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Time on route</td>
            <td>{formatTime(timeWithStopsStandard)}</td>
            <td>{formatTime(timeWithStopsOptimized)} hrs</td>
          </tr>
          <tr>
            <td>Driving time on route</td>
            <td>{formatTime(standardRoute.totalTime)}</td>
            <td>{formatTime(optimizedRoute.totalTime)} hrs</td>
          </tr>
          <tr>
            <td>Total length driven</td>
            <td>{(standardRoute.totalDistance / 1000).toFixed(2)} km</td>
            <td>{(optimizedRoute.totalDistance / 1000).toFixed(2)} km</td>
          </tr>
          <tr>
            <td>Fuel consumption</td>
            <td>{calculateFuelConsumption(standardRoute.totalDistance).toFixed(2)} liters</td>
            <td>{calculateFuelConsumption(optimizedRoute.totalDistance).toFixed(2)} liters</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};


const RouteDetails = ({ details, totalDistance, totalTime, carInfo, garbageInfo }) => {
  if (!details || details.length === 0) return null;

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '10px', 
      backgroundColor: '#2b2b2b', 
      color: '#FFFFFF',
      borderRadius: '5px',
      maxHeight: '500px', 
      overflowY: 'auto' 
    }}>
      <h3 style={{ color: '#FFA500' }}>Route Details</h3>
      <p>
        <strong>ID:</strong> {carInfo.id}<br />
        <strong>Total Distance:</strong> {(totalDistance / 1000).toFixed(2)} km<br />
        <strong>Total Time:</strong> {formatTime(totalTime)} hrs<br />
      </p>
      <div>
        {garbageInfo.map((container, index) => (
          <div key={index}>
            <strong>{container.GarbageName}:</strong> {container.GarbageCurrentCapacity} / {container.GarbageFullCapacity} Liter
          </div>
        ))}
      </div>
      <div>
        {details.map((route, index) => {
          const steps = route.steps || [];
          return (
            <div key={index}>
              <h4 style={{ marginTop: '20px' }}>Instructions for Route {index + 1}</h4>
              <ol style={{ marginLeft: '20px' }}>
  {steps.map((step, idx) => (
    <li key={idx}>{step.maneuver.instruction}</li>
  ))}
  <li>Head north on Rue Maurice Ravel</li>
  <li>At the roundabout, take the 1st exit onto Av. Léon Blum</li>
</ol>

            </div>
          );
        })}
      </div>
    </div>
  );
};





const MapComponent = () => {
  const [containers, setContainers] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeDetails, setRouteDetails] = useState([]);
  const [routeColor, setRouteColor] = useState('#000000'); // Default color black for the live road
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [carInfo, setCarInfo] = useState({});
  const [totalGarbageCapacity, setTotalGarbageCapacity] = useState(0);
  const [filteredContainers, setFilteredContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null); // State for selected container
  const [userLocations, setUserLocations] = useState([]);
  const [markers, setMarkers] = useState([]);


  const [viewport, setViewport] = useState({
    latitude: 47.51463717872925,
    longitude: 6.814662797521412,
    zoom: 12,
  });

  const [standardRoute, setStandardRoute] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const containersSnapshot = await getDocs(collection(db, 'Locations'));
        const containersData = containersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setContainers(containersData);

                // Fetch user locations
                const userLocationsSnapshot = await getDocs(collection(db, 'userLocations'));
                const userLocationsData = userLocationsSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                setUserLocations(userLocationsData);

        const pointsSnapshot = await getDocs(collection(db, 'StartAndEndPointsLocation'));
        const pointsData = pointsSnapshot.docs.map(doc => doc.data())[0];

        if (pointsData) {
          setStartPoint(pointsData.StartPoint);
          setEndPoint(pointsData.EndPoint);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };


    

    fetchData();
  }, []);

  const fetchCarData = async () => {
    const carsSnapshot = await getDocs(collection(db, 'GarbageCars'));
    const carsData = carsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return carsData;
  };

 const calculateRoute = async () => {
  if (!endPoint || userLocations.length < 1) return;

  const coordinates = userLocations.map(userLocation => [
    [userLocation.longitude, userLocation.latitude],
    [endPoint.longitude, endPoint.latitude]
  ]);

  try {
    const routes = await Promise.all(
      coordinates.map(async (coord) => {
        const response = await directionsClient.getDirections({
          profile: 'driving',
          waypoints: coord.map(c => ({ coordinates: c })),
          geometries: 'geojson',
          steps: true,
          overview: 'full',
        }).send();

        return {
          geometry: response.body.routes[0].geometry,
          distance: response.body.routes[0].distance,
          duration: response.body.routes[0].duration,
        };
      })
    );

    const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);
    const totalTime = routes.reduce((sum, route) => sum + route.duration, 0);

    setRoute({
      type: 'FeatureCollection',
      features: routes.map(route => ({
        type: 'Feature',
        geometry: route.geometry,
        properties: {},
      })),
    });

    setRouteDetails(routes);
    setRouteColor('#0000FF'); // Blue for standard route
    setTotalDistance(totalDistance);
    setTotalTime(totalTime);

    setStandardRoute({
      totalDistance,
      totalTime,
      filteredContainers: userLocations, // Save user locations as the points
    });
  } catch (error) {
    console.error("Error calculating standard route:", error);
  }
};


const [optimalMeetingPoint, setOptimalMeetingPoint] = useState(null); // Add to state

const handleOptimizedRoute = async () => {
  if (!startPoint || userLocations.length === 0) {
    console.log("Missing start point or user locations.");
    return;
  }

  try {
    // Step 1: Combine all locations (start point + user locations) and calculate the centroid
    const allLocations = [
      { latitude: startPoint.latitude, longitude: startPoint.longitude },
      ...userLocations,
    ];

    const calculateCentroid = (locations) => {
      const latitudes = locations.map(loc => loc.latitude);
      const longitudes = locations.map(loc => loc.longitude);
      const avgLatitude = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const avgLongitude = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
      return { latitude: avgLatitude, longitude: avgLongitude };
    };

    const meetingPoint = calculateCentroid(allLocations);
    setOptimalMeetingPoint(meetingPoint); // Update state with the calculated point

    console.log("Optimal Meeting Point:", meetingPoint);

    // Step 2: Calculate routes from all nodes to the optimal meeting point
    const routesToOptimalPoint = await Promise.all(
      allLocations.map(async (location) => {
        const response = await directionsClient.getDirections({
          profile: 'driving',
          waypoints: [
            { coordinates: [location.longitude, location.latitude] }, // Node location
            { coordinates: [meetingPoint.longitude, meetingPoint.latitude] }, // Optimal meeting point
          ],
          geometries: 'geojson',
          steps: true,
          overview: 'full',
        }).send();

        return {
          geometry: response.body.routes[0].geometry,
          distance: response.body.routes[0].distance,
          duration: response.body.routes[0].duration,
        };
      })
    );

    // Step 3: Aggregate data and update the state
    const totalDistance = routesToOptimalPoint.reduce((sum, route) => sum + route.distance, 0);
    const totalTime = routesToOptimalPoint.reduce((sum, route) => sum + route.duration, 0);

    setRoute({
      type: 'FeatureCollection',
      features: routesToOptimalPoint.map(route => ({
        type: 'Feature',
        geometry: route.geometry,
        properties: {},
      })),
    });

    // Update additional states
    setRouteDetails(routesToOptimalPoint);
    setRouteColor('#FF0000'); // Red for optimized route
    setTotalDistance(totalDistance);
    setTotalTime(totalTime);

    console.log("Optimized routes and big black point marker added successfully.");
  } catch (error) {
    console.error("Error calculating optimized routes:", error);
  }
};






const handleStandardRoute = async () => {
  if (!startPoint || userLocations.length === 0 || !endPoint) {
    console.log("Missing start point, user locations, or end point.");
    return;
  }

  try {
    // Step 1: Calculate routes from all user locations to the end point
    const userToEndpointRoutes = await Promise.all(
      userLocations.map(async (userLocation) => {
        const response = await directionsClient.getDirections({
          profile: 'driving',
          waypoints: [
            { coordinates: [userLocation.longitude, userLocation.latitude] }, // User location
            { coordinates: [endPoint.longitude, endPoint.latitude] }, // End point
          ],
          geometries: 'geojson',
          steps: true,
          overview: 'full',
        }).send();

        return {
          geometry: response.body.routes[0].geometry,
          distance: response.body.routes[0].distance,
          duration: response.body.routes[0].duration,
        };
      })
    );
    

    // Step 2: Calculate route from start point to end point
    const startToEndpointResponse = await directionsClient.getDirections({
      profile: 'driving',
      waypoints: [
        { coordinates: [startPoint.longitude, startPoint.latitude] }, // Start point
        { coordinates: [endPoint.longitude, endPoint.latitude] }, // End point
      ],
      geometries: 'geojson',
      steps: true,
      overview: 'full',
    }).send();

    const startToEndpointRoute = {
      geometry: startToEndpointResponse.body.routes[0].geometry,
      distance: startToEndpointResponse.body.routes[0].distance,
      duration: startToEndpointResponse.body.routes[0].duration,
    };

    // Step 3: Aggregate data and update the state
    const totalDistance =
      userToEndpointRoutes.reduce((sum, route) => sum + route.distance, 0) +
      startToEndpointRoute.distance;
    const totalTime =
      userToEndpointRoutes.reduce((sum, route) => sum + route.duration, 0) +
      startToEndpointRoute.duration;

    setRoute({
      type: 'FeatureCollection',
      features: [
        ...userToEndpointRoutes.map(route => ({
          type: 'Feature',
          geometry: route.geometry,
          properties: {},
        })),
        {
          type: 'Feature',
          geometry: startToEndpointRoute.geometry,
          properties: {},
        },
      ],
    });

    setRouteDetails([...userToEndpointRoutes, startToEndpointRoute]);
    setRouteColor('#0000FF'); // Blue for standard route
    setTotalDistance(totalDistance);
    setTotalTime(totalTime);

    console.log("Standard routes calculated successfully.");
  } catch (error) {
    console.error("Error calculating standard routes:", error);
  }
};


  const clearRoute = () => {
    setRoute(null);
    setRouteDetails([]);
    setTotalDistance(0);
    setTotalTime(0);
    setCarInfo({});
    setTotalGarbageCapacity(0);
    setFilteredContainers([]);
    setStandardRoute(null);
    setOptimizedRoute(null);
    setSelectedContainer(null); // Clear selected container
    setOptimalMeetingPoint(null); // Add to state

  };

  const handleMarkerClick = (container) => {
    setSelectedContainer(container);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '90vh' }}> {/* Increased height for a bigger map */}
      <MapGL
        {...viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={(evt) => setViewport(evt.viewState)}
        dragPan={true} // Enable drag to pan
        dragRotate={true} // Enable drag to rotate
        scrollZoom={true} // Enable scroll to zoom
        touchZoomRotate={true} // Enable touch to zoom and rotate
        doubleClickZoom={true} // Enable double click to zoom
      >
        {startPoint && (
          <Marker
            longitude={startPoint.longitude}
            latitude={startPoint.latitude}
          >
            <img
              src="/mylocation.png"
              alt="Start Point"
              style={{ width: '50px', height: '50px' }}
            />
          </Marker>
        )}

        {endPoint && (
          <Marker
            longitude={endPoint.longitude}
            latitude={endPoint.latitude}
          >
            <img
              src="/university.png"
              alt="End Point"
              style={{ width: '30px', height: '30px' }}
            />
          </Marker>
        )}

        {containers.map(container => (
          <Marker
            key={container.id}
            longitude={container.longitude}
            latitude={container.latitude}
            onClick={() => handleMarkerClick(container)} // Handle marker click
          >
            <img
              src="/location.png"
              alt={container.GarbageName}
              style={{ width: '60px', height: '60px', cursor: 'pointer' }}
            />
          </Marker>
        ))}
        
        {userLocations.map(user => (
          <Marker key={user.id} longitude={user.longitude} latitude={user.latitude}>
            <img
              src="/user.png"
              alt={user.name}
              style={{ width: '50px', height: '50px', cursor: 'pointer' }}
            />
          </Marker>
        ))}

{optimalMeetingPoint && (
  <Marker
    latitude={optimalMeetingPoint.latitude}
    longitude={optimalMeetingPoint.longitude}
  >
    <div
      style={{
        width: '20px',
        height: '20px',
        backgroundColor: 'red',
        borderRadius: '50%',
        border: '2px solid white',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
      }}
      title="Optimal Meeting Point"
    />
  </Marker>
)}

        {route && (
          <Source id="route" type="geojson" data={route}>
            <Layer
              id="routeLayer"
              type="line"
              source="route"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': routeColor, 'line-width': 4 }}
            />
          </Source>
        )}
        
      </MapGL>
      <Stack spacing={2} direction="column" style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
        <Button
          variant="contained"
          style={{
            backgroundColor: '#FF8F00',
          }}
          onClick={handleStandardRoute }
        >
          Standard Route
        </Button>
        <Button
          variant="contained"
          style={{
            backgroundColor: '#000000',
          }}
          onClick={handleOptimizedRoute}
        >
          Optimized Route
        </Button>
        <Button
          variant="contained"
          style={{
            backgroundColor: '#FF0000',
          }}
          onClick={clearRoute}
        >
          Clear Map
        </Button>
      </Stack>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, width: '300px' }}>
        <RouteDetailsTable
          standardRoute={standardRoute}
          optimizedRoute={optimizedRoute}
        />
      </div>
      <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 1, width: '300px' }}>
        <RouteDetails
          details={routeDetails}
          totalDistance={totalDistance}
          totalTime={totalTime}
          carInfo={carInfo}
          garbageInfo={filteredContainers}
          totalGarbageCapacity={totalGarbageCapacity}
        />
      </div>
    </div>
  );
};

export default MapComponent;
