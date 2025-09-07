'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Box, Paper, Typography, Container, Alert, CircularProgress, ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { subDays } from 'date-fns';
import AlertsList from '@/components/AlertsList';
import { fetchIPAWSAlerts } from '@/lib/api';
import { IPAWSAlert } from '@/types/ipaws';

const DateRangeSelector = dynamic(() => import('@/components/DateRangeSelector'), {
  ssr: false
});

const MapComponent = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  )
});


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function Home() {
  const [alerts, setAlerts] = useState<IPAWSAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(subDays(new Date(), 14));
  const [endDate, setEndDate] = useState(new Date());
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | undefined>();
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<IPAWSAlert | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchIPAWSAlerts({
        startDate,
        endDate,
        bounds: mapBounds || undefined
      });
      
      setAlerts(data);
      
      if (data.length === 0) {
        setError('No alerts found for the selected criteria');
      }
    } catch (err) {
      setError('Failed to load alerts. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, mapBounds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAlerts();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [loadAlerts]);

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleLocationFound = (location: { latitude: number; longitude: number }) => {
    setMapCenter(location);
  };

  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    // setMapBounds(bounds);
  }, []);

  const handleAlertClick = useCallback((alert: IPAWSAlert) => {
    setSelectedAlert(alert);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 0 }}>
            <Container maxWidth="xl">
              <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Historical Emergency Alert Viewer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View historical emergency alerts from the Integrated Public Alert and Warning System
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box sx={{ flex: '1 1 400px' }}>
                  <DateRangeSelector
                    startDate={startDate}
                    endDate={endDate}
                    onDateChange={handleDateChange}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {loading && <CircularProgress size={20} />}
                  <Typography variant="body2" color="text.secondary">
                    {alerts.length} alerts found
                  </Typography>
                </Box>
              </Box>
            </Container>
          </Paper>

          <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
            <Box sx={{ flex: '1 1 66%', height: '100%', minHeight: '500px' }}>
              <MapComponent
                alerts={alerts}
                onBoundsChange={handleBoundsChange}
                center={mapCenter}
                selectedAlert={selectedAlert}
                onAlertClick={handleAlertClick}
              />
            </Box>
            
            <Box sx={{ flex: '1 1 34%', height: '100%', overflow: 'auto' }}>
              <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'background.paper' }}>
                  <Typography variant="h6">
                    Alert Details
                  </Typography>
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {error && (
                    <Box sx={{ p: 2 }}>
                      <Alert severity="info">{error}</Alert>
                    </Box>
                  )}
                  
                  <AlertsList 
                    alerts={alerts} 
                    onAlertClick={handleAlertClick}
                    selectedAlert={selectedAlert}
                  />
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
