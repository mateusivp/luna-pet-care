import { Timestamp } from 'firebase/firestore'

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'admin' | 'employee' | 'client' | 'driver'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export interface User {
  uid: string
  email: string
  name: string
  phone?: string
  photoURL?: string
  role: UserRole
  status: UserStatus
  customClaims?: Record<string, any>
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  lastLoginAt?: Timestamp | Date
  lastLogoutAt?: Timestamp | Date
}

export interface CreateUserData {
  email: string
  name: string
  phone?: string
  photoURL?: string
  role: UserRole
  password?: string
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface Client {
  id: string
  userId: string // referência ao User
  name: string
  email: string
  phone: string
  cpf?: string
  birthDate?: Timestamp | Date
  address: Address
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    notifications: boolean
    smsNotifications: boolean
    emailNotifications: boolean
    preferredTimeSlots: string[]
  }
  notes?: string
  status: 'active' | 'inactive'
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ============================================================================
// PET TYPES
// ============================================================================

export type PetSize = 'small' | 'medium' | 'large' | 'extra-large'
export type PetGender = 'male' | 'female'
export type PetStatus = 'active' | 'inactive' | 'deceased'

export interface Pet {
  id: string
  clientId: string
  name: string
  species: string // 'dog', 'cat', etc.
  breed: string
  size: PetSize
  weight: number // em kg
  age: number // em anos
  gender: PetGender
  color: string
  photoURL?: string
  microchip?: string
  status: PetStatus
  medicalInfo: {
    allergies: string[]
    medications: string[]
    conditions: string[]
    vaccinations: Vaccination[]
    lastVetVisit?: Timestamp | Date
    vetContact?: {
      name: string
      phone: string
      clinic: string
    }
  }
  behaviorNotes?: string
  specialNeeds?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Vaccination {
  name: string
  date: Timestamp | Date
  nextDue?: Timestamp | Date
  veterinarian: string
  batchNumber?: string
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export type ServiceCategory = 'grooming' | 'veterinary' | 'boarding' | 'training' | 'taxi' | 'other'
export type ServiceStatus = 'active' | 'inactive' | 'maintenance'

export interface Service {
  id: string
  name: string
  description: string
  category: ServiceCategory
  duration: number // em minutos
  price: number // em centavos
  petSizes: PetSize[]
  requirements?: string[]
  imageURL?: string
  status: ServiceStatus
  maxPetsPerSession: number
  isPopular: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'
export type PaymentMethod = 'cash' | 'card' | 'pix' | 'credit' | 'debit'

export interface Appointment {
  id: string
  clientId: string
  petIds: string[]
  serviceId: string
  employeeId?: string
  driverId?: string // para serviços de taxi
  scheduledDate: Timestamp | Date
  startTime: string // formato HH:mm
  endTime: string // formato HH:mm
  status: AppointmentStatus
  notes?: string
  internalNotes?: string // apenas para funcionários
  payment: {
    amount: number // em centavos
    method?: PaymentMethod
    status: PaymentStatus
    transactionId?: string
    paidAt?: Timestamp | Date
  }
  location?: {
    type: 'pickup' | 'delivery' | 'both'
    pickupAddress?: Address
    deliveryAddress?: Address
  }
  reminders: {
    sent24h: boolean
    sent2h: boolean
    sent30min: boolean
  }
  rating?: {
    score: number // 1-5
    comment?: string
    createdAt: Timestamp | Date
  }
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ============================================================================
// TAXI DOG TYPES
// ============================================================================

export type TripStatus = 
  | 'requested' 
  | 'accepted' 
  | 'driver-assigned' 
  | 'pickup-arrived' 
  | 'pet-picked-up' 
  | 'in-transit' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled'

export interface TaxiTrip {
  id: string
  clientId: string
  petIds: string[]
  driverId?: string
  pickupAddress: Address
  deliveryAddress: Address
  scheduledTime: Timestamp | Date
  estimatedDuration: number // em minutos
  estimatedDistance: number // em km
  status: TripStatus
  fare: {
    baseFare: number
    distanceFare: number
    timeFare: number
    total: number
    currency: 'BRL'
  }
  route?: {
    distance: number
    duration: number
    polyline: string
  }
  tracking: {
    currentLocation?: {
      lat: number
      lng: number
      timestamp: Timestamp | Date
    }
    estimatedArrival?: Timestamp | Date
  }
  specialInstructions?: string
  rating?: {
    clientRating?: number
    driverRating?: number
    clientComment?: string
    driverComment?: string
  }
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Driver {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  vehicleInfo: {
    make: string
    model: string
    year: number
    color: string
    licensePlate: string
    capacity: number // número máximo de pets
  }
  documents: {
    driverLicense: string // URL do documento
    vehicleRegistration: string
    insurance: string
    backgroundCheck: string
  }
  status: 'active' | 'inactive' | 'busy' | 'offline'
  location?: {
    lat: number
    lng: number
    timestamp: Timestamp | Date
  }
  rating: {
    average: number
    totalRatings: number
  }
  earnings: {
    totalEarnings: number
    currentMonthEarnings: number
    lastPayoutDate?: Timestamp | Date
  }
  availability: {
    schedule: WeeklySchedule
    isAvailable: boolean
  }
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  isAvailable: boolean
  startTime?: string // formato HH:mm
  endTime?: string // formato HH:mm
  breaks?: {
    startTime: string
    endTime: string
  }[]
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 
  | 'appointment_reminder' 
  | 'appointment_confirmed' 
  | 'appointment_cancelled'
  | 'payment_received'
  | 'taxi_driver_assigned'
  | 'taxi_arrived'
  | 'taxi_completed'
  | 'system_maintenance'
  | 'promotional'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  channels: {
    push: boolean
    email: boolean
    sms: boolean
  }
  scheduledFor?: Timestamp | Date
  sentAt?: Timestamp | Date
  createdAt: Timestamp | Date
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentIntent {
  id: string
  appointmentId?: string
  tripId?: string
  clientId: string
  amount: number
  currency: 'BRL'
  paymentMethod: 'stripe' | 'mercadopago'
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  metadata?: Record<string, any>
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface DashboardStats {
  totalClients: number
  totalPets: number
  totalAppointments: number
  totalRevenue: number
  monthlyRevenue: number
  appointmentsToday: number
  appointmentsThisWeek: number
  averageRating: number
  popularServices: {
    serviceId: string
    serviceName: string
    count: number
  }[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface ClientForm {
  name: string
  email: string
  phone: string
  cpf?: string
  birthDate?: string
  address: Address
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface PetForm {
  name: string
  species: string
  breed: string
  size: PetSize
  weight: number
  age: number
  gender: PetGender
  color: string
  microchip?: string
  allergies: string
  medications: string
  conditions: string
  behaviorNotes?: string
  specialNeeds?: string
}

export interface AppointmentForm {
  clientId: string
  petIds: string[]
  serviceId: string
  date: string
  time: string
  notes?: string
  pickupAddress?: Address
  deliveryAddress?: Address
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WithId<T> = T & { id: string }
export type WithTimestamps<T> = T & {
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt: Timestamp | Date
}