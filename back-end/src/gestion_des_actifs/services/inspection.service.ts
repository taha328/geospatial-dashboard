import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection } from '../entities/inspection.entity';
import { CreateInspectionDto, UpdateInspectionDto } from '../dto/inspection.dto';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
  ) {}

  async create(createInspectionDto: CreateInspectionDto): Promise<Inspection> {
    const inspection = this.inspectionRepository.create(createInspectionDto);
    return await this.inspectionRepository.save(inspection);
  }

  async findAll(): Promise<Inspection[]> {
    return await this.inspectionRepository.find({
      relations: ['actif', 'actif.groupeActif', 'typeInspection', 'anomaliesDetectees'],
    });
  }

  async findOne(id: number): Promise<Inspection | null> {
    return await this.inspectionRepository.findOne({
      where: { id },
      relations: ['actif', 'actif.groupeActif', 'typeInspection', 'anomaliesDetectees'],
    });
  }

  async findByActif(actifId: number): Promise<Inspection[]> {
    return await this.inspectionRepository.find({
      where: { actifId },
      relations: ['actif', 'typeInspection', 'anomaliesDetectees'],
      order: { datePrevue: 'DESC' },
    });
  }

  async findByTypeInspection(typeInspectionId: number): Promise<Inspection[]> {
    return await this.inspectionRepository.find({
      where: { typeInspectionId },
      relations: ['actif', 'actif.groupeActif', 'typeInspection'],
      order: { datePrevue: 'DESC' },
    });
  }

  async findByStatut(statut: string): Promise<Inspection[]> {
    return await this.inspectionRepository.find({
      where: { statut },
      relations: ['actif', 'actif.groupeActif', 'typeInspection'],
      order: { datePrevue: 'ASC' },
    });
  }

  async getInspectionStats() {
    const total = await this.inspectionRepository.count();
    const planifiees = await this.inspectionRepository.count({ where: { statut: 'planifiee' } });
    const enCours = await this.inspectionRepository.count({ where: { statut: 'en_cours' } });
    const terminees = await this.inspectionRepository.count({ where: { statut: 'terminee' } });
    const annulees = await this.inspectionRepository.count({ where: { statut: 'annulee' } });
    
    const conformes = await this.inspectionRepository.count({ where: { conformite: 'conforme' } });
    const nonConformes = await this.inspectionRepository.count({ where: { conformite: 'non_conforme' } });

    return {
      total,
      statuts: { planifiees, enCours, terminees, annulees },
      conformite: { conformes, nonConformes },
    };
  }

  async update(id: number, updateInspectionDto: UpdateInspectionDto): Promise<Inspection | null> {
    await this.inspectionRepository.update(id, updateInspectionDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.inspectionRepository.delete(id);
  }
}
