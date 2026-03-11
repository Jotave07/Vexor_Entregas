import {
  DriverStatus,
  DriverType,
  HistorySource,
  LoadStatus,
  OccurrenceType,
  OrderStatus,
  UserRole
} from "@prisma/client";

export const orderStatusLabels: Record<OrderStatus, string> = {
  IMPORTED: "Importado",
  AVAILABLE: "Disponível",
  ASSIGNED: "Vinculado",
  ON_ROUTE: "Em rota",
  DELIVERED: "Entregue",
  FAILED: "Falha",
  RETURNED: "Devolvido"
};

export const loadStatusLabels: Record<LoadStatus, string> = {
  DRAFT: "Rascunho",
  OPEN: "Aberta",
  IN_TRANSIT: "Em trânsito",
  FINISHED: "Finalizada",
  CANCELED: "Cancelada"
};

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  OPERATOR: "Operador",
  DRIVER: "Motorista"
};

export const driverTypeLabels: Record<DriverType, string> = {
  OWN: "Próprio",
  AGGREGATED: "Agregado"
};

export const driverStatusLabels: Record<DriverStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo"
};

export const historySourceLabels: Record<HistorySource, string> = {
  SYSTEM: "Sistema",
  OPERATION: "Operação",
  DRIVER: "Motorista",
  INTEGRATION: "Integração"
};

export const occurrenceTypeLabels: Record<OccurrenceType, string> = {
  DELAY: "Atraso",
  ABSENT_CLIENT: "Cliente ausente",
  REFUSED: "Recusado",
  ADDRESS_ISSUE: "Endereço incorreto",
  DAMAGE: "Avaria",
  OTHER: "Outro"
};
