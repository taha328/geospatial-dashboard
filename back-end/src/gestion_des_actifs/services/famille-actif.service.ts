import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilleActif } from '../entities/famille-actif.entity';

@Injectable()
export class FamilleActifService {
  constructor(
    @InjectRepository(FamilleActif)
    private familleActifRepository: Repository<FamilleActif>,
  ) {}

  async findAll(): Promise<FamilleActif[]> {
    return this.familleActifRepository.find({
      relations: ['portefeuille', 'groupesActifs', 'groupesActifs.actifs']
    });
  }

  async findOne(id: number): Promise<FamilleActif> {
    const famille = await this.familleActifRepository.findOne({
      where: { id },
      relations: ['portefeuille', 'groupesActifs', 'groupesActifs.actifs']
    });
    
    if (!famille) {
      throw new NotFoundException(`Famille d'actifs avec l'ID ${id} non trouvée`);
    }
    
    return famille;
  }

  async create(familleData: Partial<FamilleActif>): Promise<FamilleActif> {
    const famille = this.familleActifRepository.create(familleData);
    return this.familleActifRepository.save(famille);
  }

  async update(id: number, familleData: Partial<FamilleActif>): Promise<FamilleActif> {
    await this.familleActifRepository.update(id, familleData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.familleActifRepository.delete(id);
  }

  async getGroupesByFamille(id: number): Promise<any[]> {
    const famille = await this.findOne(id);
    return famille.groupesActifs || [];
  }
}
