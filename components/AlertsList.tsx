'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip, List, ListItem, Divider } from '@mui/material';
import { IPAWSAlert } from '@/types/ipaws';
import { format } from 'date-fns';

interface AlertsListProps {
  alerts: IPAWSAlert[];
  onAlertClick?: (alert: IPAWSAlert) => void;
  selectedAlert?: IPAWSAlert | null;
}

const AlertsList: React.FC<AlertsListProps> = ({ alerts, onAlertClick, selectedAlert }) => {
  const listItemRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});
  
  useEffect(() => {
    if (selectedAlert) {
      const selectedIndex = alerts.findIndex(alert => alert === selectedAlert);
      if (selectedIndex !== -1) {
        const uniqueId = `${selectedAlert.cogId}-${selectedIndex}`;
        const element = listItemRefs.current[uniqueId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [selectedAlert, alerts]);
  
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'Extreme': return 'error';
      case 'Severe': return 'warning';
      case 'Moderate': return 'info';
      case 'Minor': return 'success';
      default: return 'default';
    }
  };

  if (alerts.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No alerts found for the selected area and date range
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: '100%', overflow: 'auto' }}>
      {alerts.map((alert, index) => {
        const info = alert.info?.[0];
        if (!info) return null;
        
        // Use a combination of cogId and index to ensure uniqueness
        const uniqueId = `${alert.cogId}-${index}`;
        const isSelected = selectedAlert === alert;

        return (
          <React.Fragment key={uniqueId}>
            <ListItem 
              ref={(el) => { listItemRefs.current[uniqueId] = el; }}
              alignItems="flex-start" 
              sx={{ 
                py: 2,
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
              onClick={() => onAlertClick?.(alert)}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold' }}>
                    {info.headline || 'Alert'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    {info.severity && (
                      <Chip
                        label={info.severity}
                        size="small"
                        color={getSeverityColor(info.severity) as any}
                      />
                    )}
                    {info.urgency && (
                      <Chip
                        label={info.urgency}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {info.certainty && (
                      <Chip
                        label={info.certainty}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Sent: {format(new Date(alert.sent), 'MMM dd, yyyy h:mm a')}
                    {info.expires && ` | Expires: ${format(new Date(info.expires), 'MMM dd, yyyy h:mm a')}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {info.description}
                  </Typography>
                  {info.area?.[0]?.areaDesc && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Area: {info.area[0].areaDesc}
                    </Typography>
                  )}
                </Box>
              </Box>
            </ListItem>
            {index < alerts.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default AlertsList;