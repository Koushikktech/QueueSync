// Utility functions for handling Firebase timestamps and dates

export function convertFirebaseDate(firebaseDate: any): Date {
  if (!firebaseDate) {
    return new Date()
  }
  
  // If it's already a Date object
  if (firebaseDate instanceof Date) {
    return firebaseDate
  }
  
  // If it's a Firebase Timestamp with toDate method
  if (firebaseDate.toDate && typeof firebaseDate.toDate === 'function') {
    return firebaseDate.toDate()
  }
  
  // If it's a string or number, try to parse it
  if (typeof firebaseDate === 'string' || typeof firebaseDate === 'number') {
    return new Date(firebaseDate)
  }
  
  // If it has seconds and nanoseconds (Firebase Timestamp object)
  if (firebaseDate.seconds !== undefined) {
    return new Date(firebaseDate.seconds * 1000 + (firebaseDate.nanoseconds || 0) / 1000000)
  }
  
  // Fallback to current date
  return new Date()
}

export function formatTime(date: any): string {
  const convertedDate = convertFirebaseDate(date)
  return convertedDate.toLocaleTimeString()
}

export function formatDate(date: any): string {
  const convertedDate = convertFirebaseDate(date)
  return convertedDate.toLocaleDateString()
}

export function formatDateTime(date: any): string {
  const convertedDate = convertFirebaseDate(date)
  return convertedDate.toLocaleString()
}