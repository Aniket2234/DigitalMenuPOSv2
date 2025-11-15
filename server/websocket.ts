import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { storage } from './storage';
import { log } from './vite';

export interface TableStatusUpdate {
  customerId: string;
  phoneNumber: string;
  tableStatus: 'free' | 'occupied' | 'preparing' | 'ready' | 'served';
  tableNumber: string;
  floorNumber: string;
  updatedAt: string;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/table-status'
  });

  // Track connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    log('WebSocket client connected');
    clients.add(ws);

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'pong') {
          // Heartbeat response received
        }
      } catch (error) {
        log('Invalid WebSocket message received');
      }
    });

    ws.on('close', () => {
      log('WebSocket client disconnected');
      clients.delete(ws);
      clearInterval(heartbeat);
    });

    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`);
      clients.delete(ws);
      clearInterval(heartbeat);
    });
  });

  // Function to broadcast table status updates
  const broadcastTableStatus = (update: TableStatusUpdate) => {
    const message = JSON.stringify({
      type: 'tableStatusUpdate',
      data: update
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Set up MongoDB Change Stream to watch for tableStatus changes
  const setupChangeStream = async () => {
    try {
      const db = await storage.getDatabase();
      const customersCollection = db.collection('customers');

      const changeStream = customersCollection.watch([
        {
          $match: {
            $or: [
              { 'updateDescription.updatedFields.tableStatus': { $exists: true } },
              { operationType: 'update' }
            ]
          }
        }
      ], { fullDocument: 'updateLookup' });

      log('MongoDB Change Stream established for table status updates');

      changeStream.on('change', (change: any) => {
        if (change.operationType === 'update' && change.fullDocument) {
          const doc = change.fullDocument;
          
          // Check if tableStatus was actually updated
          if (change.updateDescription?.updatedFields?.tableStatus) {
            const update: TableStatusUpdate = {
              customerId: doc._id.toString(),
              phoneNumber: doc.phoneNumber,
              tableStatus: doc.tableStatus,
              tableNumber: doc.tableNumber || 'NA',
              floorNumber: doc.floorNumber || 'NA',
              updatedAt: new Date().toISOString()
            };

            log(`Table status changed: ${doc.phoneNumber} -> ${doc.tableStatus}`);
            broadcastTableStatus(update);
          }
        }
      });

      changeStream.on('error', (error) => {
        log(`Change Stream error: ${error.message}`);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          log('Attempting to reconnect Change Stream...');
          setupChangeStream();
        }, 5000);
      });

      changeStream.on('close', () => {
        log('Change Stream closed, attempting to reconnect...');
        setTimeout(() => {
          setupChangeStream();
        }, 5000);
      });

    } catch (error: any) {
      log(`Failed to set up Change Stream: ${error.message}`);
      // Retry after delay
      setTimeout(() => {
        log('Retrying Change Stream setup...');
        setupChangeStream();
      }, 10000);
    }
  };

  // Initialize change stream
  setupChangeStream();

  return wss;
}
