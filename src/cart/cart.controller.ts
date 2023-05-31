import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  Post,
  HttpStatus,
} from '@nestjs/common';

// import { BasicAuthGuard, JwtAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';

@Controller('profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  @Get()
  async findUserCart() {
    console.log('[Cart controller][GET]');

    const cart = await this.cartService.findOrCreateByUserId();
    console.log('founded cart', cart);

    const data = cart.items.map((item) => ({
      product: {
        id: item.product.product_id,
      },
      count: item.count,
    }));

    console.log('the returned data', data);
    return data;
  }

  @Put()
  async updateUserCart(@Body() body) {
    console.log('PUT item', body);
    const cart = await this.cartService.updateByUserId(body);

    console.log('updated cart', cart);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        cart,
        total: calculateCartTotal(cart),
      },
    };
  }

  @Delete()
  async clearUserCart() {
    console.log('delete');

    await this.cartService.removeByUserId();

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Post('checkout')
  async checkout(@Body() body) {
    console.log('POST request');

    const cart = await this.cartService.findByUserId();

    if (!(cart && cart.items.length)) {
      const statusCode = HttpStatus.BAD_REQUEST;

      return {
        statusCode,
        message: 'Cart is empty',
      };
    }

    const { id: cartId, items } = cart;
    const total = calculateCartTotal(cart);
    const order = this.orderService.create({
      ...body,
      cartId,
      items,
      total,
    });
    console.log(' Order', order);

    await this.cartService.removeByUserId();

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { order },
    };
  }
}
