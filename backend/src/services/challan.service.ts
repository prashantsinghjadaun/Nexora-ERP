import { prisma } from '../lib/prisma';
import { SalesChallan, SalesChallanItem, ChallanStatus, Prisma, Product } from '@prisma/client';
import { CreateChallanInput, ChallanQueryInput } from '../validators/challan.validator';
import {
  NotFoundError,
  UnprocessableEntityError,
  InsufficientStockError,
  CannotCancelConfirmedChallanError,
} from '../errors/AppError';
import { PaginationMeta, ApiErrorDetail } from '../types/api.types';
import { generateChallanNumber } from '../utils/challanNumber';

export interface PaginatedChallansResult {
  challans: SalesChallan[];
  meta: PaginationMeta;
}

export class ChallanService {
  public async getChallans(query: ChallanQueryInput): Promise<PaginatedChallansResult> {
    const { page, limit, search, status, customerId, sortBy, sortOrder } = query;

    const where: Prisma.SalesChallanWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search && search.trim() !== '') {
      where.challanNumber = { contains: search.trim(), mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [challans, totalCount] = await Promise.all([
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.salesChallan.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      challans,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    };
  }

  public async createChallan(input: CreateChallanInput, createdById: string): Promise<SalesChallan> {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID ${input.customerId} not found.`);
    }

    const uniqueProductIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
    });

    if (products.length !== uniqueProductIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = uniqueProductIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(`Product(s) with ID(s) ${missingIds.join(', ')} not found.`);
    }

    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    let totalAmount = new Prisma.Decimal(0);
    let totalQuantity = 0;

    const itemsData = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = new Prisma.Decimal(product.unitPrice);
      const subtotal = unitPrice.mul(item.quantity);

      totalAmount = totalAmount.add(subtotal);
      totalQuantity += item.quantity;

      return {
        productId: item.productId,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    const challanNumber = await generateChallanNumber();

    return prisma.salesChallan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        status: ChallanStatus.DRAFT,
        totalAmount,
        totalQuantity,
        notes: input.notes,
        createdById,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
          },
        },
        items: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  public async getChallanById(
    id: string
  ): Promise<SalesChallan & { customer: unknown; items: (SalesChallanItem & { product: Product })[] }> {
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundError(`Sales challan with ID ${id} not found.`);
    }

    return challan as unknown as SalesChallan & {
      customer: unknown;
      items: (SalesChallanItem & { product: Product })[];
    };
  }

  public async confirmChallan(id: string, userId: string): Promise<SalesChallan> {
    return prisma.$transaction(
      async (tx) => {
        const challan = await tx.salesChallan.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!challan) {
          throw new NotFoundError(`Sales challan with ID ${id} not found.`);
        }

        if (challan.status !== ChallanStatus.DRAFT) {
          throw new UnprocessableEntityError('Only DRAFT challans can be confirmed.');
        }

        const productIds = Array.from(new Set(challan.items.map((i) => i.productId)));
        const activeProducts = await tx.product.findMany({
          where: { id: { in: productIds } },
        });
        const productMap = new Map<string, Product>();
        activeProducts.forEach((p) => productMap.set(p.id, p));

        const stockDeficits: ApiErrorDetail[] = [];
        const productUpdates: { product: Product; requested: number }[] = [];

        for (const item of challan.items) {
          if (item.quantity <= 0) {
            throw new UnprocessableEntityError(`Invalid item quantity for product ${item.productId}`);
          }

          const product = productMap.get(item.productId);

          if (!product) {
            throw new NotFoundError(`Product with ID ${item.productId} not found.`);
          }

          if (product.currentStock < item.quantity) {
            stockDeficits.push({
              field: 'quantity',
              message: `Insufficient stock for product ${product.name}. Requested: ${item.quantity}, Available: ${product.currentStock}`,
              productId: product.id,
              productName: product.name,
              requestedQuantity: item.quantity,
              availableQuantity: product.currentStock,
            });
          } else {
            productUpdates.push({ product, requested: item.quantity });
          }
        }

        if (stockDeficits.length > 0) {
          throw new InsufficientStockError(stockDeficits);
        }

        for (const { product, requested } of productUpdates) {
          await tx.product.update({
            where: { id: product.id },
            data: { currentStock: { decrement: requested } },
          });

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              quantity: requested,
              type: 'OUT',
              reason: `Sales Challan #${challan.challanNumber}`,
              createdById: userId,
            },
          });

          await tx.salesChallanItem.updateMany({
            where: { salesChallanId: id, productId: product.id },
            data: {
              productNameSnapshot: product.name,
              skuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
            },
          });
        }

        return tx.salesChallan.update({
          where: { id },
          data: {
            status: ChallanStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                businessName: true,
                email: true,
              },
            },
            items: true,
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
        });
      },
      { maxWait: 10000, timeout: 20000 }
    );
  }

  public async cancelChallan(id: string): Promise<SalesChallan> {
    const challan = await prisma.salesChallan.findUnique({ where: { id } });

    if (!challan) {
      throw new NotFoundError(`Sales challan with ID ${id} not found.`);
    }

    if (challan.status === ChallanStatus.CONFIRMED) {
      throw new CannotCancelConfirmedChallanError();
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      return challan;
    }

    return prisma.salesChallan.update({
      where: { id },
      data: {
        status: ChallanStatus.CANCELLED,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
          },
        },
        items: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}

export const challanService = new ChallanService();
