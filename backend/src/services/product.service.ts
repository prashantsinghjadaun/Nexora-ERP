import { prisma } from '../lib/prisma';
import { Product, StockMovement, Prisma } from '@prisma/client';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateStockMovementInput,
  ProductQueryInput,
} from '../validators/product.validator';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/AppError';
import { PaginationMeta } from '../types/api.types';

export interface PaginatedProductsResult {
  products: Product[];
  meta: PaginationMeta;
}

export class ProductService {
  public async getProducts(query: ProductQueryInput): Promise<PaginatedProductsResult> {
    const { page, limit, search, category, lowStock, sortBy, sortOrder } = query;

    const where: Prisma.ProductWhereInput = {};

    if (category && category.trim() !== '') {
      where.category = { equals: category.trim(), mode: 'insensitive' };
    }

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (lowStock) {
      const lowStockProducts = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM products WHERE "currentStock" <= "minStockAlert"
      `;
      const lowStockIds = lowStockProducts.map((p) => p.id);
      where.id = { in: lowStockIds };
    }

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      products,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    };
  }

  public async createProduct(input: CreateProductInput): Promise<Product> {
    const skuNormalized = input.sku.toUpperCase().trim();
    const existing = await prisma.product.findUnique({ where: { sku: skuNormalized } });

    if (existing) {
      throw new ConflictError(`Product with SKU '${skuNormalized}' already exists.`);
    }

    return prisma.product.create({
      data: {
        name: input.name,
        sku: skuNormalized,
        category: input.category,
        unitPrice: input.unitPrice,
        currentStock: input.currentStock,
        minStockAlert: input.minStockAlert ?? 10,
        location: input.location,
      },
    });
  }

  public async getProductById(id: string): Promise<Product> {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError(`Product with ID ${id} not found.`);
    }

    return product;
  }

  public async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found.`);
    }

    if (input.sku && input.sku.toUpperCase().trim() !== existing.sku) {
      const skuNormalized = input.sku.toUpperCase().trim();
      const duplicate = await prisma.product.findUnique({ where: { sku: skuNormalized } });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Product with SKU '${skuNormalized}' already exists.`);
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.sku && { sku: input.sku.toUpperCase().trim() }),
        ...(input.category && { category: input.category }),
        ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
        ...(input.minStockAlert !== undefined && { minStockAlert: input.minStockAlert }),
        ...(input.location && { location: input.location }),
      },
    });
  }

  public async createStockMovement(
    productId: string,
    input: CreateStockMovementInput,
    createdById: string
  ): Promise<StockMovement> {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });

      if (!product) {
        throw new NotFoundError(`Product with ID ${productId} not found.`);
      }

      if (input.type === 'OUT' && product.currentStock < input.quantity) {
        throw new BadRequestError('Insufficient stock available for this operation');
      }

      const newStock =
        input.type === 'IN'
          ? product.currentStock + input.quantity
          : product.currentStock - input.quantity;

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      return tx.stockMovement.create({
        data: {
          productId,
          quantity: input.quantity,
          type: input.type,
          reason: input.reason,
          createdById,
        },
        include: {
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
    });
  }

  public async getStockMovements(productId: string): Promise<StockMovement[]> {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw new NotFoundError(`Product with ID ${productId} not found.`);
    }

    return prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
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

export const productService = new ProductService();
