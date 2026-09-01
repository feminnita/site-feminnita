import { Request, Response } from 'express';
import * as AddressService from '../service/Address.Service';

export async function list(req: Request, res: Response) {
    res.json(await AddressService.listMyAddresses(req.customer!.id));
}

export async function create(req: Request, res: Response) {
    try {
        const { label, cep, street, number, complement, neighborhood, city, state } = req.body;
        const address = await AddressService.createAddress(req.customer!.id, {
            label,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
        });
        res.status(201).json(address);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao criar endereço, confira os campos e tente novamente.' });
    }
}

export async function update(req: Request, res: Response) {
    const id = req.params.id as string;

    try {
        res.json(await AddressService.updateAddress(req.customer!.id, id, req.body));
    } catch (error) {
        console.error(error);
        res.status(404).json({ error: 'Endereço não encontrado' })
    }
}

export async function remove(req: Request, res: Response) {
    const id = req.params.id as string;
    try {
        await AddressService.deleteAddress(req.customer!.id, id);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(404).json({ error: 'Endereço não encontrado' });
    }
}

export async function setDefault(req: Request, res: Response) {
    const id = req.params.id as string;

    try {
        res.json(await AddressService.setDefaultAddress(req.customer!.id, id));
    } catch (error) {
        console.error(error);
        res.status(404).json({ error: 'Endereço não encontrado' });
    }
}