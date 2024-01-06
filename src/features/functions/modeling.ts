import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as tf from '@tensorflow/tfjs';
import * as xlsx from 'xlsx';
import { join } from 'path';

// Function to read CSV file and perform prediction using a simple RNN
export async function predictWithRNNforCSV(
  fileName: string,
  userValue: string,
) {
  const timeSeriesData: number[] = [];
  const result = [];
  const filePath = join(process.cwd(), 'uploads', fileName);

  // Read CSV file using csv-parser
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (data: any) => {
      const value = parseFloat(data[userValue]); // Extract numeric data

      if (!isNaN(value)) {
        timeSeriesData.push(value);
      }
    })
    .on('end', () => {
      // Prepare data for RNN
      const inputSequence = tf.tensor(timeSeriesData);
      const input = inputSequence.expandDims(1);

      // Create a simple recurrent neural network in TensorFlow.js
      const model = tf.sequential();
      model.add(
        tf.layers.simpleRNN({
          units: 64,
          activation: 'relu',
          inputShape: [null, 1],
        }),
      );
      model.add(tf.layers.dense({ units: 1 }));

      model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

      // Train the model on data
      model
        .fit(input, inputSequence, { epochs: 100 })
        .then(() => {
          // Predict the next values
          const predictions = model.predict(input);
          if (Array.isArray(predictions)) {
            const predictedValues: number[][] = [];

            predictions.forEach((tensor: tf.Tensor) => {
              const values = tensor.arraySync() as number[];
              predictedValues.push(values);
            });

            console.log('RNN Prediction:', predictedValues.slice(-5)); // Show prediction for the last 5 values
          } else {
            predictions.array().then((values: number[][]) => {
              result.push(values.slice(-5)); // Show prediction for the last 5 values
            });
          }
        })
        .catch((err) => {
          console.error('Error training RNN model:', err);
        });
    });

  return { result };
}

export async function predictWithRNNforExcel(
  fileName: string,
  userValue: string,
) {
  const timeSeriesData: number[] = [];
  const result = [];
  const filePath = join(process.cwd(), 'uploads', fileName);

  // Read Excel file using 'xlsx'
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
  const worksheet = workbook.Sheets[sheetName];
  const excelData = xlsx.utils.sheet_to_json(worksheet);

  excelData.forEach((row: any) => {
    const value = parseFloat(row[userValue]); // Extract numeric data

    if (!isNaN(value)) {
      timeSeriesData.push(value);
    }
  });

  // Prepare data for RNN
  const inputSequence = tf.tensor(timeSeriesData);
  const input = inputSequence.expandDims(1);

  // Create a simple recurrent neural network in TensorFlow.js
  const model = tf.sequential();
  model.add(
    tf.layers.simpleRNN({
      units: 64,
      activation: 'relu',
      inputShape: [null, 1],
    }),
  );
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

  // Train the model on data
  model
    .fit(input, inputSequence, { epochs: 100 })
    .then(() => {
      // Predict the next values
      const predictions = model.predict(input);
      if (Array.isArray(predictions)) {
        const predictedValues: number[][] = [];

        predictions.forEach((tensor: tf.Tensor) => {
          const values = tensor.arraySync() as number[];
          predictedValues.push(values);
        });

        console.log('RNN Prediction:', predictedValues.slice(-5)); // Show prediction for the last 5 values
      } else {
        predictions.array().then((values: number[][]) => {
          result.push(values.slice(-5)); // Show prediction for the last 5 values
        });
      }
    })
    .catch((err) => {
      console.error('Error training RNN model:', err);
    });

  return { result };
}
