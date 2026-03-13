import { z } from "zod";
import {
  DriverStatus,
  DriverType,
  IntegrationEventType,
  IntegrationProvider,
  LoadStatus,
  OrderStatus,
  Prisma
} from "@prisma/client";
import { createIntegrationEvent } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";

const importedDriverSchema = z.object({
  integrationRef: z.string(),
  fullName: z.string().min(3),
  document: z.string().min(11),
  phone: z.string().optional(),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  type: z.nativeEnum(DriverType).default(DriverType.AGGREGATED),
  status: z.nativeEnum(DriverStatus).default(DriverStatus.ACTIVE)
});

const importedOrderSchema = z.object({
  erpOrderNumber: z.string(),
  integrationRef: z.string().optional(),
  invoiceNumber: z.string().optional(),
  customerCode: z.string().optional(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  customerWhatsapp: z.string().optional(),
  allowWhatsapp: z.boolean().optional(),
  allowSms: z.boolean().optional(),
  recipientName: z.string().optional(),
  recipientDocument: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  totalValue: z.number().optional(),
  invoiceDate: z.string().optional(),
  plannedDeliveryAt: z.string().optional(),
  isBilled: z.boolean().optional(),
  isOpen: z.boolean().optional(),
  winthorStatus: z.string().optional(),
  assignedDriverDocument: z.string().optional(),
  assignedDriverName: z.string().optional(),
  assignedAt: z.string().optional(),
  currentStatus: z.nativeEnum(OrderStatus).optional(),
  metadataJson: z.record(z.any()).optional()
});

const importedLoadSchema = z.object({
  integrationRef: z.string(),
  code: z.string(),
  title: z.string(),
  routeDescription: z.string().optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().optional(),
  status: z.nativeEnum(LoadStatus).default(LoadStatus.OPEN),
  driverIntegrationRef: z.string().optional(),
  vehiclePlate: z.string().optional(),
  driverDocumentSnapshot: z.string().optional(),
  driverNameSnapshot: z.string().optional(),
  carrierType: z.nativeEnum(DriverType).optional(),
  loadedAt: z.string().optional(),
  departedAt: z.string().optional(),
  closedAt: z.string().optional(),
  originBranch: z.string().optional(),
  dispatcherName: z.string().optional(),
  orders: z.array(importedOrderSchema).min(1)
});

const importedDriversPayloadSchema = z.object({
  drivers: z.array(importedDriverSchema)
});

const importedOrdersPayloadSchema = z.object({
  orders: z.array(importedOrderSchema)
});

const importedLoadsPayloadSchema = z.object({
  loads: z.array(importedLoadSchema)
});

const flatLoadRowSchema = z.object({
  carga_id: z.string(),
  pedido_id: z.string(),
  cliente: z.string(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  uf: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  total: z.coerce.number().optional(),
  nota_fiscal: z.string().optional(),
  data_faturamento: z.string().optional(),
  previsao_entrega: z.string().optional(),
  motorista_nome: z.string().optional(),
  motorista_documento: z.string().optional(),
  motorista_ref: z.string().optional(),
  placa: z.string().optional(),
  observacoes: z.string().optional()
});

function normalizeDriversPayload(body: unknown) {
  if (Array.isArray(body)) {
    return importedDriversPayloadSchema.safeParse({ drivers: body });
  }

  return importedDriversPayloadSchema.safeParse(body);
}

function normalizeOrdersPayload(body: unknown) {
  if (Array.isArray(body)) {
    return importedOrdersPayloadSchema.safeParse({ orders: body });
  }

  return importedOrdersPayloadSchema.safeParse(body);
}

function normalizeLoadsPayload(body: unknown) {
  if (Array.isArray(body)) {
    const flatRows = z.array(flatLoadRowSchema).safeParse(body);

    if (!flatRows.success) {
      return importedLoadsPayloadSchema.safeParse({ loads: body });
    }

    const grouped = new Map<string, z.infer<typeof importedLoadSchema>>();

    for (const row of flatRows.data) {
      const existing = grouped.get(row.carga_id);

      const normalizedOrder = {
        erpOrderNumber: row.pedido_id,
        integrationRef: row.pedido_id,
        invoiceNumber: row.nota_fiscal,
        customerCode: row.cliente,
        customerName: row.cliente,
        customerPhone: row.telefone,
        customerWhatsapp: row.telefone,
        city: row.municipio,
        state: row.uf,
        address: [row.endereco, row.bairro, row.municipio, row.uf, row.cep].filter(Boolean).join(", "),
        totalValue: row.total,
        invoiceDate: row.data_faturamento,
        plannedDeliveryAt: row.previsao_entrega,
        assignedDriverDocument: row.motorista_documento,
        assignedDriverName: row.motorista_nome
      };

      if (existing) {
        existing.orders.push(normalizedOrder);
        continue;
      }

      grouped.set(row.carga_id, {
        integrationRef: row.carga_id,
        code: `CG-${row.carga_id}`,
        title: `Carga ${row.carga_id}`,
        routeDescription: row.municipio ? `${row.municipio}${row.uf ? ` - ${row.uf}` : ""}` : undefined,
        notes: row.observacoes,
        status: LoadStatus.OPEN,
        driverIntegrationRef: row.motorista_ref,
        vehiclePlate: row.placa,
        driverDocumentSnapshot: row.motorista_documento,
        driverNameSnapshot: row.motorista_nome,
        orders: [normalizedOrder]
      });
    }

    return importedLoadsPayloadSchema.safeParse({ loads: Array.from(grouped.values()) });
  }

  if (typeof body === "object" && body !== null && "data" in body && Array.isArray((body as { data?: unknown[] }).data)) {
    return normalizeLoadsPayload((body as { data: unknown[] }).data);
  }

  return importedLoadsPayloadSchema.safeParse(body);
}

export async function importDrivers(body: unknown, provider: IntegrationProvider) {
  const result = normalizeDriversPayload(body);

  if (!result.success) {
    return {
      ok: false as const,
      status: 400,
      body: { error: result.error.flatten() }
    };
  }

  const syncedDrivers = await prisma.$transaction(
    result.data.drivers.map((driver) =>
      prisma.driverProfile.upsert({
        where: { integrationRef: driver.integrationRef },
        update: {
          fullName: driver.fullName,
          document: driver.document,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehiclePlate: driver.vehiclePlate,
          type: driver.type,
          status: driver.status,
          syncedAt: new Date()
        },
        create: {
          integrationRef: driver.integrationRef,
          fullName: driver.fullName,
          document: driver.document,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehiclePlate: driver.vehiclePlate,
          type: driver.type,
          status: driver.status,
          syncedAt: new Date()
        }
      })
    )
  );

  await Promise.all(
    syncedDrivers.map((driver) =>
      createIntegrationEvent({
        provider,
        eventType: IntegrationEventType.DRIVER_SYNCED,
        entityType: "driver",
        entityId: driver.id,
        correlationId: driver.integrationRef ?? driver.document,
        payloadJson: {
          integrationRef: driver.integrationRef,
          fullName: driver.fullName,
          document: driver.document,
          status: driver.status
        }
      })
    )
  );

  return {
    ok: true as const,
    status: 200,
    body: { synced: syncedDrivers.length }
  };
}

export async function importOrders(body: unknown, provider: IntegrationProvider) {
  const result = normalizeOrdersPayload(body);

  if (!result.success) {
    return {
      ok: false as const,
      status: 400,
      body: { error: result.error.flatten() }
    };
  }

  const imported = await prisma.$transaction(async (tx) => {
    const orders = [];

    for (const order of result.data.orders) {
      const customer = order.customerCode || order.customerName
        ? await tx.customer.upsert({
            where: {
              customerCode: order.customerCode ?? `cliente-${order.erpOrderNumber}`
            },
            update: {
              name: order.customerName,
              phone: order.customerPhone,
              whatsapp: order.customerWhatsapp,
              allowWhatsapp: order.allowWhatsapp ?? false,
              allowSms: order.allowSms ?? false
            },
            create: {
              customerCode: order.customerCode ?? `cliente-${order.erpOrderNumber}`,
              name: order.customerName,
              phone: order.customerPhone,
              whatsapp: order.customerWhatsapp,
              allowWhatsapp: order.allowWhatsapp ?? false,
              allowSms: order.allowSms ?? false
            }
          })
        : null;

      const savedOrder = await tx.order.upsert({
        where: { erpOrderNumber: order.erpOrderNumber },
        update: {
          integrationRef: order.integrationRef,
          invoiceNumber: order.invoiceNumber,
          customerId: customer?.id,
          customerCode: order.customerCode,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerWhatsapp: order.customerWhatsapp,
          allowWhatsapp: order.allowWhatsapp ?? false,
          allowSms: order.allowSms ?? false,
          recipientName: order.recipientName,
          recipientDocument: order.recipientDocument,
          city: order.city,
          state: order.state,
          address: order.address,
          totalValue: order.totalValue,
          invoiceDate: order.invoiceDate ? new Date(order.invoiceDate) : undefined,
          plannedDeliveryAt: order.plannedDeliveryAt ? new Date(order.plannedDeliveryAt) : undefined,
          currentStatus: OrderStatus.FATURADO,
          isBilled: order.isBilled ?? true,
          isOpen: order.isOpen ?? true,
          winthorStatus: order.winthorStatus,
          assignedDriverDocument: order.assignedDriverDocument,
          assignedDriverName: order.assignedDriverName,
          assignedAt: order.assignedAt ? new Date(order.assignedAt) : undefined,
          metadataJson: order.metadataJson
        },
        create: {
          erpOrderNumber: order.erpOrderNumber,
          integrationRef: order.integrationRef,
          invoiceNumber: order.invoiceNumber,
          customerId: customer?.id,
          customerCode: order.customerCode,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerWhatsapp: order.customerWhatsapp,
          allowWhatsapp: order.allowWhatsapp ?? false,
          allowSms: order.allowSms ?? false,
          recipientName: order.recipientName,
          recipientDocument: order.recipientDocument,
          city: order.city,
          state: order.state,
          address: order.address,
          totalValue: order.totalValue,
          invoiceDate: order.invoiceDate ? new Date(order.invoiceDate) : undefined,
          plannedDeliveryAt: order.plannedDeliveryAt ? new Date(order.plannedDeliveryAt) : undefined,
          currentStatus: OrderStatus.FATURADO,
          isBilled: order.isBilled ?? true,
          isOpen: order.isOpen ?? true,
          winthorStatus: order.winthorStatus,
          assignedDriverDocument: order.assignedDriverDocument,
          assignedDriverName: order.assignedDriverName,
          assignedAt: order.assignedAt ? new Date(order.assignedAt) : undefined,
          metadataJson: order.metadataJson
        }
      });

      orders.push(savedOrder);
    }

    return orders;
  });

  await Promise.all(
    imported.map((order) =>
      createIntegrationEvent({
        provider,
        eventType: IntegrationEventType.ORDER_SYNCED,
        entityType: "order",
        entityId: order.id,
        correlationId: order.erpOrderNumber,
        payloadJson: {
          erpOrderNumber: order.erpOrderNumber,
          invoiceNumber: order.invoiceNumber,
          currentStatus: order.currentStatus
        }
      })
    )
  );

  return {
    ok: true as const,
    status: 200,
    body: { imported: imported.length }
  };
}

export async function importLoads(body: unknown, provider: IntegrationProvider) {
  const result = normalizeLoadsPayload(body);

  if (!result.success) {
    return {
      ok: false as const,
      status: 400,
      body: { error: result.error.flatten() }
    };
  }

  try {
    const syncedLoads = await prisma.$transaction(async (tx) => {
      const processedLoads = [];

      for (const loadPayload of result.data.loads) {
        const driver = loadPayload.driverIntegrationRef
          ? await tx.driverProfile.findUnique({
              where: { integrationRef: loadPayload.driverIntegrationRef },
              select: { id: true, document: true, fullName: true, type: true, vehiclePlate: true }
            })
          : null;

        const existingLoad = await tx.load.findUnique({
          where: { integrationRef: loadPayload.integrationRef },
          select: { id: true }
        });

        const orders = [];

        for (const orderPayload of loadPayload.orders) {
          const customer = orderPayload.customerCode || orderPayload.customerName
            ? await tx.customer.upsert({
                where: {
                  customerCode: orderPayload.customerCode ?? `cliente-${orderPayload.erpOrderNumber}`
                },
                update: {
                  name: orderPayload.customerName,
                  phone: orderPayload.customerPhone,
                  whatsapp: orderPayload.customerWhatsapp,
                  allowWhatsapp: orderPayload.allowWhatsapp ?? false,
                  allowSms: orderPayload.allowSms ?? false
                },
                create: {
                  customerCode: orderPayload.customerCode ?? `cliente-${orderPayload.erpOrderNumber}`,
                  name: orderPayload.customerName,
                  phone: orderPayload.customerPhone,
                  whatsapp: orderPayload.customerWhatsapp,
                  allowWhatsapp: orderPayload.allowWhatsapp ?? false,
                  allowSms: orderPayload.allowSms ?? false
                }
              })
            : null;

          const order = await tx.order.upsert({
            where: { erpOrderNumber: orderPayload.erpOrderNumber },
            update: {
              integrationRef: orderPayload.integrationRef,
              invoiceNumber: orderPayload.invoiceNumber,
              customerId: customer?.id,
              customerCode: orderPayload.customerCode,
              customerName: orderPayload.customerName,
              customerPhone: orderPayload.customerPhone,
              customerWhatsapp: orderPayload.customerWhatsapp,
              allowWhatsapp: orderPayload.allowWhatsapp ?? false,
              allowSms: orderPayload.allowSms ?? false,
              recipientName: orderPayload.recipientName,
              recipientDocument: orderPayload.recipientDocument,
              city: orderPayload.city,
              state: orderPayload.state,
              address: orderPayload.address,
              totalValue: orderPayload.totalValue,
              invoiceDate: orderPayload.invoiceDate ? new Date(orderPayload.invoiceDate) : undefined,
              plannedDeliveryAt: orderPayload.plannedDeliveryAt ? new Date(orderPayload.plannedDeliveryAt) : undefined,
              currentStatus: orderPayload.currentStatus ?? OrderStatus.CARREGADO,
              isBilled: orderPayload.isBilled ?? true,
              isOpen: orderPayload.isOpen ?? true,
              winthorStatus: orderPayload.winthorStatus,
              assignedDriverDocument: orderPayload.assignedDriverDocument ?? driver?.document,
              assignedDriverName: orderPayload.assignedDriverName ?? driver?.fullName,
              assignedAt: orderPayload.assignedAt ? new Date(orderPayload.assignedAt) : undefined,
              metadataJson: orderPayload.metadataJson
            },
            create: {
              erpOrderNumber: orderPayload.erpOrderNumber,
              integrationRef: orderPayload.integrationRef,
              invoiceNumber: orderPayload.invoiceNumber,
              customerId: customer?.id,
              customerCode: orderPayload.customerCode,
              customerName: orderPayload.customerName,
              customerPhone: orderPayload.customerPhone,
              customerWhatsapp: orderPayload.customerWhatsapp,
              allowWhatsapp: orderPayload.allowWhatsapp ?? false,
              allowSms: orderPayload.allowSms ?? false,
              recipientName: orderPayload.recipientName,
              recipientDocument: orderPayload.recipientDocument,
              city: orderPayload.city,
              state: orderPayload.state,
              address: orderPayload.address,
              totalValue: orderPayload.totalValue,
              invoiceDate: orderPayload.invoiceDate ? new Date(orderPayload.invoiceDate) : undefined,
              plannedDeliveryAt: orderPayload.plannedDeliveryAt ? new Date(orderPayload.plannedDeliveryAt) : undefined,
              currentStatus: orderPayload.currentStatus ?? OrderStatus.CARREGADO,
              isBilled: orderPayload.isBilled ?? true,
              isOpen: orderPayload.isOpen ?? true,
              winthorStatus: orderPayload.winthorStatus,
              assignedDriverDocument: orderPayload.assignedDriverDocument ?? driver?.document,
              assignedDriverName: orderPayload.assignedDriverName ?? driver?.fullName,
              assignedAt: orderPayload.assignedAt ? new Date(orderPayload.assignedAt) : undefined,
              metadataJson: orderPayload.metadataJson
            }
          });

          orders.push(order);
        }

        const loadData = {
          code: loadPayload.code,
          title: loadPayload.title,
          routeDescription: loadPayload.routeDescription,
          notes: loadPayload.notes,
          scheduledDate: loadPayload.scheduledDate ? new Date(loadPayload.scheduledDate) : undefined,
          status: loadPayload.status,
          driverId: driver?.id,
          vehiclePlate: loadPayload.vehiclePlate ?? driver?.vehiclePlate,
          driverDocumentSnapshot: loadPayload.driverDocumentSnapshot ?? driver?.document,
          driverNameSnapshot: loadPayload.driverNameSnapshot ?? driver?.fullName,
          carrierType: loadPayload.carrierType ?? driver?.type,
          loadedAt: loadPayload.loadedAt ? new Date(loadPayload.loadedAt) : undefined,
          departedAt: loadPayload.departedAt ? new Date(loadPayload.departedAt) : undefined,
          closedAt: loadPayload.closedAt ? new Date(loadPayload.closedAt) : undefined,
          originBranch: loadPayload.originBranch,
          dispatcherName: loadPayload.dispatcherName
        };

        let loadId = existingLoad?.id;

        if (!loadId) {
          const createdLoad = await tx.load.create({
            data: {
              integrationRef: loadPayload.integrationRef,
              ...loadData
            },
            select: { id: true }
          });

          loadId = createdLoad.id;
        } else {
          await tx.load.update({
            where: { id: loadId },
            data: loadData
          });

          await tx.loadOrder.deleteMany({
            where: { loadId }
          });
        }

        await tx.loadOrder.createMany({
          data: orders.map((order, index) => ({
            loadId,
            orderId: order.id,
            sequence: index + 1
          }))
        });

        const syncedLoad = await tx.load.findUniqueOrThrow({
          where: { id: loadId }
        });

        processedLoads.push(syncedLoad);
      }

      return processedLoads;
    });

    await Promise.all(
      syncedLoads.map((load) =>
        createIntegrationEvent({
          provider,
          eventType: IntegrationEventType.LOAD_CREATED,
          entityType: "load",
          entityId: load.id,
          correlationId: load.integrationRef ?? load.code,
          payloadJson: {
            integrationRef: load.integrationRef,
            code: load.code,
            status: load.status
          }
        })
      )
    );

    return {
      ok: true as const,
      status: 200,
      body: { imported: syncedLoads.length }
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        ok: false as const,
        status: 409,
        body: { error: "Nao foi possivel sincronizar as cargas importadas." }
      };
    }

    console.error("Erro ao sincronizar cargas importadas:", error);

    return {
      ok: false as const,
      status: 500,
      body: { error: "Nao foi possivel processar a carga importada." }
    };
  }
}
