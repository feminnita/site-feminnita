import * as HeroSlideRepository from '../repository/HeroSlide.Repository';

export function listSlides() {
    return HeroSlideRepository.findActiveOrdered();
}