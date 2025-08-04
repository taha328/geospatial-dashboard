import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Portefeuille } from '../gestion_des_actifs/entities/portefeuille.entity';
import { FamilleActif } from '../gestion_des_actifs/entities/famille-actif.entity';
import { GroupeActif } from '../gestion_des_actifs/entities/groupe-actif.entity';
import { Actif } from '../gestion_des_actifs/entities/actif.entity';

@Injectable()
export class ActifsSeedService {
  private readonly logger = new Logger(ActifsSeedService.name);

  constructor(
    @InjectRepository(Portefeuille)
    private portefeuilleRepository: Repository<Portefeuille>,
    @InjectRepository(FamilleActif)
    private familleActifRepository: Repository<FamilleActif>,
    @InjectRepository(GroupeActif)
    private groupeActifRepository: Repository<GroupeActif>,
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
    private dataSource: DataSource,
  ) {}

  async seedActifs() {
    this.logger.log('🌱 Starting actifs seeding process...');

    try {
      await this.checkAndFixDataConsistency();

      const [portefeuilleCount, familleCount, groupeCount, actifCount] = await Promise.all([
        this.portefeuilleRepository.count(),
        this.familleActifRepository.count(),
        this.groupeActifRepository.count(),
        this.actifRepository.count()
      ]);

      this.logger.log(`📊 Current data state: Portefeuilles=${portefeuilleCount}, Familles=${familleCount}, Groupes=${groupeCount}, Actifs=${actifCount}`);

      if (portefeuilleCount > 0) {
        this.logger.log('✅ Data already exists. Skipping seed.');
        return { 
          status: 'skipped', 
          reason: 'Data already exists',
          counts: { portefeuilleCount, familleCount, groupeCount, actifCount }
        };
      }

      this.logger.log('🚀 Starting complete logical seeding process...');
      return await this.performCompleteSeeding();

    } catch (error) {
      this.logger.error('❌ Error during actifs seeding:', error.stack);
      throw error;
    }
  }

