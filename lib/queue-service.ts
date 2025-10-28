import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  QueueEntry,
  Business,
  WaitTimeData,
} from "@/types/queue";
import { MLService } from "./ml-service";

export class QueueService {
  private static recalculationTimeouts = new Map<string, NodeJS.Timeout>();
  // Join a queue with ML predictions
  static async joinQueue(
    businessId: string,
    userInfo: { name: string; phone?: string; email?: string; partySize?: number }
  ): Promise<string> {
    try {
      // Check if ML service is available
      const isMLAvailable = await MLService.isMLServiceAvailable();
      
      if (isMLAvailable && userInfo.partySize) {
        // Use ML model for prediction
        try {
          const mlResult = await MLService.joinQueueWithML({
            name: userInfo.name,
            size: userInfo.partySize,
          });

          // Create queue entry with ML prediction
          const queueEntry: Omit<QueueEntry, "id"> = {
            userId: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            businessId,
            position: await this.getNextPosition(businessId),
            estimatedWaitTime: mlResult.estimatedWait,
            joinedAt: new Date(),
            status: "waiting",
            userInfo: { ...userInfo, partySize: userInfo.partySize },
            mlPredicted: true, // Flag to indicate ML was used
          };

          const docRef = await addDoc(collection(db, "queues"), {
            ...queueEntry,
            joinedAt: serverTimestamp(),
          });

          await this.updateBusinessQueueLength(businessId);
          return docRef.id;
        } catch (mlError) {
          console.warn("ML prediction failed, falling back to simple calculation:", mlError);
        }
      }

      // Fallback to simple calculation
      return await this.joinQueueFallback(businessId, userInfo);
    } catch (error) {
      console.error("Error joining queue:", error);
      throw error;
    }
  }

  // Fallback method for simple queue joining
  private static async joinQueueFallback(
    businessId: string,
    userInfo: { name: string; phone?: string; email?: string; partySize?: number }
  ): Promise<string> {
    const position = await this.getNextPosition(businessId);
    const estimatedWaitTime = await this.getFallbackWaitTime(businessId, position);

    const queueEntry: Omit<QueueEntry, "id"> = {
      userId: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      businessId,
      position,
      estimatedWaitTime,
      joinedAt: new Date(),
      status: "waiting",
      userInfo,
      mlPredicted: false,
    };

    const docRef = await addDoc(collection(db, "queues"), {
      ...queueEntry,
      joinedAt: serverTimestamp(),
    });

    await this.updateBusinessQueueLength(businessId);
    return docRef.id;
  }

