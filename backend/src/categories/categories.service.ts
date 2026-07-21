import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

const DEFAULT_CATEGORIES = [
  { name: 'Elektricitet', icon: 'bolt', defaultUrgency: 'high' },
  { name: 'Hidraulikë', icon: 'droplet', defaultUrgency: 'high' },
  { name: 'Internet / IT', icon: 'wifi', defaultUrgency: 'medium' },
  { name: 'Pastërti', icon: 'sparkles', defaultUrgency: 'low' },
  { name: 'Mobilje / Pajisje', icon: 'armchair', defaultUrgency: 'medium' },
  { name: 'Siguri', icon: 'shield-alert', defaultUrgency: 'high' },
  { name: 'Tjetër', icon: 'more-horizontal', defaultUrgency: 'low' },
];

// Seeds default categories on application startup so the platform is usable out-of-the-box.
@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    const count = await this.categoriesRepository.count();
    if (count === 0) {
      await this.categoriesRepository.save(DEFAULT_CATEGORIES);
    }
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  findById(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({ where: { id } });
  }
}
