import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {
  private anomalieAddedSource = new Subject<void>();
  private maintenanceUpdatedSource = new Subject<void>();
  private dataChangedSource = new Subject<void>();

  // Observable streams
  anomalieAdded$ = this.anomalieAddedSource.asObservable();
  maintenanceUpdated$ = this.maintenanceUpdatedSource.asObservable();
  dataChanged$ = this.dataChangedSource.asObservable();

  constructor() {}

  /**
   * Notifie qu'une nouvelle anomalie a été ajoutée
   */
  notifyAnomalieAdded() {
    this.anomalieAddedSource.next();
  }

  /**
   * Notifie qu'une maintenance a été mise à jour
   */
  notifyMaintenanceUpdated() {
    this.maintenanceUpdatedSource.next();
  }

  /**
   * Notifie qu'il y a eu des changements de données généraux
   */
  notifyDataChanged() {
    this.dataChangedSource.next();
  }
}
