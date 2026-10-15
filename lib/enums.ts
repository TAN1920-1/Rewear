export enum UserRole {
  DONOR = "DONOR",
  NGO_ADMIN = "NGO_ADMIN",
  NGO_STAFF = "NGO_STAFF",
}

export enum DonationStatus {
  SUBMITTED = "SUBMITTED",
  RECEIVED = "RECEIVED",
  SORTED = "SORTED",
  INVENTORY_ADDED = "INVENTORY_ADDED",
  ALLOCATED = "ALLOCATED",
  DISTRIBUTED = "DISTRIBUTED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export enum ClothingCondition {
  NEW = "NEW",
  LIKE_NEW = "LIKE_NEW",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum InventoryStatus {
  IN_STOCK = "IN_STOCK",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  RESERVED = "RESERVED",
}

export enum InventoryTransactionType {
  RECEIVED = "RECEIVED",
  ALLOCATED = "ALLOCATED",
  DISTRIBUTED = "DISTRIBUTED",
  ADJUSTED = "ADJUSTED",
  RETURNED = "RETURNED",
  RESERVED = "RESERVED",
}

export enum DistributionStatus {
  DRAFT = "DRAFT",
  ALLOCATED = "ALLOCATED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}
