interface MLPredictionRequest {
  name: string;
  size: number;
}

interface MLPredictionResponse {
  partyId: string;
  name: string;
  status: string;
  estimatedWait: number;
}

interface WaitTimeUpdateRequest {
  queueSize: number;
  currentHour: number;
  partySize: number;
}

export class MLService {
  private static baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

  // Join queue using ML model predictions
  static async joinQueueWithML(partyData: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${this.baseUrl}/join_queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partyData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error calling ML API:', error);
      throw error;
    }
  }

  // Get updated wait time prediction based on current conditions
  static async getUpdatedWaitTime(params: WaitTimeUpdateRequest): Promise<number> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(`${this.baseUrl}/predict_wait_time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.estimatedWait || 10; // Fallback to 10 minutes
    } catch (error) {
      console.error('Error getting updated wait time:', error);
      // Return fallback calculation
      return Math.max(5, params.queueSize * 10);
    }
  }

  // Check if ML service is available
  static async isMLServiceAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('ML service not available, falling back to simple calculations');
      return false;
    }
  }
}