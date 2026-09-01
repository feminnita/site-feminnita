import * as CategoryRepository from '../repository/Category.Repository';

export function listCategories() {
    return CategoryRepository.findAllActive();
}

export async function getCategoryBySlug(slug: string) {
    const category = await CategoryRepository.findActiveBySlug(slug);
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
    return category;
}