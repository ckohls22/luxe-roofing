export interface Supplier {
  id?: string;
  logoUrl?: string | null;
  name: string;
  description?: string | null;
  installation?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Material {
  id?: string;
  supplierId: string;
  materialImage?: string | null;
  type?: string | null;
  warranty?: string | null;
  topFeatures?: string | null;
  showCase?: string | null;
  price?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
