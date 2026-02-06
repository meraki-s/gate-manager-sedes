import { Component, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SearchService, DownloadProgress } from '../../services/search.service';
import { ProviderService } from 'src/app/providers/services/providers.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-downloads',
  templateUrl: './downloads.component.html',
  styleUrls: ['./downloads.component.scss'],
})
export class DownloadsComponent implements OnInit, OnDestroy {
  // Loading states for each download type
  isGeneratingProvidersReport = new BehaviorSubject<boolean>(false);
  isGeneratingProvidersReport$ = this.isGeneratingProvidersReport.asObservable();

  isGeneratingCollaboratorsReport = new BehaviorSubject<boolean>(false);
  isGeneratingCollaboratorsReport$ = this.isGeneratingCollaboratorsReport.asObservable();

  // Progress tracking for providers report
  downloadProgressMessage = new BehaviorSubject<string>('');
  downloadProgressMessage$ = this.downloadProgressMessage.asObservable();

  downloadProgressPercentage = new BehaviorSubject<number>(0);
  downloadProgressPercentage$ = this.downloadProgressPercentage.asObservable();

  private subscriptions = new Subscription();

  constructor(
    private searchService: SearchService,
    private providersService: ProviderService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Download Excel with all providers and their documents
   */
  async onDownloadProvidersReport(): Promise<void> {
    this.isGeneratingProvidersReport.next(true);
    this.downloadProgressPercentage.next(0);
    this.downloadProgressMessage.next('Iniciando descarga...');

    // Subscribe to progress updates
    const progressSubscription = this.searchService.downloadProgress$.subscribe(
      (progress) => {
        this.downloadProgressPercentage.next(progress.percentage);

        // Format message with batch info if available
        let message = progress.message;
        if (progress.currentBatch && progress.totalBatches) {
          message = `${progress.message} (Lote ${progress.currentBatch}/${progress.totalBatches})`;
        }
        this.downloadProgressMessage.next(message);
      }
    );

    try {
      // Timeout set to 5 minutes for large reports
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                '⏱️ Timeout: El reporte está tardando más de 5 minutos. Intente nuevamente.'
              )
            ),
          300000
        )
      );

      await Promise.race([
        this.searchService.generateProvidersReport(),
        timeoutPromise,
      ]);
    } catch (error) {
      console.error('❌ Error en descarga:', error);
      this.snackbar.open(
        error instanceof Error ? error.message : 'Error al generar el reporte',
        'Cerrar',
        { duration: 5000 }
      );
    } finally {
      this.isGeneratingProvidersReport.next(false);
      this.downloadProgressPercentage.next(0);
      this.downloadProgressMessage.next('');
      progressSubscription.unsubscribe();
    }
  }

  /**
   * Download Excel with all collaborators
   */
  onDownloadCollaboratorsReport(): void {
    this.isGeneratingCollaboratorsReport.next(true);

    this.subscriptions.add(
      this.providersService.getAllCollaborators().subscribe((collaborators) => {
        let table_xlsx: any[] = [];

        let headersXlsx = [
          'Empresa',
          'RUC',
          'Nombres',
          'Apellidos',
          'DNI',
          'Cargo',
          'Estado',
          'SCTR estado',
          'SCTR vigencia',
          'SCTR archivo',
          'SVL estado',
          'SVL vigencia',
          'SVL archivo',
          'Ind. estado',
          'Ind. vigencia',
          'LOTO estado',
          'LOTO vigencia',
          'Fecha creación',
          'Creado por',
        ];

        table_xlsx.push(headersXlsx);

        collaborators.forEach((collaborator) => {
          let temp1 = [
            collaborator.companyName ? collaborator.companyName : '---',
            collaborator.companyRuc ? collaborator.companyRuc : '---',
            collaborator.name ? collaborator.name : '---',
            collaborator.lastname ? collaborator.lastname : '---',
            collaborator.dni ? collaborator.dni : '---',
            collaborator.jobTitle ? collaborator.jobTitle : '---',
            collaborator.entryDeparture ? collaborator.entryDeparture : '---',
            collaborator.sctrStatus ? collaborator.sctrStatus : '---',
            collaborator.sctrDate
              ? new Date(collaborator.sctrDate.toMillis())
              : '---',
            collaborator.sctrFile ? collaborator.sctrFile.fileURL : '---',
            collaborator.svlStatus ? collaborator.svlStatus : '---',
            collaborator.svlDate
              ? new Date(collaborator.svlDate.toMillis())
              : '---',
            collaborator.svlFile ? collaborator.svlFile.fileURL : '---',
            collaborator.inductionStatus ? collaborator.inductionStatus : '---',
            collaborator.inductionDate
              ? new Date(collaborator.inductionDate.toMillis())
              : '---',
            collaborator.lotoStatus ? collaborator.lotoStatus : '---',
            collaborator.lotoDate
              ? new Date(collaborator.lotoDate.toMillis())
              : '---',
            collaborator.createdAt
              ? new Date(collaborator.createdAt.toMillis())
              : '---',
            collaborator.createdBy
              ? collaborator.createdBy.displayName
              : '---',
          ];

          table_xlsx.push(temp1);
        });

        /* generate worksheet */
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

        // Configure column widths
        ws['!cols'] = [
          { wch: 30 }, // Empresa
          { wch: 12 }, // RUC
          { wch: 20 }, // Nombres
          { wch: 20 }, // Apellidos
          { wch: 10 }, // DNI
          { wch: 25 }, // Cargo
          { wch: 12 }, // Estado
          { wch: 12 }, // SCTR estado
          { wch: 15 }, // SCTR vigencia
          { wch: 50 }, // SCTR archivo
          { wch: 12 }, // SVL estado
          { wch: 15 }, // SVL vigencia
          { wch: 50 }, // SVL archivo
          { wch: 12 }, // Ind. estado
          { wch: 15 }, // Ind. vigencia
          { wch: 12 }, // LOTO estado
          { wch: 15 }, // LOTO vigencia
          { wch: 18 }, // Fecha creación
          { wch: 25 }, // Creado por
        ];

        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');

        /* save to file */
        const timestamp = new Date();
        const dateStr = timestamp.toLocaleDateString('es-PE').replace(/\//g, '-');
        const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
        const name = `colaboradores_${dateStr}_${timeStr}.xlsx`;

        XLSX.writeFile(wb, name);

        this.isGeneratingCollaboratorsReport.next(false);
        this.snackbar.open('✅ Reporte de colaboradores descargado', 'Cerrar', {
          duration: 3000,
        });
      })
    );
  }
}
