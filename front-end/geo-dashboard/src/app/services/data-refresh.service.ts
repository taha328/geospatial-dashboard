import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {
  private anomalieAddedSource = new Subject<void>();
  private maintenanceUpdatedSource = new Subject<void>();
  private dataChangedSource = new Subject<void>();
  private actifCreatedSource = new Subject<any>();

  // Observable streams
  anomalieAdded$ = this.anomalieAddedSource.asObservable();
  maintenanceUpdated$ = this.maintenanceUpdatedSource.asObservable();
  dataChanged$ = this.dataChangedSource.asObservable();
  actifCreated$ = this.actifCreatedSource.asObservable();

  constructor(private notificationService: NotificationService) {}

  /**
   * Notifie qu'une nouvelle anomalie a été ajoutée
   */
  notifyAnomalieAdded() {
    this.anomalieAddedSource.next();
  // trigger notification refresh
  try { this.notificationService.triggerRefresh(); } catch (e) { /* ignore */ }
    // push a local quick notification (UI shows it immediately)
    try {
      this.notificationService.pushLocalNotification({
        id: Date.now(),
        type: 'anomalie',
        message: 'Nouvelle anomalie signalée',
        date: new Date(),
        read: false
      });
    } catch (e) { /* ignore */ }
  }

  /**
   * Notifie qu'une maintenance a été mise à jour
   */
  notifyMaintenanceUpdated() {
    this.maintenanceUpdatedSource.next();
  try { this.notificationService.triggerRefresh(); } catch (e) { /* ignore */ }
  }

  /**
   * Notifie qu'il y a eu des changements de données généraux
   */
  notifyDataChanged() {
    this.dataChangedSource.next();
  try { this.notificationService.triggerRefresh(); } catch (e) { /* ignore */ }
  }

  /**
   * Notifie la création d'un actif et fournit sa charge utile
   */
  notifyActifCreated(actif: any) {
    this.actifCreatedSource.next(actif);
  try { this.notificationService.triggerRefresh(); } catch (e) { /* ignore */ }
    try {
      const msg = `Nouvel actif créé: ${actif?.nom || actif?.name || 'Actif'}`;
      this.notificationService.pushLocalNotification({
        id: Date.now(),
        type: 'actif',
        message: msg,
        date: new Date(),
        read: false,
        link: actif?.id ? `/assets/${actif.id}` : undefined
      });
    } catch (e) { /* ignore */ }
  }
}
