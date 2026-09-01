import * as ProductColorRepository from '../repository/ProductColor.Repository';

export function listColors() {
    return ProductColorRepository.findAll();
}