  // Helper to get next position
  private static async getNextPosition(businessId: string): Promise<number> {
    const queueQuery = query(
      collection(db, "queues"),
      where("businessId", "==", businessId),
      where("status", "==", "waiting")
    );

    const queueSnapshot = await getDocs(queueQuery);
    
    let maxPosition = 0;
    queueSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.position > maxPosition) {
        maxPosition = data.position;
      }
    });
    
    return maxPosition + 1;
  }

  // Get queue position and wait time
  static async getQueueStatus(queueId: string): Promise<QueueEntry | null> {
    try {
      const docRef = doc(db, "queues", queueId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt || Date.now()),
        } as QueueEntry;
      }

      return null;
    } catch (error) {
      console.error("Error getting queue status:", error);
      throw error;
    }
  }

  // Get estimated wait time with ML integration
  static async getEstimatedWaitTime(
    businessId: string,
    position: number,
    partySize: number = 2
  ): Promise<number> {
    try {
      const isMLAvailable = await MLService.isMLServiceAvailable();
      
      if (isMLAvailable) {
        // Get current queue size
        const queueSize = await this.getCurrentQueueSize(businessId);
        const currentHour = new Date().getHours();

        const mlWaitTime = await MLService.getUpdatedWaitTime({
          queueSize,
          currentHour,
          partySize,
        });

        return mlWaitTime;
      }
    } catch (error) {
      console.warn("ML wait time prediction failed, using fallback:", error);
    }

    return await this.getFallbackWaitTime(businessId, position);
  }

  // Get current queue size for ML predictions
  private static async getCurrentQueueSize(businessId: string): Promise<number> {
    const queueQuery = query(
      collection(db, "queues"),
      where("businessId", "==", businessId),
      where("status", "==", "waiting")
    );

    const queueSnapshot = await getDocs(queueQuery);
    return queueSnapshot.size;
  }

  // Fallback wait time calculation
  static async getFallbackWaitTime(
    businessId: string,
    position: number
  ): Promise<number> {
    try {
      const businessDoc = await getDoc(doc(db, "businesses", businessId));
      if (businessDoc.exists()) {
        const business = businessDoc.data() as Business;
        return position * (business.averageServiceTime || 10);
      }
      return position * 10; // Default 10 minutes per person
    } catch (error) {
      console.error("Error calculating fallback wait time:", error);
      return position * 10;
    }
  }

  // Update business queue length
  static async updateBusinessQueueLength(businessId: string): Promise<void> {
    try {
      const queueQuery = query(
        collection(db, "queues"),
        where("businessId", "==", businessId),
        where("status", "==", "waiting")
      );

      const queueSnapshot = await getDocs(queueQuery);
      const currentQueueLength = queueSnapshot.size;

      await updateDoc(doc(db, "businesses", businessId), {
        currentQueueLength,
      });
    } catch (error) {
      console.error("Error updating business queue length:", error);
    }
  }

  // Listen to queue updates with real-time position updates
  static subscribeToQueue(
    businessId: string,
    callback: (entries: QueueEntry[]) => void
  ) {
    const queueQuery = query(
      collection(db, "queues"),
      where("businessId", "==", businessId),
      where("status", "==", "waiting")
    );

    return onSnapshot(queueQuery, (snapshot) => {
      const entries: QueueEntry[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt || Date.now()),
        };
      }) as QueueEntry[];

      // Sort by position (use existing position from Firebase)
      entries.sort((a, b) => a.position - b.position);
      
      // Return entries as-is to prevent duplicates
      callback(entries);
      
      // Only recalculate positions if they're not sequential
      const needsRecalculation = entries.some((entry, index) => entry.position !== index + 1);
      
      if (needsRecalculation) {
        // Clear existing timeout for this business
        const existingTimeout = this.recalculationTimeouts.get(businessId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        // Debounced recalculation to prevent rapid updates
        const timeout = setTimeout(() => {
          this.recalculatePositionsAsync(entries);
          this.recalculationTimeouts.delete(businessId);
        }, 500);
        
        this.recalculationTimeouts.set(businessId, timeout);
      }
    });
  }

  // Recalculate positions asynchronously (non-blocking)
  private static async recalculatePositionsAsync(entries: QueueEntry[]): Promise<void> {
    const updatePromises: Promise<void>[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const newPosition = i + 1;
      
      // Update position if it changed (batch these updates)
      if (entry.position !== newPosition) {
        const updatePromise = updateDoc(doc(db, "queues", entry.id), {
          position: newPosition,
        }).catch(error => {
          console.warn(`Failed to update position for entry ${entry.id}:`, error);
        });
        
        updatePromises.push(updatePromise);
      }
    }
    
    // Execute all updates in parallel without blocking
    if (updatePromises.length > 0) {
      Promise.all(updatePromises).catch(error => {
        console.warn('Some position updates failed:', error);
      });
    }
  }

  // Update wait times for all entries in a business queue
  static async updateAllWaitTimes(businessId: string): Promise<void> {
    try {
      const isMLAvailable = await MLService.isMLServiceAvailable();
      
      if (!isMLAvailable) {
        console.log('ML service not available, skipping wait time updates');
        return;
      }

      // Get all waiting entries
      const queueQuery = query(
        collection(db, "queues"),
        where("businessId", "==", businessId),
        where("status", "==", "waiting")
      );

      const queueSnapshot = await getDocs(queueQuery);
      const entries: QueueEntry[] = [];
      
      queueSnapshot.forEach(doc => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt || Date.now()),
        } as QueueEntry);
      });

      // Sort by position
      entries.sort((a, b) => a.position - b.position);

      const currentHour = new Date().getHours();
      const totalQueueSize = entries.length;

      // Update each entry with fresh ML prediction
      const updatePromises = entries.map(async (entry, index) => {
        try {
          const partySize = entry.userInfo?.partySize || 2;
          const remainingQueueSize = Math.max(1, totalQueueSize - index);

          const updatedWaitTime = await MLService.getUpdatedWaitTime({
            queueSize: remainingQueueSize,
            currentHour,
            partySize,
          });

          // Only update if the wait time changed significantly (more than 2 minutes)
          if (Math.abs(updatedWaitTime - entry.estimatedWaitTime) > 2) {
            await updateDoc(doc(db, "queues", entry.id), {
              estimatedWaitTime: updatedWaitTime,
              lastUpdated: serverTimestamp(),
            });
            console.log(`Updated wait time for ${entry.userInfo.name}: ${updatedWaitTime} minutes`);
          }
        } catch (error) {
          console.warn(`Failed to update wait time for entry ${entry.id}:`, error);
        }
      });

      await Promise.all(updatePromises);
      console.log(`Updated wait times for ${entries.length} queue entries`);
    } catch (error) {
      console.error("Failed to update wait times:", error);
    }
  }

  // Call next customer (update status to 'called')
  static async callCustomer(queueId: string): Promise<void> {
    try {
      console.log(`📞 Calling customer ${queueId}...`);
      
      // Get the queue entry first to get customer info
      const queueEntry = await this.getQueueStatus(queueId);
      
      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      console.log(`📝 Updating status to 'called' for ${queueEntry.userInfo.name}`);
      
      await updateDoc(doc(db, "queues", queueId), {
        status: "called",
        calledAt: serverTimestamp(),
      });

      console.log(`✅ Customer ${queueEntry.userInfo.name} has been called`);

      // Trigger wait time updates for remaining customers
      setTimeout(() => {
        this.updateAllWaitTimes(queueEntry.businessId);
      }, 1000); // Small delay to let Firebase update propagate
    } catch (error) {
      console.error("Error calling customer:", error);
      throw error;
    }
  }

  // Serve customer (update status to 'served')
  static async serveCustomer(queueId: string): Promise<void> {
    try {
      console.log(`🔄 Serving customer ${queueId}...`);
      
      const queueEntry = await this.getQueueStatus(queueId);
      
      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      console.log(`📝 Updating status to 'served' for ${queueEntry.userInfo.name}`);
      
      await updateDoc(doc(db, "queues", queueId), {
        status: "served",
        servedAt: serverTimestamp(),
      });

      console.log(`✅ Customer ${queueEntry.userInfo.name} marked as served`);

      // Record analytics data
      const actualWaitTime = Math.floor(
        (new Date().getTime() - queueEntry.joinedAt.getTime()) / (1000 * 60)
      );
      await this.recordWaitTimeData(queueEntry, actualWaitTime);

      // Trigger wait time updates for remaining customers
      setTimeout(() => {
        this.updateAllWaitTimes(queueEntry.businessId);
      }, 1000);
    } catch (error) {
      console.error("Error serving customer:", error);
      throw error;
    }
  }

  // Remove customer from queue
  static async removeCustomer(queueId: string): Promise<void> {
    try {
      const queueEntry = await this.getQueueStatus(queueId);
      
      await updateDoc(doc(db, "queues", queueId), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });

      if (queueEntry) {
        // Trigger wait time updates for remaining customers
        setTimeout(() => {
          this.updateAllWaitTimes(queueEntry.businessId);
        }, 1000);
      }
    } catch (error) {
      console.error("Error removing customer:", error);
      throw error;
    }
  }

  // Listen to a specific queue entry for real-time updates
  static subscribeToQueueEntry(
    queueId: string,
    callback: (entry: QueueEntry | null) => void
  ) {
    const queueDocRef = doc(db, "queues", queueId);

    return onSnapshot(queueDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const entry: QueueEntry = {
          id: docSnapshot.id,
          ...data,
          joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt || Date.now()),
        } as QueueEntry;

        callback(entry);
      } else {
        callback(null);
      }
    });
  }

  // Record wait time data for analytics
  static async recordWaitTimeData(
    queueEntry: QueueEntry,
    actualWaitTime: number
  ): Promise<void> {
    try {
      const waitTimeData: Omit<WaitTimeData, "id"> = {
        businessId: queueEntry.businessId,
        timestamp: new Date(),
        queueLength: queueEntry.position,
        averageWaitTime: actualWaitTime,
        actualWaitTimes: [actualWaitTime],
        dayOfWeek: new Date().getDay(),
        hourOfDay: new Date().getHours(),
      };

      await addDoc(collection(db, "waitTimeData"), {
        ...waitTimeData,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error recording wait time data:", error);
    }
  }
}
