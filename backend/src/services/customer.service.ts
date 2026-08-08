import { prisma } from '../lib/prisma';
import { Customer, FollowUp, Prisma } from '@prisma/client';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateFollowUpInput,
  CustomerQueryInput,
} from '../validators/customer.validator';
import { NotFoundError } from '../errors/AppError';
import { PaginationMeta } from '../types/api.types';

export interface PaginatedCustomersResult {
  customers: Customer[];
  meta: PaginationMeta;
}

export class CustomerService {
  public async getCustomers(query: CustomerQueryInput): Promise<PaginatedCustomersResult> {
    const { page, limit, search, type, status, sortBy, sortOrder } = query;

    const where: Prisma.CustomerWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { mobile: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { businessName: { contains: searchTerm, mode: 'insensitive' } },
        { gstNumber: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      customers,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    };
  }

  public async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return prisma.customer.create({
      data: {
        name: input.name,
        mobile: input.mobile,
        email: input.email.toLowerCase(),
        businessName: input.businessName,
        type: input.type,
        address: input.address,
        status: input.status,
        gstNumber: input.gstNumber,
        nextFollowUpDate: input.nextFollowUpDate,
        notes: input.notes,
      },
    });
  }

  public async getCustomerById(id: string): Promise<Customer & { followUps: FollowUp[] }> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
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
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Customer with ID ${id} not found.`);
    }

    return customer;
  }

  public async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Customer with ID ${id} not found.`);
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.mobile && { mobile: input.mobile }),
        ...(input.email && { email: input.email.toLowerCase() }),
        ...(input.businessName && { businessName: input.businessName }),
        ...(input.type && { type: input.type }),
        ...(input.address && { address: input.address }),
        ...(input.status && { status: input.status }),
        ...(input.gstNumber !== undefined && { gstNumber: input.gstNumber }),
        ...(input.nextFollowUpDate !== undefined && { nextFollowUpDate: input.nextFollowUpDate }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });
  }

  public async createFollowUp(
    customerId: string,
    input: CreateFollowUpInput,
    createdById: string
  ): Promise<FollowUp> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID ${customerId} not found.`);
    }

    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          customerId,
          notes: input.notes,
          followUpDate: input.followUpDate,
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
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: {
          nextFollowUpDate: input.followUpDate,
        },
      }),
    ]);

    return followUp;
  }
}

export const customerService = new CustomerService();