  private async performCompleteSeeding() {
    // First, discover valid enum values to prevent mismatches
    const familleEnums = await this.discoverEnumValues('familles_actifs_type_enum');
    const groupeEnums = await this.discoverEnumValues('groupes_actifs_type_enum');

    if (familleEnums.length === 0 || groupeEnums.length === 0) {
      this.logger.error('❌ Cannot proceed without valid enum values');
      throw new Error('Failed to discover required enum types');
    }

    // Enhanced complete logical structure for port assets
    const portfolioStructure = [
      {
        portfolio: {
          nom: 'Terminal Conteneurs Nord - TC1',
          description: 'Terminal à conteneurs principal avec équipements de manutention haute capacité',
          code: 'PORT-TC1-001',
          statut: 'actif',
          latitude: 35.8845,
          longitude: -5.5026
        },
        families: [
          {
            family: {
              nom: 'Équipements de Quai TC1',
              description: 'Grues et équipements fixes du quai pour conteneurs',
              code: 'FAM-TC1-QUAI',
              type: this.selectValidEnum(familleEnums, ['equipements_specifiques', 'infrastructures_portuaires']),
              statut: 'actif',
              latitude: 35.8840,
              longitude: -5.5030
            },
            groups: [
              {
                group: {
                  nom: 'Grues Ship-to-Shore STS',
                  description: 'Grues portiques pour déchargement navires',
                  code: 'GRP-TC1-STS',
                  type: this.selectValidEnum(groupeEnums, ['equipement', 'grue', 'manutention']),
                  statut: 'actif',
                  latitude: 35.8841,
                  longitude: -5.5031
                },
                assets: [
                  {
                    nom: 'Grue STS-01 Poste 1',
                    description: 'Grue Ship-to-Shore 65T portée 22 conteneurs ZPMC',
                    code: 'ACT-STS-01',
                    type: 'grue_portique',
                    numeroSerie: 'STS01-ZPMC-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8841,
                    longitude: -5.5032,
                    dateMiseEnService: new Date('2023-01-15'),
                    dureeVieEstimee: 25,
                    valeurAchat: 8500000
                  },
                  {
                    nom: 'Grue STS-02 Poste 2',
                    description: 'Grue Ship-to-Shore 65T portée 22 conteneurs ZPMC',
                    code: 'ACT-STS-02',
                    type: 'grue_portique',
                    numeroSerie: 'STS02-ZPMC-2023',
                    statutOperationnel: 'maintenance',
                    etatGeneral: 'bon',
                    latitude: 35.8839,
                    longitude: -5.5030,
                    dateMiseEnService: new Date('2023-02-20'),
                    dureeVieEstimee: 25,
                    valeurAchat: 8500000
                  },
                  {
                    nom: 'Grue STS-03 Poste 3',
                    description: 'Grue Ship-to-Shore 70T portée 24 conteneurs Liebherr',
                    code: 'ACT-STS-03',
                    type: 'grue_portique',
                    numeroSerie: 'STS03-LHR-2024',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8837,
                    longitude: -5.5028,
                    dateMiseEnService: new Date('2024-01-10'),
                    dureeVieEstimee: 25,
                    valeurAchat: 9200000
                  }
                ]
              },
              {
                group: {
                  nom: 'Bollards d\'Amarrage TC1',
                  description: 'Points d\'amarrage pour navires porte-conteneurs',
                  code: 'GRP-TC1-BOLLARDS',
                  type: this.selectValidEnum(groupeEnums, ['infrastructure', 'amarrage', 'fixe']),
                  statut: 'actif',
                  latitude: 35.8842,
                  longitude: -5.5028
                },
                assets: [
                  {
                    nom: 'Bollard TC1-B01',
                    description: 'Bollard d\'amarrage 200T - Poste 1 Avant',
                    code: 'ACT-BOL-TC1-01',
                    type: 'bollard',
                    numeroSerie: 'BOL-TC1-01-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8843,
                    longitude: -5.5029,
                    dateMiseEnService: new Date('2023-01-10'),
                    dureeVieEstimee: 30,
                    valeurAchat: 25000
                  },
                  {
                    nom: 'Bollard TC1-B02',
                    description: 'Bollard d\'amarrage 200T - Poste 1 Arrière',
                    code: 'ACT-BOL-TC1-02',
                    type: 'bollard',
                    numeroSerie: 'BOL-TC1-02-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8841,
                    longitude: -5.5027,
                    dateMiseEnService: new Date('2023-01-10'),
                    dureeVieEstimee: 30,
                    valeurAchat: 25000
                  }
                ]
              }
            ]
          },
          {
            family: {
              nom: 'Équipements de Parc TC1',
              description: 'Équipements mobiles de manutention dans le parc à conteneurs',
              code: 'FAM-TC1-YARD',
              type: this.selectValidEnum(familleEnums, ['equipements_transport', 'equipements_specifiques']),
              statut: 'actif',
              latitude: 35.8850,
              longitude: -5.5020
            },
            groups: [
              {
                group: {
                  nom: 'Cavaliers Gerbeurs TC1',
                  description: 'Straddle carriers pour manutention conteneurs',
                  code: 'GRP-TC1-SC',
                  type: this.selectValidEnum(groupeEnums, ['transport', 'mobile', 'manutention']),
                  statut: 'actif',
                  latitude: 35.8851,
                  longitude: -5.5019
                },
                assets: [
                  {
                    nom: 'Cavalier SC-10',
                    description: 'Straddle Carrier Kalmar 40T DRG450',
                    code: 'ACT-SC-10',
                    type: 'cavalier_gerbeur',
                    numeroSerie: 'SC10-KAL-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8852,
                    longitude: -5.5018,
                    dateMiseEnService: new Date('2023-03-10'),
                    dureeVieEstimee: 15,
                    valeurAchat: 1200000
                  },
                  {
                    nom: 'Cavalier SC-11',
                    description: 'Straddle Carrier Kalmar 40T DRG450',
                    code: 'ACT-SC-11',
                    type: 'cavalier_gerbeur',
                    numeroSerie: 'SC11-KAL-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8854,
                    longitude: -5.5016,
                    dateMiseEnService: new Date('2023-03-15'),
                    dureeVieEstimee: 15,
                    valeurAchat: 1200000
                  }
                ]
              },
              {
                group: {
                  nom: 'Reach Stackers TC1',
                  description: 'Chariots gerbeurs à portée variable',
                  code: 'GRP-TC1-RS',
                  type: this.selectValidEnum(groupeEnums, ['transport', 'mobile', 'manutention']),
                  statut: 'actif',
                  latitude: 35.8856,
                  longitude: -5.5014
                },
                assets: [
                  {
                    nom: 'Reach Stacker RS-05',
                    description: 'Reach Stacker Liebherr LRS645 45T',
                    code: 'ACT-RS-05',
                    type: 'reach_stacker',
                    numeroSerie: 'RS05-LHR-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8857,
                    longitude: -5.5013,
                    dateMiseEnService: new Date('2023-04-01'),
                    dureeVieEstimee: 12,
                    valeurAchat: 850000
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        portfolio: {
          nom: 'Terminal Conteneurs Sud - TC2',
          description: 'Terminal à conteneurs secondaire pour trafic régional',
          code: 'PORT-TC2-002',
          statut: 'actif',
          latitude: 35.8800,
          longitude: -5.5100
        },
        families: [
          {
            family: {
              nom: 'Équipements de Quai TC2',
              description: 'Grues mobiles et équipements flexibles',
              code: 'FAM-TC2-QUAI',
              type: this.selectValidEnum(familleEnums, ['equipements_specifiques', 'infrastructures_portuaires']),
              statut: 'actif',
              latitude: 35.8795,
              longitude: -5.5105
            },
            groups: [
              {
                group: {
                  nom: 'Grues Mobiles Portuaires TC2',
                  description: 'Grues mobiles pour navires moyens',
                  code: 'GRP-TC2-MHC',
                  type: this.selectValidEnum(groupeEnums, ['equipement', 'grue', 'mobile']),
                  statut: 'actif',
                  latitude: 35.8796,
                  longitude: -5.5106
                },
                assets: [
                  {
                    nom: 'Grue Mobile MHC-20',
                    description: 'Grue Mobile Portuaire Liebherr LHM420',
                    code: 'ACT-MHC-20',
                    type: 'grue_mobile',
                    numeroSerie: 'MHC20-LHR-2022',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8797,
                    longitude: -5.5107,
                    dateMiseEnService: new Date('2022-11-15'),
                    dureeVieEstimee: 20,
                    valeurAchat: 3500000
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        portfolio: {
          nom: 'Zone Logistique ZL-Sud',
          description: 'Zone de stockage, entreposage et logistique avec entrepôts spécialisés',
          code: 'PORT-ZL-003',
          statut: 'actif',
          latitude: 35.8900,
          longitude: -5.4950
        },
        families: [
          {
            family: {
              nom: 'Bâtiments de Stockage ZL',
              description: 'Entrepôts et bâtiments de stockage multi-températures',
              code: 'FAM-ZL-BAT',
              type: this.selectValidEnum(familleEnums, ['batiments', 'zones_stockage']),
              statut: 'actif',
              latitude: 35.8905,
              longitude: -5.4945
            },
            groups: [
              {
                group: {
                  nom: 'Entrepôts Réfrigérés ZL',
                  description: 'Entrepôts climatisés pour marchandises sensibles',
                  code: 'GRP-ZL-FROID',
                  type: this.selectValidEnum(groupeEnums, ['batiment', 'stockage', 'infrastructure']),
                  statut: 'actif',
                  latitude: 35.8906,
                  longitude: -5.4944
                },
                assets: [
                  {
                    nom: 'Entrepôt Réfrigéré ER-01',
                    description: 'Entrepôt réfrigéré 5000m² temp -18°C à +4°C',
                    code: 'ACT-ER-01',
                    type: 'entrepot',
                    numeroSerie: 'ER01-ZL-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8907,
                    longitude: -5.4943,
                    dateMiseEnService: new Date('2023-05-15'),
                    dureeVieEstimee: 40,
                    valeurAchat: 3500000
                  },
                  {
                    nom: 'Entrepôt Réfrigéré ER-02',
                    description: 'Entrepôt congélation 3000m² temp -25°C',
                    code: 'ACT-ER-02',
                    type: 'entrepot',
                    numeroSerie: 'ER02-ZL-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8909,
                    longitude: -5.4941,
                    dateMiseEnService: new Date('2023-06-20'),
                    dureeVieEstimee: 40,
                    valeurAchat: 4200000
                  }
                ]
              },
              {
                group: {
                  nom: 'Entrepôts Secs ZL',
                  description: 'Entrepôts pour marchandises sèches et générales',
                  code: 'GRP-ZL-SEC',
                  type: this.selectValidEnum(groupeEnums, ['batiment', 'stockage', 'infrastructure']),
                  statut: 'actif',
                  latitude: 35.8912,
                  longitude: -5.4938
                },
                assets: [
                  {
                    nom: 'Entrepôt Sec ES-01',
                    description: 'Entrepôt sec 8000m² marchandises générales',
                    code: 'ACT-ES-01',
                    type: 'entrepot',
                    numeroSerie: 'ES01-ZL-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8913,
                    longitude: -5.4937,
                    dateMiseEnService: new Date('2023-04-10'),
                    dureeVieEstimee: 50,
                    valeurAchat: 2800000
                  }
                ]
              }
            ]
          },
          {
            family: {
              nom: 'Équipements de Manutention ZL',
              description: 'Chariots élévateurs et équipements de manutention logistique',
              code: 'FAM-ZL-MANUT',
              type: this.selectValidEnum(familleEnums, ['equipements_transport', 'equipements_specifiques']),
              statut: 'actif',
              latitude: 35.8910,
              longitude: -5.4940
            },
            groups: [
              {
                group: {
                  nom: 'Chariots Élévateurs ZL',
                  description: 'Flotte de chariots élévateurs multi-capacités',
                  code: 'GRP-ZL-CHARIOTS',
                  type: this.selectValidEnum(groupeEnums, ['transport', 'mobile', 'manutention']),
                  statut: 'actif',
                  latitude: 35.8911,
                  longitude: -5.4939
                },
                assets: [
                  {
                    nom: 'Chariot Élévateur CE-15',
                    description: 'Chariot élévateur Toyota 8FBE15 5T électrique',
                    code: 'ACT-CE-15',
                    type: 'chariot_elevateur',
                    numeroSerie: 'CE15-TOY-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8912,
                    longitude: -5.4938,
                    dateMiseEnService: new Date('2023-04-20'),
                    dureeVieEstimee: 12,
                    valeurAchat: 85000
                  },
                  {
                    nom: 'Chariot Élévateur CE-16',
                    description: 'Chariot élévateur Toyota 8FD25 2.5T diesel',
                    code: 'ACT-CE-16',
                    type: 'chariot_elevateur',
                    numeroSerie: 'CE16-TOY-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8914,
                    longitude: -5.4936,
                    dateMiseEnService: new Date('2023-04-25'),
                    dureeVieEstimee: 12,
                    valeurAchat: 65000
                  }
                ]
              },
              {
                group: {
                  nom: 'Transpalettes ZL',
                  description: 'Transpalettes électriques et manuels',
                  code: 'GRP-ZL-TRANSPAL',
                  type: this.selectValidEnum(groupeEnums, ['transport', 'mobile', 'manutention']),
                  statut: 'actif',
                  latitude: 35.8916,
                  longitude: -5.4934
                },
                assets: [
                  {
                    nom: 'Transpalette Électrique TE-08',
                    description: 'Transpalette électrique Still EXU20 2T',
                    code: 'ACT-TE-08',
                    type: 'transpalette',
                    numeroSerie: 'TE08-STL-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8917,
                    longitude: -5.4933,
                    dateMiseEnService: new Date('2023-05-05'),
                    dureeVieEstimee: 8,
                    valeurAchat: 18000
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        portfolio: {
          nom: 'Infrastructure Réseau & Utilités',
          description: 'Réseaux électriques, télécommunications et services portuaires',
          code: 'PORT-IR-004',
          statut: 'actif',
          latitude: 35.8875,
          longitude: -5.4980
        },
        families: [
          {
            family: {
              nom: 'Réseaux Électriques',
              description: 'Infrastructure électrique haute et basse tension',
              code: 'FAM-IR-ELEC',
              type: this.selectValidEnum(familleEnums, ['reseaux_utilitaires', 'infrastructures_portuaires']),
              statut: 'actif',
              latitude: 35.8870,
              longitude: -5.4985
            },
            groups: [
              {
                group: {
                  nom: 'Éclairage Public IR',
                  description: 'Système d\'éclairage LED du port',
                  code: 'GRP-IR-ECL',
                  type: this.selectValidEnum(groupeEnums, ['infrastructure', 'reseau', 'eclairage']),
                  statut: 'actif',
                  latitude: 35.8871,
                  longitude: -5.4984
                },
                assets: [
                  {
                    nom: 'Mât Éclairage ME-025',
                    description: 'Mât d\'éclairage LED 400W haute efficacité zone TC1',
                    code: 'ACT-ME-025',
                    type: 'mat_eclairage',
                    numeroSerie: 'ME025-LED-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8872,
                    longitude: -5.4983,
                    dateMiseEnService: new Date('2023-06-10'),
                    dureeVieEstimee: 20,
                    valeurAchat: 18000
                  },
                  {
                    nom: 'Mât Éclairage ME-026',
                    description: 'Mât d\'éclairage LED 600W zone logistique',
                    code: 'ACT-ME-026',
                    type: 'mat_eclairage',
                    numeroSerie: 'ME026-LED-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8874,
                    longitude: -5.4981,
                    dateMiseEnService: new Date('2023-06-15'),
                    dureeVieEstimee: 20,
                    valeurAchat: 22000
                  }
                ]
              },
              {
                group: {
                  nom: 'Postes de Transformation',
                  description: 'Transformateurs électriques haute tension',
                  code: 'GRP-IR-TRANSFO',
                  type: this.selectValidEnum(groupeEnums, ['infrastructure', 'electrique', 'reseau']),
                  statut: 'actif',
                  latitude: 35.8868,
                  longitude: -5.4987
                },
                assets: [
                  {
                    nom: 'Transformateur TR-001',
                    description: 'Transformateur 20kV/400V 2000kVA zone TC1',
                    code: 'ACT-TR-001',
                    type: 'transformateur',
                    numeroSerie: 'TR001-ABB-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8869,
                    longitude: -5.4988,
                    dateMiseEnService: new Date('2023-02-15'),
                    dureeVieEstimee: 30,
                    valeurAchat: 450000
                  }
                ]
              }
            ]
          },
          {
            family: {
              nom: 'Systèmes de Communication',
              description: 'Équipements de télécommunication et contrôle',
              code: 'FAM-IR-TELECOM',
              type: this.selectValidEnum(familleEnums, ['reseaux_utilitaires', 'equipements_specifiques']),
              statut: 'actif',
              latitude: 35.8876,
              longitude: -5.4978
            },
            groups: [
              {
                group: {
                  nom: 'Antennes et Relais',
                  description: 'Infrastructure de communication sans fil',
                  code: 'GRP-IR-ANTENNES',
                  type: this.selectValidEnum(groupeEnums, ['infrastructure', 'communication', 'reseau']),
                  statut: 'actif',
                  latitude: 35.8877,
                  longitude: -5.4977
                },
                assets: [
                  {
                    nom: 'Antenne Radio AR-12',
                    description: 'Antenne radio VHF/UHF contrôle trafic portuaire',
                    code: 'ACT-AR-12',
                    type: 'antenne_radio',
                    numeroSerie: 'AR12-MOT-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8878,
                    longitude: -5.4976,
                    dateMiseEnService: new Date('2023-03-20'),
                    dureeVieEstimee: 15,
                    valeurAchat: 35000
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        portfolio: {
          nom: 'Terminal Ro-Ro & Passagers',
          description: 'Terminal pour navires rouliers et transport de passagers',
          code: 'PORT-RR-005',
          statut: 'actif',
          latitude: 35.8820,
          longitude: -5.5150
        },
        families: [
          {
            family: {
              nom: 'Équipements Ro-Ro',
              description: 'Équipements spécialisés pour trafic roulier',
              code: 'FAM-RR-EQUIP',
              type: this.selectValidEnum(familleEnums, ['equipements_specifiques', 'infrastructures_portuaires']),
              statut: 'actif',
              latitude: 35.8815,
              longitude: -5.5155
            },
            groups: [
              {
                group: {
                  nom: 'Rampes d\'Accès Ro-Ro',
                  description: 'Rampes hydrauliques pour navires rouliers',
                  code: 'GRP-RR-RAMPES',
                  type: this.selectValidEnum(groupeEnums, ['infrastructure', 'hydraulique', 'acces']),
                  statut: 'actif',
                  latitude: 35.8816,
                  longitude: -5.5156
                },
                assets: [
                  {
                    nom: 'Rampe Ro-Ro RR-01',
                    description: 'Rampe hydraulique articulée 120T poste RR1',
                    code: 'ACT-RR-01',
                    type: 'rampe_roro',
                    numeroSerie: 'RR01-TTS-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8817,
                    longitude: -5.5157,
                    dateMiseEnService: new Date('2023-07-01'),
                    dureeVieEstimee: 25,
                    valeurAchat: 1800000
                  },
                  {
                    nom: 'Rampe Ro-Ro RR-02',
                    description: 'Rampe hydraulique articulée 120T poste RR2',
                    code: 'ACT-RR-02',
                    type: 'rampe_roro',
                    numeroSerie: 'RR02-TTS-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8819,
                    longitude: -5.5159,
                    dateMiseEnService: new Date('2023-07-15'),
                    dureeVieEstimee: 25,
                    valeurAchat: 1800000
                  }
                ]
              }
            ]
          },
          {
            family: {
              nom: 'Bâtiments Passagers',
              description: 'Infrastructure d\'accueil et services passagers',
              code: 'FAM-RR-PASSAGERS',
              type: this.selectValidEnum(familleEnums, ['batiments', 'zones_stockage']),
              statut: 'actif',
              latitude: 35.8825,
              longitude: -5.5145
            },
            groups: [
              {
                group: {
                  nom: 'Gare Maritime',
                  description: 'Bâtiment principal d\'accueil passagers',
                  code: 'GRP-RR-GARE',
                  type: this.selectValidEnum(groupeEnums, ['batiment', 'accueil', 'infrastructure']),
                  statut: 'actif',
                  latitude: 35.8826,
                  longitude: -5.5144
                },
                assets: [
                  {
                    nom: 'Gare Maritime GM-01',
                    description: 'Gare maritime 4500m² capacité 2000 passagers',
                    code: 'ACT-GM-01',
                    type: 'gare_maritime',
                    numeroSerie: 'GM01-BAT-2023',
                    statutOperationnel: 'operationnel',
                    etatGeneral: 'bon',
                    latitude: 35.8827,
                    longitude: -5.5143,
                    dateMiseEnService: new Date('2023-08-01'),
                    dureeVieEstimee: 50,
                    valeurAchat: 12000000
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    let totalCounts = { portefeuilles: 0, familles: 0, groupes: 0, actifs: 0 };

    // Process each portfolio structure
    for (const structure of portfolioStructure) {
      await this.dataSource.transaction(async (manager) => {
        try {
          // Create Portfolio
          const portfolio = await manager.save(Portefeuille, structure.portfolio);
          this.logger.log(`✅ Created Portfolio: ${portfolio.nom}`);
          totalCounts.portefeuilles++;

          // Create Families for this Portfolio
          for (const famData of structure.families) {
            const familyToCreate = {
              ...famData.family,
              portefeuilleId: portfolio.id
            };

            const family = await manager.save(FamilleActif, familyToCreate);
            this.logger.log(`  ✅ Created Family: ${family.nom} for ${portfolio.nom}`);
            totalCounts.familles++;

            // Create Groups for this Family
            for (const grpData of famData.groups) {
              const groupToCreate = {
                ...grpData.group,
                familleActifId: family.id
              };

              const group = await manager.save(GroupeActif, groupToCreate);
              this.logger.log(`    ✅ Created Group: ${group.nom} for ${family.nom}`);
              totalCounts.groupes++;

              // Create Assets for this Group
              for (const assetData of grpData.assets) {
                const assetToCreate = {
                  ...assetData,
                  groupeActifId: group.id
                };

                await manager.save(Actif, assetToCreate);
                this.logger.log(`      ✅ Created Asset: ${assetData.nom} for ${group.nom}`);
                totalCounts.actifs++;
              }
            }
          }
        } catch (error) {
          this.logger.error(`❌ Failed to create portfolio structure for ${structure.portfolio.nom}: ${error.message}`);
          throw error; // This will rollback the transaction
        }
      });
    }

    this.logger.log('🎉 Complete logical seeding finished successfully!');
    return {
      status: 'success',
      type: 'complete_logical_seeding',
      counts: totalCounts
    };
  }

  private async discoverEnumValues(enumTypeName: string): Promise<string[]> {
    try {
      const result = await this.dataSource.query(
        `SELECT unnest(enum_range(NULL::${enumTypeName})) as enum_value`
      );
      const values = result.map((row: any) => row.enum_value);
      this.logger.log(`📋 Discovered ${enumTypeName}: ${values.join(', ')}`);
      return values;
    } catch (error) {
      this.logger.error(`❌ Failed to discover enum values for ${enumTypeName}: ${error.message}`);
      return [];
    }
  }

  private selectValidEnum(availableEnums: string[], preferredEnums: string[]): string {
    for (const preferred of preferredEnums) {
      if (availableEnums.includes(preferred)) {
        return preferred;
      }
    }
    return availableEnums[0] || 'unknown';
  }

  private async checkAndFixDataConsistency() {
    this.logger.log('🔍 Checking data consistency...');
    
    try {
      const orphanedCount = await this.familleActifRepository.query(`
        SELECT COUNT(*) as count 
        FROM familles_actifs f
        LEFT JOIN portefeuilles p ON f."portefeuilleId" = p.id
        WHERE p.id IS NULL AND f."portefeuilleId" IS NOT NULL
      `);

      if (parseInt(orphanedCount[0].count) > 0) {
        this.logger.warn(`⚠️ Found ${orphanedCount[0].count} orphaned famille records`);
        await this.cleanupOrphanedData();
      } else {
        this.logger.log('✅ Data consistency check passed');
      }
    } catch (error) {
      this.logger.error('❌ Error during consistency check:', error.message);
    }
  }

  private async cleanupOrphanedData() {
    this.logger.log('🧹 Cleaning up orphaned data...');
    
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.query(`
          DELETE FROM actifs 
          WHERE "groupeActifId" IN (
            SELECT g.id FROM groupes_actifs g
            LEFT JOIN familles_actifs f ON g."familleActifId" = f.id
            WHERE f.id IS NULL
          )
        `);

        await manager.query(`
          DELETE FROM groupes_actifs 
          WHERE "familleActifId" IN (
            SELECT f.id FROM familles_actifs f
            LEFT JOIN portefeuilles p ON f."portefeuilleId" = p.id
            WHERE p.id IS NULL
          )
        `);

        await manager.query(`
          DELETE FROM familles_actifs 
          WHERE "portefeuilleId" NOT IN (
            SELECT id FROM portefeuilles WHERE id IS NOT NULL
          )
        `);

        this.logger.log('✅ Orphaned data cleanup completed');
      });
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error.message);
    }
  }

  // Legacy methods kept for backward compatibility but not used in new flow
  private async createGroupesOnly() {
    this.logger.warn('⚠️ createGroupesOnly is deprecated. Use performCompleteSeeding instead.');
    return { status: 'deprecated', reason: 'Method replaced by complete seeding' };
  }

  private async performFullSeeding() {
    return await this.performCompleteSeeding();
  }

  private async getGroupesData(familles: FamilleActif[]): Promise<any[]> {
    this.logger.log('getGroupesData is deprecated in new seeding flow.');
    return [];
  }

  private async createSampleActifs(manager: any, createdGroupes: GroupeActif[]): Promise<number> {
    this.logger.log('createSampleActifs is deprecated in new seeding flow.');
    return 0;
  }

  private async createFamilles(manager: EntityManager, portefeuilles: Portefeuille[]): Promise<FamilleActif[]> {
    this.logger.log('createFamilles is deprecated in new seeding flow.');
    return [];
  }

  private async createGroupes(manager: EntityManager, familles: FamilleActif[]): Promise<GroupeActif[]> {
    this.logger.log('createGroupes is deprecated in new seeding flow.');
    return [];
  }
}