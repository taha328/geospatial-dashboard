import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portefeuille } from '../entities/portefeuille.entity';

@Injectable()
export class PortefeuilleService {
  constructor(
    @InjectRepository(Portefeuille)
    private portefeuilleRepository: Repository<Portefeuille>,
  ) {}

  async findAll(): Promise<Portefeuille[]> {
    return this.portefeuilleRepository.find({
      relations: ['famillesActifs', 'famillesActifs.groupesActifs', 'famillesActifs.groupesActifs.actifs']
    });
  }

  async findOne(id: number): Promise<Portefeuille> {
    const portefeuille = await this.portefeuilleRepository.findOne({
      where: { id },
      relations: ['famillesActifs', 'famillesActifs.groupesActifs', 'famillesActifs.groupesActifs.actifs']
    });
    
    if (!portefeuille) {
      throw new NotFoundException(`Portefeuille avec l'ID ${id} non trouvé`);
    }
    
    return portefeuille;
  }

  async create(portefeuilleData: Partial<Portefeuille>): Promise<Portefeuille> {
    const portefeuille = this.portefeuilleRepository.create(portefeuilleData);
    return this.portefeuilleRepository.save(portefeuille);
  }

  async update(id: number, portefeuilleData: Partial<Portefeuille>): Promise<Portefeuille> {
    await this.portefeuilleRepository.update(id, portefeuilleData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.portefeuilleRepository.delete(id);
  }

  async getFamillesByPortefeuille(id: number): Promise<any[]> {
    const portefeuille = await this.findOne(id);
    return portefeuille.famillesActifs || [];
  }

  async getHierarchy(): Promise<any[]> {
    const portefeuilles = await this.findAll();
    
    return portefeuilles.map(portefeuille => ({
      id: portefeuille.id,
      nom: portefeuille.nom,
      type: 'portefeuille',
      statut: portefeuille.statut,
      latitude: portefeuille.latitude,
      longitude: portefeuille.longitude,
      children: portefeuille.famillesActifs?.map(famille => ({
        id: famille.id,
        nom: famille.nom,
        type: 'famille',
        statut: famille.statut,
        latitude: famille.latitude,
        longitude: famille.longitude,
        children: famille.groupesActifs?.map(groupe => ({
          id: groupe.id,
          nom: groupe.nom,
          type: 'groupe',
          statut: groupe.statut,
          latitude: groupe.latitude,
          longitude: groupe.longitude,
          children: groupe.actifs?.map(actif => ({
            id: actif.id,
            nom: actif.nom,
            type: 'actif',
            statutOperationnel: actif.statutOperationnel,
            etatGeneral: actif.etatGeneral,
            latitude: actif.latitude,
            longitude: actif.longitude,
            code: actif.code,
            numeroSerie: actif.numeroSerie
          }))
        }))
      }))
    }));
  }

  async getStatistiques(): Promise<any> {
    const portefeuilles = await this.findAll();
    
    let totalActifs = 0;
    let actifsOperationnels = 0;
    let actifsEnMaintenance = 0;
    let actifsHorsService = 0;
    
    portefeuilles.forEach(portefeuille => {
      portefeuille.famillesActifs?.forEach(famille => {
        famille.groupesActifs?.forEach(groupe => {
          groupe.actifs?.forEach(actif => {
            totalActifs++;
            switch (actif.statutOperationnel) {
              case 'operationnel':
                actifsOperationnels++;
                break;
              case 'maintenance':
                actifsEnMaintenance++;
                break;
              case 'hors_service':
                actifsHorsService++;
                break;
            }
          });
        });
      });
    });

    return {
      totalActifs,
      actifsOperationnels,
      actifsEnMaintenance,
      actifsHorsService,
      tauxDisponibilite: totalActifs > 0 ? (actifsOperationnels / totalActifs * 100).toFixed(2) : 0
    };
  }
}
