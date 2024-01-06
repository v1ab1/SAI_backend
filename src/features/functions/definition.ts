import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as tf from '@tensorflow/tfjs';
import { PCA } from 'ml-pca'; // Assuming you are using ml-pca for PCA
import { DBSCAN } from 'dbscanjs';
import * as xlsx from 'xlsx';
import { join } from 'path';

export const clusterWithDBSCANforCSV = async (fileName: string) => {
  const data: number[][] = [];
  const filePath = join(process.cwd(), 'uploads', fileName);
  const result = [];

  // Read CSV file using csv-parser
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row: any) => {
      // Assuming numeric data is in columns 'value1', 'value2', etc.
      const values: number[] = Object.values(row)
        .filter((val: any) => !isNaN(parseFloat(val)))
        .map((val: any) => parseFloat(val));

      if (values.length > 0) {
        data.push(values);
      }
    })
    .on('end', () => {
      // Apply PCA to reduce dimensionality
      const pca = new PCA(data);
      const projectedData = pca.predict(data, { nComponents: 2 }); // Adjust the number of components as needed

      // Cluster the reduced data using DBSCAN
      const dbscan = new DBSCAN({
        eps: 0.5, // Epsilon
        minPoints: 5, // Min points
        distanceFunction: 'euclidean', // Distance function (default is Euclidean)
      });
      const clusters = dbscan.run(projectedData);

      // Assign cluster labels to the original data
      result.push(clusters.labels);
    });
  return { result };
};

export const clusterWithDBSCANforExcel = async (fileName: string) => {
  const data: number[][] = [];
  const filePath = join(process.cwd(), 'uploads', fileName);
  const result = [];

  // Read Excel file using 'xlsx'
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
  const worksheet = workbook.Sheets[sheetName];
  const excelData = xlsx.utils.sheet_to_json(worksheet);

  // Parse numeric data from Excel
  excelData.forEach((row: any) => {
    // Assuming numeric data is in columns 'value1', 'value2', etc.
    const values: number[] = Object.values(row)
      .filter((val: any) => !isNaN(parseFloat(val)))
      .map((val: any) => parseFloat(val));

    if (values.length > 0) {
      data.push(values);
    }
  });

  // Apply PCA to reduce dimensionality
  const pca = new PCA(data);
  const projectedData = pca.predict(data, { nComponents: 2 }); // Adjust the number of components as needed

  // Cluster the reduced data using DBSCAN
  const dbscan = new DBSCAN({
    eps: 0.5, // Epsilon
    minPoints: 5, // Min points
    distanceFunction: 'euclidean', // Distance function (default is Euclidean)
  });
  const clusters = dbscan.run(projectedData);

  // Assign cluster labels to the original data
  return { result: clusters.labels };
};
