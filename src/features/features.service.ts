import { Injectable } from '@nestjs/common';
import { processCsvFile, processExcelFile } from './functions/empty';
import { ModifiedFilesService } from 'src/modifiedFiles/modifiedFiles.service';
import { generateId } from 'src/files/storage';
import {
  processCsvOutliers,
  processExcelOutliers,
} from './functions/emissionsy';
import {
  normalizeCsvData,
  normalizeExcelData,
} from './functions/normalization';
import {
  predictWithRNNforCSV,
  predictWithRNNforExcel,
} from './functions/modeling';
import {
  clusterWithDBSCANforCSV,
  clusterWithDBSCANforExcel,
} from './functions/definition';

@Injectable()
export class FeaturesService {
  constructor(private readonly modifiedFilesService: ModifiedFilesService) {}

  async getEmpty(
    { filename, value }: { filename: string; value: string },
    id: number,
  ) {
    const ext = filename.slice(filename.lastIndexOf('.'));
    const newName = generateId() + ext;
    if (ext === '.csv') {
      await processCsvFile(filename, newName, value);
    } else {
      await processExcelFile(filename, newName, value);
    }
    await this.modifiedFilesService.save(newName, ext, id);
    return;
  }

  async getEmissionsy(
    { filename, value }: { filename: string; value: string },
    id: number,
  ) {
    const ext = filename.slice(filename.lastIndexOf('.'));
    const newName = generateId() + ext;
    if (ext === '.csv') {
      await processCsvOutliers(filename, newName, value);
    } else {
      await processExcelOutliers(filename, newName, value);
    }
    await this.modifiedFilesService.save(newName, ext, id);
    return;
  }

  async getNormalization(
    { filename, value }: { filename: string; value: string },
    id: number,
  ) {
    const ext = filename.slice(filename.lastIndexOf('.'));
    const newName = generateId() + ext;
    if (ext === '.csv') {
      await normalizeCsvData(filename, newName, value);
    } else {
      await normalizeExcelData(filename, newName, value);
    }
    await this.modifiedFilesService.save(newName, ext, id);
    return;
  }

  async getModeling({ filename, value }: { filename: string; value: string }) {
    const ext = filename.slice(filename.lastIndexOf('.'));
    let result;
    if (ext === '.csv') {
      result = await predictWithRNNforCSV(filename, value);
    } else {
      result = await predictWithRNNforExcel(filename, value);
    }
    return result;
  }

  async getDefinition({ filename }: { filename: string; value: string }) {
    const ext = filename.slice(filename.lastIndexOf('.'));
    let result;
    if (ext === '.csv') {
      result = await clusterWithDBSCANforCSV(filename);
    } else {
      result = await clusterWithDBSCANforExcel(filename);
    }
    return result;
  }
}
