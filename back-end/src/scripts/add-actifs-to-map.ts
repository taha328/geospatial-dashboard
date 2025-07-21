import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ActifService } from '../gestion_des_actifs/services/actif.service';
import { AnomalieService } from '../gestion_des_actifs/services/anomalie.service';
import { PortefeuilleService } from '../gestion_des_actifs/services/portefeuille.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actif } from '../gestion_des_actifs/entities/actif.entity';

async function addActifsToMap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const actifService = app.get(ActifService);
  const anomalieService = app.get(AnomalieService);
  const portefeuilleService = app.get(PortefeuilleService);
  const actifRepository = app.get<Repository<Actif>>(getRepositoryToken(Actif));

  console.log('🗺️ Ajout d\'actifs géolocalisés sur la carte...');
  
  try {
    // Récupérer tous les actifs sans coordonnées
    const allActifs = await actifService.findAll();
    console.log(`📍 Trouvé ${allActifs.length} actifs`);

    // Coordonnées du Port de Tunis (exemple)
    const portCoordinates = {
      lat: 36.8065,
      lng: 10.1815
    };

    // Ajouter des coordonnées aux actifs existants
    const updates: Promise<any>[] = [];
    
    for (let i = 0; i < allActifs.length; i++) {
      const actif = allActifs[i];
      
      // Générer des coordonnées autour du port
      const offsetLat = (Math.random() - 0.5) * 0.01; // ~1km de rayon
      const offsetLng = (Math.random() - 0.5) * 0.01;
      
      const latitude = portCoordinates.lat + offsetLat;
      const longitude = portCoordinates.lng + offsetLng;
      
      updates.push(
        actifRepository.update(actif.id, {
          latitude: latitude,
          longitude: longitude
        }) as Promise<any>
      );
      
      console.log(`📍 Actif "${actif.nom}" -> Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
    }

    await Promise.all(updates);
    console.log('✅ Tous les actifs ont été géolocalisés !');

    // Créer quelques anomalies géolocalisées
    console.log('\n🚨 Création d\'anomalies géolocalisées...');
    
    const anomalies = [
      {
        titre: 'Bollard endommagé - Quai A',
        description: 'Le bollard d\'amarrage présente une fissure importante',
        typeAnomalie: 'structural',
        priorite: 'eleve',
        latitude: portCoordinates.lat + 0.001,
        longitude: portCoordinates.lng + 0.002,
        rapportePar: 'Inspecteur Port'
      },
      {
        titre: 'Défense détériorée - Quai B',
        description: 'La défense en caoutchouc est partiellement déchirée',
        typeAnomalie: 'structural',
        priorite: 'moyen',
        latitude: portCoordinates.lat - 0.002,
        longitude: portCoordinates.lng + 0.001,
        rapportePar: 'Équipe Maintenance'
      },
      {
        titre: 'Éclairage défaillant - Zone C',
        description: 'Plusieurs lampadaires ne fonctionnent plus',
        typeAnomalie: 'electrique',
        priorite: 'critique',
        latitude: portCoordinates.lat + 0.003,
        longitude: portCoordinates.lng - 0.001,
        rapportePar: 'Sécurité Portuaire'
      }
    ];

    for (const anomalie of anomalies) {
      await anomalieService.createFromMap(anomalie);
      console.log(`🚨 Anomalie créée: ${anomalie.titre}`);
    }

    console.log('\n🎉 Configuration terminée !');
    console.log('📍 Accédez à la carte: http://localhost:4200/map');
    console.log('📊 Accédez aux actifs: http://localhost:4200/assets');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }

  await app.close();
}

function getActifType(nom: string): string {
  const nomLower = nom.toLowerCase();
  
  if (nomLower.includes('bollard')) return 'bollards';
  if (nomLower.includes('defense') || nomLower.includes('défense')) return 'defenses';
  if (nomLower.includes('grue')) return 'grues';
  if (nomLower.includes('eclairage') || nomLower.includes('éclairage')) return 'eclairage';
  if (nomLower.includes('signal')) return 'signalisation';
  if (nomLower.includes('quai')) return 'quais';
  if (nomLower.includes('terminal')) return 'terminaux';
  
  return 'autres';
}

addActifsToMap().catch(console.error);
