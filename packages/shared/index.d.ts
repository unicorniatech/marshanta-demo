export interface User {
  id: string | number
  email: string
  name?: string
  phone?: string
  role?: 'client' | 'restaurant' | 'delivery' | 'admin'
  createdAt?: string
  updatedAt?: string
}

export interface Restaurant {
  id: string | number
  name: string
  address?: string
  phone?: string
  createdAt?: string
  updatedAt?: string
}

export interface DeliveryPartner {
  id: string | number
  name?: string
  phone?: string
  vehicleType?: 'bike' | 'car' | 'scooter' | 'other'
  createdAt?: string
  updatedAt?: string
}

export type ID = string | number
