import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { ApiSuccessResponse } from '../types/api.types';
import { Product, StockMovement } from '@prisma/client';
import { ProductQueryInput } from '../validators/product.validator';
import { UnauthorizedError } from '../errors/AppError';

export class ProductController {
  public async getProducts(
    req: Request,
    res: Response<ApiSuccessResponse<Product[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as ProductQueryInput;
      const { products, meta } = await productService.getProducts(query);
      res.status(200).json({
        success: true,
        data: products,
        meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createProduct(
    req: Request,
    res: Response<ApiSuccessResponse<Product>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProductById(
    req: Request,
    res: Response<ApiSuccessResponse<Product>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateProduct(
    req: Request,
    res: Response<ApiSuccessResponse<Product>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedProduct = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createStockMovement(
    req: Request,
    res: Response<ApiSuccessResponse<StockMovement>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const movement = await productService.createStockMovement(
        req.params.id,
        req.body,
        req.user.userId
      );
      res.status(201).json({
        success: true,
        data: movement,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getStockMovements(
    req: Request,
    res: Response<ApiSuccessResponse<StockMovement[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const movements = await productService.getStockMovements(req.params.id);
      res.status(200).json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
