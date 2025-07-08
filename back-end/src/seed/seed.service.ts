import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointService } from '../point/point.service';
import { ZonesService } from '../zones/zones.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { Point } from '../point/point.entity';
import { Zone } from '../zones/zone.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Point)
    private pointRepository: Repository<Point>,
    @InjectRepository(Zone)
    private zoneRepository: Repository<Zone>,
    private pointService: PointService,
    private zonesService: ZonesService,
    private userService: UserService,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    try {
      // Seed some sample points (Tanger Med landmarks)
      const points = [
        {
          latitude: 35.8845,
          longitude: -5.5026,
          description: 'Tanger Med Port',
          color: '#007bff',
          type: 'point',
        },
        {
          latitude: 35.889,
          longitude: -5.489,
          description: 'Tanger Med Engineering',
          color: '#28a745',
          type: 'point',
        },
        {
          latitude: 35.88,
          longitude: -5.51,
          description: 'Zone Logistique',
          color: '#ffc107',
          type: 'point',
        },
        {
          latitude: 35.892,
          longitude: -5.495,
          description: 'Terminal à Conteneurs',
          color: '#dc3545',
          type: 'point',
        },
      ];

      const existingPoints = await this.pointService.findAll();
      if (existingPoints.length === 0) {
        for (const point of points) {
          await this.pointService.create(point);
        }
        console.log('✅ Points Tanger Med créés avec succès');
      }

      // Seed some sample zones
      const zones = [
        {
          name: 'Zone Tanger Med Engineering',
          type: 'polygon',
          geometry: JSON.stringify({
            type: 'Polygon',
            coordinates: [
              [
                [-5.507, 35.887],
                [-5.497, 35.887],
                [-5.497, 35.892],
                [-5.507, 35.892],
                [-5.507, 35.887],
              ],
            ],
          }),
          description: 'Zone autour de Tanger Med Engineering',
          color: '#00bcd4',
          opacity: 0.4,
        },
        {
          name: 'Zone Tanger Med Port',
          type: 'polygon',
          geometry: JSON.stringify({
            type: 'Polygon',
            coordinates: [
              [
                [-5.505, 35.882],
                [-5.5, 35.882],
                [-5.5, 35.887],
                [-5.505, 35.887],
                [-5.505, 35.882],
              ],
            ],
          }),
          description: 'Zone autour du port Tanger Med',
          color: '#8bc34a',
          opacity: 0.3,
        },
      ];

      const existingZones = await this.zonesService.findAll();
      if (existingZones.length === 0) {
        for (const zone of zones) {
          await this.zonesService.create(zone);
        }
        console.log('✅ Zones Tanger Med créées avec succès');
      }

      // Seed sample users
      const users = [
        {
          name: 'Admin Tanger Med',
          email: 'admin@tangermed.ma',
          role: 'admin',
        },
        {
          name: 'Ingénieur Port',
          email: 'engineer@tangermed.ma',
          role: 'user',
        },
        {
          name: 'Gestionnaire Logistique',
          email: 'logistics@tangermed.ma',
          role: 'moderator',
        },
      ];

      const existingUsers = await this.userService.findAll();
      if (existingUsers.length === 0) {
        for (const user of users) {
          await this.userService.create(user);
        }
        console.log('✅ Utilisateurs Tanger Med créés avec succès');
      }

      console.log(
        '✅ Toutes les données de test Tanger Med créées avec succès'
      );
    } catch (error) {
      console.error(
        '❌ Erreur lors de la création des données de test Tanger Med:',
        error,
      );
    }
  }
}
