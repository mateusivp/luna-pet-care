import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './config'
import type {
  User,
  Client,
  Pet,
  Service,
  Appointment,
  TaxiRide,
  Payment,
  Notification,
} from '@/types'

// Tipos para paginação
export interface PaginationOptions {
  pageSize?: number
  lastDoc?: any
}

export interface PaginatedResult<T> {
  data: T[]
  lastDoc: any
  hasMore: boolean
}

// ===== USUÁRIOS =====
export const userService = {
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, 'users', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User
    }
    return null
  },

  async getByEmail(email: string): Promise<User | null> {
    const q = query(collection(db, 'users'), where('email', '==', email))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as User
    }
    return null
  },

  async update(id: string, userData: Partial<User>) {
    const docRef = doc(db, 'users', id)
    await updateDoc(docRef, {
      ...userData,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    const docRef = doc(db, 'users', id)
    await deleteDoc(docRef)
  },

  async getAll(options: PaginationOptions = {}): Promise<PaginatedResult<User>> {
    const { pageSize = 20, lastDoc } = options
    
    let q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    )
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const querySnapshot = await getDocs(q)
    const docs = querySnapshot.docs
    const hasMore = docs.length > pageSize
    
    if (hasMore) {
      docs.pop() // Remove o documento extra
    }
    
    const data = docs.map(doc => ({ id: doc.id, ...doc.data() } as User))
    
    return {
      data,
      lastDoc: docs[docs.length - 1],
      hasMore,
    }
  },
}

// ===== CLIENTES =====
export const clientService = {
  async create(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'clients'), {
      ...clientData,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getById(id: string): Promise<Client | null> {
    const docRef = doc(db, 'clients', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Client
    }
    return null
  },

  async update(id: string, clientData: Partial<Client>) {
    const docRef = doc(db, 'clients', id)
    await updateDoc(docRef, {
      ...clientData,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    const docRef = doc(db, 'clients', id)
    await deleteDoc(docRef)
  },

  async getByUserId(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Client>> {
    const { pageSize = 20, lastDoc } = options
    
    let q = query(
      collection(db, 'clients'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    )
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const querySnapshot = await getDocs(q)
    const docs = querySnapshot.docs
    const hasMore = docs.length > pageSize
    
    if (hasMore) {
      docs.pop()
    }
    
    const data = docs.map(doc => ({ id: doc.id, ...doc.data() } as Client))
    
    return {
      data,
      lastDoc: docs[docs.length - 1],
      hasMore,
    }
  },

  async search(searchTerm: string, userId: string): Promise<Client[]> {
    const q = query(
      collection(db, 'clients'),
      where('userId', '==', userId),
      orderBy('name')
    )
    
    const querySnapshot = await getDocs(q)
    const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client))
    
    // Filtro local para busca por nome, email ou telefone
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    )
  },
}

// ===== PETS =====
export const petService = {
  async create(petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'pets'), {
      ...petData,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getById(id: string): Promise<Pet | null> {
    const docRef = doc(db, 'pets', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Pet
    }
    return null
  },

  async update(id: string, petData: Partial<Pet>) {
    const docRef = doc(db, 'pets', id)
    await updateDoc(docRef, {
      ...petData,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    const docRef = doc(db, 'pets', id)
    await deleteDoc(docRef)
  },

  async getByClientId(clientId: string): Promise<Pet[]> {
    const q = query(
      collection(db, 'pets'),
      where('clientId', '==', clientId),
      orderBy('name')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet))
  },

  async getByUserId(userId: string): Promise<Pet[]> {
    const q = query(
      collection(db, 'pets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet))
  },
}

// ===== SERVIÇOS =====
export const serviceService = {
  async create(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getById(id: string): Promise<Service | null> {
    const docRef = doc(db, 'services', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Service
    }
    return null
  },

  async update(id: string, serviceData: Partial<Service>) {
    const docRef = doc(db, 'services', id)
    await updateDoc(docRef, {
      ...serviceData,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    const docRef = doc(db, 'services', id)
    await deleteDoc(docRef)
  },

  async getByUserId(userId: string): Promise<Service[]> {
    const q = query(
      collection(db, 'services'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('name')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service))
  },

  async getByCategory(userId: string, category: string): Promise<Service[]> {
    const q = query(
      collection(db, 'services'),
      where('userId', '==', userId),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('name')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service))
  },
}

// ===== AGENDAMENTOS =====
export const appointmentService = {
  async create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async getById(id: string): Promise<Appointment | null> {
    const docRef = doc(db, 'appointments', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Appointment
    }
    return null
  },

  async update(id: string, appointmentData: Partial<Appointment>) {
    const docRef = doc(db, 'appointments', id)
    await updateDoc(docRef, {
      ...appointmentData,
      updatedAt: Timestamp.now(),
    })
  },

  async delete(id: string) {
    const docRef = doc(db, 'appointments', id)
    await deleteDoc(docRef)
  },

  async getByUserId(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Appointment>> {
    const { pageSize = 20, lastDoc } = options
    
    let q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      orderBy('scheduledDate', 'desc'),
      limit(pageSize + 1)
    )
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const querySnapshot = await getDocs(q)
    const docs = querySnapshot.docs
    const hasMore = docs.length > pageSize
    
    if (hasMore) {
      docs.pop()
    }
    
    const data = docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
    
    return {
      data,
      lastDoc: docs[docs.length - 1],
      hasMore,
    }
  },

  async getByClientId(clientId: string): Promise<Appointment[]> {
    const q = query(
      collection(db, 'appointments'),
      where('clientId', '==', clientId),
      orderBy('scheduledDate', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
  },

  async getByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      where('scheduledDate', '>=', Timestamp.fromDate(startDate)),
      where('scheduledDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('scheduledDate')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
  },

  // Listener em tempo real para agendamentos
  onAppointmentsChange(userId: string, callback: (appointments: Appointment[]) => void) {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      orderBy('scheduledDate')
    )
    
    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
      callback(appointments)
    })
  },
}

// ===== UPLOAD DE ARQUIVOS =====
export const storageService = {
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  },

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  },

  async uploadPetPhoto(file: File, petId: string): Promise<string> {
    const path = `pets/${petId}/${Date.now()}_${file.name}`
    return await this.uploadFile(file, path)
  },

  async uploadUserAvatar(file: File, userId: string): Promise<string> {
    const path = `users/${userId}/avatar_${Date.now()}_${file.name}`
    return await this.uploadFile(file, path)
  },
}

// ===== OPERAÇÕES EM LOTE =====
export const batchService = {
  async createMultiple<T extends DocumentData>(collectionName: string, items: T[]): Promise<string[]> {
    const batch = writeBatch(db)
    const ids: string[] = []
    
    items.forEach((item) => {
      const docRef = doc(collection(db, collectionName))
      batch.set(docRef, {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      ids.push(docRef.id)
    })
    
    await batch.commit()
    return ids
  },

  async updateMultiple(updates: { collection: string; id: string; data: any }[]): Promise<void> {
    const batch = writeBatch(db)
    
    updates.forEach(({ collection: collectionName, id, data }) => {
      const docRef = doc(db, collectionName, id)
      batch.update(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    })
    
    await batch.commit()
  },

  async deleteMultiple(items: { collection: string; id: string }[]): Promise<void> {
    const batch = writeBatch(db)
    
    items.forEach(({ collection: collectionName, id }) => {
      const docRef = doc(db, collectionName, id)
      batch.delete(docRef)
    })
    
    await batch.commit()
  },
}