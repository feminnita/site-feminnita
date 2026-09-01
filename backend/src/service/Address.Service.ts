import * as AddressesRepository from '../repository/Addresses.Repository';

type AddressInput = {
    label?: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
}


export function listMyAddresses(customerId: string) {
    return AddressesRepository.findByCustomerId(customerId);
}

export async function createAddress(customerId: string, input: AddressInput) {
    const existingCount = await AddressesRepository.countByCustomerId(customerId);
    const isFirst = existingCount === 0;

    return AddressesRepository.insert({
        ...input,
        customerId,
        isDefault: isFirst,
    });
}

export async function updateAddress(customerId: string, id: string, input: Partial<AddressInput>) {
    const address = await AddressesRepository.updateByIdAndCustomerId(id, customerId, input);
    if (!address) throw new Error('ADDRESS_NOT_FOUND');
    return address;
}

export async function deleteAddress(customerId: string, id: string) {
    const address = await AddressesRepository.deleteByIdAndCustomerId(id, customerId);

    if (!address) throw new Error('ADDRESS_NOT_FOUND');

    if (address.isDefault) {
        const remaining = await AddressesRepository.findByCustomerId(customerId);

        if (remaining.length > 0) {
            await AddressesRepository.setDefault(remaining[0].id, customerId);
        }
    }
}

export async function setDefaultAddress(customerId: string, id: string) {
    const address = await AddressesRepository.setDefault(id, customerId);

    if (!address) throw new Error('ADDRESS_NOT_FOUND');
    return address;
}