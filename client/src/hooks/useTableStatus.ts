import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface TableStatus {
  tableStatus: 'free' | 'occupied' | 'preparing' | 'ready' | 'served';
  tableNumber: string;
  floorNumber: string;
}

interface TableStatusUpdate extends TableStatus {
  customerId: string;
  phoneNumber: string;
  updatedAt: string;
}

export function useTableStatus(phoneNumber: string | null) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial table status via REST
  const { data: tableStatus, isLoading } = useQuery<TableStatus>({
    queryKey: ['/api/customers', phoneNumber, 'table-status'],
    enabled: !!phoneNumber,
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  useEffect(() => {
    if (!phoneNumber) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/table-status`;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected for table status updates');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'ping') {
              // Respond to heartbeat
              ws.send(JSON.stringify({ type: 'pong' }));
            } else if (message.type === 'tableStatusUpdate') {
              const update: TableStatusUpdate = message.data;

              // Only update if the message is for this customer
              if (update.phoneNumber === phoneNumber) {
                // Optimistically update the cached query data
                queryClient.setQueryData<TableStatus>(
                  ['/api/customers', phoneNumber, 'table-status'],
                  {
                    tableStatus: update.tableStatus,
                    tableNumber: update.tableNumber,
                    floorNumber: update.floorNumber,
                  }
                );
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, attempting to reconnect...');
          setIsConnected(false);
          wsRef.current = null;

          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [phoneNumber, queryClient]);

  return {
    tableStatus: tableStatus?.tableStatus || 'free',
    tableNumber: tableStatus?.tableNumber || 'NA',
    floorNumber: tableStatus?.floorNumber || 'NA',
    isLoading,
    isConnected,
  };
}

// Helper function to get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'free':
      return 'bg-white dark:bg-white border-2 border-black';
    case 'occupied':
      return 'bg-red-500 dark:bg-red-500 border-2 border-black';
    case 'preparing':
      return 'bg-yellow-500 dark:bg-yellow-500 border-2 border-black';
    case 'ready':
      return 'bg-green-500 dark:bg-green-500 border-2 border-black';
    case 'served':
      return 'bg-purple-500 dark:bg-purple-500 border-2 border-black';
    default:
      return 'bg-white dark:bg-white border-2 border-black';
  }
}

// Helper function to get status text
export function getStatusText(status: string): string {
  switch (status) {
    case 'free':
      return 'Free';
    case 'occupied':
      return 'Occupied';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'served':
      return 'Served';
    default:
      return 'Unknown';
  }
}
