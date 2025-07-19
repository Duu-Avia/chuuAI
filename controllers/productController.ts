import { Request, Response } from 'express';
import Products from '../models/Products';
export async function addProduct(req:Request,res:Response){
    const { pageId, name, description, price, stock, imageUrl } = req.body;
    const product = new Products({
        pageId,
        name,
        description,
        price,
        stock,
        imageUrl
    })

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
}